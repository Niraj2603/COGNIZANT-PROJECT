# Standard Operating Procedure (SOP)
## IRENO Smart Assistant Project

**Document Version:** 1.0  
**Date:** August 24, 2025  
**Prepared by:** IRENO Development Team  
**Approved by:** Project Manager / Technical Lead  
**Next Review Date:** February 24, 2026  

---

## Table of Contents

1. [Document Overview](#1-document-overview)
2. [Development Lifecycle](#2-development-lifecycle)
3. [Quality Assurance](#3-quality-assurance)
4. [Compliance and Security](#4-compliance-and-security)
5. [Training and Onboarding](#5-training-and-onboarding)
6. [Maintenance and Updates](#6-maintenance-and-updates)
7. [Incident Management](#7-incident-management)
8. [Appendices](#8-appendices)

---

## 1. Document Overview

### 1.1 Purpose
This Standard Operating Procedure (SOP) document establishes standardized processes for the development, deployment, maintenance, and operation of the IRENO Smart Assistant - a ChatGPT-style AI interface for electric utilities.

### 1.2 Scope
This SOP applies to all team members involved in:
- Development and maintenance of the IRENO Smart Assistant
- Quality assurance and testing procedures
- Security and compliance management
- Incident response and resolution
- User training and support

### 1.3 System Overview
The IRENO Smart Assistant is a Generative AI-powered solution that provides:
- Natural language interface for electric utility operations
- Real-time data retrieval from IRENO APIs
- Intelligent summarization and contextualization
- Role-based access for field technicians, operators, and leadership
- Data visualization and reporting capabilities

### 1.4 Technology Stack
- **Frontend:** React 18 + Vite, CSS Modules, Lucide React
- **Backend:** Python Flask 3.0.0, LangChain, OpenAI GPT-3.5-turbo
- **APIs:** IRENO Azure Kubernetes Cluster endpoints
- **Visualization:** Recharts library
- **Architecture:** Three-tier (UI, backend services, data sources)

---

## 2. Development Lifecycle

### 2.1 Project Structure Standards

#### 2.1.1 Repository Organization
```
ireno-smart-assistant/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── context/        # React Context providers
│   │   └── styles/         # CSS modules and global styles
│   ├── public/             # Static assets
│   └── package.json        # Dependencies and scripts
├── backend/                 # Flask API server
│   ├── app.py              # Main application entry
│   ├── ireno_tools.py      # IRENO API integration
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
├── docs/                   # Documentation
└── tests/                  # Test suites
```

#### 2.1.2 Naming Conventions
- **Files:** Use kebab-case for directories, PascalCase for React components
- **Variables:** camelCase for JavaScript, snake_case for Python
- **Functions:** Descriptive names with action verbs
- **API Endpoints:** RESTful naming (e.g., `/api/chat`, `/api/charts`)

### 2.2 Git Workflow (Gitflow)

#### 2.2.1 Branch Strategy
- **main:** Production-ready code only
- **develop:** Integration branch for features
- **feature/\*:** Individual feature development
- **release/\*:** Release preparation
- **hotfix/\*:** Emergency production fixes

#### 2.2.2 Feature Development Process
1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/IRENO-123-new-feature
   ```

2. **Development Standards**
   - Commit messages: Use conventional commits format
   - Example: `feat(chat): add data visualization support`
   - Include issue number in branch name
   - Regular commits with descriptive messages

3. **Code Review Requirements**
   - All code must be reviewed by at least one senior developer
   - Use pull request templates
   - Ensure CI/CD pipeline passes
   - Update documentation as needed

4. **Merge Process**
   ```bash
   # Before creating PR
   git checkout develop
   git pull origin develop
   git checkout feature/IRENO-123-new-feature
   git rebase develop
   git push origin feature/IRENO-123-new-feature
   ```

#### 2.2.3 Version Control Standards
- **Semantic Versioning:** MAJOR.MINOR.PATCH
- **Release Tags:** Create annotated tags for releases
- **Changelog:** Maintain CHANGELOG.md with all changes
- **Backup:** Ensure remote repository backup strategy

### 2.3 Development Environment Setup

#### 2.3.1 Required Tools
- **Node.js:** Version 18+ for frontend development
- **Python:** Version 3.9+ for backend development
- **Git:** Latest version for version control
- **VS Code:** Recommended IDE with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Python extension pack
  - Prettier - Code formatter
  - ESLint

#### 2.3.2 Local Development Setup
1. **Clone Repository**
   ```bash
   git clone https://github.com/organization/ireno-smart-assistant.git
   cd ireno-smart-assistant
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Configure environment variables
   python app.py
   ```

---

## 3. Quality Assurance

### 3.1 Testing Strategy

#### 3.1.1 Unit Testing
- **Frontend Testing (Jest + React Testing Library)**
  ```bash
  npm test                    # Run all tests
  npm test -- --watch        # Watch mode
  npm run test:coverage      # Coverage report
  ```
  
- **Test Requirements:**
  - Minimum 80% code coverage
  - Test all utility functions
  - Component rendering tests
  - User interaction tests

- **Backend Testing (pytest)**
  ```bash
  pytest tests/              # Run all tests
  pytest --cov=app          # Coverage report
  pytest -v                 # Verbose output
  ```

#### 3.1.2 Integration Testing

##### 3.1.2.1 IRENO API Integration Tests
```python
# Example test structure
def test_ireno_api_offline_collectors():
    """Test offline collectors API integration"""
    api_tools = IrenoAPITools()
    result = api_tools.get_offline_collectors("test")
    
    assert result is not None
    assert "collectors" in result.lower()
    # Verify data format and content

def test_ireno_api_error_handling():
    """Test API error handling"""
    # Mock network error
    # Verify graceful error handling
    # Check fallback responses
```

##### 3.1.2.2 End-to-End Testing
- **Tools:** Cypress or Playwright
- **Test Scenarios:**
  - User login flow
  - Chat conversation with AI
  - Data visualization rendering
  - Error handling and recovery

#### 3.1.3 API Testing
- **Tools:** Postman collections or pytest-httpx
- **Test Coverage:**
  - All Flask endpoints
  - Authentication flows
  - Error responses
  - Rate limiting
  - Data validation

### 3.2 User Acceptance Testing (UAT)

#### 3.2.1 UAT Process
1. **Test Environment Setup**
   - Deploy to staging environment
   - Configure test data
   - Ensure API connectivity

2. **Test Scenarios**
   - Field Technician workflow testing
   - Command Center Operator scenarios
   - Senior Leadership reporting features

3. **UAT Checklist**
   - [ ] Login functionality for all user roles
   - [ ] Natural language query processing
   - [ ] Real-time IRENO data retrieval
   - [ ] Data visualization accuracy
   - [ ] Conversation history management
   - [ ] Theme toggle functionality
   - [ ] Mobile responsiveness
   - [ ] Error handling and recovery

#### 3.2.2 Performance Testing
- **Load Testing:** Simulate concurrent users
- **API Response Times:** < 2 seconds for data queries
- **Frontend Performance:** Lighthouse scores > 90
- **Memory Usage:** Monitor for memory leaks

### 3.3 Testing Documentation
- Maintain test plans and test cases
- Document bug reports with reproduction steps
- Track test metrics and coverage reports
- Regular testing reviews and updates

---

## 4. Compliance and Security

### 4.1 Data Handling Guidelines

#### 4.1.1 User Data Protection
- **Data Collection:** Only collect necessary user information
- **Data Storage:** Encrypt sensitive data at rest
- **Data Transmission:** Use HTTPS for all communications
- **Data Retention:** Implement data retention policies
- **User Consent:** Obtain explicit consent for data processing

#### 4.1.2 Conversation Data Management
```python
# Example data handling
class ConversationManager:
    def store_conversation(self, user_id, conversation):
        # Encrypt sensitive content
        encrypted_data = encrypt_conversation(conversation)
        # Store with expiration policy
        store_with_ttl(user_id, encrypted_data, ttl=30_days)
    
    def anonymize_conversation(self, conversation):
        # Remove PII from conversation logs
        return remove_personal_identifiers(conversation)
```

### 4.2 API Security

#### 4.2.1 API Key Management
- **Environment Variables:** Store API keys in secure environment files
- **Key Rotation:** Regular rotation of OpenAI API keys
- **Access Control:** Limit API key permissions
- **Monitoring:** Track API usage and anomalies

```python
# Secure API key handling
import os
from dotenv import load_dotenv

load_dotenv()

class SecureConfig:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    @classmethod
    def validate_config(cls):
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not found in environment")
```

#### 4.2.2 IRENO API Security
- **Authentication:** Implement proper API authentication
- **Rate Limiting:** Prevent API abuse
- **Input Validation:** Sanitize all user inputs
- **Error Handling:** Don't expose sensitive error details

### 4.3 Ethical AI Use

#### 4.3.1 AI Ethics Guidelines
- **Transparency:** Clearly indicate AI-generated responses
- **Bias Prevention:** Regular testing for bias in responses
- **Accuracy:** Implement fact-checking mechanisms
- **User Control:** Allow users to override AI suggestions

#### 4.3.2 Content Filtering
```python
def validate_ai_response(response):
    """Validate AI response for ethical concerns"""
    if contains_harmful_content(response):
        return generate_safe_fallback()
    
    if contains_misinformation(response):
        return add_disclaimer(response)
    
    return response
```

### 4.4 Compliance Standards
- **GDPR:** European data protection compliance
- **CCPA:** California Consumer Privacy Act compliance
- **SOC 2:** Security and availability controls
- **Industry Standards:** Electric utility regulatory compliance

---

## 5. Training and Onboarding

### 5.1 New Developer Onboarding

#### 5.1.1 Week 1: Environment Setup and Orientation
**Day 1-2: System Overview**
- [ ] Complete system architecture walkthrough
- [ ] Review project documentation
- [ ] Set up development environment
- [ ] Access to repositories and tools

**Day 3-4: Technology Stack Deep Dive**
- [ ] React and modern JavaScript concepts
- [ ] Python Flask and LangChain framework
- [ ] OpenAI API integration patterns
- [ ] IRENO API documentation review

**Day 5: Hands-on Practice**
- [ ] Build a simple component
- [ ] Create a test API endpoint
- [ ] Run existing test suites
- [ ] Code review participation

#### 5.1.2 Week 2: Feature Development
- [ ] Assign starter issue (good first issue)
- [ ] Pair programming session
- [ ] Code review process training
- [ ] Git workflow practice

#### 5.1.3 Onboarding Checklist
```markdown
## New Developer Checklist

### Technical Setup
- [ ] Development environment configured
- [ ] Repository access granted
- [ ] IDE extensions installed
- [ ] Local application running

### Knowledge Transfer
- [ ] Architecture overview completed
- [ ] Code review guidelines understood
- [ ] Testing procedures learned
- [ ] Security guidelines acknowledged

### First Contribution
- [ ] First feature branch created
- [ ] Code changes implemented
- [ ] Tests written and passing
- [ ] Pull request submitted and merged
```

### 5.2 Role-Specific Training

#### 5.2.1 Frontend Developers
- **React Patterns:** Component design, state management, hooks
- **CSS Architecture:** CSS modules, responsive design, theming
- **Testing:** Jest, React Testing Library, Cypress
- **Performance:** Bundle optimization, lazy loading, caching

#### 5.2.2 Backend Developers
- **Flask Patterns:** API design, middleware, error handling
- **AI Integration:** LangChain, OpenAI API, prompt engineering
- **Testing:** pytest, API testing, mocking
- **Performance:** Database optimization, caching, scaling

#### 5.2.3 Full-Stack Developers
- Combined training from both tracks
- Integration patterns and communication
- End-to-end feature development
- Deployment and DevOps basics

### 5.3 Continuous Learning
- **Regular Tech Talks:** Weekly knowledge sharing sessions
- **Code Reviews:** Learning opportunity for all team members
- **Documentation:** Maintain up-to-date technical documentation
- **External Training:** Conference attendance, online courses

---

## 6. Maintenance and Updates

### 6.1 Regular Maintenance Tasks

#### 6.1.1 Weekly Maintenance
- [ ] Dependency updates check
- [ ] Security vulnerability scans
- [ ] Performance monitoring review
- [ ] Error log analysis
- [ ] API usage statistics review

#### 6.1.2 Monthly Maintenance
- [ ] Comprehensive security audit
- [ ] Performance optimization review
- [ ] User feedback analysis
- [ ] Documentation updates
- [ ] Backup verification

#### 6.1.3 Quarterly Maintenance
- [ ] Major dependency upgrades
- [ ] Architecture review
- [ ] Capacity planning
- [ ] Disaster recovery testing
- [ ] Training needs assessment

### 6.2 AI Model Management

#### 6.2.1 Intent Management and Updates
```python
# Example intent management system
class IntentManager:
    def update_prompt_templates(self, new_templates):
        """Update AI prompt templates"""
        validate_templates(new_templates)
        backup_current_templates()
        deploy_new_templates(new_templates)
        test_template_responses()
    
    def add_new_intent(self, intent_name, examples, response_template):
        """Add new conversation intent"""
        # Validate intent doesn't conflict
        # Add training examples
        # Test intent recognition
        # Deploy to production
```

#### 6.2.2 Model Performance Monitoring
- **Response Quality:** Regular evaluation of AI responses
- **User Satisfaction:** Feedback collection and analysis
- **Performance Metrics:** Response time, accuracy, relevance
- **A/B Testing:** Compare different prompt strategies

### 6.3 Deployment Process

#### 6.3.1 Staging Deployment
```bash
# Staging deployment script
#!/bin/bash
set -e

echo "Deploying to staging environment..."

# Backend deployment
cd backend
pip install -r requirements.txt
python -m pytest tests/
gunicorn --bind 0.0.0.0:5000 app:app &

# Frontend deployment
cd ../frontend
npm ci
npm run build
npm run preview &

echo "Staging deployment complete"
```

#### 6.3.2 Production Deployment
- **Blue-Green Deployment:** Zero-downtime deployments
- **Database Migrations:** Automated and reversible
- **Environment Variables:** Secure configuration management
- **Health Checks:** Automated deployment verification

### 6.4 Rollback Procedures
```bash
# Emergency rollback script
#!/bin/bash
PREVIOUS_VERSION=$1

echo "Rolling back to version $PREVIOUS_VERSION"

# Stop current services
docker-compose down

# Restore previous version
git checkout tags/$PREVIOUS_VERSION
docker-compose up -d

# Verify rollback
curl -f http://localhost:5000/health
echo "Rollback to $PREVIOUS_VERSION complete"
```

---

## 7. Incident Management

### 7.1 Incident Classification

#### 7.1.1 Severity Levels
- **Critical (P1):** System completely unavailable, data loss
- **High (P2):** Major functionality impaired, significant user impact
- **Medium (P3):** Minor functionality issues, workaround available
- **Low (P4):** Cosmetic issues, no functional impact

#### 7.1.2 Response Time Targets
| Severity | Response Time | Resolution Target |
|----------|---------------|-------------------|
| P1       | 15 minutes    | 4 hours          |
| P2       | 1 hour        | 24 hours         |
| P3       | 4 hours       | 72 hours         |
| P4       | 24 hours      | Next release     |

### 7.2 Incident Response Workflow

#### 7.2.1 Detection and Alerting
- **Automated Monitoring:** Health checks, error rate monitoring
- **User Reports:** Support ticket system
- **Internal Discovery:** Team member identification

#### 7.2.2 Initial Response (First 15 minutes)
1. **Acknowledge Incident**
   - Log incident in tracking system
   - Assign severity level
   - Notify incident commander

2. **Assessment**
   - Gather initial information
   - Determine scope and impact
   - Identify affected systems

3. **Communication**
   - Notify stakeholders
   - Post status updates
   - Establish communication channels

#### 7.2.3 Investigation and Resolution
```python
# Incident investigation checklist
INVESTIGATION_STEPS = [
    "Check system health dashboard",
    "Review recent deployments",
    "Analyze error logs and metrics",
    "Identify root cause",
    "Implement fix or workaround",
    "Verify resolution",
    "Monitor for regression"
]
```

### 7.3 Common Issues and Solutions

#### 7.3.1 AI Response Issues
**Issue:** AI providing incorrect or irrelevant responses
- **Immediate Action:** Enable fallback responses
- **Investigation:** Review prompt templates and training data
- **Resolution:** Update prompt engineering, retrain if necessary

**Issue:** OpenAI API rate limiting or errors
- **Immediate Action:** Implement exponential backoff
- **Investigation:** Check API usage patterns
- **Resolution:** Optimize API calls, consider caching

#### 7.3.2 IRENO API Integration Issues
**Issue:** IRENO API timeout or unavailability
- **Immediate Action:** Serve cached data or graceful degradation
- **Investigation:** Check API status and network connectivity
- **Resolution:** Implement retry logic, contact IRENO team

#### 7.3.3 Frontend Issues
**Issue:** Application not loading or white screen
- **Immediate Action:** Check browser console for errors
- **Investigation:** Review recent frontend deployments
- **Resolution:** Rollback deployment or hotfix

### 7.4 Post-Incident Review

#### 7.4.1 Post-Mortem Process
1. **Timeline Creation:** Detailed incident timeline
2. **Root Cause Analysis:** Technical and process causes
3. **Impact Assessment:** User and business impact
4. **Action Items:** Preventive measures and improvements
5. **Documentation:** Update runbooks and procedures

#### 7.4.2 Post-Mortem Template
```markdown
# Post-Incident Review: [Incident Title]

## Summary
Brief description of the incident

## Timeline
- **Detection:** When and how the incident was detected
- **Response:** Initial response actions
- **Resolution:** How the incident was resolved

## Root Cause
Technical and process root causes

## Impact
- Users affected: X
- Duration: X hours
- Business impact: $X

## Action Items
- [ ] Short-term fixes
- [ ] Long-term improvements
- [ ] Process changes

## Lessons Learned
Key takeaways and improvements
```

### 7.5 Incident Prevention

#### 7.5.1 Proactive Monitoring
- **Application Performance Monitoring (APM)**
- **Log aggregation and analysis**
- **Real-time alerting systems**
- **Synthetic transaction monitoring**

#### 7.5.2 Chaos Engineering
- **Regular failover testing**
- **API dependency failure simulation**
- **Performance stress testing**
- **Security penetration testing**

---

## 8. Appendices

### Appendix A: Contact Information

#### Development Team
- **Technical Lead:** [Name] - [email] - [phone]
- **Frontend Lead:** [Name] - [email] - [phone]
- **Backend Lead:** [Name] - [email] - [phone]
- **QA Lead:** [Name] - [email] - [phone]

#### External Contacts
- **IRENO API Support:** [contact information]
- **OpenAI Support:** [contact information]
- **Infrastructure Team:** [contact information]

### Appendix B: Environment Variables

#### Required Environment Variables
```bash
# Backend (.env)
OPENAI_API_KEY=your_openai_api_key
FLASK_ENV=development|production
SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url

# Frontend (.env.local)
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_VERSION=1.0.0
```

### Appendix C: API Documentation

#### Internal API Endpoints
- `GET /health` - Health check endpoint
- `POST /api/chat` - Chat conversation endpoint
- `GET /api/charts` - Chart data endpoint
- `GET /api/test-tools` - IRENO API tools testing

#### IRENO API Endpoints
- `GET /devicemgmt/v1/collector?status=offline` - Offline collectors
- `GET /devicemgmt/v1/collector?status=online` - Online collectors
- `GET /devicemgmt/v1/collector/count` - Collector counts

### Appendix D: Troubleshooting Guide

#### Common Development Issues
1. **Node.js dependency issues**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Python virtual environment issues**
   ```bash
   deactivate
   rm -rf venv
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **OpenAI API key issues**
   - Verify key is correctly set in .env file
   - Check API key permissions and quota
   - Test with simple API call

#### Production Issues
1. **High response times**
   - Check database query performance
   - Review API call patterns
   - Monitor memory usage

2. **Memory leaks**
   - Review React component cleanup
   - Check for unclosed connections
   - Monitor garbage collection

### Appendix E: Code Quality Standards

#### Frontend Code Quality
- **ESLint Configuration:** Enforce coding standards
- **Prettier Configuration:** Consistent code formatting
- **Component Guidelines:** Reusable, testable components
- **Performance:** Lazy loading, memoization, bundle optimization

#### Backend Code Quality
- **PEP 8:** Python style guide compliance
- **Type Hints:** Use type annotations
- **Documentation:** Comprehensive docstrings
- **Error Handling:** Graceful error handling and logging

---

**Document Control:**
- **Version:** 1.0
- **Last Updated:** August 24, 2025
- **Review Cycle:** 6 months
- **Approval Required:** Technical Lead, Project Manager
- **Distribution:** All team members, stakeholders

**Revision History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Aug 24, 2025 | Development Team | Initial SOP creation |
