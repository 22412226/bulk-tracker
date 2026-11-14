import React, { useState } from "react";
import { FoodItem, BatchIngredient } from "@/types";
import { X, ChefHat, Plus, Trash2, Layers } from "lucide-react";

interface BatchRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodLibrary: FoodItem[];
  onSaveToLibrary: (food: Omit<FoodItem, "id">) => void;
}

export const BatchRecipeModal: React.FC<BatchRecipeModalProps> = ({
  isOpen,
  onClose,
  foodLibrary,
  onSaveToLibrary,
}) => {
  const [recipeName, setRecipeName] = useState<string>("Buckwheat Plov with But Şiş");
  const [containers, setContainers] = useState<string>("4");
  const [ingredients, setIngredients] = useState<BatchIngredient[]>([
    {
      id: "ing-1",
      name: "Basmati Rice (dry weight)",
      amount: 400,
      unit_label: "g",
      calories: 1468,
      protein: 26.8,
      carbs: 320,
      fat: 2.8,
    },
    {
      id: "ing-2",
      name: "Chicken Thighs / But Şiş (raw)",
      amount: 600,
      unit_label: "g",
      calories: 1200,
      protein: 102,
      carbs: 0,
      fat: 90,
    },
  ]);

  // Selected food for adding new ingredient
  const [selectedFoodId, setSelectedFoodId] = useState<string>(foodLibrary[0]?.id || "");
  const [newAmount, setNewAmount] = useState<string>("100");

  if (!isOpen) return null;

  const numContainers = Math.max(1, parseInt(containers) || 1);

  // Compute batch totals
  const batchCals = Math.round(ingredients.reduce((sum, i) => sum + i.calories, 0));
  const batchP = Math.round(ingredients.reduce((sum, i) => sum + i.protein, 0) * 10) / 10;
  const batchC = Math.round(ingredients.reduce((sum, i) => sum + i.carbs, 0) * 10) / 10;
  const batchF = Math.round(ingredients.reduce((sum, i) => sum + i.fat, 0) * 10) / 10;

  // Compute per container / portion totals
  const portionCals = Math.round(batchCals / numContainers);
  const portionP = Math.round((batchP / numContainers) * 10) / 10;
  const portionC = Math.round((batchC / numContainers) * 10) / 10;
  const portionF = Math.round((batchF / numContainers) * 10) / 10;

  const handleAddIngredient = () => {
    const food = foodLibrary.find((f) => f.id === selectedFoodId);
    if (!food) return;

    const amt = parseFloat(newAmount) || 0;
    if (amt <= 0) return;

    const factor = food.unit_type === "100g" ? amt / 100 : amt;
    const cals = Math.round(food.calories * factor);
    const p = Math.round(food.protein * factor * 10) / 10;
    const c = Math.round(food.carbs * factor * 10) / 10;
    const f = Math.round(food.fat * factor * 10) / 10;

    const newIng: BatchIngredient = {
      id: "ing-" + Math.random().toString(36).substring(2, 7),
      name: food.name,
      amount: amt,
      unit_label: food.unit_type === "100g" ? "g" : "serv",
      calories: cals,
      protein: p,
      carbs: c,
      fat: f,
    };

    setIngredients([...ingredients, newIng]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  const handleSaveRecipe = () => {
    if (!recipeName.trim() || ingredients.length === 0) return;

    onSaveToLibrary({
      name: `${recipeName.trim()} (1 of ${numContainers} portions)`,
      unit_type: "serving",
      calories: portionCals,
      protein: portionP,
      carbs: portionC,
      fat: portionF,
      serving_desc: `1 meal container (${numContainers} containers per batch)`,
      is_staple: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Batch Recipe & Prep Builder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-card-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
          {/* Recipe Name & Container Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Recipe Title
              </label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="e.g. Buckwheat Plov with But Şiş"
                className="w-full px-3 py-2 text-sm rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Containers / Servings
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={containers}
                onChange={(e) => setContainers(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold text-center rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Add Ingredient Section */}
          <div className="p-3.5 rounded-xl bg-[#0e1320] border border-border/80">
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Add Ingredient from Library:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-card border border-border text-white focus:outline-none focus:border-brand"
              >
                {foodLibrary.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name} ({food.calories} kcal / {food.unit_type})
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-24 px-3 py-2 text-xs rounded-xl bg-card border border-border text-white text-center focus:outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Current Ingredients List */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Batch Ingredients ({ingredients.length})
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {ingredients.map((ing) => (
                <div
                  key={ing.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-card-secondary border border-border/60 text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-white">{ing.name}</span>
                    <span className="text-gray-400 block text-[11px]">
                      {ing.amount} {ing.unit_label} • {ing.calories} kcal • {ing.protein}g P
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveIngredient(ing.id)}
                    className="p-1 text-gray-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Calculated Comparison Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Total Batch */}
            <div className="p-3 rounded-xl bg-card-secondary border border-border text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Cooked Batch
              </span>
              <div className="text-base font-extrabold text-white mt-0.5">
                {batchCals} kcal
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {batchP}g P • {batchC}g C • {batchF}g F
              </div>
            </div>

            {/* Per Container (What you eat!) */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                <Layers className="w-3 h-3" /> Per 1 Container ({numContainers} total)
              </span>
              <div className="text-base font-extrabold text-emerald-300 mt-0.5">
                {portionCals} kcal
              </div>
              <div className="text-[11px] text-emerald-400/90 mt-0.5">
                {portionP}g P • {portionC}g C • {portionF}g F
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSaveRecipe}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <span>Save Recipe to Library as 1-Portion Food</span>
          </button>
        </div>
      </div>
    </div>
  );
};
