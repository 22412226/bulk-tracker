import React, { useState } from "react";
import { X, Download, Upload, Cloud, HardDrive, Check, AlertCircle } from "lucide-react";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCloudSynced: boolean;
  onExport: () => void;
  onImport: (jsonStr: string) => boolean;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  isCloudSynced,
  onExport,
  onImport,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = onImport(content);
      if (success) {
        setImportStatus("success");
        setTimeout(() => {
          onClose();
          setImportStatus(null);
        }, 1200);
      } else {
        setImportStatus("error");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-brand-light" />
            <h2 className="text-lg font-bold text-white">Sync & Backup Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-card-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="my-4 p-3.5 rounded-xl bg-card-secondary border border-border/80 flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isCloudSynced ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {isCloudSynced ? <Cloud className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {isCloudSynced ? "Cloud Real-Time Sync Active" : "Local Storage Mode (Offline Ready)"}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isCloudSynced
                ? "Your data automatically syncs across your Mac & phone via Supabase."
                : "Working offline with browser storage. Add Supabase keys in .env to sync anywhere."}
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Export Button */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Export Backup
            </label>
            <button
              onClick={onExport}
              className="w-full py-2.5 px-4 rounded-xl bg-card-secondary hover:bg-card-hover border border-border text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-brand-light" />
              <span>Download Full JSON Backup</span>
            </button>
          </div>

          {/* Import Button */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              Restore from Backup
            </label>
            <label className="w-full py-2.5 px-4 rounded-xl bg-card-secondary hover:bg-card-hover border border-border text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Upload & Import JSON File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Status Message */}
          {importStatus === "success" && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" /> Data successfully restored!
            </div>
          )}
          {importStatus === "error" && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Invalid backup format.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
