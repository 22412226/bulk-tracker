import React, { useState, useMemo } from "react";
import { FoodItem, MealType, LoggedMeal } from "@/types";
import { X, Search, Zap, Check } from "lucide-react";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  foods: FoodItem[];
  defaultMealType: MealType;
  onAdd: (meal: Omit<LoggedMeal, "id" | "date">) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  foods,
  defaultMealType,
  onAdd,
}) => {
  const [selectedFoodId, setSelectedFoodId] = useState<string>(foods[0]?.id || "");
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [amount, setAmount] = useState<string>("100");
  const [search, setSearch] = useState<string>("");

  const filteredFoods = useMemo(() => {
    if (!search.trim()) return foods;
    return foods.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [foods, search]);

  const selectedFood = useMemo(() => {
    return foods.find((f) => f.id === selectedFoodId) || foods[0];
  }, [foods, selectedFoodId]);

  // When selected food changes, set default amount
  const handleSelectFood = (food: FoodItem) => {
    setSelectedFoodId(food.id);
    if (food.unit_type === "100g") {
      setAmount("100");
    } else {
      setAmount("1");
    }
  };

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const factor = selectedFood
    ? selectedFood.unit_type === "100g"
      ? numAmount / 100
      : numAmount
    : 1;

  const previewCals = selectedFood ? Math.round(selectedFood.calories * factor) : 0;
  const previewP = selectedFood ? Math.round(selectedFood.protein * factor * 10) / 10 : 0;
  const previewC = selectedFood ? Math.round(selectedFood.carbs * factor * 10) / 10 : 0;
  const previewF = selectedFood ? Math.round(selectedFood.fat * factor * 10) / 10 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFood || numAmount <= 0) return;

    onAdd({
      meal_type: mealType,
      name: selectedFood.name,
      quantity: numAmount,
      unit_label: selectedFood.unit_type === "100g" ? "g" : "serving(s)",
      calories: previewCals,
      protein: previewP,
      carbs: previewC,
      fat: previewF,
      food_id: selectedFood.id,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">⚡ Quick Add from Staples</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-card-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
          {/* Meal Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Meal Time
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-card-secondary border border-border">
              {(["Breakfast", "Lunch", "Dinner", "Snacks/Shakes"] as MealType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`py-1.5 px-1 text-xs font-semibold rounded-lg truncate transition-colors ${
                    mealType === type
                      ? "bg-brand text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {type.split("/")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Food Search & Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Select Staple Food
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search food library..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white placeholder-gray-500 focus:outline-none focus:border-brand"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-border/60 p-1.5 bg-[#0e1320]">
              {filteredFoods.map((food) => {
                const isSelected = selectedFood?.id === food.id;
                return (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-brand/20 border border-brand/50 text-white"
                        : "hover:bg-card-secondary text-gray-300"
                    }`}
                  >
                    <div className="truncate mr-2">
                      <span className="font-semibold">{food.name}</span>
                      <span className="text-[11px] text-gray-400 block">
                        {food.calories} kcal per {food.unit_type}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-light flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portion Amount */}
          {selectedFood && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Portion Amount ({selectedFood.unit_type === "100g" ? "Grams" : "Servings"})
                </label>
                <span className="text-[11px] text-gray-400">{selectedFood.serving_desc}</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  step={selectedFood.unit_type === "100g" ? "5" : "0.25"}
                  min="0.1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 px-3 py-2 text-base font-bold rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
                />

                {/* Quick Add buttons */}
                {selectedFood.unit_type === "100g" ? (
                  <div className="flex gap-1">
                    {[100, 150, 200].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(String(val))}
                        className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-card-secondary hover:bg-card-hover border border-border text-gray-300 hover:text-white"
                      >
                        {val}g
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {[1, 1.5, 2].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(String(val))}
                        className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-card-secondary hover:bg-card-hover border border-border text-gray-300 hover:text-white"
                      >
                        {val}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Macro Preview Card */}
          <div className="p-3.5 rounded-xl bg-card-secondary border border-border/80">
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Live Macro Total Preview:
            </span>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-[#0e1320]">
                <span className="text-[11px] text-gray-400 block">Calories</span>
                <span className="text-sm font-bold text-macro-calories">{previewCals} kcal</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0e1320]">
                <span className="text-[11px] text-gray-400 block">Protein</span>
                <span className="text-sm font-bold text-macro-protein">{previewP}g</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0e1320]">
                <span className="text-[11px] text-gray-400 block">Carbs</span>
                <span className="text-sm font-bold text-macro-carbs">{previewC}g</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0e1320]">
                <span className="text-[11px] text-gray-400 block">Fats</span>
                <span className="text-sm font-bold text-macro-fat">{previewF}g</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-lg shadow-brand/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Log to {mealType}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
