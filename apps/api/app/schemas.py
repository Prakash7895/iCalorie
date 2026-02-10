from pydantic import BaseModel
from typing import List, Optional


class FoodItem(BaseModel):
    name: str
    grams: Optional[float] = None
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    confidence: Optional[float] = None
    area_ratio: Optional[float] = None
    food_category: Optional[str] = None


class ScanResponse(BaseModel):
    items: List[FoodItem]
    total_calories: Optional[float] = None
    photo_url: Optional[str] = None


class ScanConfirmRequest(BaseModel):
    items: List[FoodItem]
    photo_url: Optional[str] = None


class LogRequest(BaseModel):
    items: List[FoodItem]
    total_calories: Optional[float] = None
    photo_url: Optional[str] = None
    created_at: Optional[str] = None
    plate_size_cm: Optional[float] = None
