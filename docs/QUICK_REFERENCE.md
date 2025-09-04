# IRENO Smart Assistant - Quick Reference Guide

## Development Environment Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Git
- VS Code (recommended)

### Quick Start
```bash
# Clone repository
git clone https://github.com/organization/ireno-smart-assistant.git
cd ireno-smart-assistant

# Frontend setup
cd frontend
npm install
npm run dev

# Backend setup (new terminal)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configure OPENAI_API_KEY in .env
python app.py
```

## Common Commands

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Backend
```bash
python app.py                    # Start Flask server
pytest                          # Run tests
pytest --cov=app               # Run with coverage
python -m flask routes         # List all routes
```

### Git Workflow
```bash
git checkout develop
git pull origin develop
git checkout -b feature/IRENO-123-description
# Make changes
git add .
git commit -m "feat(component): description"
git push origin feature/IRENO-123-description
# Create pull request
```

## API Endpoints

### Internal APIs
- `POST /api/chat` - Send message to AI
- `GET /api/charts` - Get chart data
- `GET /health` - Health check
- `GET /api/test-tools` - Test IRENO APIs

### IRENO APIs
- `GET /devicemgmt/v1/collector?status=offline` - Offline collectors
- `GET /devicemgmt/v1/collector?status=online` - Online collectors
- `GET /devicemgmt/v1/collector/count` - Collector statistics

## Troubleshooting

### Common Issues
1. **Frontend won't start**: Check Node.js version, clear node_modules
2. **Backend errors**: Verify Python environment, check .env file
3. **API failures**: Check OpenAI API key, verify IRENO API status
4. **Tests failing**: Update snapshots, check test environment

### Emergency Contacts
- Technical Lead: [email]
- DevOps Team: [email]
- IRENO API Support: [email]
