import React, { useState, useEffect } from "react";
import { 
  BarChart2, Award, Flame, AlertCircle, Sparkles, 
  TrendingUp, CheckCircle2, ChevronRight, Activity, 
  Calendar, Info, HelpCircle
} from "lucide-react";
import { motion } from "motion/react";
import { AnalyticsStats } from "../types";

interface AnalyticsProps {
  token: string;
}

export default function Analytics({ token }: AnalyticsProps) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/challenge/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to load analytical state files.");
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <svg className="h-8 w-8 animate-spin text-emerald-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 00 5.373 4 12c0 6.627-5.373 12-12 12v-4a8 8 0 01-8-8z" />
          </svg>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Running statistical analysis...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50 p-6 dark:bg-rose-950/20 dark:border-rose-900/30">
        <div className="flex items-start gap-3 text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Failed to aggregated metrics</h4>
            <p className="text-xs mt-1">{error || "No active history recorded."}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate scores
  const scoreFactor = Math.min(100, Math.round((stats.totalTasksCompleted / (stats.totalTasksAssigned || 1)) * 100));
  
  // Custom smart insights
  const getInsights = () => {
    const list = [];
    if (scoreFactor >= 80) {
      list.push({ title: "Excellent Baseline Habit", text: "Your cellular health and mental wellness indicators match peak performance bands." });
    } else if (scoreFactor >= 50) {
      list.push({ title: "Consistent Engagement", text: "You are maintaining high task loyalty. Strengthen recovery sleep cycles to break next tier." });
    } else {
      list.push({ title: "Foundations Pending", text: "Try grouping tasks together (habit stacking) to increase compliance coefficients." });
    }

    const categoryStatsEntries = Object.entries(stats.categoryStats) as [string, { assigned: number; completed: number }][];
    const lowCats = categoryStatsEntries
      .filter(([_, value]) => value.assigned > 0 && (value.completed / value.assigned) < 0.5)
      .map(([key]) => key);

    if (lowCats.length > 0) {
      list.push({ title: "Focus Repletion", text: `Your ${lowCats.join(" and ")} metrics currently sit below optimal rates. Prioritize these next!` });
    } else if (stats.totalTasksCompleted > 0) {
      list.push({ title: "Harmonic Integrity", text: "All wellness categories are stepping balanced. This prevents systemic burnout indicators." });
    }
    return list;
  };

  // Prepare simple dynamic SVG chart dimensions
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 20;
  const dataPoints = stats.daysHistory.slice(-7); // Last 7 active entries
  const maxVal = 3; // Out of 3 maximum tasks per day

  return (
    <div className="space-y-8">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Analysis & Intelligence</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Aggregated biometric signals, habit consistency index, and challenge trends.</p>
      </div>

      {/* KPI Matrix Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <span className="text-xs font-semibold text-slate-400">Total Wellness Practices</span>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
            {stats.totalTasksCompleted} / {stats.totalTasksAssigned}
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Completed throughout the active active cycle.</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <span className="text-xs font-semibold text-slate-400">Aggregate Compliance Rate</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.completionRate}%
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Average checklist completion efficiency index.</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <span className="text-xs font-semibold text-slate-400">Active Daily Streak</span>
          <h3 className="text-2xl font-extrabold text-orange-500 dark:text-orange-400 mt-1 flex items-center gap-1">
            <Flame className="h-6 w-6 stroke-[2.5]" />
            {stats.streak} Days
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Consequent days completing at least 2 tasks.</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <span className="text-xs font-semibold text-slate-400">Circadian Reminder Signals</span>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
            {stats.notificationsSent} Triggers
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Pushes compiled and dispatched to browser client.</p>
        </div>

      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Spline Completion Trend Graph (Last 7 Days) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between border-b pb-4 dark:border-slate-900">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Practice Completion Trends</h4>
              <p className="text-[11px] text-slate-400">Completed daily task volume over active challenge entries.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>

          <div className="mt-6">
            {dataPoints.length > 0 ? (
              <div className="w-full">
                {/* SVG Spline Trendline Graph */}
                <svg className="w-full overflow-visible" height={chartHeight} viewBox={`0 0 500 ${chartHeight}`}>
                  {/* Grids */}
                  {[0, 1, 2, 3].map((grid, index) => {
                    const y = paddingY + (index * (chartHeight - 40)) / 3;
                    return (
                      <line 
                        key={index}
                        x1={paddingX} 
                        y1={y} 
                        x2={500 - paddingX} 
                        y2={y} 
                        stroke="#f1f5f9" 
                        strokeWidth={1}
                        className="dark:stroke-slate-900"
                      />
                    );
                  })}

                  {/* Draw spline lines and area nodes */}
                  {(() => {
                    const width = 500 - paddingX * 2;
                    const stepX = width / Math.max(1, dataPoints.length - 1);
                    const points = dataPoints.map((dp, idx) => {
                      const x = paddingX + idx * stepX;
                      // Max completed value is 3 tasks
                      const valPercent = dp.completed / 3;
                      const y = chartHeight - paddingY - valPercent * (chartHeight - 40);
                      return { x, y, dp };
                    });

                    const dString = points.reduce((acc, p, idx) => {
                      return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                    }, "");

                    const areaString = points.reduce((acc, p, idx) => {
                      if (idx === 0) return `M ${p.x} ${chartHeight - paddingY} L ${p.x} ${p.y}`;
                      let s = acc + ` L ${p.x} ${p.y}`;
                      if (idx === points.length - 1) {
                        s += ` L ${p.x} ${chartHeight - paddingY} Z`;
                      }
                      return s;
                    }, "");

                    return (
                      <>
                        {/* Area Gradients */}
                        <path 
                          d={areaString} 
                          fill="url(#emerald-gradient)" 
                          opacity={0.12}
                        />
                        <defs>
                          <linearGradient id="emerald-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Spline Line */}
                        <path 
                          d={dString} 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />

                        {/* Bubble Dots */}
                        {points.map((p, idx) => (
                          <g key={idx}>
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r={5} 
                              fill="#10b981" 
                              stroke="#ffffff" 
                              strokeWidth={2}
                              className="dark:stroke-slate-950 cursor-pointer"
                            />
                            {/* Value texts */}
                            <text 
                              x={p.x} 
                              y={p.y - 10} 
                              textAnchor="middle" 
                              fontSize="10" 
                              className="fill-slate-700 dark:fill-slate-350 font-bold"
                            >
                              {p.dp.completed}
                            </text>
                            
                            {/* Days labels */}
                            <text
                              x={p.x}
                              y={chartHeight - 4}
                              textAnchor="middle"
                              fontSize="9"
                              className="fill-slate-400 dark:fill-slate-500 font-semibold"
                            >
                              D{p.dp.day}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                <p className="mt-4 text-center text-[11px] text-slate-400">
                  A high-integrity spline. A perfect 3 score denotes daily wellness consistency repletion.
                </p>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Incomplete data sequence. Progress through Challenge Days to unlock spline tracking curves.
              </div>
            )}
          </div>
        </div>

        {/* Categories Repetition Performance (Radial Meters) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between">
          <div className="border-b pb-4 dark:border-slate-900">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sector Completion Reps</h4>
            <p className="text-[11px] text-slate-400">Metrics split across hydration, nutrition and focus sectors.</p>
          </div>

          <div className="mt-6 space-y-4">
            {(Object.entries(stats.categoryStats) as [string, { assigned: number; completed: number }][]).map(([key, value]) => {
              const rate = value.assigned ? Math.round((value.completed / value.assigned) * 100) : 0;
              const barColor = 
                key === "Hydration" ? "bg-blue-500" :
                key === "Nutrition" ? "bg-emerald-500" :
                key === "Physical Health" ? "bg-orange-500" :
                key === "Mental Wellness" ? "bg-purple-500" :
                "bg-amber-500";

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{key}</span>
                    <span className="text-slate-400 font-bold">
                      {value.completed}/{value.assigned} Completed ({rate}%)
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${barColor} transition-all duration-300`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] text-slate-400 leading-normal">
            Each correct wellness cycle expands category completion sectors proportionally.
          </p>
        </div>

      </div>

      {/* Intelligence & Clinicial Guidance Recommendations block */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-6 dark:border-indigo-950/20 dark:bg-indigo-950/10">
        <h4 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-350 flex items-center gap-1.5 mb-4">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          DailyHabit Insights Engine
        </h4>

        <div className="grid gap-6 md:grid-cols-2">
          {getInsights().map((insight, idx) => (
            <div key={idx} className="space-y-1 bg-white p-4 rounded-xl shadow-sm border border-indigo-50 dark:bg-slate-950 dark:border-indigo-900/40">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {insight.title}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                {insight.text}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
