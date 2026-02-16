from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
import uuid
from app.schemas import ScanResponse, ScanConfirmRequest, LogRequest
from app.services.vision import analyze_plate
from app.db import get_db
from app.models import MealLog, User
from sqlalchemy.orm import Session
from app.services.storage import upload_image
from app.routers.auth import get_current_user
from app.services.token_service import check_and_deduct_token

router = APIRouter(prefix="/scan", tags=["scan"])


@router.post("", response_model=ScanResponse)
async def scan_plate(
    image: UploadFile = File(...),
    plate_size_cm: float | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Scan a plate image and analyze food items. Requires 1 AI token."""
    # Check and deduct token
    token_deducted = check_and_deduct_token(current_user, db)
    if not token_deducted:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient AI tokens. You've used your free scan for today. Please purchase more tokens to continue.",
        )

    # Process the image
    image_bytes = await image.read()
    items = await analyze_plate(
        image_bytes, plate_size_cm=plate_size_cm, user_id=current_user.id, db=db
    )
    total_calories = sum(i.calories or 0 for i in items)
    key = f"uploads/{uuid.uuid4().hex}.jpg"
    photo_url = upload_image(key, image_bytes, image.content_type or "image/jpeg")

    return ScanResponse(
        items=items,
        total_calories=total_calories,
        photo_url=photo_url,
        remaining_tokens=current_user.ai_tokens,
    )


@router.post("/confirm", response_model=ScanResponse)
async def confirm_scan(payload: ScanConfirmRequest):
    total_calories = sum(i.calories or 0 for i in payload.items)
    return ScanResponse(
        items=payload.items, total_calories=total_calories, photo_url=payload.photo_url
    )


@router.post("/log")
async def save_log(payload: LogRequest):
    # Placeholder: save to Postgres
    return {"status": "ok", "total_calories": payload.total_calories}
