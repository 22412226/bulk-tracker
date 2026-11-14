import React from "react";
import { TrendingUp, Sparkles, X, Check } from "lucide-react";

interface CalorieSurplusPromptModalProps {
  isOpen: boolean;
  currentWeight: number;
  weightGained: number;
  onApply: () => void;
  onDismiss: () => void;
}

export const CalorieSurplusPromptModal: React.FC<CalorieSurplusPromptModalProps> = ({
  isOpen,
  currentWeight,
  weightGained,
  onApply,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1a233a] to-card border border-amber-500/40 p-6 shadow-2xl text-center">
        {/* Close */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Glow Badge */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-4">
          <TrendingUp className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Milestone: +{weightGained} kg Gained
        </div>

        <h2 className="text-xl font-black text-white">
          Increase Bulking Calories by +150 kcal?
        </h2>

        <p className="text-sm text-gray-300 mt-2.5 leading-relaxed">
          Great work! Your morning weight has reached <span className="font-bold text-white">{currentWeight} kg</span>.
          As your muscle mass increases, your metabolic burn (TDEE) also rises.
        </p>

        <div className="p-3.5 rounded-2xl bg-card-secondary border border-border/80 my-4 text-xs text-left space-y-1.5">
          <div className="flex justify-between text-gray-300">
            <span>Proposed Calorie Adjustment:</span>
            <span className="font-bold text-amber-400">+150 kcal/day</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Carbohydrates Boost:</span>
            <span className="font-bold text-emerald-400">+37.5g carbs/day</span>
          </div>
          <p className="text-[11px] text-gray-400 pt-1 border-t border-border/60">
            Prevents weight gain plateaus while keeping body fat gain minimal.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onApply}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Apply +150 kcal to Daily Targets</span>
          </button>

          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold transition-colors"
          >
            Keep Current Targets for Now
          </button>
        </div>
      </div>
    </div>
  );
};
