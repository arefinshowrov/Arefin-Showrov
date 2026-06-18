import React, { useState } from "react";
import { Mail, Lock, User, Sparkles, Activity, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface LoginRegisterProps {
  onSuccess: (token: string, userData: any) => void;
}

export default function LoginRegister({ onSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "An unexpected authenticator issue occurred.");
      }

      setAlert({
        type: "success",
        text: isLogin ? "Login successful! Entering dashboard..." : "Registration successful! Challenge started."
      });

      setTimeout(() => {
        onSuccess(data.token, data.user);
      }, 800);
    } catch (err: any) {
      setAlert({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoUser = async () => {
    setName("Wellness Warrior");
    const suffix = Math.floor(Math.random() * 10000);
    setEmail(`user${suffix}@gmail.com`);
    setPassword("wellnesspass123");
    setIsLogin(false);
    setAlert({
      type: "success",
      text: "Demo user initialized! Simply click 'Initialize 30-Day Program' below to start instantly."
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        
        {/* Decorative Top Accent */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40">
            <Activity className="h-8 w-8 animate-pulse text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            DailyHabit
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            30-Day Human Health Tracker Ecosystem
          </p>
        </div>

        {/* State Selection */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
          <button
            onClick={() => { setIsLogin(true); setAlert(null); }}
            className={`rounded-md py-2 text-sm font-medium transition-all ${
              isLogin 
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setAlert(null); }}
            className={`rounded-md py-2 text-sm font-medium transition-all ${
              !isLogin 
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Demo Fast Logins Grid */}
        <div className="space-y-2 rounded-xl bg-emerald-50/50 p-4 border border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-center">
          <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
            🔋 Quick Access Demo
          </span>
          <button
            onClick={handleQuickDemoUser}
            type="button"
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200/60 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>Generate Free Demo Account Credentials</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Alerts */}
          {alert && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-3 text-sm font-medium ${
                alert.type === "success" 
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
              }`}
            >
              {alert.text}
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Name field for registration */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-lg border border-slate-200 py-2.5 pr-4 pl-10 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pr-4 pl-10 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pr-4 pl-10 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-200 disabled:opacity-50 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 00 5.373 4 12c0 6.627-5.373 12-12 12v-4a8 8 0 01-8-8z" />
                </svg>
                Syncing Authorization...
              </span>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Initialize 30-Day Program"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Secured with SHA-512 cryptographic password protection. No cookies or tracker logs of users are sent to third parties.
        </p>

      </div>
    </div>
  );
}
