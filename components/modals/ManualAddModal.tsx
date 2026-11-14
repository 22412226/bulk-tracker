import React, { useState, useEffect } from "react";
import { MealType, LoggedMeal } from "@/types";
import { X, Edit3 } from "lucide-react";

interface ManualAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType: MealType;
  editingMeal?: LoggedMeal | null;
  onSave: (meal: Omit<LoggedMeal, "id" | "date">, mealId?: string) => void;
}

export const ManualAddModal: React.FC<ManualAddModalProps> = ({
  isOpen,
  onClose,
  defaultMealType,
  editingMeal,
  onSave,
}) => {
  const [name, setName] = useState<string>("");
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [quantity, setQuantity] = useState<string>("1");
  const [unitLabel, setUnitLabel] = useState<string>("serving");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");

  useEffect(() => {
    if (editingMeal) {
      setName(editingMeal.name);
      setMealType(editingMeal.meal_type);
      setQuantity(String(editingMeal.quantity));
      setUnitLabel(editingMeal.unit_label);
      setCalories(String(editingMeal.calories));
      setProtein(String(editingMeal.protein));
      setCarbs(String(editingMeal.carbs));
      setFat(String(editingMeal.fat));
    } else {
      setName("");
      setMealType(defaultMealType);
      setQuantity("1");
      setUnitLabel("serving");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
    }
  }, [editingMeal, defaultMealType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        meal_type: mealType,
        name: name.trim(),
        quantity: parseFloat(quantity) || 1,
        unit_label: unitLabel.trim() || "serving",
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        food_id: editingMeal?.food_id || null,
      },
      editingMeal?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-brand-light" />
            <h2 className="text-lg font-bold text-white">
              {editingMeal ? "Edit Logged Meal" : "Custom / Manual Entry"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-card-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-4 space-y-4">
          {/* Meal Category */}
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

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Food / Meal Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scrambled Eggs with Toast"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white placeholder-gray-500 focus:outline-none focus:border-brand"
            />
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Portion Amount
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Unit (e.g. g, serving)
              </label>
              <input
                type="text"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-macro-calories mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                step="1"
                required
                placeholder="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-macro-protein mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-macro-carbs mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-macro-fat mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-lg shadow-brand/30 transition-all mt-4"
          >
            {editingMeal ? "Update Meal" : "Save Entry"}
          </button>
        </form>
      </div>
    </div>
  );
};
