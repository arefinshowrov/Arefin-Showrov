import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, Volume2, Moon, Sun, 
  RotateCcw, Download, Upload, Check, AlertTriangle, 
  Info, Clock, Bell, Trash2, Sliders, VolumeX
} from "lucide-react";
import { motion } from "motion/react";
import { UserSettings } from "../types";

interface SettingsProps {
  token: string;
  settings: UserSettings;
  onRefresh: () => void;
}

export default function Settings({ token, settings: initialSettings, onRefresh }: SettingsProps) {
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [morning, setMorning] = useState(initialSettings.morningNotificationTime);
  const [afternoon, setAfternoon] = useState(initialSettings.afternoonNotificationTime);
  const [night, setNight] = useState(initialSettings.nightNotificationTime);
  const [sound, setSound] = useState(initialSettings.soundEnabled);
  const [darkMode, setDarkMode] = useState(initialSettings.darkMode);
  
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
    setMorning(initialSettings.morningNotificationTime);
    setAfternoon(initialSettings.afternoonNotificationTime);
    setNight(initialSettings.nightNotificationTime);
    setSound(initialSettings.soundEnabled);
    setDarkMode(initialSettings.darkMode);
  }, [initialSettings]);

  // Saves general / notification schedule preferences
  const saveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("Syncing...");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          morningNotificationTime: morning,
          afternoonNotificationTime: afternoon,
          nightNotificationTime: night,
          soundEnabled: sound,
          darkMode: darkMode
        })
      });

      if (response.ok) {
        setSaveStatus("Saved successfully!");
        onRefresh();
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        throw new Error("Failed to sync settings.");
      }
    } catch (err) {
      setSaveStatus("Sync error. Try again.");
    }
  };

  // Dark Mode Toggle directly triggers element dark additions
  const handleToggleDarkMode = async (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
    
    // Auto-save this configuration
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ darkMode: checked })
      });
      onRefresh();
    } catch (e) {
      console.log(e);
    }
  };

  // Trigger JSON database export
  const handleExportData = async () => {
    try {
      const res = await fetch("/api/backup/export", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const blobObj = await res.blob();
        const urlStr = window.URL.createObjectURL(blobObj);
        const anchor = document.createElement("a");
        anchor.href = urlStr;
        anchor.download = `30_day_wellness_backup_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(urlStr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger JSON data restores imports
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (parsed.exportVersion !== "1.0.0") {
        throw new Error("Incompatible JSON backup file version.");
      }

      const res = await fetch("/api/backup/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(parsed)
      });

      if (res.ok) {
        setImportStatus({ type: "success", text: "Restore complete! Refreshing challenge state..." });
        onRefresh();
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Could not integrate JSON package.");
      }
    } catch (err: any) {
      setImportStatus({ type: "error", text: err.message || "Invalid backup payload formatted syntax." });
    }
  };

  // Completely wipes and restarts Day 1
  const handleChallengeWipe = async () => {
    try {
      const res = await fetch("/api/challenge/reset", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setResetConfirm(false);
        onRefresh();
        alert("Challenge reset. You have been step-back to Day 1!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Profile Configurations</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage daily notification schedules, offline file backups, sound alarms, and visual styles.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Core parameters Form */}
        <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          
          <div className="flex items-center gap-2 border-b pb-4 dark:border-slate-900">
            <Sliders className="h-5 w-5 text-emerald-500" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Alarms & Schedule Adjustments</h4>
          </div>

          <form onSubmit={saveGeneralSettings} className="mt-6 space-y-6">
            
            {/* Visual themes togglers */}
            <div className="grid grid-cols-2 gap-4">
              
              <div 
                onClick={() => handleToggleDarkMode(!darkMode)}
                className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${
                  darkMode 
                    ? "bg-slate-900/50 border-emerald-500 text-white" 
                    : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900"
                }`}
              >
                <div className="flex justify-center mb-2">
                  <Moon className="h-5 w-5 text-indigo-500" />
                </div>
                <span className="text-xs font-semibold block">SaaS Dark Theme</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Toggle elegant eye-care visual theme.</span>
              </div>

              <div 
                onClick={() => handleToggleDarkMode(false)}
                className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${
                  !darkMode 
                    ? "bg-white border-emerald-500 text-slate-950" 
                    : "bg-slate-900/30 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="flex justify-center mb-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-xs font-semibold block">Emerald Light Theme</span>
                <span className="text-[10px] text-slate-400 mt-1 block">High contrast minimalist styling.</span>
              </div>

            </div>

            {/* Notification sound selector */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-950 rounded-lg">
                  {sound ? <Volume2 className="h-4 w-4 text-emerald-500" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Sound Signals</span>
                  <p className="text-[10px] text-slate-400">Play micro-frequencies upon checkpoint completions and alerts.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sound}
                onChange={(e) => setSound(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
              />
            </div>

            {/* Smart reminder schedules triggers */}
            <div className="space-y-4">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">Notification Slots (8-Hour intervals)</span>
              
              <div className="grid gap-4 sm:grid-cols-3">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Slot 1 (Morning)</label>
                  <div className="relative">
                    <Clock className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                    <input
                      type="time"
                      value={morning}
                      onChange={(e) => setMorning(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2.5 pr-3 pl-9 text-xs focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Slot 2 (Afternoon)</label>
                  <div className="relative">
                    <Clock className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                    <input
                      type="time"
                      value={afternoon}
                      onChange={(e) => setAfternoon(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2.5 pr-3 pl-9 text-xs focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Slot 3 (Midnight)</label>
                  <div className="relative">
                    <Clock className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                    <input
                      type="time"
                      value={night}
                      onChange={(e) => setNight(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2.5 pr-3 pl-9 text-xs focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm transition-all"
              >
                Sync Settings
              </button>
              {saveStatus && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  {saveStatus}
                </span>
              )}
            </div>

          </form>
        </div>

        {/* backups & factory restarts */}
        <div className="space-y-6">
          
          {/* Data exports & restores */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2 border-b pb-4 dark:border-slate-900">
              <Download className="h-5 w-5 text-emerald-500" />
              <h4 className="font-bold text-sm text-slate-905 dark:text-white">Database Backup utils</h4>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-[11px] text-slate-400 leading-normal">
                Avoid Cloud ephemerality loss! Export your checklist logs, level status, streak achievements, and settings parameters into local files.
              </p>

              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Export Profile JSON
              </button>

              <div className="pt-2">
                <label className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer dark:border-slate-800 dark:hover:bg-slate-900 transition-all text-center">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Restore Profile Files</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              {importStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg p-2.5 text-[11px] font-semibold flex items-center gap-2 ${
                    importStatus.type === "success" 
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  <Info className="h-3.5 w-3.5" />
                  <span>{importStatus.text}</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Hard reset */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/10 p-6 shadow-sm dark:border-rose-950/20">
            <h4 className="font-bold text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2 border-b border-rose-100 pb-4 dark:border-rose-950">
              <Trash2 className="h-5 w-5" />
              Reset Wellness Challenge
            </h4>

            <div className="mt-4 space-y-4">
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400">
                Wipes all completed challenge items, streak parameters, unlocked medals, level meters and restarts Day 1 cleanly.
              </p>

              {resetConfirm ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    Are you certain? Wipes are completely permanent.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="rounded-lg border bg-white py-1.5 text-xs font-semibold hover:bg-slate-50 dark:bg-slate-900"
                    >
                      Hold on
                    </button>
                    <button
                      onClick={handleChallengeWipe}
                      className="rounded-lg bg-rose-600 text-white py-1.5 text-xs font-bold hover:bg-rose-700"
                    >
                      Yes, reset now
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="w-full rounded-lg bg-rose-100/50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-xs py-2 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-300 transition-all"
                >
                  Reset Challenge to Day 1
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
