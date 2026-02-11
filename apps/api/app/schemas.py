from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


# Auth Schemas
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    profile_picture_url: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


# Food & Nutrition Schemas
class FoodItem(BaseModel):
    name: str
    grams: Optional[float] = None
    calories: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    confidence: Optional[float] = None


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
