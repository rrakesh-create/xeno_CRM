import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

root_path = "/_/backend" if os.environ.get("VERCEL") else ""
app = FastAPI(title="Xeno CRM API", root_path=root_path)

@app.middleware("http")
async def strip_vercel_prefix(request: Request, call_next):
    if os.environ.get("VERCEL") and request.scope["path"].startswith("/_/backend"):
        request.scope["path"] = request.scope["path"][len("/_/backend"):]
        if "raw_path" in request.scope:
            request.scope["raw_path"] = request.scope["path"].encode()
    return await call_next(request)

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


