"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { FoodItem, LoggedMeal, UserSettings, WeightEntry, DayMode, MacroTotals, MealType } from "@/types";
import { AppDataState, getInitialLocalState, saveStateToLocal, syncWithSupabase, exportDataAsJSON } from "@/lib/storage";
import { getEffectiveTargets, suggestMealToCloseDay, MealSuggestion } from "@/lib/calculations";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface CalorieAdjustmentPrompt {
  show: boolean;
  currentWeight: number;
  weightGained: number;
}

interface TrackerContextType {
  activeTab: "dashboard" | "library" | "goals";
  setActiveTab: (tab: "dashboard" | "library" | "goals") => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  state: AppDataState;
  isGymDay: boolean;
  effectiveTargets: MacroTotals;
  currentDayMeals: LoggedMeal[];
  currentDayTotals: MacroTotals;
  remainingTotals: MacroTotals;
  suggestedMeal: MealSuggestion | null;
  calorieAdjustmentPrompt: CalorieAdjustmentPrompt | null;
  dismissCaloriePrompt: () => void;
  applyCalorieIncrease: () => void;
  
  // Actions
  toggleGymDay: () => void;
  addMeal: (meal: Omit<LoggedMeal, "id" | "date">) => void;
  updateMeal: (meal: LoggedMeal) => void;
  deleteMeal: (mealId: string) => void;
  copyYesterdayMeals: () => boolean;
  addFood: (food: Omit<FoodItem, "id">) => void;
  updateFood: (food: FoodItem) => void;
  deleteFood: (foodId: string) => void;
  logWeight: (weight_kg: number, note?: string) => void;
  updateSettings: (settings: UserSettings) => void;
  exportJSON: () => void;
  importJSON: (jsonStr: string) => boolean;
  refreshCloudSync: () => Promise<void>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "library" | "goals">("dashboard");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [state, setState] = useState<AppDataState>(getInitialLocalState);
  const [calorieAdjustmentPrompt, setCalorieAdjustmentPrompt] = useState<CalorieAdjustmentPrompt | null>(null);

  // Sync with cloud on initial mount
  useEffect(() => {
    async function initSync() {
      if (isSupabaseConfigured) {
        const cloudState = await syncWithSupabase(state);
        setState(cloudState);
      }
    }
    initSync();
  }, []);

  // Persist to local storage whenever state changes
  useEffect(() => {
    saveStateToLocal(state);
  }, [state]);

  const isGymDay = Boolean(state.dayModes[selectedDate]?.is_gym_day);
  const effectiveTargets = getEffectiveTargets(state.settings, isGymDay);

  const currentDayMeals = state.dailyLogs[selectedDate] || [];

  const currentDayTotals: MacroTotals = currentDayMeals.reduce(
    (acc, m) => ({
      calories: Math.round(acc.calories + m.calories),
      protein: Math.round((acc.protein + m.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + m.carbs) * 10) / 10,
      fat: Math.round((acc.fat + m.fat) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remainingTotals: MacroTotals = {
    calories: Math.max(0, effectiveTargets.calories - currentDayTotals.calories),
    protein: Math.max(0, Math.round((effectiveTargets.protein - currentDayTotals.protein) * 10) / 10),
    carbs: Math.max(0, Math.round((effectiveTargets.carbs - currentDayTotals.carbs) * 10) / 10),
    fat: Math.max(0, Math.round((effectiveTargets.fat - currentDayTotals.fat) * 10) / 10),
  };

  const suggestedMeal = suggestMealToCloseDay(remainingTotals, state.foods);

  const toggleGymDay = useCallback(() => {
    setState((prev) => {
      const current = prev.dayModes[selectedDate]?.is_gym_day || false;
      const updatedModes = {
        ...prev.dayModes,
        [selectedDate]: {
          date: selectedDate,
          is_gym_day: !current,
        },
      };

      if (isSupabaseConfigured && supabase) {
        supabase
          .from("day_modes")
          .upsert({ date: selectedDate, is_gym_day: !current })
          .then();
      }

      return { ...prev, dayModes: updatedModes };
    });
  }, [selectedDate]);

  const addMeal = useCallback(
    (meal: Omit<LoggedMeal, "id" | "date">) => {
      const newMeal: LoggedMeal = {
        ...meal,
        id: Math.random().toString(36).substring(2, 10),
        date: selectedDate,
      };

      setState((prev) => {
        const dayMeals = prev.dailyLogs[selectedDate] || [];
        const updatedDailyLogs = {
          ...prev.dailyLogs,
          [selectedDate]: [...dayMeals, newMeal],
        };

        if (isSupabaseConfigured && supabase) {
          supabase.from("daily_logs").insert(newMeal).then();
        }

        return { ...prev, dailyLogs: updatedDailyLogs };
      });
    },
    [selectedDate]
  );

  const updateMeal = useCallback(
    (meal: LoggedMeal) => {
      setState((prev) => {
        const dayMeals = prev.dailyLogs[meal.date] || [];
        const updated = dayMeals.map((m) => (m.id === meal.id ? meal : m));
        const updatedDailyLogs = { ...prev.dailyLogs, [meal.date]: updated };

        if (isSupabaseConfigured && supabase) {
          supabase.from("daily_logs").update(meal).eq("id", meal.id).then();
        }

        return { ...prev, dailyLogs: updatedDailyLogs };
      });
    },
    []
  );

  const deleteMeal = useCallback(
    (mealId: string) => {
      setState((prev) => {
        const dayMeals = prev.dailyLogs[selectedDate] || [];
        const updated = dayMeals.filter((m) => m.id !== mealId);
        const updatedDailyLogs = { ...prev.dailyLogs, [selectedDate]: updated };

        if (isSupabaseConfigured && supabase) {
          supabase.from("daily_logs").delete().eq("id", mealId).then();
        }

        return { ...prev, dailyLogs: updatedDailyLogs };
      });
    },
    [selectedDate]
  );

  const copyYesterdayMeals = useCallback((): boolean => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() - 1);
    const yesterdayStr = cur.toISOString().split("T")[0];

    const yesterdayMeals = state.dailyLogs[yesterdayStr];
    if (!yesterdayMeals || yesterdayMeals.length === 0) {
      return false;
    }

    const copiedMeals: LoggedMeal[] = yesterdayMeals.map((m) => ({
      ...m,
      id: Math.random().toString(36).substring(2, 10),
      date: selectedDate,
    }));

    setState((prev) => {
      const currentMeals = prev.dailyLogs[selectedDate] || [];
      const updated = {
        ...prev.dailyLogs,
        [selectedDate]: [...currentMeals, ...copiedMeals],
      };

      if (isSupabaseConfigured && supabase) {
        supabase.from("daily_logs").insert(copiedMeals).then();
      }

      return { ...prev, dailyLogs: updated };
    });

    return true;
  }, [selectedDate, state.dailyLogs]);

  const addFood = useCallback((food: Omit<FoodItem, "id">) => {
    const newFood: FoodItem = {
      ...food,
      id: "food-" + Math.random().toString(36).substring(2, 10),
    };

    setState((prev) => {
      const updatedFoods = [newFood, ...prev.foods];

      if (isSupabaseConfigured && supabase) {
        supabase.from("food_library").insert(newFood).then();
      }

      return { ...prev, foods: updatedFoods };
    });
  }, []);

  const updateFood = useCallback((food: FoodItem) => {
    setState((prev) => {
      const updatedFoods = prev.foods.map((f) => (f.id === food.id ? food : f));

      if (isSupabaseConfigured && supabase) {
        supabase.from("food_library").update(food).eq("id", food.id).then();
      }

      return { ...prev, foods: updatedFoods };
    });
  }, []);

  const deleteFood = useCallback((foodId: string) => {
    setState((prev) => {
      const updatedFoods = prev.foods.filter((f) => f.id !== foodId);

      if (isSupabaseConfigured && supabase) {
        supabase.from("food_library").delete().eq("id", foodId).then();
      }

      return { ...prev, foods: updatedFoods };
    });
  }, []);

  const logWeight = useCallback((weight_kg: number, note: string = "") => {
    setState((prev) => {
      const entry: WeightEntry = {
        date: selectedDate,
        weight_kg: Math.round(weight_kg * 100) / 100,
        note,
      };

      const updatedWeights = {
        ...prev.weights,
        [selectedDate]: entry,
      };

      const baseline = prev.settings.last_notified_weight_increase ?? prev.settings.baseline_weight_kg ?? prev.settings.weight_kg;
      const weightGain = weight_kg - baseline;

      // Check for +1.5kg lean bulking surplus prompt
      if (weightGain >= 1.5) {
        setCalorieAdjustmentPrompt({
          show: true,
          currentWeight: weight_kg,
          weightGained: Math.round(weightGain * 10) / 10,
        });
      }

      const updatedSettings: UserSettings = {
        ...prev.settings,
        weight_kg,
      };

      if (isSupabaseConfigured && supabase) {
        supabase.from("weight_history").upsert(entry).then();
        supabase.from("user_settings").upsert({ id: "default_user", ...updatedSettings }).then();
      }

      return {
        ...prev,
        weights: updatedWeights,
        settings: updatedSettings,
      };
    });
  }, [selectedDate]);

  const dismissCaloriePrompt = useCallback(() => {
    setCalorieAdjustmentPrompt(null);
  }, []);

  const applyCalorieIncrease = useCallback(() => {
    if (!calorieAdjustmentPrompt) return;
    const currentWeight = calorieAdjustmentPrompt.currentWeight;

    setState((prev) => {
      const newTargetCals = prev.settings.target_calories + 150;
      const newSurplus = prev.settings.surplus_kcal + 150;
      // recalculate carbs +37.5g to match 150 kcal
      const newCarbs = prev.settings.target_carbs + 37.5;

      const updatedSettings: UserSettings = {
        ...prev.settings,
        target_calories: Math.round(newTargetCals),
        surplus_kcal: newSurplus,
        target_carbs: Math.round(newCarbs),
        last_notified_weight_increase: currentWeight,
      };

      if (isSupabaseConfigured && supabase) {
        supabase.from("user_settings").upsert({ id: "default_user", ...updatedSettings }).then();
      }

      return { ...prev, settings: updatedSettings };
    });

    setCalorieAdjustmentPrompt(null);
  }, [calorieAdjustmentPrompt]);

  const updateSettings = useCallback((newSettings: UserSettings) => {
    setState((prev) => {
      if (isSupabaseConfigured && supabase) {
        supabase.from("user_settings").upsert({ id: "default_user", ...newSettings }).then();
      }
      return { ...prev, settings: newSettings };
    });
  }, []);

  const exportJSON = useCallback(() => {
    exportDataAsJSON(state);
  }, [state]);

  const importJSON = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.settings || !parsed.food_library) {
        return false;
      }

      const importedState: AppDataState = {
        settings: parsed.settings,
        foods: parsed.food_library,
        dailyLogs: parsed.daily_logs || {},
        weights: parsed.weight_history || {},
        dayModes: parsed.day_modes || {},
        isCloudSynced: state.isCloudSynced,
      };

      setState(importedState);
      saveStateToLocal(importedState);
      return true;
    } catch (err) {
      console.error("Failed to parse imported JSON", err);
      return false;
    }
  }, [state.isCloudSynced]);

  const refreshCloudSync = useCallback(async () => {
    const updated = await syncWithSupabase(state);
    setState(updated);
  }, [state]);

  return (
    <TrackerContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        state,
        isGymDay,
        effectiveTargets,
        currentDayMeals,
        currentDayTotals,
        remainingTotals,
        suggestedMeal,
        calorieAdjustmentPrompt,
        dismissCaloriePrompt,
        applyCalorieIncrease,
        toggleGymDay,
        addMeal,
        updateMeal,
        deleteMeal,
        copyYesterdayMeals,
        addFood,
        updateFood,
        deleteFood,
        logWeight,
        updateSettings,
        exportJSON,
        importJSON,
        refreshCloudSync,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error("useTracker must be used within a TrackerProvider");
  }
  return context;
}
