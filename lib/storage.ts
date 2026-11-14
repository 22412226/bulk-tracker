import { FoodItem, LoggedMeal, UserSettings, WeightEntry, DayMode } from "@/types";
import { DEFAULT_SETTINGS, DEFAULT_STAPLES, INITIAL_LOGGED_MEALS, INITIAL_WEIGHT_HISTORY } from "./seedData";
import { supabase, isSupabaseConfigured } from "./supabase";

const LS_SETTINGS = "bulking_tracker_settings";
const LS_FOODS = "bulking_tracker_foods";
const LS_LOGS = "bulking_tracker_daily_logs";
const LS_WEIGHTS = "bulking_tracker_weights";
const LS_DAY_MODES = "bulking_tracker_day_modes";

export interface AppDataState {
  settings: UserSettings;
  foods: FoodItem[];
  dailyLogs: Record<string, LoggedMeal[]>; // date -> meals
  weights: Record<string, WeightEntry>;   // date -> weight
  dayModes: Record<string, DayMode>;       // date -> day mode
  isCloudSynced: boolean;
}

export function getInitialLocalState(): AppDataState {
  if (typeof window === "undefined") {
    const today = new Date().toISOString().split("T")[0];
    return {
      settings: DEFAULT_SETTINGS,
      foods: DEFAULT_STAPLES,
      dailyLogs: { [today]: INITIAL_LOGGED_MEALS },
      weights: { [today]: INITIAL_WEIGHT_HISTORY[0] },
      dayModes: { [today]: { date: today, is_gym_day: false } },
      isCloudSynced: false,
    };
  }

  try {
    const rawSettings = localStorage.getItem(LS_SETTINGS);
    const rawFoods = localStorage.getItem(LS_FOODS);
    const rawLogs = localStorage.getItem(LS_LOGS);
    const rawWeights = localStorage.getItem(LS_WEIGHTS);
    const rawModes = localStorage.getItem(LS_DAY_MODES);

    const today = new Date().toISOString().split("T")[0];

    const settings: UserSettings = rawSettings
      ? JSON.parse(rawSettings)
      : DEFAULT_SETTINGS;

    const foods: FoodItem[] = rawFoods ? JSON.parse(rawFoods) : DEFAULT_STAPLES;

    const dailyLogs: Record<string, LoggedMeal[]> = rawLogs
      ? JSON.parse(rawLogs)
      : { [today]: INITIAL_LOGGED_MEALS };

    const weights: Record<string, WeightEntry> = rawWeights
      ? JSON.parse(rawWeights)
      : { [today]: INITIAL_WEIGHT_HISTORY[0] };

    const dayModes: Record<string, DayMode> = rawModes
      ? JSON.parse(rawModes)
      : { [today]: { date: today, is_gym_day: false } };

    return {
      settings,
      foods,
      dailyLogs,
      weights,
      dayModes,
      isCloudSynced: isSupabaseConfigured,
    };
  } catch (err) {
    console.error("Error reading localStorage, using defaults", err);
    const today = new Date().toISOString().split("T")[0];
    return {
      settings: DEFAULT_SETTINGS,
      foods: DEFAULT_STAPLES,
      dailyLogs: { [today]: INITIAL_LOGGED_MEALS },
      weights: { [today]: INITIAL_WEIGHT_HISTORY[0] },
      dayModes: { [today]: { date: today, is_gym_day: false } },
      isCloudSynced: false,
    };
  }
}

export function saveStateToLocal(state: AppDataState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(state.settings));
    localStorage.setItem(LS_FOODS, JSON.stringify(state.foods));
    localStorage.setItem(LS_LOGS, JSON.stringify(state.dailyLogs));
    localStorage.setItem(LS_WEIGHTS, JSON.stringify(state.weights));
    localStorage.setItem(LS_DAY_MODES, JSON.stringify(state.dayModes));
  } catch (err) {
    console.error("Error saving to localStorage", err);
  }
}

/**
 * Cloud sync layer with Supabase (if configured)
 */
export async function syncWithSupabase(localState: AppDataState): Promise<AppDataState> {
  if (!isSupabaseConfigured || !supabase) {
    return { ...localState, isCloudSynced: false };
  }

  try {
    // 1. Fetch cloud settings
    const { data: cloudSettings, error: sErr } = await supabase
      .from("user_settings")
      .select("*")
      .eq("id", "default_user")
      .single();

    let mergedSettings = localState.settings;
    if (!sErr && cloudSettings) {
      mergedSettings = {
        ...localState.settings,
        weight_kg: Number(cloudSettings.weight_kg),
        goal_weight_kg: Number(cloudSettings.goal_weight_kg),
        height_cm: Number(cloudSettings.height_cm),
        age: Number(cloudSettings.age),
        gender: cloudSettings.gender as "Male" | "Female",
        activity_level: cloudSettings.activity_level,
        surplus_kcal: Number(cloudSettings.surplus_kcal),
        use_manual_targets: Boolean(cloudSettings.use_manual_targets),
        target_calories: Number(cloudSettings.target_calories),
        target_protein: Number(cloudSettings.target_protein),
        target_carbs: Number(cloudSettings.target_carbs),
        target_fat: Number(cloudSettings.target_fat),
        baseline_weight_kg: Number(cloudSettings.baseline_weight_kg || localState.settings.weight_kg),
        last_notified_weight_increase: Number(cloudSettings.last_notified_weight_increase || localState.settings.weight_kg),
      };
    } else {
      // Upsert local settings to cloud
      await supabase.from("user_settings").upsert({
        id: "default_user",
        ...localState.settings,
      });
    }

    // 2. Fetch food library
    const { data: cloudFoods } = await supabase.from("food_library").select("*");
    let mergedFoods = localState.foods;
    if (cloudFoods && cloudFoods.length > 0) {
      mergedFoods = cloudFoods.map((f) => ({
        id: f.id,
        name: f.name,
        unit_type: f.unit_type,
        calories: Number(f.calories),
        protein: Number(f.protein),
        carbs: Number(f.carbs),
        fat: Number(f.fat),
        serving_desc: f.serving_desc || "",
        is_staple: Boolean(f.is_staple),
      }));
    } else {
      // Push initial foods to cloud
      for (const food of localState.foods) {
        await supabase.from("food_library").upsert(food);
      }
    }

    // 3. Fetch daily logs
    const { data: cloudLogs } = await supabase.from("daily_logs").select("*");
    const mergedDailyLogs: Record<string, LoggedMeal[]> = { ...localState.dailyLogs };
    if (cloudLogs) {
      for (const row of cloudLogs) {
        const item: LoggedMeal = {
          id: row.id,
          date: row.date,
          meal_type: row.meal_type,
          name: row.name,
          quantity: Number(row.quantity),
          unit_label: row.unit_label,
          calories: Number(row.calories),
          protein: Number(row.protein),
          carbs: Number(row.carbs),
          fat: Number(row.fat),
          food_id: row.food_id,
        };
        if (!mergedDailyLogs[row.date]) mergedDailyLogs[row.date] = [];
        if (!mergedDailyLogs[row.date].some((m) => m.id === item.id)) {
          mergedDailyLogs[row.date].push(item);
        }
      }
    }

    // 4. Fetch weight history
    const { data: cloudWeights } = await supabase.from("weight_history").select("*");
    const mergedWeights: Record<string, WeightEntry> = { ...localState.weights };
    if (cloudWeights) {
      for (const w of cloudWeights) {
        mergedWeights[w.date] = {
          date: w.date,
          weight_kg: Number(w.weight_kg),
          note: w.note || "",
        };
      }
    }

    // 5. Fetch day modes
    const { data: cloudDayModes } = await supabase.from("day_modes").select("*");
    const mergedDayModes: Record<string, DayMode> = { ...localState.dayModes };
    if (cloudDayModes) {
      for (const dm of cloudDayModes) {
        mergedDayModes[dm.date] = {
          date: dm.date,
          is_gym_day: Boolean(dm.is_gym_day),
          notes: dm.notes || "",
        };
      }
    }

    const finalState: AppDataState = {
      settings: mergedSettings,
      foods: mergedFoods,
      dailyLogs: mergedDailyLogs,
      weights: mergedWeights,
      dayModes: mergedDayModes,
      isCloudSynced: true,
    };

    saveStateToLocal(finalState);
    return finalState;
  } catch (err) {
    console.error("Supabase sync failed, using local storage", err);
    return { ...localState, isCloudSynced: false };
  }
}

/**
 * Full JSON export of user data
 */
export function exportDataAsJSON(state: AppDataState): void {
  const exportPayload = {
    version: "2.0-pwa",
    exported_at: new Date().toISOString(),
    settings: state.settings,
    food_library: state.foods,
    daily_logs: state.dailyLogs,
    weight_history: state.weights,
    day_modes: state.dayModes,
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bulking_tracker_backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
