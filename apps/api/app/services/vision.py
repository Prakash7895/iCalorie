import base64
import json
from typing import List, Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from sqlalchemy.orm import Session

from app.config import settings
from app.schemas import FoodItem
from app.services.nutrition import (
    normalize_food_name,
    get_portion_grams,
    get_usda_nutrition,
    calculate_calories,
)


async def analyze_plate(
    image_bytes: bytes,
    plate_size_cm: float | None = None,
    user_id: Optional[int] = None,
    db: Optional[Session] = None,
) -> List[FoodItem]:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{image_b64}"

    # Exact prompt requested by user
    prompt = """
            You are a food analysis AI.

            Analyze the provided food image and follow ALL rules strictly:

            1. Identify each distinct food item visible.
            2. For each item:
            - Provide a clear generic food name (lowercase).
            - Estimate portion using STRICT numeric format only:
                    "<number> cup"
                    "<number> bowl"
                    "<number> piece"
                    "<number> tbsp"
                    "<number> tsp"
            - Do NOT use words like small, medium, large.
            - Do NOT use ranges.
            - Do NOT use fractions like 1/2. Use decimals (0.5).
            3. Cooking style must be ONE of:
            "fried", "steamed", "baked", "curry", null
            4. If mixed dish (biryani, dal-chawal), treat as ONE dish.
            5. Do NOT guess calories.
            6. If unsure, lower confidence but still choose best estimate.
            7. Assume the food is served on a standard 10-inch dinner plate unless a bowl is clearly visible.
            8. Do NOT adjust portion size based solely on camera distance.

            Return ONLY valid JSON.

            Schema:
            {
            "foods": [
                {
                "name": string,
                "portion": string,
                "cooking_style": "fried" | "steamed" | "baked" | "curry" | null,
                "confidence": number (0-1),
                "notes": string | null
                }
            ],
            "meal_notes": string | null
            }
    """

    model = ChatOpenAI(
        model=settings.ai_model,
        api_key=settings.openai_api_key,
        max_tokens=1500,
        temperature=0,
    )
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

    # Log token usage to database
    if user_id and db:
        try:
            from app.models import TokenUsage

            # Extract usage information from response
            usage_metadata = getattr(response, "usage_metadata", None) or getattr(
                response, "response_metadata", {}
            ).get("token_usage", {})

            if usage_metadata:
                input_tokens = usage_metadata.get(
                    "input_tokens", 0
                ) or usage_metadata.get("prompt_tokens", 0)
                output_tokens = usage_metadata.get(
                    "output_tokens", 0
                ) or usage_metadata.get("completion_tokens", 0)
                total_tokens = getattr(
                    usage_metadata, "total_tokens", 0
                ) or usage_metadata.get("total_tokens", input_tokens + output_tokens)

                # Calculate cost based on GPT-4o-mini pricing
                # https://openai.com/api/pricing/
                # Input: $0.150 / 1M tokens
                # Output: $0.600 / 1M tokens
                input_cost = (input_tokens / 1_000_000) * 0.150
                output_cost = (output_tokens / 1_000_000) * 0.600
                total_cost = input_cost + output_cost

                # Create token usage record
                token_record = TokenUsage(
                    user_id=user_id,
                    model_name=settings.ai_model,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    total_tokens=total_tokens,
                    estimated_cost_usd=round(total_cost, 6),
                    endpoint="/scan",
                )
                db.add(token_record)
                db.commit()
        except Exception as e:
            # Don't fail the request if logging fails
            print(f"Warning: Failed to log token usage: {e}")
            db.rollback() if db else None

    try:
        # Clean potential markdown fences
        clean_raw = raw.strip()
        if clean_raw.startswith("```json"):
            clean_raw = clean_raw[7:]
        if clean_raw.endswith("```"):
            clean_raw = clean_raw[:-3]

        data = json.loads(clean_raw)
    except json.JSONDecodeError:
        # Fallback extraction
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1:
            data = json.loads(raw[start : end + 1])
        else:
            raise ValueError("Failed to parse GPT response")

    items = []
    for item in data.get("foods", []):
        raw_name = item.get("name", "Unknown")
        portion_str = item.get("portion")
        cooking_style = item.get("cooking_style")
        notes = item.get("notes")

        # 1. Normalize Name
        normalized_name = normalize_food_name(raw_name)

        # 2. Get USDA Nutrition (kcal, protein, carbs, fat per 100g)
        nutrition = await get_usda_nutrition(normalized_name)
        kcal_per_100g = nutrition["kcal"]

        # 3. Get Grams
        # grams = get_portion_grams(portion_str)
        grams = get_portion_grams(
            normalized_name,
            item["portion"],
            nutrition.get("serving_grams"),
        )

        # 4. Calculate Total Calories and Macros
        total_kcal = calculate_calories(grams, kcal_per_100g, cooking_style)

        # Scale macros based on grams
        scale = grams / 100.0
        protein = round(nutrition["protein"] * scale, 1)
        carbs = round(nutrition["carbs"] * scale, 1)
        fat = round(nutrition["fat"] * scale, 1)

        items.append(
            FoodItem(
                name=raw_name,
                normalized_name=normalized_name,
                portion=portion_str,
                estimated_grams=grams,
                calories=total_kcal,
                confidence=item.get("confidence"),
                notes=notes,
                protein_g=protein,
                carbs_g=carbs,
                fat_g=fat,
            )
        )
    return items
