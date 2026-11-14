import React, { useState } from "react";
import { useTracker } from "@/context/TrackerContext";
import { MacroCard } from "../MacroCard";
import { DateNavigator } from "../DateNavigator";
import { GymDayBadge } from "../GymDayBadge";
import { MealSection } from "../MealSection";
import { QuickAddModal } from "../modals/QuickAddModal";
import { ManualAddModal } from "../modals/ManualAddModal";
import { SuggestMealModal } from "../modals/SuggestMealModal";
import { MealType, LoggedMeal } from "@/types";
import { Sparkles, Copy, Zap, Plus, Check } from "lucide-react";

export const DashboardView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    isGymDay,
    toggleGymDay,
    effectiveTargets,
    currentDayTotals,
    remainingTotals,
    currentDayMeals,
    suggestedMeal,
    state,
    addMeal,
    updateMeal,
    deleteMeal,
    copyYesterdayMeals,
  } = useTracker();

  // Modals state
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [manualAddOpen, setManualAddOpen] = useState<boolean>(false);
  const [suggestModalOpen, setSuggestModalOpen] = useState<boolean>(false);
  const [activeMealType, setActiveMealType] = useState<MealType>("Lunch");
  const [editingMeal, setEditingMeal] = useState<LoggedMeal | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleOpenQuickAdd = (type: MealType = "Lunch") => {
    setActiveMealType(type);
    setQuickAddOpen(true);
  };

  const handleOpenManualAdd = (type: MealType = "Lunch") => {
    setActiveMealType(type);
    setEditingMeal(null);
    setManualAddOpen(true);
  };

  const handleEditMeal = (meal: LoggedMeal) => {
    setEditingMeal(meal);
    setActiveMealType(meal.meal_type);
    setManualAddOpen(true);
  };

  const handleCopyYesterday = () => {
    const success = copyYesterdayMeals();
    if (success) {
      setCopyFeedback("✓ Copied all yesterday's meals!");
      setTimeout(() => setCopyFeedback(null), 2500);
    } else {
      setCopyFeedback("No meals logged on yesterday's date.");
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  // Filter meals by section
  const breakfastMeals = currentDayMeals.filter((m) => m.meal_type === "Breakfast");
  const lunchMeals = currentDayMeals.filter((m) => m.meal_type === "Lunch");
  const dinnerMeals = currentDayMeals.filter((m) => m.meal_type === "Dinner");
  const snackMeals = currentDayMeals.filter(
    (m) => m.meal_type === "Snacks/Shakes" || m.meal_type === ("Snacks" as any)
  );

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Top Controls: Date switcher and Gym Day toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        <GymDayBadge
          isGymDay={isGymDay}
          onToggle={toggleGymDay}
        />
      </div>

      {/* Action Buttons Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => handleOpenQuickAdd("Lunch")}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md shadow-brand/20 transition-all"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>⚡ Quick Add</span>
        </button>

        <button
          onClick={() => handleOpenManualAdd("Lunch")}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-card hover:bg-card-secondary border border-border text-gray-200 text-xs font-semibold transition-all"
        >
          <Plus className="w-4 h-4 text-brand-light" />
          <span>Custom Entry</span>
        </button>

        <button
          onClick={handleCopyYesterday}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-card hover:bg-card-secondary border border-border text-gray-200 text-xs font-semibold transition-all"
        >
          <Copy className="w-4 h-4 text-emerald-400" />
          <span>Copy Yesterday</span>
        </button>

        <button
          onClick={() => setSuggestModalOpen(true)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-brand/20 hover:from-amber-500/30 hover:to-brand/30 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>💡 Suggest Meal</span>
        </button>
      </div>

      {/* Copy feedback notification */}
      {copyFeedback && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" /> {copyFeedback}
        </div>
      )}

      {/* 4 Responsive Macro Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MacroCard
          title="Calories"
          current={currentDayTotals.calories}
          target={effectiveTargets.calories}
          unit="kcal"
          colorHex="#F59E0B"
          isCalories={false}
        />
        <MacroCard
          title="Protein"
          current={currentDayTotals.protein}
          target={effectiveTargets.protein}
          unit="g"
          colorHex="#38BDF8"
        />
        <MacroCard
          title="Carbs"
          current={currentDayTotals.carbs}
          target={effectiveTargets.carbs}
          unit="g"
          colorHex="#34D399"
        />
        <MacroCard
          title="Fats"
          current={currentDayTotals.fat}
          target={effectiveTargets.fat}
          unit="g"
          colorHex="#F472B6"
        />
      </div>

      {/* Meal Category Sections */}
      <div className="space-y-3.5">
        <MealSection
          title="Breakfast"
          icon="🍳"
          meals={breakfastMeals}
          onOpenAdd={handleOpenQuickAdd}
          onEditMeal={handleEditMeal}
          onDeleteMeal={deleteMeal}
        />

        <MealSection
          title="Lunch"
          icon="🍗"
          meals={lunchMeals}
          onOpenAdd={handleOpenQuickAdd}
          onEditMeal={handleEditMeal}
          onDeleteMeal={deleteMeal}
        />

        <MealSection
          title="Dinner"
          icon="🍲"
          meals={dinnerMeals}
          onOpenAdd={handleOpenQuickAdd}
          onEditMeal={handleEditMeal}
          onDeleteMeal={deleteMeal}
        />

        <MealSection
          title="Snacks/Shakes"
          icon="🥤"
          meals={snackMeals}
          onOpenAdd={handleOpenQuickAdd}
          onEditMeal={handleEditMeal}
          onDeleteMeal={deleteMeal}
        />
      </div>

      {/* Connected Modals */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        foods={state.foods}
        defaultMealType={activeMealType}
        onAdd={addMeal}
      />

      <ManualAddModal
        isOpen={manualAddOpen}
        onClose={() => setManualAddOpen(false)}
        defaultMealType={activeMealType}
        editingMeal={editingMeal}
        onSave={(meal, mealId) => {
          if (mealId) {
            updateMeal({ ...meal, id: mealId, date: selectedDate });
          } else {
            addMeal(meal);
          }
        }}
      />

      <SuggestMealModal
        isOpen={suggestModalOpen}
        onClose={() => setSuggestModalOpen(false)}
        suggestion={suggestedMeal}
        remainingTotals={remainingTotals}
        onAddMeal={addMeal}
      />
    </div>
  );
};
