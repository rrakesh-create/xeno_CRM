# Xeno CRM

An advanced marketing and shopper engagement platform designed to empower direct-to-consumer (D2C) brands with actionable AI-driven insights and multi-channel campaign capabilities.

## Architecture

This project is built using a modern microservice architecture:
- **Frontend**: React, Vite, and Lucide React for premium UI components.
- **Backend**: FastAPI (Python) serving as the main API and database orchestration layer using SQLite and SQLAlchemy.
- **Channel Service**: A decoupled FastAPI simulator that mimics network latency, delivery status (WhatsApp, SMS, Email, RCS), and triggers webhook receipts.

## Getting Started

### 1. Database Seeding
Before running the services, you should seed the database with initial shopper data.
```bash
cd backend
# Make sure you are using your python virtual environment
python seed.py
```
This generates 150 unique shoppers, synthetic orders, reviews, and past campaigns.

### 2. Running the Backend Service
The main CRM Backend provides REST endpoints for campaigns, analytics, and AI processing.

```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Note: Make sure your `.env` contains `GEMINI_API_KEY`, `CHANNEL_SERVICE_URL=http://localhost:8001`, and `CRM_RECEIPT_URL=http://localhost:8000/receipts`.*

### 3. Running the Channel Service (Simulator)
This microservice simulates the transit layer for messages and sends webhook callbacks back to the CRM backend.

```bash
cd channel-service
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Running the Frontend
Start the React Vite development server.

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` (or the port Vite provides) in your browser to access the Marketing Hub.
