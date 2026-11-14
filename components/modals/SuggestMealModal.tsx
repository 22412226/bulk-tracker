import React, { useState } from "react";
import { MealSuggestion } from "@/lib/calculations";
import { MacroTotals, MealType, LoggedMeal } from "@/types";
import { X, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface SuggestMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: MealSuggestion | null;
  remainingTotals: MacroTotals;
  onAddMeal: (meal: Omit<LoggedMeal, "id" | "date">) => void;
}

export const SuggestMealModal: React.FC<SuggestMealModalProps> = ({
  isOpen,
  onClose,
  suggestion,
  remainingTotals,
  onAddMeal,
}) => {
  const [targetCategory, setTargetCategory] = useState<MealType>("Dinner");

  if (!isOpen) return null;

  const handleApplySuggestion = () => {
    if (!suggestion) return;

    onAddMeal({
      meal_type: targetCategory,
      name: `${suggestion.food.name} (Suggested)`,
      quantity: suggestion.quantity,
      unit_label: suggestion.food.unit_type === "100g" ? "g" : "serving(s)",
      calories: suggestion.calories,
      protein: suggestion.protein,
      carbs: suggestion.carbs,
      fat: suggestion.fat,
      food_id: suggestion.food.id,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
            <h2 className="text-lg font-bold text-white">Smart Meal Recommendation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-card-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Remaining deficit summary */}
        <div className="mt-4 p-3 rounded-xl bg-card-secondary border border-border/80">
          <span className="text-xs font-semibold text-gray-400 block mb-1">
            Current Remaining Needed Today:
          </span>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <span className="text-[11px] text-gray-400 block">Calories</span>
              <span className="text-xs font-bold text-macro-calories">{remainingTotals.calories} kcal</span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Protein</span>
              <span className="text-xs font-bold text-macro-protein">{remainingTotals.protein}g</span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Carbs</span>
              <span className="text-xs font-bold text-macro-carbs">{remainingTotals.carbs}g</span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block">Fats</span>
              <span className="text-xs font-bold text-macro-fat">{remainingTotals.fat}g</span>
            </div>
          </div>
        </div>

        {/* Recommendation Content */}
        {suggestion ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-card-secondary to-[#1c2438] border border-brand/40 shadow-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-light flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Best Match ({suggestion.scoreMatch}%)
                </span>
                <span className="text-xs font-bold text-macro-calories">
                  {suggestion.calories} kcal
                </span>
              </div>

              <h3 className="text-base font-black text-white">{suggestion.food.name}</h3>
              <p className="text-xs font-medium text-emerald-400 mt-0.5">
                Recommended portion: {suggestion.unitLabel}
              </p>

              <p className="text-xs text-gray-300 mt-2 bg-black/30 p-2.5 rounded-lg border border-border/40">
                💡 {suggestion.reason}
              </p>

              {/* Macro breakdown of suggestion */}
              <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-2 border-t border-border/40 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block">Protein</span>
                  <span className="font-bold text-macro-protein">+{suggestion.protein}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Carbs</span>
                  <span className="font-bold text-macro-carbs">+{suggestion.carbs}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Fats</span>
                  <span className="font-bold text-macro-fat">+{suggestion.fat}g</span>
                </div>
              </div>
            </div>

            {/* Choose category */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Add this suggested meal to:
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-card-secondary border border-border">
                {(["Breakfast", "Lunch", "Dinner", "Snacks/Shakes"] as MealType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTargetCategory(type)}
                    className={`py-1.5 px-1 text-xs font-semibold rounded-lg truncate transition-colors ${
                      targetCategory === type
                        ? "bg-brand text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {type.split("/")[0]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleApplySuggestion}
              className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-lg shadow-brand/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Log Suggested Portion Now</span>
            </button>
          </div>
        ) : (
          <div className="mt-4 p-6 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Daily Targets Reached!</h3>
            <p className="text-xs text-gray-400">
              You have already achieved your daily bulking calories and protein. No extra meals needed!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
