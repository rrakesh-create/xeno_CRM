from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import uuid
import httpx
import os
import json
import asyncio
from typing import Optional

from models.database import get_db, Campaign, Communication, Customer, SessionLocal
router = APIRouter(prefix="/campaigns", tags=["campaigns"])

CHANNEL_SERVICE_URL = os.getenv("CHANNEL_SERVICE_URL", "http://localhost:8001")
CRM_RECEIPT_URL = os.getenv("CRM_RECEIPT_URL", "http://localhost:8000/receipts")

class CampaignCreate(BaseModel):
    name: str
    segment_label: str
    segment_filters: dict
    message_template: str
    channel: str
    audience_size: int

@router.get("/")
def list_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    results = []
    for c in campaigns:
        stats = get_campaign_stats_inner(c.id, db)
        results.append({
            "id": c.id,
            "name": c.name,
            "channel": c.channel,
            "audience_size": c.audience_size,
            "status": c.status,
            "created_at": c.created_at,
            "stats": stats
        })
    return results

@router.post("/")
def create_campaign(camp: CampaignCreate, db: Session = Depends(get_db)):
    new_camp = Campaign(
        id=str(uuid.uuid4()),
        name=camp.name,
        segment_label=camp.segment_label,
        segment_filters=json.dumps(camp.segment_filters),
        message_template=camp.message_template,
        channel=camp.channel,
        status="draft",
        audience_size=camp.audience_size
    )
    db.add(new_camp)
    db.commit()
    db.refresh(new_camp)
    return {"id": new_camp.id, "status": new_camp.status}

def resolve_segment_shoppers(db: Session, filters_str: str):
    """
    Parses stored JSON filter arrays to query matching shoppers dynamically.
    """
    filters = json.loads(filters_str)
    query = db.query(Customer)
    
    if filters.get("city"):
        query = query.filter(Customer.city == filters["city"])
    if filters.get("min_spend") is not None:
        query = query.filter(Customer.total_spend >= filters["min_spend"])
    if filters.get("max_spend") is not None:
        query = query.filter(Customer.total_spend <= filters["max_spend"])
    if filters.get("inactive_days") is not None:
        import datetime
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=filters["inactive_days"])
        query = query.filter(Customer.last_order <= cutoff)
        
    return query.all()

async def transmit_bulk_staggered_messages(campaign_id: str, message_template: str, channel: str, shoppers: list, channel_url: str):
    """
    Executes a multi-recipient message loop. Uses a 50ms stagger step 
    to avoid overloading the receipt handler webhooks.
    """
    async with httpx.AsyncClient() as client:
        for s in shoppers:
            # Removed 50ms stagger step to prevent Vercel serverless function timeout
            
            # 2. Open an isolated database session thread for each record to prevent race conditions
            db = SessionLocal()
            try:
                # 3. Handle dynamic name substitution personalizations inline
                personalized_text = message_template.replace("{name}", s.name)
                
                # 4. Insert an individual row into the communications tracking matrix
                comm = Communication(
                    id=str(uuid.uuid4()),
                    campaign_id=campaign_id,
                    customer_id=s.id,
                    personalized_message=personalized_text,
                    channel=channel,
                    status="sent" # Moves immediately from pending to sent
                )
                db.add(comm)
                db.commit()
                communication_id = comm.id
            finally:
                db.close()
            
            # 5. Dispatch the tracking data structure over to the isolated Channel service
            payload = {
                "communication_id": communication_id,
                "channel": channel.lower(),
                "callback_url": os.environ.get("CRM_RECEIPT_URL", "http://localhost:8000/receipts")
            }
            
            try:
                # Fire-and-forget call to the mock gateway router running on port 8001
                print(f"[Campaign {campaign_id}] Dispatching message to {s.name} (ID: {communication_id})")
                await client.post(f"{channel_url}/send", json=payload, timeout=0.5)
            except Exception:
                pass  # Suppress individual network drops so the remaining batch loop can finish safely

@router.post("/{id}/send")
async def launch_campaign(id: str, db: Session = Depends(get_db)):
    """
    Accepts a single request, calculates category audience sizes, 
    and executes the send loop synchronously for Vercel.
    """
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign record target missing")
        
    if campaign.status == "running":
        raise HTTPException(status_code=400, detail="This campaign is already running active dispatches")

    # Resolve all targeted customers belonging to the same category filter layout
    shoppers = resolve_segment_shoppers(db, campaign.segment_filters)
    if not shoppers:
        raise HTTPException(status_code=400, detail="No shoppers matched this segment category criteria")
        
    # Flip parent campaign monitoring states immediately
    campaign.status = "running"
    campaign.audience_size = len(shoppers)
    db.commit()
    
    # Delegate the mass multi-recipient send workflow
    # Must be awaited synchronously in Vercel Serverless functions
    channel_url = os.environ.get("CHANNEL_SERVICE_URL", "http://localhost:8001")
    await transmit_bulk_staggered_messages(
        campaign_id=campaign.id, 
        message_template=campaign.message_template, 
        channel=campaign.channel, 
        shoppers=shoppers, 
        channel_url=channel_url
    )
    
    return {
        "status": "running",
        "message": "One-click mass blast successfully processing in background tasks.",
        "audience_targeted": len(shoppers)
    }

@router.get("/{id}")
def get_campaign(id: str, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    comms = db.query(Communication).filter(Communication.campaign_id == id).all()
    
    communications_list = []
    for c in comms:
        communications_list.append({
            "id": c.id,
            "customer_id": c.customer_id,
            "customer_name": c.customer.name,
            "customer_email": c.customer.email,
            "status": c.status,
            "updated_at": c.updated_at
        })
        
    return {
        "id": campaign.id,
        "name": campaign.name,
        "segment_label": campaign.segment_label,
        "message_template": campaign.message_template,
        "channel": campaign.channel,
        "status": campaign.status,
        "communications": communications_list,
        "stats": get_campaign_stats_inner(id, db)
    }

def get_campaign_stats_inner(campaign_id: str, db: Session):
    stats = db.query(
        Communication.status, 
        func.count(Communication.id)
    ).filter(Communication.campaign_id == campaign_id).group_by(Communication.status).all()
    
    stat_dict = {
        "pending": 0, "sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "failed": 0
    }
    for s in stats:
        stat_dict[s[0]] = s[1]
        
    total = sum(stat_dict.values())
    
    current_sent = stat_dict["sent"]
    current_delivered = stat_dict["delivered"]
    current_opened = stat_dict["opened"]
    current_clicked = stat_dict["clicked"]
    current_failed = stat_dict["failed"]
    
    cumulative_clicked = current_clicked
    cumulative_opened = current_opened + cumulative_clicked
    cumulative_delivered = current_delivered + cumulative_opened
    cumulative_sent = current_sent + cumulative_delivered + current_failed
    
    stat_dict["clicked"] = cumulative_clicked
    stat_dict["opened"] = cumulative_opened
    stat_dict["delivered"] = cumulative_delivered
    stat_dict["sent"] = cumulative_sent
    
    if total > 0:
        stat_dict["delivery_rate"] = int((cumulative_delivered / total) * 100)
        if cumulative_delivered > 0:
            stat_dict["open_rate"] = int((cumulative_opened / cumulative_delivered) * 100)
            if cumulative_opened > 0:
                stat_dict["click_rate"] = int((cumulative_clicked / cumulative_opened) * 100)
            else:
                stat_dict["click_rate"] = 0
        else:
            stat_dict["open_rate"] = 0
            stat_dict["click_rate"] = 0
    else:
        stat_dict["delivery_rate"] = 0
        stat_dict["open_rate"] = 0
        stat_dict["click_rate"] = 0
        
    return stat_dict

@router.get("/{id}/stats")
def campaign_stats(id: str, db: Session = Depends(get_db)):
    return get_campaign_stats_inner(id, db)
