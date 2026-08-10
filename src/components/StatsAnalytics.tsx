import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, FileText, Database, Shield, Flame, 
  Upload, Check, RefreshCw, BarChart3, TrendingUp, ArrowLeft, Award, Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, Area, AreaChart 
} from 'recharts';
import { Habit, HabitLog, UserStats } from '../types';
import { 
  downloadHabitsCSV, downloadLogsCSV, exportDataJSON, 
  getPastDates 
} from '../utils/storage';
import { soundFX } from '../utils/audio';
import { STREAK_MILESTONES } from '../utils/badges';

interface StatsAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  logs: HabitLog[];
  stats: UserStats;
  onRedeemShield: () => void;
  onImportJSON: (importedData: { habits: Habit[]; logs: HabitLog[]; stats: UserStats }) => void;
  onResetSeedData: () => void;
  onResetProgressToZero: () => void;
}

export const StatsAnalytics: React.FC<StatsAnalyticsProps> = ({
  isOpen,
  onClose,
  habits,
  logs,
  stats,
  onRedeemShield,
  onImportJSON,
  onResetSeedData,
  onResetProgressToZero,
}) => {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Calculate overall completion rate
  const totalPossible = habits.length * 30; // approx 30 days
  const actualCompletions = logs.filter(l => l.completed).length;
  const overallRate = totalPossible > 0 ? Math.min(100, Math.round((actualCompletions / totalPossible) * 100)) : 0;

  // Generate 7-day daily completion data for Recharts line chart
  const past7Days = getPastDates(7);
  const weeklyChartData = past7Days.map(dStr => {
    const d = new Date(dStr + 'T00:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayDate = d.getDate();
    const label = `${dayName} ${dayDate}`;

    const totalHabits = habits.length;
    const completedCount = habits.filter(h => 
      logs.some(l => l.habitId === h.id && l.date === dStr && l.completed)
    ).length;

    const percentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

    return {
      date: dStr,
      label,
      percentage,
      completedCount,
      totalHabits,
    };
  });

  // Calculate 7-day average percentage
  const avg7DayPercent = Math.round(
    weeklyChartData.reduce((acc, curr) => acc + curr.percentage, 0) / (weeklyChartData.length || 1)
  );

  const handleExportJSON = () => {
    const jsonStr = exportDataJSON(habits, logs, stats);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJSON(true);
    soundFX.playCheerSound();
    setTimeout(() => setCopiedJSON(false), 2500);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    try {
      const parsed = JSON.parse(importText);
      if (Array.isArray(parsed.habits) && Array.isArray(parsed.logs)) {
        onImportJSON(parsed);
        setShowImportArea(false);
        soundFX.playLevelUpSound();
      } else {
        setImportError('Invalid format: Must contain "habits" and "logs" arrays.');
      }
    } catch {
      setImportError('Syntax error: Invalid JSON payload.');
    }
  };

  // Custom Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl shadow-2xl text-xs">
          <div className="font-extrabold text-slate-300 mb-1">{data.label}</div>
          <div className="flex items-center gap-1.5 text-lime-400 font-black text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>{data.percentage}% Daily Completion</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">
            {data.completedCount} of {data.totalHabits} habits marked completed
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white my-8"
          >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-lime-400 to-emerald-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-lime-500/20">
              📊
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Analytics, CSV & Cross-Platform Sync
              </h2>
              <p className="text-xs text-slate-400">Export data, review performance, and manage streak shields.</p>
            </div>
          </div>

          {/* Core Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Total Logs</div>
              <div className="text-2xl font-black text-lime-400">{logs.filter(l => l.completed).length}</div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Longest Streak</div>
              <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-amber-400" />
                {stats.longestStreakEver}d
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Consistency</div>
              <div className="text-2xl font-black text-cyan-400">{overallRate}%</div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Level & XP</div>
              <div className="text-xl font-black text-fuchsia-400">Lvl {stats.level}</div>
              <div className="text-[10px] text-slate-400">{stats.xp} XP</div>
            </div>
          </div>

          {/* Weekly 7-Day Completion Line Chart (Recharts) */}
          <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-lime-400/20 text-lime-400 rounded-xl border border-lime-400/30">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    7-Day Habit Completion Trend
                  </h3>
                  <p className="text-[11px] text-slate-400">Daily habit completion percentages over the last 7 days</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">7-Day Avg:</span>
                <span className="text-xs font-black text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-lg border border-lime-400/20">
                  {avg7DayPercent}%
                </span>
              </div>
            </div>

            {/* Recharts Area / Line Chart Container */}
            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#a3e635" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#limeGradient)" 
                    dot={{ fill: '#a3e635', r: 4, strokeWidth: 2, stroke: '#020617' }}
                    activeDot={{ r: 6, fill: '#a3e635', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Streak Shield Protection Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 rounded-2xl border border-indigo-500/40 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/40">
                <Shield className="w-6 h-6 fill-indigo-400/20" />
              </div>
              <div>
                <div className="text-sm font-black text-indigo-200">
                  Streak Protection Shields: {stats.streakShieldsAvailable} Available
                </div>
                <div className="text-xs text-indigo-300/80">
                  Shields automatically freeze your streak if you miss a day!
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRedeemShield}
              disabled={stats.xp < 200}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md"
            >
              Get Shield (200 XP)
            </motion.button>
          </div>

          {/* Global Streak Badges Showcase */}
          <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-400/20 text-amber-400 rounded-xl border border-amber-400/30">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Milestone Badges & Trophies
                  </h3>
                  <p className="text-[11px] text-slate-400">Highest active habit streak: {stats.longestStreakEver} days</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/20">
                {STREAK_MILESTONES.filter(m => stats.longestStreakEver >= m.minStreak).length} / {STREAK_MILESTONES.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STREAK_MILESTONES.map((badge) => {
                const isUnlocked = stats.longestStreakEver >= badge.minStreak;
                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isUnlocked
                        ? `bg-slate-900/90 ${badge.borderColor} ${badge.shadowColor} shadow-md`
                        : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-lg mb-2 ${
                      isUnlocked
                        ? `bg-gradient-to-br ${badge.gradient} border ${badge.borderColor}`
                        : 'bg-slate-800 border border-slate-700/60 grayscale'
                    }`}>
                      {badge.icon}
                    </div>
                    <div className="text-xs font-black text-white truncate">{badge.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{badge.minStreak} Days</div>
                    <div className="mt-2">
                      {isUnlocked ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-300 border border-lime-400/30 inline-flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Earned
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5 text-slate-500" /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export to CSV Section */}
          <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 mb-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-lime-400 mb-3 flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Progress to CSV File
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Download complete raw data tables of your habits and daily completion logs for Excel, Google Sheets, or backup.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => downloadHabitsCSV(habits, logs)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-lime-400 border border-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Download Habits CSV
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => downloadLogsCSV(habits, logs)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Download Logs CSV
              </motion.button>
            </div>
          </div>

          {/* Cross-Platform JSON Backup & Cloud Restore */}
          <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 mb-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" /> Cross-Platform JSON Backup & Restore
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Transfer your habit progress across phones, tablets, or laptop browsers instantly.
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                {copiedJSON ? <Check className="w-4 h-4 text-lime-400" /> : <Download className="w-4 h-4" />}
                <span>{copiedJSON ? 'Copied JSON to Clipboard!' : 'Copy Backup JSON'}</span>
              </button>

              <button
                onClick={() => setShowImportArea(!showImportArea)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import JSON Data</span>
              </button>

              <button
                onClick={onResetProgressToZero}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold text-xs cursor-pointer"
                title="Reset all habit progress, logs, streaks, and XP to 0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Progress to 0</span>
              </button>

              <button
                onClick={onResetSeedData}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-xl font-bold text-xs cursor-pointer ml-auto"
                title="Reload high-energy demo habits"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Demo Seed</span>
              </button>
            </div>

            {/* Import JSON textarea */}
            {showImportArea && (
              <form onSubmit={handleImportSubmit} className="mt-4 p-4 bg-slate-900 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Paste JSON Backup Payload below:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste JSON content here..."
                  rows={4}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-lime-400 font-mono focus:outline-none mb-2"
                />
                {importError && (
                  <p className="text-xs text-rose-400 mb-2 font-bold">{importError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    Load & Restore
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-lime-500/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
};
