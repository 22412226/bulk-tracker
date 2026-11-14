import React from "react";
import { MealType, LoggedMeal } from "@/types";
import { MealItemRow } from "./MealItemRow";
import { Plus } from "lucide-react";

interface MealSectionProps {
  title: MealType;
  icon: string;
  meals: LoggedMeal[];
  onOpenAdd: (mealType: MealType) => void;
  onEditMeal: (meal: LoggedMeal) => void;
  onDeleteMeal: (mealId: string) => void;
}

export const MealSection: React.FC<MealSectionProps> = ({
  title,
  icon,
  meals,
  onOpenAdd,
  onEditMeal,
  onDeleteMeal,
}) => {
  const totalCals = Math.round(meals.reduce((sum, m) => sum + m.calories, 0));
  const totalProtein = Math.round(meals.reduce((sum, m) => sum + m.protein, 0) * 10) / 10;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="text-base font-bold text-white">{title}</h3>
          {meals.length > 0 && (
            <span className="text-xs font-medium text-gray-400 ml-1">
              ({totalCals} kcal • {totalProtein}g P)
            </span>
          )}
        </div>

        <button
          onClick={() => onOpenAdd(title)}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-card-secondary hover:bg-card-hover text-brand-light hover:text-white border border-border transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Meals List */}
      <div className="mt-3 space-y-2">
        {meals.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-500">
            No items logged yet. Tap &quot;+ Add&quot; to pick from your staples.
          </div>
        ) : (
          meals.map((meal) => (
            <MealItemRow
              key={meal.id}
              meal={meal}
              onEdit={onEditMeal}
              onDelete={onDeleteMeal}
            />
          ))
        )}
      </div>
    </div>
  );
};
