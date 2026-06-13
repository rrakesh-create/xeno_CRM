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

@router.get("/brand-insights")
def brand_insights():
    return {
        "health_score": 78,
        "recommendations": [
            {
                "title": "Win-back Inactive Spenders",
                "description": "High-value shoppers who haven't ordered in 90+ days. Recommended channel: Email.",
                "action_text": "Build this campaign",
                "campaign_prompt": "Target shoppers with spend > 2000 and inactive_days > 90 via email. Angle: We missed you."
            },
            {
                "title": "Upsell Recent Buyers",
                "description": "Shoppers who made a purchase in the last 15 days. Recommended channel: WhatsApp.",
                "action_text": "Build this campaign",
                "campaign_prompt": "Target shoppers with inactive_days < 15 via whatsapp. Angle: Thanks for buying, check this out."
            },
            {
                "title": "Review Generation",
                "description": "Engage highly active shoppers to leave a review on recent purchases.",
                "action_text": "View Engagement Stats",
                "campaign_prompt": ""
            }
        ]
    }
