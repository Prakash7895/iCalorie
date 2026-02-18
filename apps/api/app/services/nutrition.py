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

FOOD_PORTION_MAP = {
    "rice, white, cooked long grain": {"cup": 158.0, "bowl": 240.0},
    "lentils, cooked": {"cup": 198.0, "bowl": 240.0},
    "bread, whole wheat, commercially prepared": {"piece": 40.0},
    "apple, raw": {"piece": 182.0},
    "pizza, cheese, regular crust": {"slice": 125.0},
    "oil": {"tbsp": 14.0, "tsp": 5.0},
}

DEFAULT_UNIT_MAP = {
    "cup": 160.0,
    "bowl": 240.0,
    "tbsp": 14.0,
    "tsp": 5.0,
    "piece": 100.0,
    "slice": 80.0,
    "serving": 150.0,
}

FOOD_CATEGORY_RULES = {
    "fruit_whole": {
        "keywords": ["apple", "banana", "orange", "mango", "pear", "guava"],
        "unit_weights": {"piece": 150.0},
    },
    "flatbread": {
        "keywords": ["chapati", "roti", "naan", "paratha"],
        "unit_weights": {"piece": 40.0},
    },
    "pizza": {"keywords": ["pizza"], "unit_weights": {"slice": 125.0}},
    "rice_grain": {"keywords": ["rice"], "unit_weights": {"cup": 158.0, "bowl": 240.0}},
    "lentil_curry": {
        "keywords": ["lentil", "dal"],
        "unit_weights": {"cup": 198.0, "bowl": 240.0},
    },
}


def normalize_food_name(name: str) -> str:
    """Normalizes GPT food names to USDA-friendly terms."""
    normalized = name.lower().strip()
    return FOOD_NORMALIZATION_RULES.get(normalized, normalized)


# def get_portion_grams(portion_str: str) -> float:
#     """
#     Parses portion string (e.g., '1 cup', '2 pieces') and returns grams.
#     Defaults to 150g (medium serving) if ambiguous.
#     """
#     if not portion_str:
#         return 150.0

#     portion_str = portion_str.lower()

#     # Extract number
#     match = re.search(r"(\d+(?:\.\d+)?)", portion_str)
#     quantity = float(match.group(1)) if match else 1.0

#     # Match unit
#     for unit, grams_per_unit in PORTION_MAP.items():
#         if unit in portion_str:
#             return quantity * grams_per_unit

#     return 150.0  # Default fallback


def detect_food_category(food_name: str) -> Optional[str]:
    food_name = food_name.lower()
    for category, config in FOOD_CATEGORY_RULES.items():
        for keyword in config["keywords"]:
            if keyword in food_name:
                return category
    return None


def normalize_portion_string(portion: str) -> str:
    if not portion:
        return "1 serving"
    portion = portion.lower().strip()
    portion = portion.replace("cups", "cup")
    portion = portion.replace("pieces", "piece")
    return portion


def get_portion_grams(
    food_name: str, portion_str: str, usda_serving_grams: Optional[float] = None
) -> float:
    portion_str = normalize_portion_string(portion_str)

    match = re.search(r"(\d+(?:\.\d+)?)", portion_str)
    quantity = float(match.group(1)) if match else 1.0

    unit = None
    for u in DEFAULT_UNIT_MAP:
        if u in portion_str:
            unit = u
            break

    if not unit:
        return 150.0

    # 1️⃣ USDA serving override
    if usda_serving_grams:
        return quantity * usda_serving_grams

    # 2️⃣ Category-based
    category = detect_food_category(food_name)
    if category:
        category_units = FOOD_CATEGORY_RULES[category]["unit_weights"]
        if unit in category_units:
            return quantity * category_units[unit]

    # 3️⃣ Default fallback
    return quantity * DEFAULT_UNIT_MAP.get(unit, 150.0)


def select_best_food_match(foods, search_term):
    if not foods:
        return None

    # 1. Exact match
    for food in foods:
        if food["description"].lower() == search_term.lower():
            return food

    # 2. Remove complex dishes
    GENERIC_BLOCK_WORDS = [
        "salad",
        "burger",
        "sandwich",
        "prepared",
        "with",
        "flavored",
    ]

    generic_foods = [
        f
        for f in foods
        if not any(word in f["description"].lower() for word in GENERIC_BLOCK_WORDS)
    ]

    if not generic_foods:
        generic_foods = foods

    # 3. Choose shortest description (most generic)
    return min(generic_foods, key=lambda f: len(f["description"]))


async def get_usda_nutrition(food_name: str) -> Dict[str, float]:
    """
    Fetches nutrition data (kcal, protein, carbs, fat) per 100g from USDA API.
    Returns 0.0 for all values if not found or API key missing.
    """
    defaults = {
        "kcal": 0.0,
        "protein": 0.0,
        "carbs": 0.0,
        "fat": 0.0,
        "serving_grams": None,
    }
    if not USDA_API_KEY:
        print("WARNING: USDA_API_KEY not set")
        return defaults

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                USDA_API_URL,
                params={
                    "api_key": USDA_API_KEY,
                    "query": food_name,
                    "pageSize": 50,
                    "dataType": [
                        "Foundation",
                        "SR Legacy",
                    ],
                },
                timeout=5.0,
            )
            data = response.json()
            foods = data.get("foods", [])
            if not foods:
                return defaults

            food = select_best_food_match(foods, food_name)
            nutrients = food.get("foodNutrients", [])
            result = defaults.copy()

            # Extract serving size if available
            result["serving_grams"] = food.get("servingSize")

            for nutrient in nutrients:
                nid = nutrient.get("nutrientId")
                val = float(nutrient.get("value", 0.0))
                # 1008, 2047, 2048: Energy (kcal)
                if nid in [1008, 2047, 2048]:
                    result["kcal"] = val
                # 1003: Protein
                elif nid == 1003:
                    result["protein"] = val
                # 1005: Carbohydrate, by difference
                elif nid == 1005:
                    result["carbs"] = val
                # 1004: Total lipid (fat)
                elif nid == 1004:
                    result["fat"] = val

            return result
    except Exception as e:
        print(f"USDA API Error: {e}")
        return defaults


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
        elif "baked" in style:
            multiplier += 0.05

    return round(base_calories * multiplier, -1)
