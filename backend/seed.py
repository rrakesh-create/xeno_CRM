import random
import uuid
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.database import engine, Base, Customer, Order, Campaign, Communication, Receipt, Feedback

# Initialize DB
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
session = Session(bind=engine)

CITIES = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Surat"]

PRODUCTS = [
    {"name": "Ethnic Kurti", "price": 899},
    {"name": "Cotton Saree", "price": 1499},
    {"name": "Silk Dupatta", "price": 699},
    {"name": "Designer Salwar Suit", "price": 2499},
    {"name": "Lehenga Choli", "price": 4999},
    {"name": "Mens Kurta", "price": 1299},
    {"name": "Sherwani", "price": 3599},
    {"name": "Palazzo Pants", "price": 799},
    {"name": "Banarasi Saree", "price": 3299},
    {"name": "Pashmina Shawl", "price": 1899}
]

FIRST_NAMES = ["Aarav", "Vihaan", "Vivaan", "Ananya", "Diya", "Aditya", "Aryan", "Kavya", "Saanvi", "Neha", "Rohan", "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Riya", "Karan", "Pooja", "Raj"]
LAST_NAMES = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Desai", "Joshi", "Verma", "Chauhan", "Shah", "Reddy", "Mehta", "Iyer", "Nair", "Bose", "Das", "Yadav", "Malhotra", "Kapoor", "Jain"]

def random_date(start_days_ago, end_days_ago):
    delta = random.randint(end_days_ago, start_days_ago)
    return datetime.utcnow() - timedelta(days=delta)

def get_review(rating):
    if rating == 5:
        return random.choice(["Amazing fabric quality!", "Fast delivery and great fit.", "Beautiful design, love it.", "Highly recommend to everyone.", "Perfect for the festive season!"])
    elif rating == 4:
        return random.choice(["Good product overall.", "Nice material but packaging could be better.", "Looks just like the picture.", "Satisfied with the purchase.", "Fits well, color is nice."])
    elif rating == 3:
        return random.choice(["Average quality.", "Color is slightly different than shown.", "Okay product for the price.", "Took a bit long to deliver.", "Not bad, but could be improved."])
    elif rating == 2:
        return random.choice(["Damaged packaging when it arrived.", "Wrong size sent.", "Thin material, expected better.", "Stitching came off after one wash.", "Disappointed with the quality."])
    else: # rating 1
        return random.choice(["Completely wrong item received.", "Very poor quality, do not buy.", "Terrible customer service.", "Total waste of money.", "Defective piece."])

def generate_rating():
    rand = random.random()
    if rand < 0.40: return 5
    elif rand < 0.70: return 4
    elif rand < 0.85: return 3
    elif rand < 0.95: return 2
    else: return 1

customers = []
orders_list = []

# Generate 150 customers
for i in range(150):
    c_id = str(uuid.uuid4())
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    city = random.choice(CITIES)
    email = f"{name.lower().replace(' ', '.')}.{i}@example.com"
    phone = f"+919{random.randint(100000000, 999999999)}"
    
    # Distribution
    rand_segment = random.random()
    if rand_segment < 0.10: # VIP (9)
        order_count = random.randint(8, 20)
        last_order = random_date(15, 1)
        created_at = last_order - timedelta(days=random.randint(60, 300))
    elif rand_segment < 0.30: # At-risk (18)
        order_count = random.randint(1, 4)
        last_order = random_date(200, 60)
        created_at = last_order - timedelta(days=random.randint(10, 100))
    else: # Regular (63)
        order_count = random.randint(2, 7)
        last_order = random_date(60, 5)
        created_at = last_order - timedelta(days=random.randint(30, 200))
        
    total_spend = 0
    c_orders = []
    
    for j in range(order_count):
        o_id = str(uuid.uuid4())
        item = random.choice(PRODUCTS)
        qty = random.randint(1, 2)
        amount = item["price"] * qty
        total_spend += amount
        
        rating = generate_rating()
        review = get_review(rating) if random.random() > 0.3 else None # 70% leave review
        
        if j == order_count - 1:
            o_date = last_order
        else:
            o_date = created_at + timedelta(days=random.randint(1, max((last_order - created_at).days, 2)))
            
        c_orders.append(Order(
            id=o_id, customer_id=c_id, amount=amount,
            items=json.dumps([{"name": item["name"], "price": item["price"], "qty": qty}]),
            rating=rating, review_text=review, ordered_at=o_date
        ))
        
    orders_list.extend(c_orders)
    customers.append(Customer(
        id=c_id, name=name, email=email, phone=phone, city=city,
        total_spend=total_spend, order_count=order_count,
        last_order=last_order, created_at=created_at
    ))

session.add_all(customers)
session.add_all(orders_list)
session.commit()

# Generate feedback for some customers
feedbacks = []
feedback_comments = {
    5: [
        "Amazing fabric quality! Very satisfied.",
        "Fast delivery and great fit. Perfect product!",
        "Beautiful design, absolutely love it.",
        "Highly recommend to everyone, perfect brand quality.",
        "Perfect for the festive season! Amazing delivery speed."
    ],
    4: [
        "Good product overall. Nice material.",
        "Nice material but packaging could be better.",
        "Looks just like the picture, good design.",
        "Satisfied with the purchase, good service.",
        "Fits well, color is nice. Happy with quality."
    ],
    3: [
        "Average quality stitching. Okay product.",
        "Color is slightly different than shown. Average fabric.",
        "Okay product for the price, not bad.",
        "Took a bit long to deliver, average packaging.",
        "Not bad, but could be improved. Average fit."
    ],
    2: [
        "Damaged packaging when it arrived. Poor quality.",
        "Wrong size sent, very poor service.",
        "Thin material, expected better fabric.",
        "Stitching came off after one wash. Terrible.",
        "Disappointed with the quality. Poor packaging."
    ],
    1: [
        "Completely wrong item received. Terrible service.",
        "Very poor quality, do not buy this defective item.",
        "Terrible customer service. Delay in delivery.",
        "Total waste of money. Poor fabric quality.",
        "Defective piece received, poor stitching."
    ]
}

# Seed feedback for ~45 customers (~50%)
feedback_customers = random.sample(customers, 45)
for fc in feedback_customers:
    rating = generate_rating()
    comment = random.choice(feedback_comments[rating]) if random.random() > 0.1 else None # 90% leave comments
    f_date = fc.last_order + timedelta(days=random.randint(1, 5))
    if f_date > datetime.utcnow():
        f_date = datetime.utcnow()
        
    feedbacks.append(Feedback(
        id=str(uuid.uuid4()),
        customer_id=fc.id,
        rating=rating,
        comment=comment,
        consent_given=1,
        created_at=f_date
    ))

session.add_all(feedbacks)
session.commit()
print(f"Successfully seeded {len(feedbacks)} customer feedbacks!")


# Seed 3 pre-completed campaigns
campaigns = [
    {
        "name": "Summer Ethnic Sale", "segment_label": "High Spenders in Mumbai & Delhi",
        "channel": "WhatsApp", "status": "completed", "audience_size": 15, "days_ago": 10
    },
    {
        "name": "We Miss You", "segment_label": "Inactive 90+ days",
        "channel": "Email", "status": "completed", "audience_size": 25, "days_ago": 5
    },
    {
        "name": "Flash Sale - Kurtis", "segment_label": "All Shoppers",
        "channel": "SMS", "status": "completed", "audience_size": 150, "days_ago": 2
    }
]

for camp_data in campaigns:
    camp_id = str(uuid.uuid4())
    created_date = datetime.utcnow() - timedelta(days=camp_data["days_ago"])
    
    campaign = Campaign(
        id=camp_id, name=camp_data["name"], segment_label=camp_data["segment_label"],
        segment_filters=json.dumps({}), message_template=f"Hello {{name}}, special offer for you!",
        channel=camp_data["channel"], status=camp_data["status"],
        audience_size=camp_data["audience_size"], created_at=created_date
    )
    session.add(campaign)
    
    target_customers = random.sample(customers, camp_data["audience_size"])
    comms = []
    receipts = []
    
    for tc in target_customers:
        comm_id = str(uuid.uuid4())
        
        # Decide final status
        rand = random.random()
        if rand < 0.12: final_status = "failed"
        elif rand < 0.40: final_status = "delivered"
        elif rand < 0.70: final_status = "opened"
        else: final_status = "clicked"
        
        comm = Communication(
            id=comm_id, campaign_id=camp_id, customer_id=tc.id,
            personalized_message=f"Hello {tc.name}, special offer for you!",
            status=final_status, channel=camp_data["channel"],
            created_at=created_date, updated_at=created_date + timedelta(seconds=random.randint(10, 300))
        )
        comms.append(comm)
        
        # Add receipt history
        receipts.append(Receipt(id=str(uuid.uuid4()), communication_id=comm_id, status="sent", received_at=created_date + timedelta(seconds=1)))
        if final_status != "failed":
            receipts.append(Receipt(id=str(uuid.uuid4()), communication_id=comm_id, status="delivered", received_at=created_date + timedelta(seconds=4)))
        if final_status in ["opened", "clicked"]:
            receipts.append(Receipt(id=str(uuid.uuid4()), communication_id=comm_id, status="opened", received_at=created_date + timedelta(seconds=20)))
        if final_status == "clicked":
            receipts.append(Receipt(id=str(uuid.uuid4()), communication_id=comm_id, status="clicked", received_at=created_date + timedelta(seconds=45)))
        if final_status == "failed":
            receipts.append(Receipt(id=str(uuid.uuid4()), communication_id=comm_id, status="failed", received_at=created_date + timedelta(seconds=3)))

    session.add_all(comms)
    session.add_all(receipts)

session.commit()
print("Successfully seeded 150 shoppers, orders with reviews, and 3 completed campaigns!")
