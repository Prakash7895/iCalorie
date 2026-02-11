from sqlalchemy import Column, DateTime, Integer, Float, String, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

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
