from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta

from models.database import get_db, Customer, Order

router = APIRouter(prefix="/customers", tags=["customers"])

def calculate_engagement_risk(last_order_date, order_count, created_at_date):
    if not last_order_date or not created_at_date:
        return 100 # High risk if no orders

    days_inactive = (datetime.utcnow() - last_order_date).days
    days_since_first_order = max((datetime.utcnow() - created_at_date).days, 1)
    order_frequency = order_count / days_since_first_order
    
    recency_score = min(days_inactive / 90.0, 1.0) * 60
    frequency_score = max(1.0 - (order_frequency * 30.0), 0.0) * 40
    
    churn_score = int(recency_score + frequency_score)
    return max(0, min(100, churn_score))

def get_risk_label(score):
    if score <= 30: return "Low"
    if score <= 60: return "Medium"
    return "High"

@router.get("/")
def list_customers(
    search: Optional[str] = None,
    city: Optional[str] = None,
    min_spend: Optional[float] = None,
    max_spend: Optional[float] = None,
    inactive_days: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    
    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%") | Customer.email.ilike(f"%{search}%"))
    if city:
        query = query.filter(Customer.city == city)
    if min_spend is not None:
        query = query.filter(Customer.total_spend >= min_spend)
    if max_spend is not None:
        query = query.filter(Customer.total_spend <= max_spend)
        
    customers = query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for c in customers:
        risk_score = calculate_engagement_risk(c.last_order, c.order_count, c.created_at)
        results.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "city": c.city,
            "total_spend": c.total_spend,
            "order_count": c.order_count,
            "last_order": c.last_order,
            "engagement_risk": risk_score,
            "engagement_badge": get_risk_label(risk_score)
        })
        
    return results

@router.get("/stats")
def customer_stats(db: Session = Depends(get_db)):
    total_customers = db.query(Customer).count()
    total_revenue = db.query(func.sum(Customer.total_spend)).scalar() or 0.0
    total_orders = db.query(func.sum(Customer.order_count)).scalar() or 0
    
    inactive_cutoff = datetime.utcnow() - timedelta(days=60)
    inactive_count = db.query(Customer).filter(Customer.last_order < inactive_cutoff).count()
    
    return {
        "total_customers": total_customers,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "inactive_count": inactive_count
    }

@router.get("/cities")
def list_cities(db: Session = Depends(get_db)):
    cities = db.query(Customer.city).distinct().all()
    return [c[0] for c in cities if c[0]]

@router.get("/{id}")
def get_customer(id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Shopper not found")
        
    orders = db.query(Order).filter(Order.customer_id == id).order_by(Order.ordered_at.desc()).all()
    
    risk_score = calculate_engagement_risk(customer.last_order, customer.order_count, customer.created_at)
    
    return {
        "profile": {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "phone": customer.phone,
            "city": customer.city,
            "total_spend": customer.total_spend,
            "order_count": customer.order_count,
            "engagement_risk": risk_score,
            "engagement_badge": get_risk_label(risk_score)
        },
        "orders": [
            {
                "id": o.id,
                "amount": o.amount,
                "items": o.items,
                "rating": o.rating,
                "review_text": o.review_text,
                "ordered_at": o.ordered_at
            } for o in orders
        ]
    }
