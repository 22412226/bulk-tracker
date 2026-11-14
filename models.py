"""
Domain models for Bulking Tracker.
Immutability-focused dataclasses with validation and serialization.
"""

from __future__ import annotations
from dataclasses import dataclass, field
import uuid
from typing import Dict, Any, Optional


@dataclass(frozen=True)
class FoodItem:
    """A food item or preset stored in the user's library."""
    id: str
    name: str
    unit_type: str  # '100g' or 'serving'
    calories: float
    protein: float
    carbs: float
    fat: float
    serving_desc: str = ""
    is_staple: bool = False

    @classmethod
    def create(
        cls,
        name: str,
        unit_type: str,
        calories: float,
        protein: float,
        carbs: float,
        fat: float,
        serving_desc: str = "",
        is_staple: bool = False,
        item_id: Optional[str] = None
    ) -> FoodItem:
        return cls(
            id=item_id or str(uuid.uuid4())[:8],
            name=name.strip(),
            unit_type=unit_type,
            calories=round(max(0.0, float(calories)), 1),
            protein=round(max(0.0, float(protein)), 1),
            carbs=round(max(0.0, float(carbs)), 1),
            fat=round(max(0.0, float(fat)), 1),
            serving_desc=serving_desc.strip(),
            is_staple=is_staple
        )

    def calculate_for(self, amount: float) -> Dict[str, float]:
        """Calculates macro totals for a given quantity (in grams if 100g, or servings)."""
        factor = (amount / 100.0) if self.unit_type == "100g" else amount
        return {
            "calories": round(self.calories * factor, 1),
            "protein": round(self.protein * factor, 1),
            "carbs": round(self.carbs * factor, 1),
            "fat": round(self.fat * factor, 1)
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "unit_type": self.unit_type,
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat,
            "serving_desc": self.serving_desc,
            "is_staple": self.is_staple
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> FoodItem:
        return cls(
            id=str(data.get("id", str(uuid.uuid4())[:8])),
            name=str(data.get("name", "Unnamed Food")),
            unit_type=str(data.get("unit_type", "100g")),
            calories=float(data.get("calories", 0.0)),
            protein=float(data.get("protein", 0.0)),
            carbs=float(data.get("carbs", 0.0)),
            fat=float(data.get("fat", 0.0)),
            serving_desc=str(data.get("serving_desc", "")),
            is_staple=bool(data.get("is_staple", False))
        )


@dataclass(frozen=True)
class LoggedMeal:
    """A meal entry logged in a specific day's record."""
    id: str
    name: str
    meal_type: str  # 'Breakfast', 'Lunch', 'Dinner', 'Snacks/Shakes'
    quantity: float
    unit_label: str  # 'g' or 'serving(s)'
    calories: float
    protein: float
    carbs: float
    fat: float
    food_id: Optional[str] = None

    @classmethod
    def create(
        cls,
        name: str,
        meal_type: str,
        quantity: float,
        unit_label: str,
        calories: float,
        protein: float,
        carbs: float,
        fat: float,
        food_id: Optional[str] = None,
        meal_id: Optional[str] = None
    ) -> LoggedMeal:
        return cls(
            id=meal_id or str(uuid.uuid4())[:8],
            name=name.strip(),
            meal_type=meal_type,
            quantity=round(max(0.01, float(quantity)), 2),
            unit_label=unit_label,
            calories=round(max(0.0, float(calories)), 1),
            protein=round(max(0.0, float(protein)), 1),
            carbs=round(max(0.0, float(carbs)), 1),
            fat=round(max(0.0, float(fat)), 1),
            food_id=food_id
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "meal_type": self.meal_type,
            "quantity": self.quantity,
            "unit_label": self.unit_label,
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat,
            "food_id": self.food_id
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> LoggedMeal:
        return cls(
            id=str(data.get("id", str(uuid.uuid4())[:8])),
            name=str(data.get("name", "Logged Food")),
            meal_type=str(data.get("meal_type", "Lunch")),
            quantity=float(data.get("quantity", 1.0)),
            unit_label=str(data.get("unit_label", "serving")),
            calories=float(data.get("calories", 0.0)),
            protein=float(data.get("protein", 0.0)),
            carbs=float(data.get("carbs", 0.0)),
            fat=float(data.get("fat", 0.0)),
            food_id=data.get("food_id")
        )


@dataclass(frozen=True)
class WeightEntry:
    """Daily body weight measurement."""
    date: str  # YYYY-MM-DD
    weight_kg: float
    note: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "date": self.date,
            "weight_kg": round(self.weight_kg, 2),
            "note": self.note
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> WeightEntry:
        return cls(
            date=str(data.get("date", "")),
            weight_kg=float(data.get("weight_kg", 0.0)),
            note=str(data.get("note", ""))
        )


@dataclass(frozen=True)
class UserSettings:
    """User profile, calorie surplus goals, and macro targets."""
    weight_kg: float = 63.2
    goal_weight_kg: float = 70.0
    height_cm: float = 175.0
    age: int = 24
    gender: str = "Male"  # Male / Female
    activity_level: str = "Moderate (4x/week strength training)"
    surplus_kcal: int = 350
    use_manual_targets: bool = True
    target_calories: float = 2900.0
    target_protein: float = 120.0
    target_carbs: float = 380.0
    target_fat: float = 80.0

    def calculate_bmr(self) -> float:
        """Calculates Basal Metabolic Rate using Mifflin-St Jeor formula."""
        if self.gender.lower() == "male":
            return (10.0 * self.weight_kg) + (6.25 * self.height_cm) - (5.0 * self.age) + 5.0
        return (10.0 * self.weight_kg) + (6.25 * self.height_cm) - (5.0 * self.age) - 161.0

    def get_activity_multiplier(self) -> float:
        """Translates activity level string to multiplier."""
        mapping = {
            "Sedentary (desk job, little exercise)": 1.2,
            "Light (1-3x/week light exercise)": 1.375,
            "Moderate (4x/week strength training)": 1.55,
            "Heavy (6-7x/week intense training)": 1.725,
            "Athlete (2x/day intense training)": 1.9
        }
        return mapping.get(self.activity_level, 1.55)

    def calculate_tdee(self) -> float:
        """Maintenance calories (TDEE)."""
        return self.calculate_bmr() * self.get_activity_multiplier()

    def get_effective_targets(self) -> Dict[str, float]:
        """Returns the active targets based on manual vs auto mode."""
        if self.use_manual_targets:
            return {
                "calories": round(self.target_calories, 0),
                "protein": round(self.target_protein, 0),
                "carbs": round(self.target_carbs, 0),
                "fat": round(self.target_fat, 0)
            }
        
        # Auto-calculated lean bulking targets
        tdee = self.calculate_tdee()
        bulking_cals = tdee + self.surplus_kcal
        # 2.0g protein / kg body weight
        protein_g = self.weight_kg * 2.0
        # 1.0g fat / kg body weight
        fat_g = self.weight_kg * 1.0
        # remaining cals from carbs: (bulking_cals - (protein_g * 4 + fat_g * 9)) / 4
        cals_from_pf = (protein_g * 4.0) + (fat_g * 9.0)
        remaining_cals = max(200.0, bulking_cals - cals_from_pf)
        carbs_g = remaining_cals / 4.0

        return {
            "calories": round(bulking_cals, 0),
            "protein": round(protein_g, 0),
            "carbs": round(carbs_g, 0),
            "fat": round(fat_g, 0)
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "weight_kg": self.weight_kg,
            "goal_weight_kg": self.goal_weight_kg,
            "height_cm": self.height_cm,
            "age": self.age,
            "gender": self.gender,
            "activity_level": self.activity_level,
            "surplus_kcal": self.surplus_kcal,
            "use_manual_targets": self.use_manual_targets,
            "target_calories": self.target_calories,
            "target_protein": self.target_protein,
            "target_carbs": self.target_carbs,
            "target_fat": self.target_fat
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> UserSettings:
        return cls(
            weight_kg=float(data.get("weight_kg", 63.2)),
            goal_weight_kg=float(data.get("goal_weight_kg", 70.0)),
            height_cm=float(data.get("height_cm", 175.0)),
            age=int(data.get("age", 24)),
            gender=str(data.get("gender", "Male")),
            activity_level=str(data.get("activity_level", "Moderate (4x/week strength training)")),
            surplus_kcal=int(data.get("surplus_kcal", 350)),
            use_manual_targets=bool(data.get("use_manual_targets", True)),
            target_calories=float(data.get("target_calories", 2900.0)),
            target_protein=float(data.get("target_protein", 120.0)),
            target_carbs=float(data.get("target_carbs", 380.0)),
            target_fat=float(data.get("target_fat", 80.0))
        )
