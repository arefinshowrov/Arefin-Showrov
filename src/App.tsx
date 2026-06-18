import React, { useState, useEffect } from "react";
import { 
  Activity, BarChart2, Award, Settings as SettingsIcon, 
  LogOut, ShieldCheck, Flame, User, Info, CalendarClock, Heart, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { User as UserType, Challenge, Task, Badge, UserSettings, AnalyticsStats } from "./types";
import LoginRegister from "./components/LoginRegister";
import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";
import Settings from "./components/Settings";
import EndOfChallenge from "./components/EndOfChallenge";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("health_auth_token"));
  const [user, setUser] = useState<UserType | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "settings" | "graduation">("dashboard");
  const [appLoading, setAppLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Authenticate and hydrate state details
  const fetchProfileAndState = async (authToken: string) => {
    setSyncing(true);
    setGlobalError(null);
    try {
      // 1. Fetch user profile, settings and badge states
      const profileRes = await fetch("/api/auth/profile", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });

      if (!profileRes.ok) {
        if (profileRes.status === 401 || profileRes.status === 403) {
          handleLogout();
          return;
        }
        throw new Error("Could not hydrate user profile records.");
      }

      const profileData = await profileRes.json();
      setUser(profileData.user);
      setBadges(profileData.badges || []);
      setSettings(profileData.settings);

      // Auto-apply dark mode CSS class
      if (profileData.settings?.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // 2. Fetch challenge state & day tasks
      const activeChallengeRes = await fetch("/api/challenge/active", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });

      if (activeChallengeRes.ok) {
        const challengeData = await activeChallengeRes.json();
        setChallenge(challengeData.challenge);
        setTasks(challengeData.tasks || []);
        
        // If challenge status is "completed", auto-route user to Graduation report page!
        if (challengeData.challenge?.status === "completed") {
          setActiveTab("graduation");
        }
      }

      // 3. Keep analytics cache ready
      const statsRes = await fetch("/api/challenge/stats", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

    } catch (err: any) {
      setGlobalError(err.message || "Ecosystem syncing failed.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfileAndState(token);
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, userData: any) => {
    localStorage.setItem("health_auth_token", newToken);
    setToken(newToken);
    setUser(userData);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("health_auth_token");
    setToken(null);
    setUser(null);
    setChallenge(null);
    setTasks([]);
    setBadges([]);
    setSettings(null);
    setStats(null);
    setActiveTab("dashboard");
  };

  const refreshApplicationStates = () => {
    if (token) fetchProfileAndState(token);
  };

  if (!token || !user) {
    return <LoginRegister onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Primary Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div id="main-nav" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Brand Logo and Active Streak indicator */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-md tracking-tight text-slate-900 dark:text-white block leading-none">
                DailyHabit
              </span>
              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold block mt-1 uppercase tracking-wider">
                Health Optimizer
              </span>
            </div>

            {challenge && challenge.streak > 0 && (
              <div className="ml-4 flex items-center gap-1 rounded-full bg-orange-55 shadow-sm border border-orange-200/40 bg-orange-50/20 px-2.5 py-1 text-xs font-bold text-orange-600 dark:border-orange-900/30 dark:text-orange-400">
                <Flame className="h-3.5 w-3.5 fill-current animate-pulse" />
                <span>{challenge.streak} Day Streak</span>
              </div>
            )}
          </div>

          {/* Navigation Control Tabs */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-350">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`rounded-lg px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all ${
                activeTab === "dashboard" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold" : ""
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`rounded-lg px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all ${
                activeTab === "analytics" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold" : ""
              }`}
            >
              Intelligence Stats
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`rounded-lg px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all ${
                activeTab === "settings" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold" : ""
              }`}
            >
              Configurations
            </button>
            {challenge && (challenge.status === "completed" || challenge.currentDay >= 1) && (
              <button
                onClick={() => setActiveTab("graduation")}
                className={`rounded-lg px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all ${
                  activeTab === "graduation" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold" : ""
                }`}
              >
                Graduation Plaque
              </button>
            )}
          </nav>

          {/* User badge and LogOut trigger */}
          <div className="flex items-center gap-3">
            <div className="items-center gap-1.5 hidden sm:flex border border-slate-100 rounded-lg py-1 px-2.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <div className="text-left">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-100 block leading-tight">
                  {user.name}
                </span>
                <span className="text-[9px] text-slate-450 block leading-tight">Level {challenge?.level || 1} Tier</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="group flex h-9 w-9 items-center justify-center rounded-lg border border-slate-150 hover:bg-rose-50 hover:border-rose-250 hover:text-rose-600 dark:border-slate-800 dark:hover:bg-rose-950/20 transition-all"
              title="Logout session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Control Navigation Tab Drawer */}
      <div className="md:hidden border-b border-slate-100 bg-white/70 backdrop-blur-sm dark:bg-slate-950 dark:border-slate-900 flex px-2 py-1 gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-3 py-1.5 rounded-md text-[11px] font-bold shrink-0 ${activeTab === "dashboard" ? "bg-emerald-500 text-white" : "text-slate-600 dark:text-slate-350"}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-3 py-1.5 rounded-md text-[11px] font-bold shrink-0 ${activeTab === "analytics" ? "bg-emerald-500 text-white" : "text-slate-600 dark:text-slate-350"}`}
        >
          Intelligence
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-3 py-1.5 rounded-md text-[11px] font-bold shrink-0 ${activeTab === "settings" ? "bg-emerald-500 text-white" : "text-slate-600 dark:text-slate-350"}`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab("graduation")}
          className={`px-3 py-1.5 rounded-md text-[11px] font-bold shrink-0 ${activeTab === "graduation" ? "bg-emerald-500 text-white" : "text-slate-600 dark:text-slate-350"}`}
        >
          Graduation
        </button>
      </div>

      {/* Main Workspace Frame */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {globalError && (
          <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50 p-4 dark:bg-rose-950/25 dark:border-rose-900/40">
            <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-300 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <div>
                <span className="font-bold">Sync Error:</span>
                <span className="ml-1 text-xs/normal text-slate-600 dark:text-slate-400">{globalError}</span>
              </div>
            </div>
          </div>
        )}

        {syncing && !challenge ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <svg className="h-10 w-10 animate-spin text-emerald-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 00 5.373 4 12c0 6.627-5.373 12-12 12v-4a8 8 0 01-8-8z" />
              </svg>
              <h4 className="text-xs font-bold text-slate-500 mt-2">Hydrating active wellness nodes...</h4>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {challenge && (
              <>
                {activeTab === "dashboard" && settings && (
                  <Dashboard
                    token={token}
                    challenge={challenge}
                    tasks={tasks}
                    badges={badges}
                    settings={settings}
                    onRefresh={refreshApplicationStates}
                    onSetView={(view) => setActiveTab(view as any)}
                  />
                )}

                {activeTab === "analytics" && (
                  <Analytics token={token} />
                )}

                {activeTab === "settings" && settings && (
                  <Settings
                    token={token}
                    settings={settings}
                    onRefresh={refreshApplicationStates}
                  />
                )}

                {activeTab === "graduation" && stats && (
                  <EndOfChallenge
                    token={token}
                    stats={stats}
                    onRestart={() => {
                      const triggerReset = async () => {
                        try {
                          const res = await fetch("/api/challenge/reset", {
                            method: "POST",
                            headers: { "Authorization": `Bearer ${token}` }
                          });
                          if (res.ok) {
                            refreshApplicationStates();
                            setActiveTab("dashboard");
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      };
                      triggerReset();
                    }}
                  />
                )}
              </>
            )}
          </motion.div>
        )}

      </main>

      {/* Sticky footer credits */}
      <footer className="py-6 border-t border-slate-100 bg-white/50 text-center text-[10px] text-slate-400 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-500">
        <p>DailyHabit Human Health Tracker Protocol Module. Optimized layout built in full compliance of security schemas.</p>
      </footer>

    </div>
  );
}
