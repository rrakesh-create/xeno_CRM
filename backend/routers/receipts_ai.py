import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import SessionLocal, Communication, Receipt, Campaign

router = APIRouter(tags=["Webhook receipts Hub"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Enforce deterministic state progression thresholds
STATUS_RANKS = {"pending": 0, "sent": 1, "delivered": 2, "opened": 3, "clicked": 4, "failed": -1}

@router.post("/receipts")
def ingest_delivery_receipt(payload: dict, db: Session = Depends(get_db)):
    comm_id = payload.get("communication_id")
    incoming_status = payload.get("status")
    
    comm = db.query(Communication).filter(Communication.id == comm_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Communication reference node missing")
        
    # Log the raw audit entry in the receipts table
    db.add(Receipt(communication_id=comm_id, status=incoming_status))
    
    current_rank = STATUS_RANKS.get(comm.status, 0)
    incoming_rank = STATUS_RANKS.get(incoming_status, 0)
    
    # Idempotence protection logic: stop regressions
    if incoming_status == "failed" and current_rank < 2:
        comm.status = "failed"
    elif incoming_rank > current_rank and comm.status != "failed":
        comm.status = incoming_status
         
    db.commit()
    
    # Track campaign completion state metrics
    parent_camp_id = comm.campaign_id
    total_comms = db.query(Communication).filter(Communication.campaign_id == parent_camp_id).count()
    settled_comms = db.query(Communication).filter(
        Communication.campaign_id == parent_camp_id,
        Communication.status.in_(["delivered", "opened", "clicked", "failed"])
    ).count()
    
    if total_comms == settled_comms:
        campaign = db.query(Campaign).filter(Campaign.id == parent_camp_id).first()
        if campaign:
            campaign.status = "completed"
            db.commit()
              
    return {"status": "processed", "current_record_state": comm.status}
