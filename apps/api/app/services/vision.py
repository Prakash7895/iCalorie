from typing import List
from app.schemas import FoodItem


async def analyze_plate(image_bytes: bytes) -> List[FoodItem]:
    # Placeholder for OpenAI vision + LangChain tool orchestration.
    # Return a mocked response until the model integration is wired.
    return [
        FoodItem(name="Grilled chicken", grams=160, calories=220, protein_g=32, carbs_g=0, fat_g=9, confidence=0.82),
        FoodItem(name="Rice", grams=150, calories=180, protein_g=4, carbs_g=38, fat_g=1, confidence=0.76),
        FoodItem(name="Broccoli", grams=80, calories=60, protein_g=4, carbs_g=10, fat_g=0.5, confidence=0.74),
        FoodItem(name="Sauce", grams=50, calories=160, protein_g=0, carbs_g=6, fat_g=14, confidence=0.62),
    ]
