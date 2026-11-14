"use client";

import React, { useState, useEffect } from "react";
import { TrackerProvider, useTracker } from "@/context/TrackerContext";
import { Navbar } from "@/components/Navbar";
import { DashboardView } from "@/components/views/DashboardView";
import { FoodLibraryView } from "@/components/views/FoodLibraryView";
import { GoalsWeightView } from "@/components/views/GoalsWeightView";
import { BackupModal } from "@/components/modals/BackupModal";
import { CalorieSurplusPromptModal } from "@/components/modals/CalorieSurplusPromptModal";
import { Cloud, HardDrive } from "lucide-react";

function TrackerApp() {
  const {
    activeTab,
    state,
    exportJSON,
    importJSON,
    calorieAdjustmentPrompt,
    applyCalorieIncrease,
    dismissCaloriePrompt,
  } = useTracker();

  const [backupModalOpen, setBackupModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0B0F19]">
      {/* Desktop Sidebar & Mobile Bottom Navigation */}
      <Navbar onOpenBackup={() => setBackupModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header (hidden on md and up) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111726]/90 backdrop-blur-md border-b border-border sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-brand flex items-center justify-center text-white text-xs font-black">
              ⚡
            </div>
            <span className="text-sm font-black text-white">
              Lean Bulking Tracker
            </span>
          </div>

          <button
            onClick={() => setBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card-secondary border border-border text-[11px] font-semibold text-gray-300"
          >
            {state.isCloudSynced ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{state.isCloudSynced ? "Cloud" : "Local"}</span>
          </button>
        </header>

        {/* View Router */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "library" && <FoodLibraryView />}
          {activeTab === "goals" && <GoalsWeightView />}
        </main>
      </div>

      {/* Backup & Cloud Sync Modal */}
      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        isCloudSynced={state.isCloudSynced}
        onExport={exportJSON}
        onImport={importJSON}
      />

      {/* Automatic Milestone Calorie Surplus Prompt (+1.5kg weight gain) */}
      {calorieAdjustmentPrompt && (
        <CalorieSurplusPromptModal
          isOpen={calorieAdjustmentPrompt.show}
          currentWeight={calorieAdjustmentPrompt.currentWeight}
          weightGained={calorieAdjustmentPrompt.weightGained}
          onApply={applyCalorieIncrease}
          onDismiss={dismissCaloriePrompt}
        />
      )}
    </div>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#0B0F19]" />;
  }

  return (
    <TrackerProvider>
      <TrackerApp />
    </TrackerProvider>
  );
}
