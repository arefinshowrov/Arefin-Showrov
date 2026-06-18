import React, { useState } from "react";
import { 
  Award, Sparkles, Download, Share2, Clipboard, 
  Activity, CheckCircle2, TrendingUp, HeartHandshake, Info
} from "lucide-react";
import { motion } from "motion/react";
import { AnalyticsStats } from "../types";

interface EndOfChallengeProps {
  token: string;
  stats: AnalyticsStats;
  onRestart: () => void;
}

export default function EndOfChallenge({ token, stats, onRestart }: EndOfChallengeProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Compute Categories strengths & weaknesses
  const categoriesList = Object.entries(stats.categoryStats).map(([key, value]) => {
    const rate = value.assigned ? (value.completed / value.assigned) : 0;
    return { name: key, rate, completed: value.completed, assigned: value.assigned };
  });

  const sortedCats = [...categoriesList].sort((a, b) => b.rate - a.rate);
  const mostCompleted = sortedCats[0]?.completed > 0 ? sortedCats[0].name : "None yet";
  const leastCompleted = sortedCats[sortedCats.length - 1]?.assigned > 0 ? sortedCats[sortedCats.length - 1].name : "None yet";

  // Compute standard health score coefficients
  const overallScore = stats.completionRate;
  let scoreTitle = "Wellness Novice";
  let scoreClass = "text-yellow-600 border-yellow-250 bg-yellow-50";

  if (overallScore >= 90) {
    scoreTitle = "Peak Human Bio-Optimizer";
    scoreClass = "text-emerald-600 border-emerald-250 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400";
  } else if (overallScore >= 75) {
    scoreTitle = "Consistent Wellness Practitioner";
    scoreClass = "text-indigo-600 border-indigo-250 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400";
  } else if (overallScore >= 50) {
    scoreTitle = "Habit-Stacking Apprentice";
    scoreClass = "text-blue-600 border-blue-250 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400";
  }

  // Simulate PDF report compilation & text download
  const downloadReportPDF = () => {
    setDownloading(true);
    setTimeout(() => {
      const docHeader = `
============================================================
       OFFICIAL 30-DAY HUMAN HEALTH CHALLENGE REPORT
============================================================
Generated: ${new Date().toLocaleDateString()}
Aggregate Score Index: ${overallScore}/100 [${scoreTitle}]

MILESTONES SUMMARY:
------------------------------------------
Total Wellness Practices Assigned : ${stats.totalTasksAssigned}
Total Wellness Practices Completed: ${stats.totalTasksCompleted}
Success Completion Rate    : ${stats.completionRate}%
Peak Streak Accomplishment : ${stats.streak} Days
Dispatched Reminder Signals: ${stats.notificationsSent} Triggers

SECTOR PERFORMANCE INDICES:
------------------------------------------
Most Practiced Category    : ${mostCompleted}
Needs Focus Category       : ${leastCompleted}

SECTOR BREAKDOWNS:
${categoriesList.map(c => `- ${c.name}: ${c.completed}/${c.assigned} reps completed (${Math.round(c.rate * 100)}%)`).join("\n")}

Congratulations on finalizing the 30-Day DailyHabit protocol!
Keep optimizing your biological rhythms.
============================================================
`;
      const blob = new Blob([docHeader], { type: "text/plain;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "30_day_health_graduation_report.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloading(false);
    }, 1000);
  };

  // Copy share accomplishments
  const handleCopyShareCard = () => {
    const text = `🏆 30-Day DailyHabit Bio-Optimization graduation plaque! 
Overall Score: ${overallScore}/100 - ${scoreTitle}
🔥 Peak Streak: ${stats.streak} Days
💪 Clearance Rate: ${stats.completionRate}%
Most consistent: ${mostCompleted}. Join the health challenge!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* Decorative Graduation Ring Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-500/10 to-transparent p-8 text-center dark:border-amber-950/40">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-24 bg-amber-400 rounded-full" />
        
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400 opacity-20 blur-xl rounded-full scale-125 animate-pulse" />
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white h-20 w-20 rounded-full flex items-center justify-center shadow-lg relative">
              <Award className="h-10 w-10 stroke-[2]" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-slate-900 mt-6 dark:text-white">
          Congratulations, Health Optimizer!
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
          You have successfully navigated through the 30-Day active wellness curriculum, re-training biological focus habits, posture and mental health thresholds.
        </p>

        <div className="mt-4 flex justify-center">
          <span className={`rounded-full border px-3.5 py-1 text-xs font-bold ${scoreClass}`}>
            🏆 Tier: {scoreTitle}
          </span>
        </div>

      </div>

      {/* Graduation Scorecard Details */}
      <div className="grid gap-6 md:grid-cols-3">
        
        <div className="bg-white border rounded-2xl p-5 shadow-sm dark:bg-slate-950 dark:border-slate-900 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">System Score Rating</span>
          <h4 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{overallScore} / 100</h4>
          <p className="text-xs text-slate-400 mt-2">Calculated from total checklist tasks marked complete.</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm dark:bg-slate-950 dark:border-slate-900 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Peak Wellness Sequence</span>
          <h4 className="text-3xl font-black mt-2 text-slate-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            {stats.streak} Days
          </h4>
          <p className="text-xs text-slate-400 mt-2">Maximum consecutive days meeting checkmark compliance thresholds.</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm dark:bg-slate-950 dark:border-slate-900 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Practices Handled</span>
          <h4 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{stats.totalTasksCompleted} / {stats.totalTasksAssigned}</h4>
          <p className="text-xs text-slate-400 mt-2">Sum of hydration, posture and sleep rituals completed.</p>
        </div>

      </div>

      {/* Categories Core Strengths table */}
      <div className="bg-white border rounded-2xl p-6 dark:bg-slate-950 dark:border-slate-900 shadow-sm grid gap-6 md:grid-cols-2">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block mb-1">⭐ Wellness Peak Sector</span>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">{mostCompleted}</h4>
          <p className="text-xs text-slate-400 mt-1">Your most active, highest completing bio-tracker health segment.</p>
        </div>
        
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block mb-1">🎯 Mindful Focus Opportunity</span>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">{leastCompleted}</h4>
          <p className="text-xs text-slate-400 mt-1">The category sitting lowest on compliance rate. Perfect sector to raise next!</p>
        </div>
      </div>

      {/* Interactive Actions Grid */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={downloadReportPDF}
          disabled={downloading}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-6 py-3.5 font-semibold hover:bg-slate-800 disabled:opacity-50 text-xs transition-all shadow-md dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Compiling PDF Report..." : "Download Official PDF Certificate"}
        </button>

        <button
          onClick={handleCopyShareCard}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Graduation Plaque Copied!
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              Copy Shareable Achievement Plaque
            </>
          )}
        </button>

        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-xs font-bold text-white hover:bg-emerald-600 transition-all shadow-md"
        >
          Initialize New 30-Day Cycle 🚀
        </button>
      </div>

    </div>
  );
}
