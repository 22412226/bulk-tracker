import React, { useState, useMemo } from "react";
import { useTracker } from "@/context/TrackerContext";
import { FoodItem, MealType } from "@/types";
import { FoodEditorModal } from "../modals/FoodEditorModal";
import { BatchRecipeModal } from "../modals/BatchRecipeModal";
import { Search, Plus, ChefHat, Edit2, Trash2, Zap, Bookmark } from "lucide-react";

export const FoodLibraryView: React.FC = () => {
  const { state, addFood, updateFood, deleteFood, addMeal } = useTracker();
  const [search, setSearch] = useState<string>("");
  const [filterStaplesOnly, setFilterStaplesOnly] = useState<boolean>(false);

  // Modals state
  const [foodModalOpen, setFoodModalOpen] = useState<boolean>(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredFoods = useMemo(() => {
    let result = state.foods;
    if (filterStaplesOnly) {
      result = result.filter((f) => f.is_staple);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.serving_desc?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [state.foods, search, filterStaplesOnly]);

  const handleOpenNew = () => {
    setEditingFood(null);
    setFoodModalOpen(true);
  };

  const handleOpenEdit = (food: FoodItem) => {
    setEditingFood(food);
    setFoodModalOpen(true);
  };

  const handleQuickLogToToday = (food: FoodItem) => {
    const defaultQty = food.unit_type === "100g" ? 100 : 1;
    const factor = food.unit_type === "100g" ? defaultQty / 100 : defaultQty;

    addMeal({
      meal_type: "Lunch" as MealType,
      name: food.name,
      quantity: defaultQty,
      unit_label: food.unit_type === "100g" ? "g" : "serving(s)",
      calories: Math.round(food.calories * factor),
      protein: Math.round(food.protein * factor * 10) / 10,
      carbs: Math.round(food.carbs * factor * 10) / 10,
      fat: Math.round(food.fat * factor * 10) / 10,
      food_id: food.id,
    });

    setFeedback(`✓ Logged 1 portion of "${food.name}" to today's Lunch!`);
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            🥑 My Foods & Meals Library
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Pre-calculated staples and bulk batch recipes for instant logging.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBatchModalOpen(true)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm"
          >
            <ChefHat className="w-4 h-4 text-emerald-400" />
            <span>Batch Meal Builder</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md shadow-brand/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Food</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search staples (e.g. rice, plov, chicken)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-card border border-border text-white placeholder-gray-500 focus:outline-none focus:border-brand"
          />
        </div>

        <button
          onClick={() => setFilterStaplesOnly(!filterStaplesOnly)}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
            filterStaplesOnly
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-card border-border text-gray-400 hover:text-white"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Staples Only</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Food Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredFoods.map((food) => (
          <div
            key={food.id}
            className="p-4 rounded-2xl bg-card border border-border hover:border-border-light transition-all flex flex-col justify-between group shadow-lg"
          >
            <div>
              {/* Card Title & Staple badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-brand-light transition-colors">
                    {food.name}
                  </h3>
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    {food.serving_desc || (food.unit_type === "100g" ? "Measured raw/dry" : "Standard portion")}
                  </span>
                </div>

                {food.is_staple && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex-shrink-0">
                    ★ Staple
                  </span>
                )}
              </div>

              {/* Macro Pills Breakdown */}
              <div className="grid grid-cols-4 gap-1.5 my-3 text-center">
                <div className="p-1.5 rounded-lg bg-card-secondary border border-border/50">
                  <span className="text-[10px] text-gray-400 block">Calories</span>
                  <span className="text-xs font-black text-macro-calories">
                    {food.calories}
                  </span>
                  <span className="text-[9px] text-gray-500 block">kcal</span>
                </div>
                <div className="p-1.5 rounded-lg bg-card-secondary border border-border/50">
                  <span className="text-[10px] text-gray-400 block">Protein</span>
                  <span className="text-xs font-black text-macro-protein">
                    {food.protein}g
                  </span>
                  <span className="text-[9px] text-gray-500 block">per {food.unit_type}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-card-secondary border border-border/50">
                  <span className="text-[10px] text-gray-400 block">Carbs</span>
                  <span className="text-xs font-black text-macro-carbs">
                    {food.carbs}g
                  </span>
                  <span className="text-[9px] text-gray-500 block">per {food.unit_type}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-card-secondary border border-border/50">
                  <span className="text-[10px] text-gray-400 block">Fats</span>
                  <span className="text-xs font-black text-macro-fat">
                    {food.fat}g
                  </span>
                  <span className="text-[9px] text-gray-500 block">per {food.unit_type}</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <button
                onClick={() => handleQuickLogToToday(food)}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-brand/20 hover:bg-brand/30 text-brand-light text-xs font-bold transition-colors"
                title="Log 1 portion to today's Lunch"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>+ Log to Today</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(food)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-card-secondary transition-colors"
                  title="Edit food"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteFood(food.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete food"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredFoods.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-card rounded-2xl border border-border p-6">
            <p className="text-sm font-semibold">No foods matching &quot;{search}&quot;</p>
            <p className="text-xs text-gray-400 mt-1">
              Tap &quot;New Food&quot; to create your first custom preset.
            </p>
          </div>
        )}
      </div>

      {/* Connected Modals */}
      <FoodEditorModal
        isOpen={foodModalOpen}
        onClose={() => setFoodModalOpen(false)}
        food={editingFood}
        onSave={(data, id) => {
          if (id) {
            updateFood({ ...data, id });
          } else {
            addFood(data);
          }
        }}
      />

      <BatchRecipeModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        foodLibrary={state.foods}
        onSaveToLibrary={addFood}
      />
    </div>
  );
};
