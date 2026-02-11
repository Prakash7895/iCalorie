from fastapi import APIRouter, UploadFile, File, Form, Depends
import uuid
from app.schemas import ScanResponse, ScanConfirmRequest, LogRequest
from app.services.vision import analyze_plate
from app.db import get_db
from app.models import MealLog
from sqlalchemy.orm import Session
from app.services.storage import upload_image

router = APIRouter(prefix="/scan", tags=["scan"])


@router.post("", response_model=ScanResponse)
@router.post("", response_model=ScanResponse)
async def scan_plate(
    image: UploadFile = File(...),
    plate_size_cm: float | None = Form(None),
    db: Session = Depends(get_db),
):
    image_bytes = await image.read()
    # Note: plate_size_cm is now optional/fallback as we use portion estimation
    items = await analyze_plate(image_bytes, plate_size_cm=plate_size_cm)
    total_calories = sum(i.calories or 0 for i in items)
    key = f"uploads/{uuid.uuid4().hex}.jpg"
    photo_url = upload_image(key, image_bytes, image.content_type or "image/jpeg")
    return ScanResponse(items=items, total_calories=total_calories, photo_url=photo_url)


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
