import React from "react";
import { LoggedMeal } from "@/types";
import { Trash2, Edit2 } from "lucide-react";

interface MealItemRowProps {
  meal: LoggedMeal;
  onEdit: (meal: LoggedMeal) => void;
  onDelete: (mealId: string) => void;
}

export const MealItemRow: React.FC<MealItemRowProps> = ({
  meal,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="group flex items-center justify-between p-3 rounded-xl bg-card-secondary hover:bg-card-hover border border-border/60 hover:border-border transition-all">
      {/* Left: Food name & quantity */}
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-white truncate">{meal.name}</h4>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#2A344A] text-gray-300 whitespace-nowrap">
            {meal.quantity} {meal.unit_label}
          </span>
        </div>

        {/* Macro tags */}
        <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[11px] font-medium text-gray-400">
          <span className="text-macro-calories font-bold">
            {Math.round(meal.calories)} kcal
          </span>
          <span className="text-macro-protein">{meal.protein}g P</span>
          <span className="text-macro-carbs">{meal.carbs}g C</span>
          <span className="text-macro-fat">{meal.fat}g F</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(meal)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-card transition-colors"
          title="Edit portion"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(meal.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete entry"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
