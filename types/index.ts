export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks/Shakes";
export type UnitType = "100g" | "serving";

export interface FoodItem {
  id: string;
  name: string;
  unit_type: UnitType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_desc?: string;
  is_staple?: boolean;
}

export interface LoggedMeal {
  id: string;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  name: string;
  quantity: number;
  unit_label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  food_id?: string | null;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight_kg: number;
  note?: string;
}

export interface UserSettings {
  weight_kg: number;
  goal_weight_kg: number;
  height_cm: number;
  age: number;
  gender: "Male" | "Female";
  activity_level: string;
  surplus_kcal: number;
  use_manual_targets: boolean;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  baseline_weight_kg?: number;
  last_notified_weight_increase?: number;
}

export interface DayMode {
  date: string; // YYYY-MM-DD
  is_gym_day: boolean; // GZCLP training day vs rest day
  notes?: string;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface BatchIngredient {
  id: string;
  name: string;
  amount: number; // in grams or servings
  unit_label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface BatchRecipe {
  name: string;
  containers: number;
  ingredients: BatchIngredient[];
  serving_desc?: string;
}
