# Developer Runbook: IRENO Smart Assistant Backend Setup

## 🚀 First-Time Backend Setup Guide

**Prerequisites**: Python 3.9+ and pip installed, React frontend running on localhost:3000 or localhost:5173

**Estimated Setup Time**: 10-15 minutes

---

## Step 1: Navigate to Backend Directory

Open your terminal/command prompt and navigate to the backend directory:

```bash
cd "c:\Users\2350938\Downloads\ireno-chatgpt-style\ireno-react-app-Frontend\backend"
```

**Verify you're in the correct directory:**
```bash
# You should see files like app.py and ireno_tools.py
dir  # Windows
ls   # macOS/Linux
```

---

## Step 2: Create requirements.txt File

Create a `requirements.txt` file with the exact dependencies needed:

**Create the file and copy this content exactly:**

```txt
Flask==3.0.0
Flask-CORS==4.0.0
langchain==0.1.20
langchain-openai==0.1.7
langchain-community==0.0.38
openai==1.30.1
python-dotenv==1.0.0
requests==2.31.0
```

**Save this as `requirements.txt` in the backend directory.**

---

## Step 3: Create Python Virtual Environment

**Create a new virtual environment:**

```bash
# Windows
python -m venv venv

# macOS/Linux  
python3 -m venv venv
```

**Activate the virtual environment:**

```bash
# Windows (Command Prompt)
venv\Scripts\activate

# Windows (PowerShell)
venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate
```

**✅ Verification**: Your command prompt should now show `(venv)` at the beginning.

---

## Step 4: Install All Dependencies

**Install all required packages with a single command:**

```bash
pip install -r requirements.txt
```

**⏳ This will take 2-3 minutes to download and install all packages.**

**✅ Verification**: Check if key packages are installed:
```bash
pip list | findstr Flask     # Windows
pip list | grep Flask       # macOS/Linux
```

You should see Flask, Flask-CORS, and other packages listed.

---

## Step 5: Create Environment Configuration

**Create a `.env` file for environment variables:**

```bash
# Create the .env file
echo. > .env   # Windows
touch .env     # macOS/Linux
```

**Add your OpenAI API key to the .env file:**

Open the `.env` file in your text editor and add this content:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_actual_openai_api_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# Application Configuration
SECRET_KEY=your_secret_key_here_change_in_production
```

**🔑 IMPORTANT**: Replace `your_actual_openai_api_key_here` with your actual OpenAI API key (starts with `sk-`).

**📝 To get an OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key and paste it in your .env file

---

## Step 6: Start the Flask Backend Server

**Start the server with this exact command:**

```bash
python app.py
```

**✅ Expected Output**: You should see:
```
🚀 Starting IRENO Backend API with RAG and Tool Calling...
📡 API available at: http://127.0.0.1:5000
💬 Chat endpoint: http://127.0.0.1:5000/api/chat
🧠 OpenAI Model: gpt-3.5-turbo with function calling
💾 Memory Window: 10 messages
🔧 RAG Tools Available:
   - Offline Collectors API
   - Online Collectors API
   - Collectors Count API
✅ OpenAI API key loaded successfully
🌐 IRENO API Base URL: https://irenoakscluster.westus.cloudapp.azure.com
🤖 Agent Type: OpenAI Functions with RAG capabilities
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

**❌ If you see "OpenAI API key not found!"**: Check your .env file and make sure the API key is correct.

---

## Step 7: Verify Backend is Running

**Test 1: Health Check**

Open a new terminal window (keep the server running) and test:

```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "IRENO Backend API",
  "features": [
    "OpenAI Integration",
    "LangChain",
    "Conversation Memory",
    "RAG with Tool Calling",
    "IRENO API Integration"
  ]
}
```

**Test 2: Chat Endpoint**

Test the main chat functionality:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Hello, can you help me?\"}"
```

**Expected Response:**
```json
{
  "response": "Hello! I'm IRENO Smart Assistant, your AI-powered utility management companion. I can help you with real-time monitoring, system status checks, performance analytics, and more. What would you like to know about your electric utility systems?"
}
```

**Test 3: IRENO API Tools**

Test the IRENO API integration:

```bash
curl http://localhost:5000/api/test-tools
```

**Expected Response**: JSON with results from IRENO API tools testing.

---

## Step 8: Connect Frontend to Backend

**Ensure your React frontend is configured to connect to the backend:**

1. **Check Frontend Configuration**: The frontend should be making requests to `http://127.0.0.1:5000/api/chat`

2. **CORS Verification**: The backend has CORS enabled to accept requests from the frontend

3. **Test Full Integration**: 
   - Open your React app (localhost:3000 or localhost:5173)
   - Login with any credentials
   - Try sending a message in the chat
   - You should see AI responses

---

## 🛠️ Troubleshooting

### Problem: "ModuleNotFoundError"
**Solution**: Make sure virtual environment is activated and dependencies are installed:
```bash
# Activate venv first
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Then install dependencies
pip install -r requirements.txt
```

### Problem: "OpenAI API key not found"
**Solution**: Check your .env file:
1. File is named exactly `.env` (with the dot)
2. API key starts with `sk-`
3. No spaces around the equals sign
4. File is in the same directory as app.py

### Problem: "Port 5000 already in use"
**Solution**: Kill the process using port 5000:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Problem: "CORS errors" in browser
**Solution**: Backend should have Flask-CORS installed and configured. Check that:
1. Flask-CORS is in requirements.txt
2. Backend is running on port 5000
3. Frontend is making requests to correct URL

### Problem: Backend starts but AI doesn't respond
**Solution**: Test OpenAI API key separately:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models
```

---

## 📝 Quick Commands Reference

```bash
# Activate virtual environment
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start backend server
python app.py

# Test health endpoint
curl http://localhost:5000/health

# Test chat endpoint
curl -X POST http://localhost:5000/api/chat -H "Content-Type: application/json" -d "{\"message\": \"test\"}"

# Deactivate virtual environment (when done)
deactivate
```

---

## 🎯 Success Checklist

- [ ] Virtual environment created and activated
- [ ] All dependencies installed without errors
- [ ] .env file created with valid OpenAI API key
- [ ] Backend server starts without errors
- [ ] Health endpoint returns "healthy" status
- [ ] Chat endpoint returns AI response
- [ ] Frontend can connect and send messages
- [ ] IRENO API tools are accessible

**🎉 If all checkboxes are checked, your IRENO Smart Assistant backend is ready!**

---

## 🔄 Daily Development Workflow

**Starting Work:**
1. Navigate to backend directory
2. Activate virtual environment: `venv\Scripts\activate`
3. Start server: `python app.py`

**Ending Work:**
1. Stop server: `Ctrl+C`
2. Deactivate environment: `deactivate`

**Updating Dependencies:**
```bash
pip install new-package
pip freeze > requirements.txt  # Update requirements file
```

---

## 📞 Support

**If you encounter issues:**
1. Check the troubleshooting section above
2. Verify all steps were followed exactly
3. Check the console output for specific error messages
4. Ensure your OpenAI API key has sufficient credits
5. Contact the development team with specific error messages

**Common URLs:**
- Backend Health: http://localhost:5000/health
- Chat API: http://localhost:5000/api/chat
- Tools Test: http://localhost:5000/api/test-tools
- Frontend: http://localhost:5173 (or :3000)

---

**Document Version**: 1.0  
**Last Updated**: August 24, 2025  
**Estimated Setup Time**: 10-15 minutes  
**Tested On**: Windows 10/11, macOS, Ubuntu
