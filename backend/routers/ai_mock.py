from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models.database import get_db, Customer

router = APIRouter(prefix="/ai", tags=["ai"])

class SegmentReq(BaseModel):
    prompt: str

@router.post("/segment")
def ai_segment(req: SegmentReq, db: Session = Depends(get_db)):
    import time
    time.sleep(1)
    prompt_lower = req.prompt.lower()
    
    if "all" in prompt_lower or "festival" in prompt_lower:
        count = db.query(Customer).count()
        return {
            "label": "All Customers (Festival Segment)",
            "explanation": "Based on your prompt, I have selected your entire customer database to receive the festival broadcast.",
            "filters": {"segment": "all_customers"},
            "customer_count": count
        }
        
    count = db.query(Customer).filter(Customer.city == "Mumbai", Customer.total_spend >= 2000).count()
    return {
        "label": "Dormant Mumbai VIPs",
        "explanation": "Based on your prompt, I've identified high-value shoppers in Mumbai.",
        "filters": {"city": "Mumbai", "min_spend": 2000},
        "customer_count": count
    }

class DraftReq(BaseModel):
    label: str
    channel: str
    tone: str

@router.post("/draft-message")
def ai_draft(req: DraftReq):
    import time
    time.sleep(1) # simulate slight delay for realism
    
    tone_lower = req.tone.lower()
    is_festival = "festival" in req.label.lower() or "all" in req.label.lower()
    
    if is_festival:
        if "highly professional" in tone_lower:
            message = f"Dear {{name}},\n\nAs the festival season approaches, we wish you and your family joy and prosperity. To celebrate, we are offering an exclusive store-wide discount to all our esteemed customers. Please use code FESTIVAL20 at checkout.\n\nWarm regards,\nXeno CRM Team\n(Channel: {req.channel.upper()})"
        elif "conversational" in tone_lower:
            message = f"Hi {{name}},\n\nThe festival season is here! We wanted to celebrate with you by offering a special discount across our entire store. Use code FESTIVAL20 for your festive shopping.\n\nHappy Holidays!\nYour Friends at Xeno\n(Channel: {req.channel.upper()})"
        elif "friendly" in tone_lower:
            message = f"Hey {{name}}! 🎇\n\nIt's time to celebrate! We're wishing you a wonderful festival season filled with joy. As a special gift from us to you, enjoy a massive discount on everything in store! Use code FESTIVAL20! 🎁✨\n\nWarmly,\nThe Xeno Family 💙\n(Channel: {req.channel.upper()})"
        else:
            message = f"Yo {{name}} 🎆\n\nFestival season is officially ON! We're celebrating big time and you're invited to the party. Grab your favorite gear with our site-wide festival drop using code FESTIVAL20 before it's gone!\n\nStay fresh ✌️\nXeno\n(Channel: {req.channel.upper()})"
    else:
        if "highly professional" in tone_lower:
            message = f"Dear {{name}},\n\nWe hope this message finds you well. As a valued client, we would like to extend an exclusive offer to you. Please enjoy a 20% courtesy discount on your upcoming wardrobe upgrade.\n\nThank you for your continued partnership.\n\nBest regards,\nXeno CRM Team\n(Channel: {req.channel.upper()})"
        elif "conversational" in tone_lower:
            message = f"Hi {{name}},\n\nHope you're having a good day! We wanted to drop by and share something special with you. If you're looking for a style upgrade anytime soon, here is an exclusive 20% off just for you.\n\nLet us know if you have any questions!\n\nCheers,\nYour Friends at Xeno\n(Channel: {req.channel.upper()})"
        elif "friendly" in tone_lower:
            message = f"Hey {{name}}! 🌟\n\nWe're so thrilled to have you with us! To show our appreciation, we've prepared a super special treat for you: take an exclusive 20% off your next style upgrade! 👗👕\n\nWe can't wait to see what you pick out!\n\nWarmly,\nThe Xeno Family 💙\n(Channel: {req.channel.upper()})"
        else: # Playful & Edgy
            message = f"Yo {{name}} 🔥\n\nReady to turn some heads? We're dropping a massive 20% discount on your next style upgrade, exclusively for our VIP squad. Don't sleep on this drop!\n\nGrab your gear now.\n\nStay fresh ✌️\nXeno\n(Channel: {req.channel.upper()})"

    return {
        "message": message
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
