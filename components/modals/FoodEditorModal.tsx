import React, { useState, useEffect } from "react";
import { FoodItem, UnitType } from "@/types";
import { X, Apple } from "lucide-react";

interface FoodEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  food?: FoodItem | null;
  onSave: (food: Omit<FoodItem, "id">, existingId?: string) => void;
}

export const FoodEditorModal: React.FC<FoodEditorModalProps> = ({
  isOpen,
  onClose,
  food,
  onSave,
}) => {
  const [name, setName] = useState<string>("");
  const [unitType, setUnitType] = useState<UnitType>("100g");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [servingDesc, setServingDesc] = useState<string>("");
  const [isStaple, setIsStaple] = useState<boolean>(true);

  useEffect(() => {
    if (food) {
      setName(food.name);
      setUnitType(food.unit_type);
      setCalories(String(food.calories));
      setProtein(String(food.protein));
      setCarbs(String(food.carbs));
      setFat(String(food.fat));
      setServingDesc(food.serving_desc || "");
      setIsStaple(Boolean(food.is_staple));
    } else {
      setName("");
      setUnitType("100g");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setServingDesc("");
      setIsStaple(true);
    }
  }, [food, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        name: name.trim(),
        unit_type: unitType,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        serving_desc: servingDesc.trim(),
        is_staple: isStaple,
      },
      food?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              {food ? "Edit Saved Food" : "Add Food to Library"}
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
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Food / Staple Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Basmati Rice (dry weight)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
            />
          </div>

          {/* Unit Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Measurement Base
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUnitType("100g")}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-colors ${
                  unitType === "100g"
                    ? "bg-brand text-white border-brand"
                    : "bg-card-secondary border-border text-gray-400"
                }`}
              >
                Per 100 grams
              </button>
              <button
                type="button"
                onClick={() => setUnitType("serving")}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-colors ${
                  unitType === "serving"
                    ? "bg-brand text-white border-brand"
                    : "bg-card-secondary border-border text-gray-400"
                }`}
              >
                Per 1 Serving / Portion
              </button>
            </div>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-macro-calories mb-1">
                Calories
              </label>
              <input
                type="number"
                step="0.5"
                required
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
                required
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
                required
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
                required
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Portion Note / Serving Description
            </label>
            <input
              type="text"
              placeholder="e.g. Raw uncooked rice / 1 full meal container"
              value={servingDesc}
              onChange={(e) => setServingDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
            />
          </div>

          {/* Staple checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isStapleCheck"
              checked={isStaple}
              onChange={(e) => setIsStaple(e.target.checked)}
              className="rounded bg-card-secondary border-border text-brand focus:ring-brand"
            />
            <label htmlFor="isStapleCheck" className="text-xs text-gray-300 font-medium">
              Pin to Quick Add Staples (Always visible on Dashboard)
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-lg shadow-brand/30 transition-all mt-4"
          >
            {food ? "Update Food" : "Save to Food Library"}
          </button>
        </form>
      </div>
    </div>
  );
};
