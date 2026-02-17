from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    Float,
    String,
    JSON,
    ForeignKey,
    Boolean,
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    profile_picture_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Scan management
    scans_remaining = Column(
        Integer, default=5, nullable=False
    )  # Current available scans (default to 5 free scans)

    daily_calorie_goal = Column(
        Integer, default=2000, nullable=False
    )  # User's daily calorie goal

    # Relationship
    meal_logs = relationship("MealLog", back_populates="user")


class MealLog(Base):
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    total_calories = Column(Float, nullable=True)
    photo_url = Column(String, nullable=True)
    items = Column(JSON, nullable=True)
    plate_size_cm = Column(Float, nullable=True)

    # Relationship
    user = relationship("User", back_populates="meal_logs")


class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_name = Column(String, nullable=False)  # e.g., "gpt-4o-mini"
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)
    estimated_cost_usd = Column(Float, nullable=True)  # Cost in USD
    endpoint = Column(String, nullable=True)  # e.g., "/scan"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship
    user = relationship("User")


class PurchaseReceipt(Base):
    __tablename__ = "purchase_receipts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform = Column(String, nullable=False)  # 'android' or 'ios'
    product_id = Column(String, nullable=False)  # e.g., 'com.icalorie.tokens.5'
    receipt_token = Column(
        String, nullable=False, unique=True, index=True
    )  # Unique purchase token
    scans_added = Column(Integer, nullable=False)  # Number of scans added
    price_usd = Column(Float, nullable=True)  # Purchase price
    verified_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User")
