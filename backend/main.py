from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Xeno CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Xeno CRM Backend Running"}

from routers import customers, campaigns, receipts_ai, ai_mock, feedback
from models.database import init_db

init_db()  # Synchronize schema on startup

app.include_router(customers.router)
app.include_router(campaigns.router)
app.include_router(receipts_ai.router)
app.include_router(ai_mock.router)
app.include_router(feedback.router)


