# Testing Procedures
## IRENO Smart Assistant

### Test Strategy Overview

#### Testing Pyramid
```
    /\
   /  \      E2E Tests (10%)
  /____\     - User workflows
 /      \    - Integration tests
/__UI___\    - Critical paths
/        \
/  Unit   \   Unit Tests (70%)
/__Tests__\   - Component logic
            - API functions
            - Utility functions

Integration Tests (20%)
- API integration
- Database tests
- External service mocking
```

### Unit Testing

#### Frontend Testing (Jest + React Testing Library)

##### Component Testing Example
```javascript
// ChatInput.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import ChatInput from '../components/ChatInput';

describe('ChatInput Component', () => {
  const renderWithProvider = (component) => {
    return render(
      <AppProvider>
        {component}
      </AppProvider>
    );
  };

  test('sends message when form is submitted', async () => {
    renderWithProvider(<ChatInput />);
    
    const input = screen.getByPlaceholderText('Message IRENO Smart Assistant...');
    const sendButton = screen.getByRole('button', { name: /send message/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  test('disables send button when input is empty', () => {
    renderWithProvider(<ChatInput />);
    
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  test('auto-resizes textarea based on content', () => {
    renderWithProvider(<ChatInput />);
    
    const textarea = screen.getByPlaceholderText('Message IRENO Smart Assistant...');
    fireEvent.change(textarea, { 
      target: { value: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5' } 
    });
    
    expect(textarea.style.height).not.toBe('auto');
  });
});
```

##### Hook Testing
```javascript
// useApp.test.js
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '../context/AppContext';

describe('useApp hook', () => {
  const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

  test('adds new conversation', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    const newConversation = {
      id: '1',
      title: 'Test Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    act(() => {
      result.current.actions.addConversation(newConversation);
    });

    expect(result.current.state.conversations).toContain(newConversation);
    expect(result.current.state.activeConversation).toEqual(newConversation);
  });

  test('toggles theme correctly', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.state.theme).toBe('light');

    act(() => {
      result.current.actions.setTheme('dark');
    });

    expect(result.current.state.theme).toBe('dark');
  });
});
```

#### Backend Testing (pytest)

##### API Testing
```python
# test_chat_api.py
import pytest
import json
from app import app
from unittest.mock import patch, MagicMock

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_openai():
    with patch('app.agent') as mock_agent:
        mock_agent.run.return_value = "Test AI response"
        yield mock_agent

def test_chat_endpoint_success(client, mock_openai):
    """Test successful chat interaction"""
    response = client.post('/api/chat', 
                          json={'message': 'Hello, how are you?'},
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'response' in data
    assert data['response'] == "Test AI response"

def test_chat_endpoint_missing_message(client):
    """Test chat endpoint with missing message"""
    response = client.post('/api/chat', 
                          json={},
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data

def test_chat_endpoint_ai_error(client):
    """Test chat endpoint when AI service fails"""
    with patch('app.agent.run', side_effect=Exception("AI service error")):
        response = client.post('/api/chat', 
                              json={'message': 'Test message'},
                              content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'experiencing technical difficulties' in data['response']

def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get('/health')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert 'IRENO Backend API' in data['service']
```

##### IRENO Tools Testing
```python
# test_ireno_tools.py
import pytest
import requests_mock
from ireno_tools import IrenoAPITools

@pytest.fixture
def ireno_tools():
    return IrenoAPITools()

def test_get_offline_collectors_success(ireno_tools):
    """Test successful offline collectors retrieval"""
    mock_data = [
        {"id": "collector_1", "name": "Collector 1", "location": "Site A"},
        {"id": "collector_2", "name": "Collector 2", "location": "Site B"}
    ]
    
    with requests_mock.Mocker() as m:
        m.get(f"{ireno_tools.BASE_URL}?status=offline", json=mock_data)
        
        result = ireno_tools.get_offline_collectors("test")
        
        assert "Found 2 offline collectors" in result
        assert "Collector 1" in result
        assert "Site A" in result

def test_get_offline_collectors_empty(ireno_tools):
    """Test offline collectors when none are offline"""
    with requests_mock.Mocker() as m:
        m.get(f"{ireno_tools.BASE_URL}?status=offline", json=[])
        
        result = ireno_tools.get_offline_collectors("test")
        
        assert "All collectors are currently online" in result

def test_get_collectors_count_with_breakdown(ireno_tools):
    """Test collector count with online/offline breakdown"""
    mock_data = {
        "total": 100,
        "online": 95,
        "offline": 5
    }
    
    with requests_mock.Mocker() as m:
        m.get(f"{ireno_tools.BASE_URL}/count", json=mock_data)
        
        result = ireno_tools.get_collectors_count("test")
        
        assert "Total collectors: 100" in result
        assert "Online: 95" in result
        assert "Offline: 5" in result
        assert "System availability: 95.0%" in result

def test_api_timeout_handling(ireno_tools):
    """Test API timeout handling"""
    with requests_mock.Mocker() as m:
        m.get(f"{ireno_tools.BASE_URL}?status=offline", 
              exc=requests.exceptions.Timeout)
        
        result = ireno_tools.get_offline_collectors("test")
        
        assert "Error fetching offline collectors" in result
        assert "temporarily unavailable" in result
```

### Integration Testing

#### API Integration Tests
```python
# test_integration.py
import pytest
import requests
import time
from unittest.mock import patch

@pytest.mark.integration
class TestIrenoAPIIntegration:
    """Integration tests with real IRENO APIs"""
    
    def test_ireno_api_connectivity(self):
        """Test connection to IRENO API"""
        url = "https://irenoakscluster.westus.cloudapp.azure.com/devicemgmt/v1/collector/count"
        
        try:
            response = requests.get(url, timeout=10)
            assert response.status_code in [200, 404, 503]  # Accept various responses
        except requests.exceptions.RequestException:
            pytest.skip("IRENO API not accessible")

    def test_openai_integration(self):
        """Test OpenAI API integration"""
        if not os.getenv("OPENAI_API_KEY"):
            pytest.skip("OpenAI API key not configured")
        
        from app import llm
        
        response = llm.invoke("Hello, this is a test message")
        assert response is not None
        assert len(response.content) > 0

@pytest.mark.integration  
class TestEndToEndFlow:
    """End-to-end integration tests"""
    
    def test_complete_chat_flow(self, client):
        """Test complete chat interaction flow"""
        # Send a message that should trigger IRENO API call
        response = client.post('/api/chat', 
                              json={'message': 'How many collectors are offline?'},
                              content_type='application/json')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify AI response contains relevant information
        assert 'response' in data
        response_text = data['response'].lower()
        assert any(keyword in response_text for keyword in 
                  ['collectors', 'offline', 'online', 'status'])

    def test_chart_data_integration(self, client):
        """Test chart data endpoint integration"""
        response = client.get('/api/charts')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'chart_data' in data
        assert isinstance(data['chart_data'], list)
        assert len(data['chart_data']) >= 2  # Online and Offline data
```

### End-to-End Testing

#### Cypress E2E Tests
```javascript
// cypress/e2e/chat-flow.cy.js
describe('IRENO Smart Assistant E2E', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('completes full user workflow', () => {
    // Login
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('password');
    cy.get('[data-testid="role-select"]').select('field_technician');
    cy.get('[data-testid="login-button"]').click();

    // Verify main app loads
    cy.get('[data-testid="main-app"]').should('be.visible');
    cy.get('[data-testid="chat-input"]').should('be.visible');

    // Start new conversation
    cy.get('[data-testid="new-chat-button"]').click();
    
    // Send message
    cy.get('[data-testid="chat-input"]')
      .type('Show me the status of offline collectors{enter}');
    
    // Verify typing indicator appears
    cy.get('[data-testid="typing-indicator"]').should('be.visible');
    
    // Verify response appears
    cy.get('[data-testid="ai-message"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', 'collectors');
    
    // Test chart functionality
    cy.get('[data-testid="chat-input"]')
      .type('Show me a chart of collector status{enter}');
    
    // Verify chart renders
    cy.get('[data-testid="data-chart"]', { timeout: 10000 })
      .should('be.visible');
    
    // Test conversation history
    cy.get('[data-testid="conversation-sidebar"]').should('contain.text', 'collectors');
  });

  it('handles errors gracefully', () => {
    // Login
    cy.login('testuser', 'password', 'field_technician');
    
    // Simulate backend error
    cy.intercept('POST', '/api/chat', { forceNetworkError: true }).as('chatError');
    
    cy.get('[data-testid="chat-input"]')
      .type('Test message{enter}');
    
    // Verify error message appears
    cy.get('[data-testid="ai-message"]')
      .should('contain.text', 'trouble connecting to the server');
  });

  it('renders responsive design', () => {
    cy.viewport(375, 667); // Mobile size
    cy.visit('http://localhost:5173');
    
    // Verify mobile layout
    cy.get('[data-testid="sidebar-toggle"]').should('be.visible');
    cy.get('[data-testid="conversation-sidebar"]').should('not.be.visible');
    
    // Toggle sidebar
    cy.get('[data-testid="sidebar-toggle"]').click();
    cy.get('[data-testid="conversation-sidebar"]').should('be.visible');
  });
});
```

### Performance Testing

#### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load"

scenarios:
  - name: "Chat API Load Test"
    weight: 100
    flow:
      - post:
          url: "/api/chat"
          json:
            message: "How many collectors are currently online?"
          capture:
            - json: "$.response"
              as: "response"
      - think: 2
```

#### Frontend Performance Testing
```javascript
// lighthouse-ci.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173'],
      startServerCommand: 'npm run preview',
      settings: {
        chromeFlags: '--no-sandbox'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.9}],
        'categories:seo': ['error', {minScore: 0.9}]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports'
    }
  }
};
```

### Test Data Management

#### Test Data Setup
```python
# conftest.py
import pytest
from app import app
from unittest.mock import patch

@pytest.fixture(scope="session")
def test_data():
    return {
        "users": [
            {
                "username": "field_tech_1",
                "role": "field_technician",
                "avatar": "F"
            },
            {
                "username": "operator_1", 
                "role": "command_center",
                "avatar": "O"
            }
        ],
        "conversations": [
            {
                "id": "conv_1",
                "title": "Test Conversation",
                "messages": [
                    {
                        "id": "msg_1",
                        "role": "user",
                        "content": "Hello",
                        "timestamp": "2025-08-24T10:00:00Z"
                    }
                ]
            }
        ],
        "ireno_responses": {
            "offline_collectors": [
                {"id": "coll_1", "name": "Collector 1", "location": "Site A"},
                {"id": "coll_2", "name": "Collector 2", "location": "Site B"}
            ],
            "online_collectors": [
                {"id": "coll_3", "name": "Collector 3", "location": "Site C"}
            ],
            "collector_count": {
                "total": 150,
                "online": 148,
                "offline": 2
            }
        }
    }

@pytest.fixture
def mock_ireno_api(test_data):
    """Mock IRENO API responses"""
    with patch('ireno_tools.IrenoAPITools') as mock_tools:
        mock_instance = mock_tools.return_value
        mock_instance.get_offline_collectors.return_value = (
            f"Found {len(test_data['ireno_responses']['offline_collectors'])} offline collectors"
        )
        mock_instance.get_online_collectors.return_value = (
            f"Found {len(test_data['ireno_responses']['online_collectors'])} online collectors"
        )
        mock_instance.get_collectors_count.return_value = (
            f"Total collectors: {test_data['ireno_responses']['collector_count']['total']}"
        )
        yield mock_instance
```

### Test Automation

#### CI/CD Pipeline Testing
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run unit tests
        run: |
          cd frontend
          npm test -- --coverage --watchAll=false
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run E2E tests
        run: |
          docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Test Reporting

#### Coverage Reports
```bash
# Generate coverage reports
npm run test:coverage              # Frontend coverage
pytest --cov=app --cov-report=html # Backend coverage

# View reports
open frontend/coverage/lcov-report/index.html
open backend/htmlcov/index.html
```

#### Test Metrics Tracking
- **Coverage Targets**: >80% line coverage, >70% branch coverage
- **Performance Targets**: <2s API response time, >90 Lighthouse score
- **Quality Gates**: All tests pass before merge, no security vulnerabilities
