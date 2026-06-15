import os
import shutil
import uuid
import datetime
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

if os.environ.get("VERCEL"):
    db_path = "/tmp/xeno_crm.db"
    if not os.path.exists(db_path):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        source_db = os.path.join(base_dir, "xeno_crm.db")
        if os.path.exists(source_db):
            shutil.copy(source_db, db_path)
    DATABASE_URL = f"sqlite:///{db_path}"
else:
    DATABASE_URL = "sqlite:///./xeno_crm.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class Customer(Base):
    __tablename__ = "customers"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    city = Column(String, index=True, nullable=False)
    total_spend = Column(Float, default=0.0)
    order_count = Column(Integer, default=0)
    last_order = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    communications = relationship("Communication", back_populates="customer", cascade="all, delete-orphan")

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    items = Column(Text, nullable=False)  # JSON-serialized array string
    rating = Column(Integer, nullable=False)  # 1 to 5 star rating
    review_text = Column(Text, nullable=True)
    ordered_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")

class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    segment_label = Column(String, nullable=False)
    segment_filters = Column(Text, nullable=False)  # JSON-serialized parameters
    message_template = Column(Text, nullable=False)
    channel = Column(String, nullable=False)  # whatsapp / sms / email / rcs
    status = Column(String, default="draft")  # draft / running / completed
    audience_size = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    communications = relationship("Communication", back_populates="campaign", cascade="all, delete-orphan")

class Communication(Base):
    __tablename__ = "communications"
    id = Column(String, primary_key=True, default=generate_uuid)
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    personalized_message = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending/sent/delivered/opened/clicked/failed
    channel = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    campaign = relationship("Campaign", back_populates="communications")
    customer = relationship("Customer", back_populates="communications")

class Receipt(Base):
    __tablename__ = "receipts"
    id = Column(String, primary_key=True, default=generate_uuid)
    communication_id = Column(String, ForeignKey("communications.id"), nullable=False)
    status = Column(String, nullable=False)
    received_at = Column(DateTime, default=datetime.datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(String, primary_key=True, default=generate_uuid)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True) # Nullable for GDPR/anonymity
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    consent_given = Column(Integer, default=1) # 1 for True, 0 for False (standard SQLite representation)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer")

def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
