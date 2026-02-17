from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
import uuid
from app.schemas import ScanResponse
from app.services.vision import analyze_plate
from app.db import get_db
from app.models import MealLog, User
from sqlalchemy.orm import Session
from app.services.storage import upload_image
from datetime import datetime
from app.routers.auth import get_current_user

router = APIRouter(prefix="/scan", tags=["scan"])


@router.post("", response_model=ScanResponse)
async def scan_plate(
    image: UploadFile = File(...),
    plate_size_cm: float | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Scan a plate image and analyze food items. Decrements 1 scan on success and saves log."""

    # Check if user has available scans
    if current_user.scans_remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient scans available. Please wait for your daily reset or purchase more scans to continue.",
        )

    # Process the image
    image_bytes = await image.read()

    # Analyze plate
    items = await analyze_plate(
        image_bytes, plate_size_cm=plate_size_cm, user_id=current_user.id, db=db
    )

    total_calories = sum(i.calories or 0 for i in items)
    key = f"uploads/{uuid.uuid4().hex}.jpg"
    photo_url = upload_image(key, image_bytes, image.content_type or "image/jpeg")

    # Create MealLog entry immediately
    log = MealLog(
        user_id=current_user.id,
        created_at=datetime.utcnow(),
        total_calories=total_calories,
        photo_url=photo_url,
        items=[item.model_dump() for item in items],
        plate_size_cm=plate_size_cm,
    )
    db.add(log)

    # Successfully processed and analyzed, now decrement the scan balance
    current_user.scans_remaining -= 1
    db.commit()
    db.refresh(log)

    return ScanResponse(
        items=items,
        total_calories=total_calories,
        photo_url=photo_url,
        scans_remaining=current_user.scans_remaining,
        log_id=log.id,
    )
