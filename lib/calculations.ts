import { FoodItem, UserSettings, MacroTotals } from "@/types";

export function calculateBMR(settings: UserSettings): number {
  const { weight_kg, height_cm, age, gender } = settings;
  if (gender.toLowerCase() === "male") {
    return 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age + 5.0;
  }
  return 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age - 161.0;
}

export function getActivityMultiplier(activityLevel: string): number {
  const map: Record<string, number> = {
    "Sedentary (desk job, little exercise)": 1.2,
    "Light (1-3x/week light exercise)": 1.375,
    "Moderate (4x/week strength training)": 1.55,
    "Heavy (6-7x/week intense training)": 1.725,
    "Athlete (2x/day intense training)": 1.9,
  };
  return map[activityLevel] || 1.55;
}

export function calculateTDEE(settings: UserSettings): number {
  return calculateBMR(settings) * getActivityMultiplier(settings.activity_level);
}

export function getEffectiveTargets(
  settings: UserSettings,
  isGymDay: boolean = false
): MacroTotals {
  let baseTargets: MacroTotals;

  if (settings.use_manual_targets) {
    baseTargets = {
      calories: Math.round(settings.target_calories),
      protein: Math.round(settings.target_protein),
      carbs: Math.round(settings.target_carbs),
      fat: Math.round(settings.target_fat),
    };
  } else {
    const tdee = calculateTDEE(settings);
    const bulkingCals = tdee + settings.surplus_kcal;
    const proteinG = settings.weight_kg * 2.0;
    const fatG = settings.weight_kg * 1.0;
    const calsFromPF = proteinG * 4.0 + fatG * 9.0;
    const remainingCals = Math.max(200, bulkingCals - calsFromPF);
    const carbsG = remainingCals / 4.0;

    baseTargets = {
      calories: Math.round(bulkingCals),
      protein: Math.round(proteinG),
      carbs: Math.round(carbsG),
      fat: Math.round(fatG),
    };
  }

  // If GZCLP Gym Day is active, provide workout boost (+150 kcal carbs)
  if (isGymDay) {
    return {
      calories: baseTargets.calories + 150,
      protein: baseTargets.protein,
      carbs: baseTargets.carbs + 35,
      fat: baseTargets.fat,
    };
  }

  return baseTargets;
}

export interface MealSuggestion {
  food: FoodItem;
  quantity: number;
  unitLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  scoreMatch: number;
  reason: string;
}

/**
 * Smart engine: suggests the optimal item from the user's food library
 * to close out the remaining macros of the day without overshooting.
 */
export function suggestMealToCloseDay(
  remaining: MacroTotals,
  foodLibrary: FoodItem[]
): MealSuggestion | null {
  if (foodLibrary.length === 0) return null;
  if (remaining.calories <= 50 && remaining.protein <= 5) return null;

  let bestSuggestion: MealSuggestion | null = null;
  let minDifference = Infinity;

  for (const food of foodLibrary) {
    // Determine reasonable portion range
    let quantities: number[] = [];
    if (food.unit_type === "100g") {
      // 50g to 350g in 25g increments
      for (let g = 50; g <= 350; g += 25) {
        quantities.push(g);
      }
    } else {
      // 0.5 to 2.5 servings
      quantities = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    }

    for (const qty of quantities) {
      const factor = food.unit_type === "100g" ? qty / 100 : qty;
      const cals = Math.round(food.calories * factor);
      const prot = Math.round(food.protein * factor * 10) / 10;
      const carb = Math.round(food.carbs * factor * 10) / 10;
      const fat = Math.round(food.fat * factor * 10) / 10;

      // Penalize overshooting calories heavily, reward hitting protein and calories
      const calDiff = Math.abs(cals - remaining.calories);
      const protDiff = Math.abs(prot - remaining.protein);
      const penalty = cals > remaining.calories + 150 ? 500 : 0;
      const score = calDiff * 1.0 + protDiff * 4.0 + penalty;

      if (score < minDifference) {
        minDifference = score;
        const unitLabel = food.unit_type === "100g" ? `${qty}g` : `${qty} serving(s)`;
        let reason = `Fills ~${cals} kcal and +${prot}g protein perfectly.`;
        if (remaining.protein > 25 && prot >= 25) {
          reason = `High-protein choice (+${prot}g P) to hit your daily muscle-building target.`;
        } else if (remaining.carbs > 100 && carb >= 60) {
          reason = `High-glycogen refill (+${carb}g C) for bulking energy and workout recovery.`;
        }

        bestSuggestion = {
          food,
          quantity: qty,
          unitLabel,
          calories: cals,
          protein: prot,
          carbs: carb,
          fat: fat,
          scoreMatch: Math.max(0, Math.min(100, Math.round(100 - score / 10))),
          reason,
        };
      }
    }
  }

  return bestSuggestion;
}
