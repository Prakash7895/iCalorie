from fastapi import APIRouter, UploadFile, File
from app.schemas import ScanResponse, ScanConfirmRequest, LogRequest
from app.services.vision import analyze_plate

router = APIRouter(prefix="/scan", tags=["scan"])


@router.post("", response_model=ScanResponse)
async def scan_plate(image: UploadFile = File(...)):
    image_bytes = await image.read()
    items = await analyze_plate(image_bytes)
    total_calories = sum(i.calories or 0 for i in items)
    return ScanResponse(items=items, total_calories=total_calories, photo_url=None)


@router.post("/confirm", response_model=ScanResponse)
async def confirm_scan(payload: ScanConfirmRequest):
    total_calories = sum(i.calories or 0 for i in payload.items)
    return ScanResponse(items=payload.items, total_calories=total_calories, photo_url=payload.photo_url)


@router.post("/log")
async def save_log(payload: LogRequest):
    # Placeholder: save to Postgres
    return {"status": "ok", "total_calories": payload.total_calories}
