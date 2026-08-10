import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, CheckCircle2, Shield, Trophy, Zap, 
  Sparkles, LayoutGrid, Award, ArrowUpRight, Check,
  Calendar, Layers, Target, ChevronDown, ChevronUp
} from 'lucide-react';
import { Habit, HabitLog, UserStats } from '../types';
import { getTodayString, getPastDates, CATEGORY_COLORS } from '../utils/storage';
import { soundFX } from '../utils/audio';

interface HabitWidgetsProps {
  habits: Habit[];
  logs: HabitLog[];
  stats: UserStats;
  todayLogsMap: Map<string, HabitLog>;
  onToggleComplete: (habitId: string, event?: React.MouseEvent) => void;
  onUpdateCount: (habitId: string, delta: number, event?: React.MouseEvent) => void;
  onRedeemShield: () => void;
  onOpenStats: () => void;
  onOpenAICoach: () => void;
}

export const HabitWidgets: React.FC<HabitWidgetsProps> = ({
  habits,
  logs,
  stats,
  todayLogsMap,
  onToggleComplete,
  onUpdateCount,
  onRedeemShield,
  onOpenStats,
  onOpenAICoach,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeWidgetTab, setActiveWidgetTab] = useState<'all' | 'quick' | 'consistency' | 'rank'>('all');

  const todayStr = getTodayString();
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter(h => todayLogsMap.get(h.id)?.completed).length;

  // 7-day consistency calculation
  const past7Days = getPastDates(7);
  let total7DayPossible = past7Days.length * (totalHabits || 1);
  let total7DayCompleted = 0;

  const dayBadges = past7Days.map(dStr => {
    const d = new Date(dStr + 'T00:00:00');
    const dayLetter = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const dayNum = d.getDate();
    
    const countCompleted = habits.filter(h => 
      logs.some(l => l.habitId === h.id && l.date === dStr && l.completed)
    ).length;

    total7DayCompleted += countCompleted;

    const isAllDone = totalHabits > 0 && countCompleted === totalHabits;
    const isPartial = countCompleted > 0 && !isAllDone;

    return {
      date: dStr,
      dayLetter,
      dayNum,
      countCompleted,
      totalHabits,
      isAllDone,
      isPartial,
      isToday: dStr === todayStr,
    };
  });

  const percent7Day = total7DayPossible > 0 ? Math.round((total7DayCompleted / total7DayPossible) * 100) : 0;

  // Spotlight Priority Habit (Uncompleted with highest streak, or first habit)
  const spotlightHabit = habits
    .filter(h => !todayLogsMap.get(h.id)?.completed)
    .sort((a, b) => b.streak - a.streak)[0] || habits[0];

  // Level & XP math
  const currentXPInLevel = stats.xp % 500;
  const xpNeededForNext = 500 - currentXPInLevel;
  const levelProgressPercent = Math.min(100, Math.round((currentXPInLevel / 500) * 100));

  const getRankTitle = (lvl: number) => {
    if (lvl >= 10) return 'Legendary Titan';
    if (lvl >= 7) return 'Master Streak Grandmaster';
    if (lvl >= 5) return 'Habit Champion';
    if (lvl >= 3) return 'Streak Warrior';
    return 'Habit Initiate';
  };

  return (
    <div className="mb-8">
      {/* Widget Section Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-lime-400/20 to-emerald-400/20 text-lime-400 border border-lime-400/30 rounded-xl shadow-md">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Interactive Habit Widgets</span>
              <span className="text-[10px] bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded-full border border-lime-400/20 font-bold">
                Dashboard Mini Apps
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Quick action widgets for high-speed tracking & insights</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Widget Filter Tabs */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-[11px] font-bold">
            {(['all', 'quick', 'consistency', 'rank'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveWidgetTab(tab)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  activeWidgetTab === tab
                    ? 'bg-lime-400 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Widgets Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* WIDGET 1: Quick Check-in Mini Widget */}
            {(activeWidgetTab === 'all' || activeWidgetTab === 'quick') && (
              <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/5 rounded-full blur-xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-lime-400 bg-lime-400/10 px-2.5 py-1 rounded-full border border-lime-400/20 flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-lime-400" /> Quick Log
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {completedTodayCount}/{totalHabits} Done
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white mb-2">Today's Fast Track</h4>

                  {/* Habit checklist list */}
                  <div className="space-y-2 mb-3 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                    {habits.slice(0, 4).map(h => {
                      const log = todayLogsMap.get(h.id);
                      const isDone = log?.completed;

                      return (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="text-sm shrink-0">{h.icon}</span>
                            <span className={`text-xs font-extrabold truncate ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {h.title}
                            </span>
                          </div>

                          <button
                            onClick={(e) => onToggleComplete(h.id, e)}
                            className={`p-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shrink-0 ${
                              isDone
                                ? 'bg-lime-400 text-slate-950 shadow-sm shadow-lime-500/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-medium text-center border-t border-slate-800/80 pt-2">
                  Tap checkmarks to launch confetti explosion
                </div>
              </div>
            )}

            {/* WIDGET 2: 7-Day Consistency & Matrix Widget */}
            {(activeWidgetTab === 'all' || activeWidgetTab === 'consistency') && (
              <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Consistency
                    </span>
                    <span className="text-xs font-black text-cyan-400">
                      {percent7Day}% Avg
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white mb-1">7-Day Weekly Rhythm</h4>
                  <p className="text-[11px] text-slate-400 mb-3">Habit adherence for past 7 days</p>

                  {/* Day circles row */}
                  <div className="grid grid-cols-7 gap-1.5 mb-3">
                    {dayBadges.map((day, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col items-center p-1.5 rounded-xl border text-center transition-all ${
                          day.isToday
                            ? 'bg-cyan-500/10 border-cyan-400/50 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{day.dayLetter}</span>
                        <span className="text-[10px] font-extrabold text-white mb-1">{day.dayNum}</span>
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            day.isAllDone
                              ? 'bg-lime-400 shadow-sm shadow-lime-400'
                              : day.isPartial
                              ? 'bg-amber-400'
                              : 'bg-slate-800'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={onOpenStats}
                  className="w-full flex items-center justify-center gap-1 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-cyan-300 font-bold text-[11px] uppercase rounded-xl border border-slate-700/60 transition-colors cursor-pointer"
                >
                  <span>Detailed Analytics</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* WIDGET 3: Streak & Protection Shield Widget */}
            {(activeWidgetTab === 'all' || activeWidgetTab === 'rank') && (
              <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-amber-400" /> Streak Shield
                    </span>
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      {stats.streakShieldsAvailable} Available
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white mb-1">Streak Momentum</h4>

                  <div className="flex items-center gap-3 my-3 p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Flame className="w-7 h-7 text-amber-400 fill-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-amber-300">
                        {stats.currentStreakTotal} <span className="text-xs font-bold text-slate-400">Days Active</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Best Streak Ever: <strong className="text-amber-400">{stats.longestStreakEver}d</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onRedeemShield}
                    disabled={stats.xp < 200}
                    className="flex-1 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 disabled:opacity-40 text-indigo-300 border border-indigo-500/30 font-extrabold text-[11px] uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Buy Shield (200 XP)</span>
                  </button>
                </div>
              </div>
            )}

            {/* WIDGET 4: Level Rank & XP Progress Widget */}
            {(activeWidgetTab === 'all' || activeWidgetTab === 'rank') && (
              <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/5 rounded-full blur-xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-full border border-purple-400/20 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-purple-400" /> Rank Badge
                    </span>
                    <span className="text-xs font-black text-purple-300">
                      Level {stats.level}
                    </span>
                  </div>

                  <div className="mb-2">
                    <h4 className="text-sm font-black text-white">{getRankTitle(stats.level)}</h4>
                    <p className="text-[11px] text-slate-400">Total XP: {stats.xp} pts</p>
                  </div>

                  {/* Level Progress Bar */}
                  <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800 mb-3">
                    <div className="flex justify-between items-center text-[10px] font-extrabold mb-1">
                      <span className="text-slate-400 uppercase">Progress to Lvl {stats.level + 1}</span>
                      <span className="text-purple-300">{currentXPInLevel} / 500 XP</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 rounded-full transition-all duration-500"
                        style={{ width: `${levelProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenAICoach}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 font-extrabold text-[11px] uppercase rounded-xl border border-purple-500/30 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Get AI Coach Advice</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
