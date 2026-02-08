import base64
import json
from typing import List

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from app.config import settings
from app.schemas import FoodItem


async def analyze_plate(image_bytes: bytes) -> List[FoodItem]:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{image_b64}"

    prompt = (
        "You are a nutrition estimator. Analyze the food in the photo and return a JSON object "
        "with a top-level key `items` that is a list. Each item must include: "
        "name, grams, calories, protein_g, carbs_g, fat_g, confidence (0-1). "
        "If you are unsure, provide best estimates. Return ONLY JSON."
    )

    model = ChatOpenAI(model="gpt-4.1-mini", api_key=settings.openai_api_key)
    message = HumanMessage(
        content=[
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
        ]
    )

    response = model.invoke([message])
    raw = response.content if isinstance(response.content, str) else str(response.content)

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
        items.append(
            FoodItem(
                name=item.get("name", "Unknown"),
                grams=item.get("grams"),
                calories=item.get("calories"),
                protein_g=item.get("protein_g"),
                carbs_g=item.get("carbs_g"),
                fat_g=item.get("fat_g"),
                confidence=item.get("confidence"),
            )
        )
    return items
