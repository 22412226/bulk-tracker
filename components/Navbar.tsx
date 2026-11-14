import React from "react";
import { LayoutDashboard, Utensils, Target, Cloud, HardDrive, ShieldCheck } from "lucide-react";
import { useTracker } from "@/context/TrackerContext";

interface NavbarProps {
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBackup }) => {
  const { activeTab, setActiveTab, state, effectiveTargets } = useTracker();

  const navItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "library" as const,
      label: "Food Library",
      icon: Utensils,
    },
    {
      id: "goals" as const,
      label: "Goals & Weight",
      icon: Target,
    },
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR (hidden on mobile, visible md and up)    */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-card border-r border-border p-5 justify-between select-none">
        <div>
          {/* Logo & Title */}
          <div className="flex items-center gap-3 pb-6 border-b border-border/80">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-brand flex items-center justify-center text-white shadow-lg shadow-brand/20 font-black text-xl">
              ⚡
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">
                Lean Bulking
              </h1>
              <span className="text-[11px] font-semibold text-brand-light">
                Macro & PWA Tracker
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-brand text-white shadow-lg shadow-brand/25"
                      : "text-gray-400 hover:text-white hover:bg-card-secondary"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Bottom Stats & Cloud Sync */}
        <div className="space-y-3 pt-4 border-t border-border/80">
          <div className="p-3 rounded-xl bg-card-secondary border border-border/60 text-xs space-y-1">
            <div className="flex justify-between text-gray-400">
              <span>Current Scale:</span>
              <span className="font-bold text-white">{state.settings.weight_kg.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Daily Target:</span>
              <span className="font-bold text-amber-400">{effectiveTargets.calories.toLocaleString()} kcal</span>
            </div>
          </div>

          <button
            onClick={onOpenBackup}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#0e1320] hover:bg-card-secondary border border-border/60 text-[11px] text-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              {state.isCloudSynced ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{state.isCloudSynced ? "Supabase Synced" : "Local Backup"}</span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (fixed on mobile)           */}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111726]/95 backdrop-blur-lg border-t border-border px-3 py-2 pb-safe shadow-2xl">
        <div className="grid grid-cols-3 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
                  isActive
                    ? "text-brand-light font-bold"
                    : "text-gray-400 hover:text-gray-200 font-medium"
                }`}
              >
                <div
                  className={`p-1 rounded-xl mb-0.5 transition-all ${
                    isActive ? "bg-brand/20 text-brand-light" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
