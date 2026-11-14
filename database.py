"""
Persistence engine for Bulking Tracker.
Handles JSON load/save, default seed staples, and day-by-day operations.
"""

import json
import os
import shutil
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timedelta

from models import FoodItem, LoggedMeal, WeightEntry, UserSettings

DATA_FILENAME = "bulking_tracker_data.json"

DEFAULT_STAPLES = [
    FoodItem.create(
        name="Basmati Rice (dry weight)",
        unit_type="100g",
        calories=367.0,
        protein=6.7,
        carbs=80.0,
        fat=0.7,
        serving_desc="Raw/dry unboiled rice",
        is_staple=True,
        item_id="staple-rice"
    ),
    FoodItem.create(
        name="Buckwheat Plov with But Şiş (1 container/portion)",
        unit_type="serving",
        calories=1087.0,
        protein=41.5,
        carbs=159.5,
        fat=30.9,
        serving_desc="1 full meal container",
        is_staple=True,
        item_id="staple-plov"
    ),
    FoodItem.create(
        name="Chicken Thighs / But Şiş (raw weight)",
        unit_type="100g",
        calories=200.0,
        protein=17.0,
        carbs=0.0,
        fat=15.0,
        serving_desc="Skinless chicken thigh chunks",
        is_staple=True,
        item_id="staple-chicken"
    ),
    FoodItem.create(
        name="Bulking Oat & Banana Shake (1 serving)",
        unit_type="serving",
        calories=580.0,
        protein=20.0,
        carbs=87.5,
        fat=15.7,
        serving_desc="Milk, oats, banana, peanut butter",
        is_staple=True,
        item_id="staple-shake"
    ),
    FoodItem.create(
        name="Whole Egg (1 large)",
        unit_type="serving",
        calories=75.0,
        protein=6.3,
        carbs=0.6,
        fat=5.3,
        serving_desc="1 large raw or boiled egg",
        is_staple=True,
        item_id="staple-egg"
    ),
]


class Database:
    """Thread-safe JSON data storage for all bulking data."""

    def __init__(self, filepath: Optional[str] = None):
        if filepath is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.filepath = os.path.join(base_dir, DATA_FILENAME)
        else:
            self.filepath = filepath

        self._settings = UserSettings()
        self._food_library: Dict[str, FoodItem] = {}
        self._daily_logs: Dict[str, List[LoggedMeal]] = {}
        self._weight_history: Dict[str, WeightEntry] = {}
        
        self.load()

    def load(self) -> None:
        """Loads state from local JSON, creating defaults if not present."""
        if not os.path.exists(self.filepath):
            self._initialize_defaults()
            self.save()
            return

        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Load Settings
            settings_dict = data.get("settings", {})
            self._settings = UserSettings.from_dict(settings_dict)

            # Load Food Library
            raw_foods = data.get("food_library", [])
            self._food_library = {item["id"]: FoodItem.from_dict(item) for item in raw_foods}
            
            # Ensure starter staples exist
            for staple in DEFAULT_STAPLES:
                if staple.id not in self._food_library:
                    self._food_library[staple.id] = staple

            # Load Daily Logs
            raw_logs = data.get("daily_logs", {})
            self._daily_logs = {}
            for d, meals_list in raw_logs.items():
                self._daily_logs[d] = [LoggedMeal.from_dict(m) for m in meals_list]

            # Load Weight History
            raw_weights = data.get("weight_history", {})
            self._weight_history = {d: WeightEntry.from_dict(w) for d, w in raw_weights.items()}

        except Exception as err:
            print(f"[Database] Error reading database ({err}), creating backup & resetting defaults.")
            backup_path = f"{self.filepath}.backup.{int(datetime.now().timestamp())}"
            shutil.copyfile(self.filepath, backup_path)
            self._initialize_defaults()
            self.save()

    def _initialize_defaults(self) -> None:
        """Initializes empty state with default staples and settings."""
        self._settings = UserSettings()
        self._food_library = {item.id: item for item in DEFAULT_STAPLES}
        self._daily_logs = {}
        today_str = datetime.now().strftime("%Y-%m-%d")
        self._weight_history = {
            today_str: WeightEntry(date=today_str, weight_kg=self._settings.weight_kg, note="Baseline weight")
        }

    def save(self) -> None:
        """Atomically saves the state to disk."""
        data = {
            "version": "1.0",
            "last_saved": datetime.now().isoformat(),
            "settings": self._settings.to_dict(),
            "food_library": [item.to_dict() for item in self._food_library.values()],
            "daily_logs": {
                d: [m.to_dict() for m in meals] for d, meals in self._daily_logs.items()
            },
            "weight_history": {
                d: w.to_dict() for d, w in self._weight_history.items()
            }
        }
        
        tmp_filepath = f"{self.filepath}.tmp"
        with open(tmp_filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp_filepath, self.filepath)

    # --- Settings Operations ---
    def get_settings(self) -> UserSettings:
        return self._settings

    def update_settings(self, new_settings: UserSettings) -> None:
        self._settings = new_settings
        self.save()

    # --- Food Library Operations ---
    def get_all_foods(self) -> List[FoodItem]:
        # Return sorted by name with staples first
        return sorted(
            list(self._food_library.values()),
            key=lambda x: (not x.is_staple, x.name.lower())
        )

    def get_food(self, food_id: str) -> Optional[FoodItem]:
        return self._food_library.get(food_id)

    def save_food(self, food: FoodItem) -> None:
        self._food_library = {**self._food_library, food.id: food}
        self.save()

    def delete_food(self, food_id: str) -> bool:
        if food_id in self._food_library:
            new_lib = {k: v for k, v in self._food_library.items() if k != food_id}
            self._food_library = new_lib
            self.save()
            return True
        return False

    # --- Daily Meal Operations ---
    def get_meals_for_date(self, date_str: str) -> List[LoggedMeal]:
        return list(self._daily_logs.get(date_str, []))

    def add_meal(self, date_str: str, meal: LoggedMeal) -> None:
        current_meals = self._daily_logs.get(date_str, [])
        self._daily_logs = {**self._daily_logs, date_str: [*current_meals, meal]}
        self.save()

    def update_meal(self, date_str: str, updated_meal: LoggedMeal) -> None:
        current_meals = self._daily_logs.get(date_str, [])
        new_list = [updated_meal if m.id == updated_meal.id else m for m in current_meals]
        self._daily_logs = {**self._daily_logs, date_str: new_list}
        self.save()

    def delete_meal(self, date_str: str, meal_id: str) -> bool:
        current_meals = self._daily_logs.get(date_str, [])
        new_list = [m for m in current_meals if m.id != meal_id]
        if len(new_list) != len(current_meals):
            self._daily_logs = {**self._daily_logs, date_str: new_list}
            self.save()
            return True
        return False

    def copy_yesterday_meals(self, target_date_str: str) -> int:
        """Copies all meal logs from the preceding day into target_date_str."""
        try:
            curr_date = datetime.strptime(target_date_str, "%Y-%m-%d")
            prev_date_str = (curr_date - timedelta(days=1)).strftime("%Y-%m-%d")
        except ValueError:
            return 0

        yesterday_meals = self._daily_logs.get(prev_date_str, [])
        if not yesterday_meals:
            return 0

        # Create fresh clones with new IDs
        cloned_meals = [
            LoggedMeal.create(
                name=m.name,
                meal_type=m.meal_type,
                quantity=m.quantity,
                unit_label=m.unit_label,
                calories=m.calories,
                protein=m.protein,
                carbs=m.carbs,
                fat=m.fat,
                food_id=m.food_id
            )
            for m in yesterday_meals
        ]

        current_meals = self._daily_logs.get(target_date_str, [])
        self._daily_logs = {**self._daily_logs, target_date_str: [*current_meals, *cloned_meals]}
        self.save()
        return len(cloned_meals)

    def get_daily_totals(self, date_str: str) -> Dict[str, float]:
        """Calculates total calories, protein, carbs, and fat for a given date."""
        meals = self.get_meals_for_date(date_str)
        cals = sum(m.calories for m in meals)
        p = sum(m.protein for m in meals)
        c = sum(m.carbs for m in meals)
        f = sum(m.fat for m in meals)
        return {
            "calories": round(cals, 1),
            "protein": round(p, 1),
            "carbs": round(c, 1),
            "fat": round(f, 1),
            "count": len(meals)
        }

    # --- Weight History Operations ---
    def get_weight_for_date(self, date_str: str) -> Optional[WeightEntry]:
        return self._weight_history.get(date_str)

    def log_weight(self, date_str: str, weight_kg: float, note: str = "") -> None:
        entry = WeightEntry(date=date_str, weight_kg=weight_kg, note=note)
        self._weight_history = {**self._weight_history, date_str: entry}
        # Also sync latest weight to settings weight_kg
        updated_settings = UserSettings(
            weight_kg=weight_kg,
            goal_weight_kg=self._settings.goal_weight_kg,
            height_cm=self._settings.height_cm,
            age=self._settings.age,
            gender=self._settings.gender,
            activity_level=self._settings.activity_level,
            surplus_kcal=self._settings.surplus_kcal,
            use_manual_targets=self._settings.use_manual_targets,
            target_calories=self._settings.target_calories,
            target_protein=self._settings.target_protein,
            target_carbs=self._settings.target_carbs,
            target_fat=self._settings.target_fat
        )
        self._settings = updated_settings
        self.save()

    def get_all_weights(self) -> List[WeightEntry]:
        """Returns weight entries sorted by date."""
        entries = list(self._weight_history.values())
        return sorted(entries, key=lambda x: x.date)
