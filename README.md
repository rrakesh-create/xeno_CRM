# 🚀 Xeno CRM: AI-Powered D2C Marketing Hub

![Xeno CRM Dashboard](https://img.shields.io/badge/Status-Live-success) ![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi) ![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)

Xeno CRM is an advanced, beautifully designed marketing and shopper engagement platform. It is engineered specifically to empower direct-to-consumer (D2C) brands with **actionable AI-driven insights**, intelligent segmentation, and one-click multi-channel campaign capabilities.

🔗 **[Live Demo (Vercel Deployment)](https://xeno-crm-8xwc.vercel.app/)**

---

## ✨ Key Features

1. **Intelligent Dashboard**: Real-time statistical monitoring of audience scale, total revenue, aggregate orders, and average campaign engagement rates.
2. **Conversational AI Campaign Creator**: Forget complex filters. Use natural language (e.g., *"Win-back churned users"*) to instantly generate target segments and tailored copywriting powered by Google's Gemini LLM.
3. **One-Click Mass Dispatch**: Target an entire segment seamlessly. The backend gracefully handles staggered messaging algorithms and tracking generation without blocking the user interface.
4. **Brand Health Insights**: AI autonomously scans database trends to identify opportunities (e.g., dormant high-value spenders) and prescribes one-click actionable campaigns.
5. **Customer Feedback Pipeline**: Ingests, categorizes, and provides actionable sentiment analysis over user feedback.
6. **Adaptive Mobile Responsiveness**: A sleek UI that elegantly morphs into a mobile-friendly horizontal layout, maintaining premium aesthetics across all devices.

---

## 🏗️ Architecture Stack

This application utilizes a modern, decoupled microservice pattern tailored for Vercel's serverless edge:

- **Frontend**: Built with `Vite` + `React`. Styling utilizes an intricate glassmorphic CSS design system with dynamic micro-animations. State management is fully reactive.
- **Backend Core**: Powered by Python `FastAPI`. It handles route logic, LLM integrations via `google-generativeai`, and database orchestration using `SQLAlchemy`.
- **Database**: Relational `SQLite` architecture storing complex data schemas (Customers, Orders, Communications, Feedbacks, and Campaigns). *Custom configured for Vercel's ephemeral read-only filesystem via `/tmp/` injection.*
- **Deployment**: Vercel Serverless environment. The frontend is built dynamically while the Python backend leverages the `@vercel/python` builder. Custom middleware seamlessly resolves `/_/backend` prefix routing.

---

## ⚙️ Local Development Guide

To run this project on your local machine, follow these steps:

### 1. Database Seeding
Before launching the servers, populate the SQLite database with rich synthetic shopper data.
```bash
cd backend
python seed.py
```
*(This generates 150 unique shoppers, synthetic order histories, randomized feedback, and past campaign statistics).*

### 2. Run the Main API Backend
The CRM backend processes REST endpoints, AI prompts, and database reads.
```bash
cd backend
# Optional: create a virtual environment first
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
**Environment Variables Required:**
Create a `.env` file inside `/backend` with:
- `GEMINI_API_KEY`: Your Google Gemini API Key

### 3. Run the Frontend Client
Boot up the Vite development server.
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` to experience the Xeno CRM interface. The local frontend is configured to automatically communicate with `localhost:8000`.

---

## 🤝 Project Finalization Details

This project has been thoroughly optimized and prepared for submission:
- **Zero Console Errors**: Comprehensive error handling injected into frontend Axios instances.
- **Serverless Optimizations**: Background tasks converted to synchronous `await` executions specifically to prevent Vercel process freezing.
- **Dynamic Routing**: Automatic Hostname detection (`window.location.hostname`) to elegantly switch between Local and Production API routing.

**Built with ❤️ for the future of D2C Marketing.**
