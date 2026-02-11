from pydantic import BaseModel
from typing import List, Optional


class FoodItem(BaseModel):
    name: str  # Display name (GPT)
    normalized_name: Optional[str] = None  # USDA name
    portion: Optional[str] = None  # "1 cup"
    estimated_grams: Optional[float] = None
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    confidence: Optional[float] = None
    notes: Optional[str] = None


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


# Auth Schemas
class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    created_at: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse
