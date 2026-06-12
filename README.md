# Xeno CRM

A consumer marketing and engagement tool built for marketers to find shoppers, send personalized messages, watch delivery happen live, and understand engagement behavior.

## Architecture Overview
The application consists of three decoupled services:
1. **CRM Backend** (FastAPI): The primary service handling the database (SQLite), AI integration (Gemini), and core endpoints.
2. **Channel Service** (FastAPI): A separate simulation service that processes message dispatch, simulates realistic delivery delays and open/click probabilities, and fires callbacks to the CRM backend.
3. **Frontend** (React): A glassmorphism-themed UI for marketers.

## How to run locally

### 1. Clone the repo
\`\`\`bash
# (Assuming you have cloned the repository into xeno-crm or similar)
cd xeno-crm
\`\`\`

### 2. Configure Backend Environment
Navigate to the \`backend\` directory and set up your \`.env\`:
\`\`\`bash
cd backend
# edit .env and ensure it has:
# GEMINI_API_KEY=your_gemini_key_here
# CHANNEL_SERVICE_URL=http://localhost:8001
# CRM_RECEIPT_URL=http://localhost:8000/receipts
\`\`\`

### 3. Run the CRM Backend
\`\`\`bash
# Inside backend directory
python -m venv venv
# On Windows: .\\venv\\Scripts\\activate | On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python seed.py # Seed the mock data
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

### 4. Run the Channel Service
Open a new terminal.
\`\`\`bash
# Inside channel-service directory
python -m venv venv
# On Windows: .\\venv\\Scripts\\activate | On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
\`\`\`

### 5. Run the Frontend
Open a new terminal.
\`\`\`bash
# Inside frontend directory
npm install
npm run dev
# The React app will start on port 5173 (Vite default) or 3000 depending on config.
# Create a .env file in frontend with VITE_API_URL=http://localhost:8000
\`\`\`

## Live URLs
- **Frontend**: [Link to be added after deployment]
- **CRM Backend**: [Link to be added after deployment]
- **Channel Service**: [Link to be added after deployment]

*(Note: First load may take 30–50 seconds on free tier due to cold start.)*

## Trade-offs
- **SQLite instead of PostgreSQL**: Sufficient for this scope, would migrate at scale with connection pooling.
- **Polling instead of WebSockets**: 3-second polling is adequate for demo scale, WebSockets at production scale with Redis pub/sub.
- **Gemini Flash instead of Pro**: Faster response time for chat interactions, sufficient quality for segmentation and drafting.
- **No authentication**: Opens directly to the marketer dashboard, saves build time, not required by the brief.
- **No real messaging APIs**: 100% stubbed per brief requirement.
- **Single retry on failed messages**: Production would use exponential backoff with a dead letter queue.
- **Free tier deployment**: Cold start latency on first load, production would use always-on instances.
- **Status updates via polling**: At scale, the receipt webhook would publish to a message queue (Redis/Celery) to handle burst volume from large campaigns.

## What is deliberately not built
- No user authentication or authorization.
- No real messaging (WhatsApp/SMS APIs).
- No sales CRM elements (no leads, deals, tickets, or pipelines).
