# IRENO Smart Assistant – Placement Interview Preparation Guide

## 1) Project in One Line (Elevator Pitch)
IRENO Smart Assistant is an AI-powered utility operations assistant that combines a React chat interface with a Flask + LangChain backend to answer both real-time operational KPI questions (via live IRENO APIs) and SOP/procedure questions (via Azure Blob document search) through a single chat endpoint.

---

## 2) Business Problem and Why This Project Matters
### Problem
Utility teams (field technicians, command center operators, and leadership) often need:
- live system health/KPI visibility,
- quick procedural guidance,
- one interface instead of switching between dashboards and manuals.

### Solution Value
This project provides:
- **Unified assistant UX** for operational data + SOP knowledge,
- **Tool-calling reliability** where AI fetches data from explicit tools instead of guessing,
- **Role-aware workflow** for different utility stakeholders.

---

## 3) High-Level Architecture
### Frontend (React + Vite)
- Chat UI components (`ChatArea`, `ChatInput`, `ConversationSidebar`, `MainChat`)
- Global app state using React context/reducer
- Local persistence with `localStorage` (conversation/session continuity)
- Auth pages (`LoginPage`, `SignupPage`) and role-oriented app flow

### Backend (Flask + LangChain + Azure OpenAI)
- JWT authentication and role metadata
- SQLAlchemy models (`User`, `ChatMessage`, `LogEntry`)
- Tool-calling LangChain agent with conversation memory
- Health checks and operational logging

### Data Sources
1. **IRENO APIs** for collectors and KPIs (offline/online/count, historical and zone KPIs)
2. **Azure Blob SOP documents** for procedure/troubleshooting queries

---

## 4) Core AI / RAG Design You Should Explain in Interviews
### Tool-Calling RAG (Key differentiator)
Instead of pure LLM text generation, the agent:
1. Detects user intent (collector count, zone KPI, SOP request, etc.)
2. Calls the appropriate backend tool
3. Builds response from tool output

### Anti-hallucination Strategy
The prompt and flow include strict rules to:
- avoid fabricated percentages/dates/zones,
- require exact values from tools,
- report data/tool errors transparently,
- treat historical KPI data as static in the configured date window.

### Memory
Conversation window memory (`k=10`) preserves short context for follow-up questions while limiting token growth.

---

## 5) Important Backend Endpoints (Know these clearly)
- `POST /api/signup` → register user, role handling
- `POST /api/login` → verify credentials and return JWT
- `POST /api/chat` → authenticated chat endpoint that invokes the tool-calling agent
- `GET /health` → service readiness and configuration visibility

---

## 6) Key Tools and What Each Does
### Collector Management
- `get_offline_collectors`: Returns offline collectors, supports zone-specific filtering
- `get_online_collectors`: Returns online collectors summary
- `get_collectors_count`: Total/online/offline counts + zone breakdown analysis

### KPI Analytics
- `get_last_7_days_interval_read_success`
- `get_last_7_days_register_read_success`
- Zone-level weekly/monthly interval/register success tools

### Documentation Tool
- `search_sop_documents`: Connects to Azure Blob, fetches markdown SOP docs, runs keyword search

---

## 7) Frontend Engineering Points to Talk About
### State Management
- Centralized reducer actions: user session, conversations, typing state, theme, sidebar behavior

### Persistence and Robustness
- Defensive localStorage checks
- Recovery from corrupted storage
- Quota error handling + retry behavior

### Chat UX Behavior
- Adds user message instantly
- Shows typing state while waiting for backend
- Sends Bearer token for auth
- Graceful fallback message on backend failure

---

## 8) Security Topics (Interview-ready)
- JWT-based auth for protected API routes
- Role-aware authorization support
- Secret management via environment variables
- Security guideline coverage: key rotation, input validation, security headers, incident response patterns

---

## 9) Testing and Reliability Topics
### Testing Strategy
- Testing pyramid documented (unit-heavy + integration + E2E)
- Frontend tests (components/hooks)
- Backend tests (chat endpoint, tool behavior, timeout/error scenarios)

### Observability / Operations
- Structured backend logging
- Tool usage visibility through intermediate agent steps
- Health endpoint for quick diagnostics
- Incident runbook for outages and rollback procedure

---

## 10) STAR Stories You Can Use in Interview
### Story A: Hallucination Reduction
- **Situation:** AI responses risked incorrect utility metrics.
- **Task:** Ensure only real KPI/API values are shown.
- **Action:** Added strict tool-first prompt rules, date/zone mapping constraints, and data-query detection.
- **Result:** Improved reliability and trust of responses for operations users.

### Story B: API Reliability Improvement
- **Situation:** Some endpoints were unstable/non-working.
- **Task:** Improve production reliability and user confidence.
- **Action:** Focused on known working endpoints, better formatting, and explicit fallback/error messages.
- **Result:** More predictable assistant behavior and better troubleshooting experience.

### Story C: Better User Continuity in Frontend
- **Situation:** Session/chat context could be lost on refresh.
- **Task:** Preserve user experience across sessions.
- **Action:** Implemented resilient localStorage hydration and corruption handling.
- **Result:** Users retain conversations/preferences with fewer interruptions.

---

## 11) Frequently Asked Interview Questions + Strong Answer Angles
1. **What was your contribution?**
   - Mention architecture understanding, endpoint/tool integration, prompt reliability work, and robustness improvements.

2. **Why tool-calling instead of plain chatbot?**
   - Deterministic data retrieval from APIs/docs reduces hallucination and improves auditability.

3. **How did you handle failures?**
   - Timeout/connection error paths in tools, backend error handling, frontend fallback messaging, health/runbook process.

4. **How did you secure the system?**
   - JWT auth, role checks, secret env vars, and documented security practices.

5. **How did you test quality?**
   - Unit + integration strategy, mocked API tests, endpoint validation, and operational checks.

---

## 12) 60-Second Sample Script (Practice)
"I worked on IRENO Smart Assistant, a full-stack AI operations assistant for utility management. On the frontend, we built a React chat platform with persistent conversations and role-aware UX. On the backend, we integrated Flask with LangChain tool-calling and Azure OpenAI so that user questions are routed either to live IRENO APIs for collector/KPI metrics or to SOP documentation search from Azure Blob. A key focus was reliability: anti-hallucination rules, strict tool usage for data queries, robust error handling, health checks, and JWT-based security. This made the assistant practical for real operational workflows, not just generic chat."

---

## 13) Final Interview Preparation Checklist
- [ ] Can explain architecture in <90 seconds
- [ ] Can trace one user query from UI -> backend -> tool -> response
- [ ] Can justify anti-hallucination design decisions
- [ ] Can discuss one failure scenario and recovery
- [ ] Can discuss one security measure and one testing approach
- [ ] Can present 2-3 STAR stories confidently

