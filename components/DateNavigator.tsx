import React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DateNavigatorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    onDateChange(todayStr);
  };

  // Format date display (e.g., "Saturday, Nov 14")
  const dateObj = new Date(selectedDate + "T00:00:00");
  const formattedText = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-card border border-border p-2 sm:p-2.5 rounded-2xl">
      {/* Date Switcher Arrows */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevDay}
          className="p-1.5 sm:p-2 rounded-xl text-gray-300 hover:text-white hover:bg-card-secondary transition-colors"
          title="Previous Day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="relative flex items-center gap-2 px-2 sm:px-3 py-1 rounded-xl hover:bg-card-secondary transition-colors cursor-pointer group">
          <CalendarIcon className="w-4 h-4 text-brand-light" />
          <span className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
            {isToday ? `Today (${formattedText})` : formattedText}
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>

        <button
          onClick={handleNextDay}
          className="p-1.5 sm:p-2 rounded-xl text-gray-300 hover:text-white hover:bg-card-secondary transition-colors"
          title="Next Day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Today jump button */}
      {!isToday && (
        <button
          onClick={handleToday}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand/20 text-brand-light hover:bg-brand/30 border border-brand/40 transition-colors"
        >
          Jump to Today
        </button>
      )}
    </div>
  );
};
