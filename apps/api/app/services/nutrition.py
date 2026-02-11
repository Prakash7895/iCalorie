import httpx
import os
import re
from typing import Optional, Dict

USDA_API_KEY = os.getenv("USDA_API_KEY")
USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

# Static Portion Map (MVP)
PORTION_MAP = {
    "cup": 158.0,  # approximate (rice)
    "bowl": 240.0,
    "tbsp": 14.0,
    "tsp": 5.0,
    "piece": 40.0,  # default for flatbread
    "slice": 28.0,
    "serving": 150.0,
}

# Normalization Rules (MVP)
FOOD_NORMALIZATION_RULES = {
    "dal": "lentils, cooked",
    "white rice": "rice, white, cooked long grain",
    "brown rice": "rice, brown, cooked",
    "chicken curry": "chicken, meat only, cooked, stewed",
    "biryani": "rice, white, cooked long grain",
    "chapati": "bread, whole wheat, commercially prepared",
    "roti": "bread, whole wheat, commercially prepared",
    "naan": "naan",
    "paneer": "cheese, paneer",
    "yogurt": "yogurt, plain, whole milk",
    "curd": "yogurt, plain, whole milk",
}


def normalize_food_name(name: str) -> str:
    """Normalizes GPT food names to USDA-friendly terms."""
    normalized = name.lower().strip()
    return FOOD_NORMALIZATION_RULES.get(normalized, normalized)


def get_portion_grams(portion_str: str) -> float:
    """
    Parses portion string (e.g., '1 cup', '2 pieces') and returns grams.
    Defaults to 150g (medium serving) if ambiguous.
    """
    if not portion_str:
        return 150.0

    portion_str = portion_str.lower()

    # Extract number
    match = re.search(r"(\d+(?:\.\d+)?)", portion_str)
    quantity = float(match.group(1)) if match else 1.0

    # Match unit
    for unit, grams_per_unit in PORTION_MAP.items():
        if unit in portion_str:
            return quantity * grams_per_unit

    return 150.0  # Default fallback


async def get_usda_nutrition(food_name: str) -> float:
    """
    Fetches kcal per 100g from USDA API.
    Returns 0.0 if not found or API key missing.
    """
    if not USDA_API_KEY:
        print("WARNING: USDA_API_KEY not set")
        return 0.0

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                USDA_API_URL,
                params={
                    "api_key": USDA_API_KEY,
                    "query": food_name,
                    "pageSize": 1,
                    # "dataType": ["Foundation", "SR Legacy"],
                },
                timeout=5.0,
            )
            data = response.json()

            if not data.get("foods"):
                return 0.0

            food = data["foods"][0]
            nutrients = food.get("foodNutrients", [])

            # Find Energy (Atwater General Factors) or Energy (Atwater Specific Factors) or Energy
            # Nutrient ID 2047: Energy (Atwater Specific Factors)
            # Nutrient ID 2048: Energy (Atwater General Factors)
            # Nutrient ID 1008: Energy (kcal)
            for nutrient in nutrients:
                if nutrient.get("nutrientId") in [1008, 2047, 2048]:
                    return float(nutrient.get("value", 0.0))

            return 0.0
    except Exception as e:
        print(f"USDA API Error: {e}")
        return 0.0


def calculate_calories(
    grams: float, kcal_per_100g: float, cooking_style: Optional[str] = None
) -> float:
    """Calculates total calories with cooking style adjustments."""
    base_calories = (grams / 100.0) * kcal_per_100g
    multiplier = 1.0

    if cooking_style:
        style = cooking_style.lower()
        if "fried" in style:
            multiplier += 0.15
        elif "curry" in style or "gravy" in style:
            multiplier += 0.10
        elif "restaurant" in style:
            multiplier += 0.20

    return round(base_calories * multiplier)
