import React from "react";

interface MacroCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  colorHex: string;
  isCalories?: boolean;
}

export const MacroCard: React.FC<MacroCardProps> = ({
  title,
  current,
  target,
  unit,
  colorHex,
  isCalories = false,
}) => {
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(0, target - current);
  const isOver = current > target;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-card border border-border p-3.5 sm:p-4.5 transition-all duration-200 hover:border-border-light shadow-lg flex flex-col justify-between ${
        isCalories ? "col-span-2 sm:col-span-1" : ""
      }`}
    >
      {/* Top Bar with Accent Pill */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${colorHex}18`,
            color: colorHex,
          }}
        >
          {percentage}%
        </span>
      </div>

      {/* Main Numbers */}
      <div className="my-1">
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {current.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-gray-400">
            / {target.toLocaleString()} {unit}
          </span>
        </div>

        <div className="text-[11px] text-gray-400 mt-0.5 flex items-center justify-between">
          <span>{isOver ? "Over target" : "Remaining"}</span>
          <span className={isOver ? "text-rose-400 font-semibold" : "text-gray-300 font-medium"}>
            {isOver ? `+${(current - target).toLocaleString()}` : `${remaining.toLocaleString()}`} {unit}
          </span>
        </div>
      </div>

      {/* Progress Track (Apple Fitness style) */}
      <div className="w-full bg-[#1e2638] h-2 rounded-full overflow-hidden mt-2 relative">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: colorHex,
            boxShadow: `0 0 10px ${colorHex}55`,
          }}
        />
      </div>
    </div>
  );
};
