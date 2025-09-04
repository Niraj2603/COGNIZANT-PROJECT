from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify
import jwt
from functools import wraps
from datetime import datetime, timedelta
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
from langchain_openai import AzureChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import ChatPromptTemplate
from langchain.agents import create_tool_calling_agent, AgentExecutor
from ireno_tools import create_ireno_tools

# Load environment variables
load_dotenv()


# Initialize Flask app
app = Flask(__name__)
CORS(app)


# JWT secret key (set in .env or fallback)
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key')

# Database configuration using MYSQL_URI from .env
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('MYSQL_URI', 'mysql+pymysql://root:password@localhost/ireno_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# JWT helper functions
def generate_jwt_token(user):
    payload = {
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(hours=12)
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return token
# Add role_required decorator for role-based authorization
def role_required(required_role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(request, 'user', None)
            if not user or user.get('role') != required_role:
                return jsonify({'message': 'Forbidden: insufficient privileges'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

def decode_jwt_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Missing or invalid Authorization header'}), 401
        token = auth_header.split(' ')[1]
        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({'message': 'Invalid or expired token'}), 401
        request.user = payload
        return f(*args, **kwargs)
    return decorated

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # 'user' or 'admin'

    def to_dict(self):
        return {'id': self.id, 'username': self.username, 'email': self.email, 'role': self.role}

# Chat message model
class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    sender = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    timestamp = db.Column(db.DateTime, server_default=db.func.now())

# Log entry model
class LogEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())

# Create tables if not exist (run once at startup)
with app.app_context():
    db.create_all()

# User registration endpoint

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    requested_role = data.get('role', 'user')
    if not username or not email or not password:
        return jsonify({'message': 'All fields are required.'}), 400
    hashed_password = generate_password_hash(password)
    is_first_user = User.query.count() == 0
    # Only allow 'admin', 'field_technician', 'command_center', 'senior_leadership', or 'user' as roles
    allowed_roles = {'admin', 'field_technician', 'command_center', 'senior_leadership', 'user'}
    if is_first_user:
        role = 'admin'
    else:
        role = requested_role if requested_role in allowed_roles and requested_role != 'admin' else 'user'
    user = User(username=username, email=email, password=hashed_password, role=role)
    try:
        db.session.add(user)
        db.session.commit()
        logger.info(f"New user registered: {username} ({email}), role: {role}")
        return jsonify({'message': 'Signup successful', 'username': username, 'email': email, 'role': role}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Username or email already exists.'}), 409
    except Exception as e:
        db.session.rollback()
        logger.error(f"Signup error: {str(e)}")
        return jsonify({'message': 'Signup failed.'}), 500

# User login endpoint
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not username or not password:
        return jsonify({'message': 'Username and password required.'}), 400
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        token = generate_jwt_token(user)
        return jsonify({'message': 'Login successful', 'username': user.username, 'email': user.email, 'token': token}), 200
    else:
        return jsonify({'message': 'Invalid username or password.'}), 401

# Enhanced logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Console output
        logging.FileHandler('ireno_assistant.log', mode='a', encoding='utf-8')  # File output
    ]
)

# Set specific log levels for different components
logging.getLogger('werkzeug').setLevel(logging.INFO)  # Flask server logs
logging.getLogger('httpx').setLevel(logging.INFO)     # HTTP request logs
logging.getLogger('langchain').setLevel(logging.INFO) # LangChain logs
logging.getLogger('requests').setLevel(logging.INFO)  # API request logs

logger = logging.getLogger(__name__)

# Log startup information
logger.info("=" * 80)
logger.info("IRENO Smart Assistant - Backend Starting Up")
logger.info("=" * 80)

# Global variables for agent components
agent_executor = None
memory = None

def initialize_azure_openai():
    """Initialize Azure OpenAI with the exact configuration from the demo notebook"""
    try:
        # Get API key from environment
        api_key = os.getenv('AZURE_OPENAI_API_KEY')
        if not api_key:
            raise ValueError("AZURE_OPENAI_API_KEY not found in environment variables")
        # Create Azure OpenAI instance with exact notebook configuration
        azure_llm = AzureChatOpenAI(
            azure_deployment="gpt-4o",
            openai_api_version="2025-01-01-preview",
            azure_endpoint="https://ireno-interns-openai.openai.azure.com/",
            api_key=api_key,
            temperature=0
        )
        logger.info("Azure OpenAI initialized successfully")
        return azure_llm
    except Exception as e:
        logger.error(f"Failed to initialize Azure OpenAI: {str(e)}")
        raise

def create_chat_prompt():
    """Create an enhanced ChatPromptTemplate with FIXED data extraction and NO hallucination"""
    system_prompt = """You are the IRENO Smart Assistant - an expert AI assistant for electric utility management and smart grid operations.

🚨 CRITICAL ANTI-HALLUCINATION RULES:
1. NEVER generate fake data, percentages, dates, or zone names
2. ONLY use exact values returned by tools
3. If tools fail, report the error - don't invent data
4. All APIs contain STATIC historical data (Aug 4-11, 2025) - NOT relative to current date

MISSION: Provide real-time insights, performance analytics, and operational support for electric utility systems.

**🔧 AVAILABLE WORKING TOOLS (9 TOTAL):**

**COLLECTOR MANAGEMENT (3 tools):**
- get_offline_collectors: Monitor offline/disconnected devices (supports zone filtering: "Brooklyn", "Queens", etc.)
- get_online_collectors: Track active/operational devices  
- get_collectors_count: Get comprehensive statistics with ACCURATE zone breakdown and offline percentages

**� HISTORICAL KPI DATA (2 tools) - Aug 4-11, 2025 ONLY:**
- get_last_7_days_interval_read_success: Daily interval read data (Aug 4-11, 2025)
  • Supports specific date queries: "August 10th, 2025" → returns exact percentage for that date
  • Example data: 2025-08-10 = 94.77%, 2025-08-09 = 94.89%
  
- get_last_7_days_register_read_success: Daily register read data (Aug 4-11, 2025)  
  • Supports specific date queries: "August 5th, 2025" → returns exact percentage for that date
  • Example data: All dates show 100% performance

**🌍 ZONE-BASED PERFORMANCE (4 tools):**
- get_interval_read_success_by_zone_weekly: Weekly interval performance by zone
- get_interval_read_success_by_zone_monthly: Monthly interval performance by zone (supports zone ID queries)
- get_register_read_success_by_zone_weekly: Weekly register performance by zone  
- get_register_read_success_by_zone_monthly: Monthly register performance by zone (supports zone ID queries)

**REAL ZONE MAPPING (NO HALLUCINATION):**
- 11852150-1fe1-4d7a-ba57-84a31af92b55 = Westchester
- 1091d1bd-b146-461c-bd33-eb25a5d95787 = Manhattan
- 427917a2-e104-455f-8f29-36cef60a86c6 = Brooklyn  
- efba1047-90d1-4f6f-a5c9-a4b40176e150 = Queens
- 3668467f-3f94-4486-bcc1-cbb1aa16d015 = Bronx
- 6f5a70ef-dc5c-4efa-83ca-efa1590873b7 = Staten Island

**🚨 MANDATORY TOOL USAGE FOR DATA QUERIES:**
✅ "August 10th, 2025 interval read" → get_last_7_days_interval_read_success
✅ "Which zone has highest offline" → get_collectors_count  
✅ "Brooklyn offline collectors" → get_offline_collectors
✅ "Zone ID 3668467f..." → get_interval_read_success_by_zone_monthly
✅ "Compare August 9th vs 10th" → get_last_7_days_interval_read_success (will show both dates)

**RESPONSE RULES:**
- Start with: "Based on real-time data from the IRENO system:"
- Show exact dates from tool responses (2025-08-XX format)  
- Use exact percentages from tools (show decimal precision)
- If tool shows no data for a date, say "No data available for [date]"
- NEVER say "Zone A", "Zone B" - use real zone names from mapping above
- For zone comparisons, use actual percentages from tool responses

**DATA QUERY DETECTION:**
- "August X, 2025" or "Aug X" → Historical daily tools
- "zone", "area", "highest", "lowest" → Zone-based tools or collectors count
- "offline collectors in [zone]" → get_offline_collectors with zone filtering
- Zone ID (UUID format) → Zone tools that support ID lookup
- "how many collectors" → get_collectors_count

**TONE:** Professional, technical, accurate - suitable for utility operators, field technicians, and management.

🚨 REMEMBER: You are a data extraction assistant - NEVER invent data. Extract exact values from tool responses."""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("placeholder", "{chat_history}"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}")
    ])
    
    return prompt

def initialize_agent():
    """Initialize the RAG and Tool Calling agent"""
    global agent_executor, memory
    
    try:
        # Initialize Azure OpenAI
        azure_llm = initialize_azure_openai()
        # Get live tools from ireno_tools.py
        tools = create_ireno_tools()
        logger.info(f"Created {len(tools)} live API tools")
        # Create conversation memory with k=10 as specified
        global memory, agent_executor
        memory = ConversationBufferWindowMemory(
            k=10,
            memory_key="chat_history",
            return_messages=True
        )
        # Create chat prompt template
        prompt = create_chat_prompt()
        # Create tool calling agent
        agent = create_tool_calling_agent(
            llm=azure_llm,
            tools=tools,
            prompt=prompt
        )
        # Create agent executor with memory and verbose logging
        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            memory=memory,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5,
            return_intermediate_steps=True  # This will help us see tool usage
        )
        logger.info("RAG and Tool Calling agent initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize agent: {str(e)}")
        return False

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Check if agent is initialized
        agent_status = "initialized" if agent_executor is not None else "not initialized"
        
        # Check environment variables
        azure_key_status = "configured" if os.getenv('AZURE_OPENAI_API_KEY') else "missing"
        
        return jsonify({
            "status": "healthy",
            "agent": agent_status,
            "azure_openai_key": azure_key_status,
            "tools": "live API integration",
            "memory": "conversation buffer (k=10)",
            "model": "gpt-4o via Azure OpenAI"
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
@jwt_required
def chat():
    """Main chat endpoint that processes user messages through the RAG agent"""
    try:
        # Check if agent is initialized
        if agent_executor is None:
            return jsonify({
                "error": "Agent not initialized. Please check server logs."
            }), 500

        # Get user message and username from request
        data = request.get_json()
        if not data or 'message' not in data or 'username' not in data:
            return jsonify({
                "error": "Missing 'message' or 'username' field in request body"
            }), 400

        user_message = data['message'].strip()
        username = data['username'].strip()
        if not user_message or not username:
            return jsonify({
                "error": "Message and username cannot be empty"
            }), 400

        logger.info(f"Processing user message: {user_message}")

        # Check if query requires real data and enhance the prompt with specific tool guidance
        data_keywords = [
            'august', 'aug', '2025', 'date', 'daily', 'day',  # Date-specific
            'last 7 days', 'last seven days', 'weekly', 'recent', 'past week',
            'zone performance', 'zone', 'area', 'highest zone', 'lowest zone', 'best zone', 'worst zone',
            'interval read', 'register read', 'success rate', 'percentage', 'performance',
            'monthly', 'weekly trends', 'zone comparison', 'which zone', 'brooklyn', 'queens', 'bronx', 
            'manhattan', 'westchester', 'staten island', 'offline collectors in',
            'kpi', 'metrics', 'statistics', 'data', 'count', 'how many', 'total collectors',
            '3668467f', '427917a2', '11852150', '1091d1bd', 'efba1047', '6f5a70ef'  # Zone IDs
        ]
        
        needs_real_data = any(keyword in user_message.lower() for keyword in data_keywords)
        
        if needs_real_data:
            enhanced_message = f"""🚨 DATA QUERY DETECTED - MANDATORY TOOL USAGE - NO HALLUCINATION 🚨

User Query: {user_message}

CRITICAL INSTRUCTIONS FOR AI AGENT:
1. This query requires REAL-TIME data from IRENO system APIs
2. You MUST use appropriate tools from the 9 working APIs
3. DO NOT generate, assume, or hallucinate any data values, percentages, dates, or zone names
4. If tools fail or return no data, report the exact error - don't invent data
5. Use exact values, dates, and zone names from tool responses
6. Start response with "Based on real-time data from the IRENO system:"

SPECIFIC TOOL SELECTION GUIDE:
- "August X, 2025" or date queries → get_last_7_days_interval_read_success OR get_last_7_days_register_read_success
- "zone performance", "which zone highest/lowest" → get_collectors_count (has zone breakdown)
- "offline collectors in [zone name]" → get_offline_collectors (supports zone filtering)
- Zone ID (UUID like 3668467f-...) → get_interval_read_success_by_zone_monthly OR get_register_read_success_by_zone_monthly
- "weekly zone" → get_interval/register_read_success_by_zone_weekly
- "monthly zone" → get_interval/register_read_success_by_zone_monthly  
- "how many collectors" → get_collectors_count
- "offline collectors" → get_offline_collectors

CRITICAL ZONE MAPPING (NO HALLUCINATION):
- 11852150-1fe1-4d7a-ba57-84a31af92b55 = Westchester
- 1091d1bd-b146-461c-bd33-eb25a5d95787 = Manhattan
- 427917a2-e104-455f-8f29-36cef60a86c6 = Brooklyn
- efba1047-90d1-4f6f-a5c9-a4b40176e150 = Queens
- 3668467f-3f94-4486-bcc1-cbb1aa16d015 = Bronx
- 6f5a70ef-dc5c-4efa-83ca-efa1590873b7 = Staten Island

EXPECTED HISTORICAL DATA (Aug 4-11, 2025):
- Daily interval reads: Aug 9 = 94.89%, Aug 10 = 94.77%, etc.
- Daily register reads: 100% for all dates
- Zone performance varies by zone and metric
- NO relative dates - data is static for Aug 4-11, 2025

ANTI-HALLUCINATION CHECKLIST:
✅ Extract exact percentages from tool responses
✅ Use exact dates in YYYY-MM-DD format from tools
✅ Use real zone names from mapping above (no "Zone A", "Zone B", etc.)
✅ If specific date not found, show available dates from tool response
✅ If zone filtering fails, show what data is actually available

PROCESS: Tool Call → Extract Real Data → Format Response (NO INVENTION)"""
            logger.info(f"Enhanced message for data query: {enhanced_message[:100]}...")
        else:
            enhanced_message = user_message

        # Find user in database
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Save user message to ChatMessage table
        chat_msg = ChatMessage(user_id=user.id, message=user_message, sender='user')
        db.session.add(chat_msg)
        db.session.commit()

        # Invoke the agent executor with the user's message
        try:
            logger.info("Invoking agent executor...")
            response = agent_executor.invoke({
                "input": enhanced_message  # Use enhanced message instead of original
            })
            logger.info(f"Agent executor completed successfully")
            
            # Log tool usage for debugging
            if 'intermediate_steps' in response:
                tools_used = [step[0].tool for step in response['intermediate_steps']]
                logger.info(f"🔧 TOOLS USED: {tools_used}")
                if not tools_used and needs_real_data:
                    logger.warning("🚨 WARNING: Data query detected but NO TOOLS were used!")
            else:
                logger.info("ℹ️ No intermediate steps found in response")
                
        except Exception as agent_error:
            logger.error("=" * 80)
            logger.error("AGENT EXECUTION ERROR DETAILS:")
            logger.error("=" * 80)
            logger.error(f"Error message: {str(agent_error)}")
            logger.error(f"Error type: {type(agent_error).__name__}")
            logger.error(f"User message that caused error: {user_message}")
            logger.error("Full stack trace:")
            logger.error("", exc_info=True)
            logger.error("=" * 80)
            # Save error log to LogEntry table
            log_entry = LogEntry(level="ERROR", message=f"Agent error: {str(agent_error)}")
            db.session.add(log_entry)
            db.session.commit()
            # Return a user-friendly error response
            return jsonify({
                "error": "I encountered an issue processing your request. Please try again or rephrase your question.",
                "details": f"Error type: {type(agent_error).__name__}",
                "status": "error"
            }), 500

        # Extract the agent's response
        agent_response = response.get('output', 'Sorry, I could not generate a response.')

        # Save assistant response to ChatMessage table
        assistant_msg = ChatMessage(user_id=user.id, message=agent_response, sender='assistant')
        db.session.add(assistant_msg)
        db.session.commit()

        # Save info log to LogEntry table
        log_entry = LogEntry(level="INFO", message=f"User: {username}, Message: {user_message}, Response: {agent_response}")
        db.session.add(log_entry)
        db.session.commit()

        logger.info(f"Agent response generated successfully")
        return jsonify({
            "response": agent_response,
            "status": "success"
        }), 200
    except Exception as e:
        # Enhanced error logging for debugging
        logger.error("=" * 80)
        logger.error("CHAT ENDPOINT ERROR DETAILS:")
        logger.error("=" * 80)
        logger.error(f"Error message: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Request data: {request.get_json() if request.is_json else 'No JSON data'}")
        logger.error(f"Request method: {request.method}")
        logger.error(f"Request URL: {request.url}")
        logger.error("Full traceback:")
        logger.error("", exc_info=True)
        
        # Check for specific error types
        if "openai" in str(type(e)).lower() or "azure" in str(type(e)).lower():
            logger.error("AZURE OPENAI API ERROR DETECTED:")
            logger.error("   - Check if API key is valid and not expired")
            logger.error("   - Verify network connectivity to Azure OpenAI")
            logger.error("   - Ensure Azure OpenAI service is running")
            logger.error("   - Check if deployment name 'gpt-4o' exists")
        elif "connection" in str(e).lower():
            logger.error("CONNECTION ERROR DETECTED:")
            logger.error("   - Check network connectivity")
            logger.error("   - Verify IRENO API endpoints are accessible")
            logger.error("   - Check firewall settings")
        elif "timeout" in str(e).lower():
            logger.error("TIMEOUT ERROR DETECTED:")
            logger.error("   - API response taking too long")
            logger.error("   - Consider increasing timeout values")
            logger.error("   - Check API server load")
        
        logger.error("=" * 80)
        
        return jsonify({
            "error": f"Connection error.",
            "details": str(e),
            "status": "error"
        }), 500


# Admin-only: Reset conversation memory
@app.route('/api/reset-memory', methods=['POST'])
@jwt_required
@role_required('admin')
def reset_memory():
    """Reset the conversation memory (admin only)"""
    try:
        global memory
        if memory:
            memory.clear()
            logger.info("Conversation memory reset (admin)")
            return jsonify({"status": "success", "message": "Memory reset successfully"}), 200
        else:
            return jsonify({"status": "error", "message": "Memory not initialized"}), 500
    except Exception as e:
        logger.error(f"Memory reset error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Admin-only: Delete a user
@app.route('/api/admin/delete-user', methods=['POST'])
@jwt_required
@role_required('admin')
def delete_user():
    data = request.get_json()
    username = data.get('username', '').strip()
    if not username:
        return jsonify({'message': 'Username required.'}), 400
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found.'}), 404
    db.session.delete(user)
    db.session.commit()
    logger.info(f"Admin deleted user: {username}")
    return jsonify({'message': f'User {username} deleted successfully.'}), 200

# Admin-only: Dashboard endpoint (example)
@app.route('/api/admin/dashboard', methods=['GET'])
@jwt_required
@role_required('admin')
def admin_dashboard():
    user_count = User.query.count()
    chat_count = ChatMessage.query.count()
    log_count = LogEntry.query.count()
    return jsonify({
        'user_count': user_count,
        'chat_count': chat_count,
        'log_count': log_count,
        'message': 'Admin dashboard data.'
    }), 200

if __name__ == '__main__':
    print("Starting IRENO Smart Grid RAG Assistant with Azure OpenAI...")
    print("=" * 60)
    # Initialize the agent
    if initialize_agent():
        print("Agent initialization successful!")
        print(f"Tools: Live API integration via ireno_tools.py")
        print(f"Model: GPT-4o via Azure OpenAI")
        print(f"Memory: Conversation Buffer (k=10)")
        print(f"Endpoint: POST /api/chat")
        print("=" * 60)
        # Start Flask development server
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("Agent initialization failed! Check logs for details.")
        print("Make sure AZURE_OPENAI_API_KEY is set in your .env file")
