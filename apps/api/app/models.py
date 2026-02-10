from sqlalchemy import Column, DateTime, Integer, Float, String, JSON
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class MealLog(Base):
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    total_calories = Column(Float, nullable=True)
    photo_url = Column(String, nullable=True)
    items = Column(JSON, nullable=True)
    plate_size_cm = Column(Float, nullable=True)
