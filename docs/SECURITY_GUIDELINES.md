# Security Guidelines
## IRENO Smart Assistant

### API Key Management

#### OpenAI API Keys
```bash
# Environment setup
export OPENAI_API_KEY="sk-..."

# In production, use secrets management
kubectl create secret generic openai-secrets \
  --from-literal=api-key="$OPENAI_API_KEY"

# Verify key is working
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

#### Key Rotation Process
1. Generate new API key in OpenAI dashboard
2. Update secret in production environment
3. Test with new key
4. Revoke old key
5. Monitor for any failures

### Data Protection

#### User Data Handling
```python
# Encrypt sensitive data
from cryptography.fernet import Fernet

def encrypt_conversation(conversation_data):
    key = os.environ.get('ENCRYPTION_KEY').encode()
    f = Fernet(key)
    encrypted_data = f.encrypt(json.dumps(conversation_data).encode())
    return encrypted_data

def decrypt_conversation(encrypted_data):
    key = os.environ.get('ENCRYPTION_KEY').encode()
    f = Fernet(key)
    decrypted_data = f.decrypt(encrypted_data)
    return json.loads(decrypted_data.decode())
```

#### Data Retention Policy
- User conversations: 30 days
- System logs: 90 days
- Audit logs: 1 year
- Error logs: 6 months

### Input Validation

#### Frontend Validation
```javascript
// Sanitize user input
import DOMPurify from 'dompurify';

function sanitizeInput(input) {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}
```

#### Backend Validation
```python
# Validate and sanitize inputs
import re
from flask import request, abort

def validate_chat_input(message):
    if not message or len(message.strip()) == 0:
        abort(400, "Message cannot be empty")
    
    if len(message) > 4000:
        abort(400, "Message too long")
    
    # Remove potentially harmful patterns
    sanitized = re.sub(r'[<>"\']', '', message)
    return sanitized
```

### Authentication & Authorization

#### JWT Token Management
```python
import jwt
from datetime import datetime, timedelta

def generate_token(user_data):
    payload = {
        'user_id': user_data['id'],
        'role': user_data['role'],
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
```

#### Role-Based Access Control
```python
from functools import wraps

def require_role(required_role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                abort(401)
            
            payload = verify_token(token.replace('Bearer ', ''))
            if not payload or payload['role'] != required_role:
                abort(403)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/admin/users')
@require_role('senior_leadership')
def get_users():
    # Admin-only endpoint
    pass
```

### Security Headers

#### Flask Security Configuration
```python
from flask_talisman import Talisman

# Content Security Policy
csp = {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'connect-src': "'self' https://api.openai.com"
}

Talisman(app, content_security_policy=csp)

@app.after_request
def after_request(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response
```

### Monitoring & Alerting

#### Security Monitoring
```python
import logging
from datetime import datetime

security_logger = logging.getLogger('security')

def log_security_event(event_type, user_id, details):
    security_logger.warning(f"Security Event: {event_type}", extra={
        'timestamp': datetime.utcnow().isoformat(),
        'user_id': user_id,
        'event_type': event_type,
        'details': details,
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent')
    })

# Usage
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        # Process chat
        pass
    except Exception as e:
        log_security_event('CHAT_ERROR', user_id, str(e))
        raise
```

### Incident Response

#### Security Incident Types
1. **Data Breach**: Unauthorized access to user data
2. **API Abuse**: Excessive or malicious API usage
3. **Authentication Bypass**: Unauthorized access attempts
4. **Code Injection**: Malicious code execution attempts

#### Immediate Response Actions
1. **Isolate the threat**
   ```bash
   # Block suspicious IP
   kubectl patch service ireno-frontend -p '{"spec":{"loadBalancerSourceRanges":["ALLOWED_IP_RANGE"]}}'
   
   # Revoke compromised tokens
   kubectl delete secret jwt-signing-key
   kubectl create secret generic jwt-signing-key --from-literal=key="NEW_SECRET_KEY"
   ```

2. **Assess impact**
   - Check audit logs for affected users
   - Verify data integrity
   - Determine scope of compromise

3. **Contain and recover**
   - Update security patches
   - Reset compromised credentials
   - Implement additional monitoring

### Compliance Checklist

#### Pre-deployment Security Review
- [ ] All dependencies scanned for vulnerabilities
- [ ] Input validation implemented
- [ ] Authentication and authorization tested
- [ ] Security headers configured
- [ ] API rate limiting enabled
- [ ] Logging and monitoring active
- [ ] Data encryption verified
- [ ] Backup and recovery tested

#### Monthly Security Audit
- [ ] Review access logs for anomalies
- [ ] Update dependencies with security patches
- [ ] Rotate API keys and secrets
- [ ] Test incident response procedures
- [ ] Review and update security policies
- [ ] Conduct penetration testing
- [ ] Validate backup integrity
