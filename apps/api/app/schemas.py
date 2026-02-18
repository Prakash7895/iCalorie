from pydantic import BaseModel, EmailStr, model_validator, Field
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
    scans_remaining: int = 0
    daily_calorie_goal: int = 2000

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def convert_profile_picture_path_to_url(self):
        """Convert stored S3 key to full URL."""
        from app.config import settings

        if self.profile_picture_url and not self.profile_picture_url.startswith("http"):
            self.profile_picture_url = f"{settings.s3_endpoint_url}/{settings.s3_bucket}/{self.profile_picture_url}"
        return self


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    daily_calorie_goal: Optional[int] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class TokenBalanceResponse(BaseModel):
    scans_remaining: int


class PurchaseTokensRequest(BaseModel):
    amount: int = Field(..., gt=0, description="Number of tokens to purchase")


class TokenUsageResponse(BaseModel):
    id: int
    model_name: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: Optional[float]
    endpoint: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class TokenPackage(BaseModel):
    """Represents a token purchase package."""

    scans: int  # Number of scans user will get
    price_usd: float  # Price in USD
    product_id: str  # Google Play product ID
    savings_percent: Optional[int] = None  # Discount % compared to base price


class PricingInfo(BaseModel):
    """Pricing information for token purchases."""

    base_price_per_scan: float
    packages: List[TokenPackage]


# Food & Nutrition Schemas
class FoodItem(BaseModel):
    name: str
    normalized_name: Optional[str] = None
    portion: Optional[str] = None
    estimated_grams: Optional[float] = None
    calories: Optional[float] = None
    confidence: Optional[float] = None
    notes: Optional[str] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None


class ScanResponse(BaseModel):
    items: List[FoodItem]
    total_calories: Optional[float] = None
    photo_url: Optional[str] = None
    scans_remaining: Optional[int] = None
    log_id: Optional[int] = None


class LogRequest(BaseModel):
    items: List[FoodItem]
    total_calories: Optional[float] = None
    photo_url: Optional[str] = None
    created_at: Optional[str] = None
    plate_size_cm: Optional[float] = None


class AndroidPurchaseRequest(BaseModel):
    """Request to verify Android in-app purchase."""

    purchase_token: str  # Google Play purchase token
    product_id: str  # Product ID that was purchased
    package_name: Optional[str] = (
        None  # App package name (optional, uses config default)
    )


class TokenPackage(BaseModel):
    """Token package information."""

    product_id: str
    scans: int
    price_usd: float
    savings_percent: int


class PricingInfo(BaseModel):
    """Pricing information for token packages."""

    packages: List[TokenPackage]
    price_per_scan: float
