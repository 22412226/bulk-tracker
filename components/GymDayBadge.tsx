import React from "react";
import { Dumbbell, Moon } from "lucide-react";

interface GymDayBadgeProps {
  isGymDay: boolean;
  onToggle: () => void;
}

export const GymDayBadge: React.FC<GymDayBadgeProps> = ({ isGymDay, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-2xl border transition-all duration-200 text-xs sm:text-sm font-semibold select-none ${
        isGymDay
          ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          : "bg-card-secondary border-border text-gray-400 hover:text-gray-200 hover:border-border-light"
      }`}
    >
      {isGymDay ? (
        <>
          <Dumbbell className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>GZCLP Workout Day (+150 kcal)</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-gray-400" />
          <span>Rest Day</span>
        </>
      )}
      <span className="text-[10px] text-gray-500 group-hover:text-gray-300 ml-1">
        (Tap to switch)
      </span>
    </button>
  );
};
