import React, { useState, useMemo } from "react";
import { useTracker } from "@/context/TrackerContext";
import { UserSettings } from "@/types";
import { calculateBMR, calculateTDEE } from "@/lib/calculations";
import { Scale, Flame, Activity, Check, TrendingUp, Sparkles } from "lucide-react";

export const GoalsWeightView: React.FC = () => {
  const { state, logWeight, updateSettings } = useTracker();
  const settings = state.settings;

  // Weight form state
  const [morningWeight, setMorningWeight] = useState<string>("");
  const [weightNote, setWeightNote] = useState<string>("");
  const [weightFeedback, setWeightFeedback] = useState<string | null>(null);

  // Settings form state
  const [useManual, setUseManual] = useState<boolean>(settings.use_manual_targets);
  const [targetCals, setTargetCals] = useState<string>(String(settings.target_calories));
  const [targetProtein, setTargetProtein] = useState<string>(String(settings.target_protein));
  const [targetCarbs, setTargetCarbs] = useState<string>(String(settings.target_carbs));
  const [targetFat, setTargetFat] = useState<string>(String(settings.target_fat));

  // Profile stats
  const [height, setHeight] = useState<string>(String(settings.height_cm));
  const [age, setAge] = useState<string>(String(settings.age));
  const [goalWeight, setGoalWeight] = useState<string>(String(settings.goal_weight_kg));
  const [activity, setActivity] = useState<string>(settings.activity_level);
  const [surplus, setSurplus] = useState<number>(settings.surplus_kcal);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  const bmr = useMemo(() => calculateBMR(settings), [settings]);
  const tdee = useMemo(() => calculateTDEE(settings), [settings]);

  // Handle logging morning weight
  const handleLogWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const wt = parseFloat(morningWeight);
    if (!wt || wt < 30 || wt > 250) {
      setWeightFeedback("Please enter a valid weight (e.g. 63.5)");
      return;
    }

    logWeight(wt, weightNote.trim());
    setMorningWeight("");
    setWeightNote("");
    setWeightFeedback(`✓ Recorded morning scale: ${wt.toFixed(1)} kg!`);
    setTimeout(() => setWeightFeedback(null), 3000);
  };

  // Handle saving nutrition settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newSettings: UserSettings = {
        ...settings,
        height_cm: parseFloat(height) || 180,
        age: parseInt(age) || 21,
        goal_weight_kg: parseFloat(goalWeight) || 70,
        activity_level: activity,
        surplus_kcal: surplus,
        use_manual_targets: useManual,
        target_calories: parseFloat(targetCals) || 2900,
        target_protein: parseFloat(targetProtein) || 120,
        target_carbs: parseFloat(targetCarbs) || 380,
        target_fat: parseFloat(targetFat) || 80,
      };

      updateSettings(newSettings);
      setSettingsFeedback("✓ Successfully saved targets and profile!");
      setTimeout(() => setSettingsFeedback(null), 3000);
    } catch {
      setSettingsFeedback("Please ensure numeric values are valid.");
    }
  };

  // Weight history list (sorted by date)
  const sortedWeights = useMemo(() => {
    return Object.values(state.weights).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [state.weights]);

  // Transformation Progress calculation
  const baseline = 55.0; // visual starting reference
  const totalNeeded = Math.max(0.1, settings.goal_weight_kg - baseline);
  const currentProgress = Math.max(
    0,
    Math.min(100, Math.round(((settings.weight_kg - baseline) / totalNeeded) * 100))
  );
  const remainingKg = Math.max(0, settings.goal_weight_kg - settings.weight_kg);

  // SVG Chart points
  const chartData = useMemo(() => {
    if (sortedWeights.length < 2) return null;
    const weights = sortedWeights.map((w) => w.weight_kg);
    const minW = Math.min(...weights) - 0.5;
    const maxW = Math.max(...weights, settings.goal_weight_kg) + 0.5;
    const range = maxW - minW || 1;

    const width = 300;
    const height = 100;
    const step = width / (sortedWeights.length - 1);

    const points = sortedWeights
      .map((w, idx) => {
        const x = idx * step;
        const y = height - ((w.weight_kg - minW) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return { points, minW, maxW };
  }, [sortedWeights, settings.goal_weight_kg]);

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          🎯 Lean Bulking Goals & Weight Tracker
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Mifflin-St Jeor metabolic calculator, target macros, and scale weight progression.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Weight Tracker & Transformation Progress   */}
        {/* ======================================================== */}
        <div className="space-y-4">
          {/* Visual Transformation Card */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-400" /> Transformation Goal
              </span>
              <span className="text-xs font-bold text-emerald-400">{currentProgress}%</span>
            </div>

            <div className="flex items-baseline justify-between my-2">
              <div>
                <span className="text-2xl font-black text-white">
                  {settings.weight_kg.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400 ml-1">kg current</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-emerald-400">
                  {settings.goal_weight_kg.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400 ml-1">kg target</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#1e2638] h-3 rounded-full overflow-hidden relative my-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all duration-500"
                style={{ width: `${currentProgress}%` }}
              />
            </div>

            <div className="text-xs text-gray-400 flex items-center justify-between mt-1">
              <span>{remainingKg > 0 ? `+${remainingKg.toFixed(1)} kg remaining to goal` : "🎉 Goal Weight Reached!"}</span>
              <span className="text-emerald-400 font-semibold">Lean Muscle Bulk</span>
            </div>

            {/* SVG Trend Sparkline */}
            {chartData && (
              <div className="mt-4 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Weight Trend Line
                  </span>
                  <span>{sortedWeights.length} weigh-ins</span>
                </div>
                <div className="h-20 w-full overflow-hidden relative bg-[#0e1320] rounded-xl p-2 flex items-center">
                  <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={chartData.points}
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Morning Weigh-in Form */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-lg">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-brand-light" /> Log Morning Scale Weight
            </h3>

            <form onSubmit={handleLogWeight} className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="250"
                    required
                    placeholder="e.g. 63.5"
                    value={morningWeight}
                    onChange={(e) => setMorningWeight(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">
                    kg
                  </span>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md shadow-brand/20"
                >
                  Record
                </button>
              </div>

              {weightFeedback && (
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold animate-in fade-in">
                  {weightFeedback}
                </div>
              )}
            </form>

            {/* Recent Weigh-in History List */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <span className="text-xs font-semibold text-gray-400 block mb-2">
                Recent Weigh-in Logs
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {sortedWeights.slice(-6).reverse().map((entry) => (
                  <div
                    key={entry.date}
                    className="flex items-center justify-between p-2 rounded-lg bg-card-secondary border border-border/50 text-xs"
                  >
                    <span className="font-medium text-gray-300">📅 {entry.date}</span>
                    <span className="font-extrabold text-emerald-400">
                      {entry.weight_kg.toFixed(1)} kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Lean Bulking Targets & MSJ Calculator      */}
        {/* ======================================================== */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/80">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" /> Nutrition Targets & Calculator
            </h3>
            <span className="text-xs font-bold text-brand-light flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> MSJ Lean Bulking
            </span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Mode Segmented Toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Target Calculation Mode
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-card-secondary border border-border">
                <button
                  type="button"
                  onClick={() => setUseManual(true)}
                  className={`py-2 px-2 text-xs font-bold rounded-lg transition-colors ${
                    useManual
                      ? "bg-brand text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Manual Fixed Targets
                </button>
                <button
                  type="button"
                  onClick={() => setUseManual(false)}
                  className={`py-2 px-2 text-xs font-bold rounded-lg transition-colors ${
                    !useManual
                      ? "bg-brand text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Mifflin-St Jeor Auto
                </button>
              </div>
            </div>

            {/* Target Macros Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-macro-calories mb-1">
                  Daily Cals
                </label>
                <input
                  type="number"
                  disabled={!useManual}
                  value={targetCals}
                  onChange={(e) => setTargetCals(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-bold rounded-xl bg-card-secondary border border-border text-white disabled:opacity-60 focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-macro-protein mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  disabled={!useManual}
                  value={targetProtein}
                  onChange={(e) => setTargetProtein(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-bold rounded-xl bg-card-secondary border border-border text-white disabled:opacity-60 focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-macro-carbs mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  disabled={!useManual}
                  value={targetCarbs}
                  onChange={(e) => setTargetCarbs(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-bold rounded-xl bg-card-secondary border border-border text-white disabled:opacity-60 focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-macro-fat mb-1">
                  Fats (g)
                </label>
                <input
                  type="number"
                  disabled={!useManual}
                  value={targetFat}
                  onChange={(e) => setTargetFat(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-bold rounded-xl bg-card-secondary border border-border text-white disabled:opacity-60 focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Body Stats & Profile */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Goal Wt (kg)
                </label>
                <input
                  type="number"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Activity Multiplier
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-card-secondary border border-border text-white focus:outline-none focus:border-brand"
              >
                <option value="Sedentary (desk job, little exercise)">
                  Sedentary (1.2x)
                </option>
                <option value="Light (1-3x/week light exercise)">
                  Light 1-3x/week (1.375x)
                </option>
                <option value="Moderate (4x/week strength training)">
                  Moderate 4x/week lifting (1.55x)
                </option>
                <option value="Heavy (6-7x/week intense training)">
                  Heavy 6-7x/week lifting (1.725x)
                </option>
                <option value="Athlete (2x/day intense training)">
                  Athlete 2x/day (1.9x)
                </option>
              </select>
            </div>

            {/* Calorie Surplus Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Lean Bulking Surplus (+kcal/day)
                </label>
                <span className="text-xs font-black text-amber-400">
                  +{surplus} kcal
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="600"
                step="50"
                value={surplus}
                onChange={(e) => setSurplus(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                <span>+200 (Micro-bulk)</span>
                <span>+350 (Recommended)</span>
                <span>+600 (Aggressive)</span>
              </div>
            </div>

            {/* Live Readouts */}
            <div className="p-3 rounded-xl bg-[#0e1320] border border-border/80 flex items-center justify-around text-center text-xs">
              <div>
                <span className="text-[10px] text-gray-400 block">Calculated BMR</span>
                <span className="font-bold text-white">{Math.round(bmr)} kcal</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <span className="text-[10px] text-gray-400 block">Maintenance TDEE</span>
                <span className="font-bold text-sky-400">{Math.round(tdee)} kcal</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <span className="text-[10px] text-gray-400 block">Bulking Target</span>
                <span className="font-bold text-amber-400">
                  {Math.round(tdee + surplus)} kcal
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-lg shadow-brand/30 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Settings & Goals</span>
            </button>

            {settingsFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-semibold text-center animate-in fade-in">
                {settingsFeedback}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
