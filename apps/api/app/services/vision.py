import base64
import json
import math
from typing import List

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from app.config import settings
from app.schemas import FoodItem


def estimate_grams(area_ratio: float | None, plate_size_cm: float | None, category: str | None) -> float | None:
    if area_ratio is None:
        return None
    plate_d = plate_size_cm or 27.0
    plate_area = math.pi * (plate_d / 2) ** 2
    area_cm2 = max(0.0, min(1.0, area_ratio)) * plate_area

    category = (category or "mixed").lower()
    thickness = {
        "protein": 2.0,
        "carb": 2.5,
        "veg": 2.0,
        "fat": 0.5,
        "mixed": 2.0,
        "liquid": 1.0,
    }.get(category, 2.0)
    density = {
        "protein": 1.0,
        "carb": 0.85,
        "veg": 0.4,
        "fat": 0.9,
        "mixed": 0.9,
        "liquid": 1.0,
    }.get(category, 0.9)

    grams = area_cm2 * thickness * density
    return max(20.0, min(500.0, grams))


async def analyze_plate(image_bytes: bytes, plate_size_cm: float | None = None) -> List[FoodItem]:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{image_b64}"

    prompt = (
        "You are a food segmentation and portion estimator. Analyze the food in the photo and return ONLY JSON "
        "with a top-level key `items` that is a list. Each item must include: "
        "name, calories, protein_g, carbs_g, fat_g, confidence (0-1), "
        "area_ratio (0-1, fraction of plate area occupied), and food_category "
        "(one of: protein, carb, veg, fat, mixed, liquid). "
        "Do NOT include grams; we will compute grams from area_ratio. "
        "If you are unsure, provide best estimates. Return ONLY JSON."
    )

    model = ChatOpenAI(model="gpt-4.1-mini", api_key=settings.openai_api_key)
    message = HumanMessage(
        content=[
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
        ]
    )

    response = await model.ainvoke([message])
    raw = (
        response.content if isinstance(response.content, str) else str(response.content)
    )

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Try to recover JSON from fenced or mixed output
        start = raw.find("{")
        end = raw.rfind("}")
        if start == -1 or end == -1:
            raise
        data = json.loads(raw[start : end + 1])

    items = []
    for item in data.get("items", []):
        area_ratio = item.get("area_ratio")
        category = item.get("food_category")
        grams = estimate_grams(area_ratio, plate_size_cm, category)
        items.append(
            FoodItem(
                name=item.get("name", "Unknown"),
                grams=grams,
                calories=item.get("calories"),
                protein_g=item.get("protein_g"),
                carbs_g=item.get("carbs_g"),
                fat_g=item.get("fat_g"),
                confidence=item.get("confidence"),
                area_ratio=area_ratio,
                food_category=category,
            )
        )
    return items
