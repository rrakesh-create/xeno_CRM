from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["ai"])

class SegmentReq(BaseModel):
    prompt: str

@router.post("/segment")
def ai_segment(req: SegmentReq):
    return {
        "label": "Dormant Mumbai VIPs",
        "explanation": "Based on your prompt, I've identified high-value shoppers in Mumbai.",
        "filters": {"city": "Mumbai", "min_spend": 2000},
        "customer_count": 45
    }

class DraftReq(BaseModel):
    label: str
    channel: str
    tone: str

@router.post("/draft-message")
def ai_draft(req: DraftReq):
    return {
        "message": f"Hey {{name}} 👋 Here is an exclusive 20% off your next style upgrade! ({req.tone} tone via {req.channel})"
    }

class WhatIfReq(BaseModel):
    size: int
    avg_spend: float

@router.post("/what-if")
def ai_whatif(req: WhatIfReq):
    return {
        "projected_open_count": int(req.size * 0.45),
        "min_projected_revenue": req.size * 0.1 * req.avg_spend,
        "max_projected_revenue": req.size * 0.25 * req.avg_spend
    }
