import csv
import io
import re
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.database import get_db, Feedback, Customer

router = APIRouter(prefix="/feedback", tags=["feedback"])

from pydantic import BaseModel

class FeedbackCreate(BaseModel):
    customer_id: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    consent_given: bool = True


# Standard English stopwords for simple keyword analysis
STOPWORDS = {
    "the", "and", "to", "for", "is", "a", "in", "of", "this", "with", "it", "was", "that", 
    "on", "my", "have", "but", "be", "not", "are", "you", "i", "as", "at", "an", "or", "by",
    "about", "from", "had", "has", "but", "so", "if", "very", "too", "quite", "really"
}

def analyze_comments(feedbacks: List[Feedback]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Performs a simple keyword frequency analysis on feedback comments,
    split by positive (4-5 stars) and negative (1-2 stars) sentiment groups.
    """
    pos_words = {}
    neg_words = {}
    
    for f in feedbacks:
        if not f.comment:
            continue
        # Clean comment text: lowercase and strip punctuation
        cleaned = re.sub(r"[^\w\s]", "", f.comment.lower())
        words = [w for w in cleaned.split() if w not in STOPWORDS and len(w) > 2]
        
        for w in words:
            if f.rating >= 4:
                pos_words[w] = pos_words.get(w, 0) + 1
            elif f.rating <= 2:
                neg_words[w] = neg_words.get(w, 0) + 1
                
    # Sort and take top 8 words
    sorted_pos = sorted(pos_words.items(), key=lambda x: x[1], reverse=True)[:8]
    sorted_neg = sorted(neg_words.items(), key=lambda x: x[1], reverse=True)[:8]
    
    return {
        "positive": [{"text": word, "value": count} for word, count in sorted_pos],
        "negative": [{"text": word, "value": count} for word, count in sorted_neg]
    }

@router.get("/")
def list_feedback(
    rating: Optional[int] = Query(None, ge=1, le=5),
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Feedback)
    if rating is not None:
        query = query.filter(Feedback.rating == rating)
    if customer_id is not None:
        query = query.filter(Feedback.customer_id == customer_id)
        
    feedbacks = query.order_by(Feedback.created_at.desc()).all()
    
    results = []
    for f in feedbacks:
        cust_name = "Anonymous"
        cust_email = "N/A"
        cust_city = "N/A"
        if f.customer_id:
            cust = db.query(Customer).filter(Customer.id == f.customer_id).first()
            if cust:
                cust_name = cust.name
                cust_email = cust.email
                cust_city = cust.city
                
        results.append({
            "id": f.id,
            "customer_id": f.customer_id,
            "customer_name": cust_name,
            "customer_email": cust_email,
            "customer_city": cust_city,
            "rating": f.rating,
            "comment": f.comment,
            "consent_given": bool(f.consent_given),
            "created_at": f.created_at
        })
    return results

@router.post("/")
def create_feedback(fb: FeedbackCreate, db: Session = Depends(get_db)):
    if fb.rating < 1 or fb.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    if fb.customer_id:
        cust = db.query(Customer).filter(Customer.id == fb.customer_id).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
            
    new_fb = Feedback(
        customer_id=fb.customer_id,
        rating=fb.rating,
        comment=fb.comment,
        consent_given=1 if fb.consent_given else 0
    )
    db.add(new_fb)
    db.commit()
    db.refresh(new_fb)
    
    return {
        "id": new_fb.id,
        "status": "success",
        "rating": new_fb.rating
    }

@router.get("/analysis")
def get_feedback_analysis(db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).all()
    if not feedbacks:
        return {
            "average_rating": 0.0,
            "total_count": 0,
            "rating_distribution": {5: 0, 4: 0, 3: 0, 2: 0, 1: 0},
            "trends": [],
            "keywords": {"positive": [], "negative": []},
            "segments": {
                "promoters": {"count": 0, "avg_spend": 0.0, "avg_orders": 0.0},
                "passives": {"count": 0, "avg_spend": 0.0, "avg_orders": 0.0},
                "detractors": {"count": 0, "avg_spend": 0.0, "avg_orders": 0.0}
            }
        }
        
    total_count = len(feedbacks)
    avg_rating = round(sum(f.rating for f in feedbacks) / total_count, 2)
    
    # Rating Distribution
    dist = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for f in feedbacks:
        dist[f.rating] = dist.get(f.rating, 0) + 1
        
    # Rating Trends over Time
    # Query database grouping by date (YYYY-MM-DD)
    # Using SQLite strftime for dates
    trend_query = db.query(
        func.strftime("%Y-%m-%d", Feedback.created_at).label("date"),
        func.avg(Feedback.rating).label("avg_rating"),
        func.count(Feedback.id).label("count")
    ).group_by("date").order_by("date").all()
    
    trends = [{"date": t.date, "avg_rating": round(t.avg_rating, 2), "count": t.count} for t in trend_query]
    
    # Keyword analysis
    keywords = analyze_comments(feedbacks)
    
    # Segment Comparisons: Promoters (4-5), Passives (3), Detractors (1-2)
    promoters_spend, promoters_orders, promoters_count = 0.0, 0.0, 0
    passives_spend, passives_orders, passives_count = 0.0, 0.0, 0
    detractors_spend, detractors_orders, detractors_count = 0.0, 0.0, 0
    
    for f in feedbacks:
        if not f.customer_id:
            continue
        cust = db.query(Customer).filter(Customer.id == f.customer_id).first()
        if not cust:
            continue
            
        if f.rating >= 4:
            promoters_count += 1
            promoters_spend += cust.total_spend
            promoters_orders += cust.order_count
        elif f.rating == 3:
            passives_count += 1
            passives_spend += cust.total_spend
            passives_orders += cust.order_count
        else: # 1-2 stars
            detractors_count += 1
            detractors_spend += cust.total_spend
            detractors_orders += cust.order_count
            
    segments = {
        "promoters": {
            "count": promoters_count,
            "avg_spend": round(promoters_spend / promoters_count, 2) if promoters_count > 0 else 0.0,
            "avg_orders": round(promoters_orders / promoters_count, 2) if promoters_count > 0 else 0.0
        },
        "passives": {
            "count": passives_count,
            "avg_spend": round(passives_spend / passives_count, 2) if passives_count > 0 else 0.0,
            "avg_orders": round(passives_orders / passives_count, 2) if passives_count > 0 else 0.0
        },
        "detractors": {
            "count": detractors_count,
            "avg_spend": round(detractors_spend / detractors_count, 2) if detractors_count > 0 else 0.0,
            "avg_orders": round(detractors_orders / detractors_count, 2) if detractors_count > 0 else 0.0
        }
    }
    
    return {
        "average_rating": avg_rating,
        "total_count": total_count,
        "rating_distribution": dist,
        "trends": trends,
        "keywords": keywords,
        "segments": segments
    }

@router.get("/export")
def export_feedback_csv(db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Feedback ID", "Customer Name", "Customer Email", "Customer City", 
        "Rating", "Comment", "Consent Given", "Segment Group", "Customer Spend", 
        "Order Count", "Created At"
    ])
    
    for f in feedbacks:
        cust_name = "Anonymous"
        cust_email = "N/A"
        cust_city = "N/A"
        cust_spend = 0.0
        cust_orders = 0
        if f.customer_id:
            cust = db.query(Customer).filter(Customer.id == f.customer_id).first()
            if cust:
                cust_name = cust.name
                cust_email = cust.email
                cust_city = cust.city
                cust_spend = cust.total_spend
                cust_orders = cust.order_count
                
        segment = "Promoter" if f.rating >= 4 else "Passive" if f.rating == 3 else "Detractor"
        
        writer.writerow([
            f.id, cust_name, cust_email, cust_city, 
            f.rating, f.comment or "", "Yes" if f.consent_given else "No", 
            segment, cust_spend, cust_orders, f.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
        
    output.seek(0)
    response = StreamingResponse(io.StringIO(output.getvalue()), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=feedback_report.csv"
    return response

@router.delete("/{id}")
def delete_feedback(id: str, db: Session = Depends(get_db)):
    fb = db.query(Feedback).filter(Feedback.id == id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    db.delete(fb)
    db.commit()
    return {"status": "success", "message": f"Feedback {id} successfully deleted for privacy compliance"}
