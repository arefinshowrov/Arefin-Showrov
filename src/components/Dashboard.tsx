import React, { useState, useEffect } from "react";
import { 
  Flame, BatteryCharging, ShieldAlert, CheckCircle, 
  Sparkles, Calendar, Clock, RotateCcw, AlertCircle, 
  Send, PlusCircle, Volume2, Award, ArrowUpRight, 
  FileText, Activity, Droplets, Apple, Dumbbell, 
  Brain, Sun, Zap, Info, BellRing, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Challenge, Task, Badge, UserSettings, NotificationLog } from "../types";

interface DashboardProps {
  token: string;
  challenge: Challenge;
  tasks: Task[];
  badges: Badge[];
  settings: UserSettings;
  onRefresh: () => void;
  onSetView: (view: "dashboard" | "analytics" | "settings" | "admin") => void;
}

export default function Dashboard({ 
  token, 
  challenge: initialChallenge, 
  tasks: initialTasks, 
  badges: initialBadges,
  settings,
  onRefresh,
  onSetView
}: DashboardProps) {
  const [challenge, setChallenge] = useState<Challenge>(initialChallenge);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [badges, setBadges] = useState<Badge[]>(initialBadges);
  const [advancingLoader, setAdvancingLoader] = useState(false);
  const [xpEarnedAlert, setXpEarnedAlert] = useState<{ active: boolean; xp: number } | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [editingNotesTaskId, setEditingNotesTaskId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<NotificationLog[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    setChallenge(initialChallenge);
    setTasks(initialTasks);
    setBadges(initialBadges);
  }, [initialChallenge, initialTasks, initialBadges]);

  // Fetch sent alerts history
  const fetchNotificationHistory = async () => {
    try {
      const res = await fetch("/api/notifications/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotificationHistory();
  }, [token]);

  // Level mapping
  const levelNames = [
    "",
    "Beginner",
    "Consistent",
    "Healthy Habit Builder",
    "Wellness Champion",
    "Peak Performer"
  ];

  const getNextLevelXp = (lvl: number) => {
    if (lvl === 1) return 100;
    if (lvl === 2) return 250;
    if (lvl === 3) return 500;
    if (lvl === 4) return 900;
    return 1500; // Peak limit
  };

  const getLevelColor = (lvl: number) => {
    const colors = [
      "",
      "text-slate-400 border-slate-200 bg-slate-50 dark:bg-slate-900/40 dark:border-slate-800",
      "text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900",
      "text-purple-500 border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900",
      "text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900",
      "text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900",
    ];
    return colors[lvl] || "text-emerald-500 border-emerald-200 bg-emerald-50";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Hydration":
        return <Droplets className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      case "Nutrition":
        return <Apple className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />;
      case "Physical Health":
        return <Dumbbell className="h-5 w-5 text-orange-500 dark:text-orange-400" />;
      case "Mental Wellness":
        return <Brain className="h-5 w-5 text-purple-400 dark:text-purple-300" />;
      case "Recovery":
        return <Sun className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
      default:
        return <Activity className="h-5 w-5 text-emerald-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Hydration": return "bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-950/35 dark:border-blue-900/30 dark:text-blue-300";
      case "Nutrition": return "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/35 dark:border-emerald-900/30 dark:text-emerald-300";
      case "Physical Health": return "bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-950/35 dark:border-orange-900/30 dark:text-orange-300";
      case "Mental Wellness": return "bg-purple-50 border-purple-100 text-purple-800 dark:bg-purple-950/35 dark:border-purple-900/30 dark:text-purple-300";
      case "Recovery": return "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/35 dark:border-amber-900/30 dark:text-amber-300";
      default: return "bg-slate-50 border-slate-100 text-slate-800 dark:bg-slate-900 dark:border-slate-800";
    }
  };

  const getBadgeName = (badgeId: string) => {
    switch (badgeId) {
      case "hydration_hero": return "💧 Hydration Hero";
      case "fitness_warrior": return "🏃 Fitness Warrior";
      case "mindfulness_master": return "🧠 Mindfulness Master";
      case "sunlight_champion": return "🌞 Sunlight Champion";
      case "streak_7": return "🔥 7-Day Streak Badge";
      case "streak_30": return "👑 Peak 30-Day Badge";
      default: return "🏅 Achievement Badge";
    }
  };

  // Browser Reminders & Permission Request handler
  const requestNotificationPermission = async () => {
    try {
      if (!("Notification" in window)) {
        setNotificationMsg({ text: "Notifications are not supported in your browser.", type: "error" });
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotificationMsg({ text: "Superb! Notification alert triggers enabled.", type: "success" });
      } else {
        setNotificationMsg({ text: "Push permission was denied. Try enabling in browser bar settings.", type: "error" });
      }
    } catch {
      setNotificationMsg({ text: "Frame security sandbox restricts direct push triggers.", type: "error" });
    }
  };

  // Immediate Test Notification & REST logging
  const triggerTestNotification = async () => {
    const focusTask = tasks.find(t => !t.completed) || tasks[0];
    const taskName = focusTask ? focusTask.title : "Drink Water (250ml+)";
    const titleText = "Wellness Practice Reminder";
    const bodyText = `Time to focus on: ${taskName}`;

    // Play optional audio focus notification sound
    if (settings.soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 high tone
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        console.log("Audio contexts blocked until human engagement interaction.");
      }
    }

    // Try sending native web push
    let sentViaBrowser = false;
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(titleText, {
          body: bodyText,
          icon: "/favicon.ico"
        });
        sentViaBrowser = true;
      } catch (e) {
        console.log(e);
      }
    }

    // Save history logs on database endpoint
    try {
      const res = await fetch("/api/notifications/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: titleText,
          body: bodyText,
          category: focusTask ? focusTask.category : "Hydration"
        })
      });

      if (res.ok) {
        setNotificationMsg({ 
          text: `Alert Triggered! ${sentViaBrowser ? "Fired browser notification." : "Pushed in-app overlay reminder."} saved to profile logs.`, 
          type: "success" 
        });
        fetchNotificationHistory();
        setTimeout(() => setNotificationMsg(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Task Checklist Item Complete state
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      const taskObj = tasks.find(t => t.id === taskId);
      const targetState = !currentCompleted;

      const response = await fetch(`/api/challenge/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: targetState,
          notes: taskObj ? taskObj.notes : ""
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setChallenge(data.challenge);
        
        if (targetState) {
          // Play micro sound frequency for reward feedback
          if (settings.soundEnabled) {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
              osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
              osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
              gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.28);
            } catch (err) {
              console.log(err);
            }
          }
          
          // Trigger reward overlay
          setXpEarnedAlert({ active: true, xp: taskObj?.xpEarned || 20 });
          setTimeout(() => setXpEarnedAlert(null), 2500);
        }

        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save/Update Inline notes
  const saveTaskNotes = async (taskId: string) => {
    setSavingNoteId(taskId);
    try {
      const response = await fetch(`/api/challenge/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: tasks.find(t => t.id === taskId)?.completed || false,
          notes: noteText
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setEditingNotesTaskId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNoteId(null);
    }
  };

  // Handle Day Advancement
  const handleAdvanceDay = async () => {
    setAdvancingLoader(true);
    try {
      const res = await fetch("/api/challenge/advance", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setChallenge(data.challenge);
        setTasks(data.tasks);
        onRefresh();
        
        // Render success day rollover
        if (settings.soundEnabled) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(261.63, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
          } catch(e) {}
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancingLoader(false);
    }
  };

  const currentFocusTask = tasks.find(t => !t.completed) || tasks[0];
  const progressPercent = Math.round((challenge.currentDay / 30) * 100);
  const todaysCompletedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Gamification Floating FX Toast */}
      <AnimatePresence>
        {xpEarnedAlert && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed bottom-12 right-6 z-50 flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-white shadow-xl dark:bg-emerald-600 font-bold"
          >
            <Sparkles className="h-5 w-5 animate-spin" />
            <span>+{xpEarnedAlert.xp} XP WELLNESS BOOSTER!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Core Grid (Hero & Progress Section) */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* HERO CARD (DAY COUNTER) */}
        <div id="hero-card" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-md dark:from-emerald-600 dark:to-emerald-700">
          <div className="absolute -right-6 -bottom-6 opacity-10">
            <Calendar className="h-32 w-32" />
          </div>
          <div className="flex justify-between items-start">
            <span className="rounded-full bg-emerald-400/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              Current Challenge Status: ACTIVE
            </span>
            <span className="text-xs text-white/80 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> 30-Day Cycle
            </span>
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-emerald-100 font-bold">Wellness Cycle</p>
            <h3 className="text-5xl font-extrabold tracking-tight mt-1">
              DAY {challenge.currentDay}
            </h3>
            <p className="mt-2 text-sm text-emerald-500-100/95 font-medium">
              You are {30 - challenge.currentDay} days away from premium habit baseline!
            </p>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={handleAdvanceDay}
              disabled={advancingLoader}
              className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-60"
            >
              {advancingLoader ? "Rolling Tasks..." : "Advance Day ⏩"}
            </button>
            <button
              onClick={() => onSetView("settings")}
              className="rounded-lg bg-emerald-400/40 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400/50 transition-all backdrop-blur-sm"
            >
              Configure
            </button>
          </div>
        </div>

        {/* PROGRESS CARD */}
        <div id="progress-card" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Challenge Completion</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                {progressPercent}% Saved
              </span>
            </div>
            
            <div className="mt-6 space-y-2">
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Day 1</span>
                <span>{30 - challenge.currentDay} Days Remaining</span>
                <span>Day 30</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-900 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Overall Target</span>
              <p className="text-md font-bold text-slate-800 dark:text-slate-100">30 Daily Sessions</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Completed Days</span>
              <p className="text-md font-bold text-slate-800 dark:text-slate-100">{challenge.currentDay - 1} Clear</p>
            </div>
          </div>
        </div>

        {/* GAMIFICATION XP LEVEL CARD */}
        <div id="gamified-card" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Wellness Badge Tier</span>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5 dark:text-white flex items-center gap-1.5">
                <Award className="h-5 w-5 text-amber-500" />
                Level {challenge.level}
              </h4>
            </div>
            <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${getLevelColor(challenge.level)}`}>
              {levelNames[challenge.level]}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>XP Level Metre</span>
              <span>{challenge.xp} / {getNextLevelXp(challenge.level)} XP</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (challenge.xp / getNextLevelXp(challenge.level)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Earn XP by ticking complete checkmarks of active wellness reminders!
            </p>
          </div>
        </div>

      </div>

      {/* Smart Quick Reminders & In-App Notification Hub Console */}
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-5 dark:border-emerald-950/40 dark:from-emerald-950/10 dark:to-teal-950/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100/50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <BellRing className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Active Reminder Routine Engine</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Checks and triggers alerts every 8 hours. Active times: <strong>{settings.morningNotificationTime}</strong> | <strong>{settings.afternoonNotificationTime}</strong> | <strong>{settings.nightNotificationTime}</strong>
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={requestNotificationPermission}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 transition-all"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Enable Reminders
            </button>
            <button
              onClick={triggerTestNotification}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm transition-all"
            >
              <Zap className="h-3.5 w-3.5" strokeWidth={3} />
              Test Reminder Trigger
            </button>
            <button
              onClick={() => { setShowHistoryModal(true); fetchNotificationHistory(); }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 transition-all"
            >
              Alert Logs
            </button>
          </div>
        </div>

        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
              notificationMsg.type === "success" 
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
            }`}
          >
            <Info className="h-4 w-4" />
            <span>{notificationMsg.text}</span>
          </motion.div>
        )}
      </div>

      {/* Main Focus Detail Widget */}
      <div id="focus-area" className="grid gap-6 lg:grid-cols-3">
        
        {/* Dynamic Focus Section */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 dark:border-slate-900">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Active Focus Objective</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                Live Rotation
              </span>
            </div>

            {currentFocusTask ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                    {getCategoryIcon(currentFocusTask.category)}
                  </div>
                  <div>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${getCategoryColor(currentFocusTask.category)}`}>
                      {currentFocusTask.category}
                    </span>
                    <h4 className="text-md font-bold text-slate-900 dark:text-white mt-1">
                      {currentFocusTask.title}
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 p-4 rounded-xl dark:bg-slate-900/30">
                  {currentFocusTask.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Assigned For Day {challenge.currentDay}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">+{currentFocusTask.xpEarned} XP rewards</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto animate-bounce" />
                <h5 className="font-bold text-slate-900 dark:text-white mt-3">All Day {challenge.currentDay} Tasks Cleared!</h5>
                <p className="text-xs text-slate-400 mt-1">
                  Ready to step forward? Press "Advance Day ⏩" to roll new challenges!
                </p>
              </div>
            )}
          </div>

          {currentFocusTask && (
            <button
              onClick={() => handleToggleTask(currentFocusTask.id, currentFocusTask.completed)}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 active:scale-95 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Mark Completed & Earn +{currentFocusTask.xpEarned} XP
            </button>
          )}
        </div>

        {/* Task Completion Checklist Entries list */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 dark:border-slate-900">
            <div>
              <h3 className="text-md font-bold text-slate-900 dark:text-white">Day {challenge.currentDay} Wellness Checklist</h3>
              <p className="text-xs text-slate-400">Complete tasks to secure daily streaks and raise level badges.</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
              Cleared {todaysCompletedCount} / {tasks.length}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                className={`relative rounded-xl border p-4 transition-all ${
                  task.completed 
                    ? "bg-slate-50/50 border-slate-100 dark:bg-slate-900/10 dark:border-slate-900" 
                    : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-950 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                        task.completed 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "border-slate-300 hover:border-emerald-500 dark:border-slate-700"
                      }`}
                    >
                      {task.completed && <CheckCircle className="h-4 w-4" strokeWidth={3} />}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm font-semibold transition-all ${
                          task.completed ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"
                        }`}>
                          {task.title}
                        </h4>
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getCategoryColor(task.category)}`}>
                          {task.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {task.description}
                      </p>
                      
                      {task.completedAt && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                          Completed at {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      +{task.xpEarned} XP
                    </span>
                  </div>
                </div>

                {/* Inline Notes Field Section */}
                <div className="mt-3 pt-3 border-t border-dashed border-slate-100 dark:border-slate-900">
                  {editingNotesTaskId === task.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add personal notes, targets, or logs (e.g. 'Drank 300ml, felt energized!')"
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        rows={2}
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingNotesTaskId(null)}
                          className="rounded-md border px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-800 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveTaskNotes(task.id)}
                          disabled={savingNoteId === task.id}
                          className="rounded-md bg-emerald-500 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-600"
                        >
                          {savingNoteId === task.id ? "Saving..." : "Save Notes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-400 italic">
                        {task.notes ? `🗒️ Note: ${task.notes}` : "No notes logged for this wellness entry."}
                      </p>
                      <button
                        onClick={() => { setEditingNotesTaskId(task.id); setNoteText(task.notes || ""); }}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {task.notes ? "Edit Note" : "+ Log Note"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Gamified Achievement Badges Collection section */}
      <div id="badges-section" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4 dark:border-slate-900">
          <div>
            <h3 className="text-md font-bold text-slate-900 dark:text-white">Your Earned Achievement Badges</h3>
            <p className="text-xs text-slate-400">Earn medals by completing criteria streaks and daily category repetitions.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Unlocked {badges.length} Medals
          </span>
        </div>

        {badges.length > 0 ? (
          <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
            {badges.map((b) => (
              <motion.div
                key={b.id}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center justify-center p-3 text-center border border-amber-100 bg-amber-50/20 rounded-xl dark:border-amber-950/30 dark:bg-amber-950/10"
              >
                <div className="text-2xl">🏆</div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 block">
                  {getBadgeName(b.badgeId)}
                </span>
                <span className="text-[9px] text-slate-400 block mt-1">
                  Earned {new Date(b.earnedAt).toLocaleDateString()}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50/50 rounded-xl mt-6 dark:bg-slate-900/20">
            <span className="text-2xl grayscale block">🏅</span>
            <p className="text-xs text-slate-400 mt-2">
              No badges unlocked yet. Keep completing hydration, physical, posturial and recovery categories!
            </p>
          </div>
        )}
      </div>

      {/* Alert Logs Overlay History modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100 dark:bg-slate-950 dark:border-slate-900">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-900">
              <h3 className="text-md font-bold text-slate-900 dark:text-white">Reminder Schedules Sent History</h3>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-3 pr-2">
              {notificationHistory.length > 0 ? (
                notificationHistory.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-250">{item.title}</span>
                      <span className="text-[10px] text-slate-400">{new Date(item.sentAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{item.body}</p>
                    <span className="inline-block text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                      Category: {item.category}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-xs text-slate-400">No diagnostic notifications logged yet on profile.</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg bg-slate-150 border px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-800 text-slate-700 dark:text-slate-200"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
