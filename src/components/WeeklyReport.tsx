import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, TrendingUp, Clock, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { formatDate } from '../utils/storage';

interface WeeklyReportProps {
  habits: Habit[];
  logs: HabitLog[];
}

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ habits, logs }) => {
  const [view, setView] = useState<'week' | 'month'>('week');

  const reportData = useMemo(() => {
    const now = new Date();
    const daysBack = view === 'week' ? 7 : 30;

    // Generate date range
    const dates: string[] = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(formatDate(d));
    }

    // Per-habit completion rate
    const habitStats = habits.map(h => {
      const habitLogs = logs.filter(l => l.habitId === h.id && l.completed && dates.includes(l.date));
      const rate = dates.length > 0 ? (habitLogs.length / dates.length) * 100 : 0;
      return { habit: h, completions: habitLogs.length, rate, total: dates.length };
    });

    // Daily completion counts
    const dailyData = dates.map(date => {
      const dayLogs = logs.filter(l => l.date === date && l.completed);
      const completedCount = new Set(dayLogs.map(l => l.habitId)).size;
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      return { date, dayOfWeek, completed: completedCount, total: habits.length };
    });

    // Best and worst days
    const bestDay = dailyData.reduce((best, d) => d.completed > best.completed ? d : best, dailyData[0] || { date: '', dayOfWeek: '-', completed: 0, total: 0 });
    const worstDay = dailyData.reduce((worst, d) => d.completed < worst.completed ? d : worst, dailyData[0] || { date: '', dayOfWeek: '-', completed: 0, total: 0 });

    // Total study hours (habits with unit = 'mins')
    const studyHabits = habits.filter(h => h.unit === 'mins');
    const totalStudyMins = studyHabits.reduce((sum, h) => {
      const completions = logs.filter(l => l.habitId === h.id && l.completed && dates.includes(l.date)).length;
      return sum + (completions * h.targetCount);
    }, 0);
    const totalStudyHours = Math.round(totalStudyMins / 60 * 10) / 10;

    // Overall completion rate
    const totalPossible = dates.length * habits.length;
    const totalCompleted = logs.filter(l => l.completed && dates.includes(l.date)).length;
    const overallRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return { habitStats, dailyData, bestDay, worstDay, totalStudyHours, overallRate, dates };
  }, [habits, logs, view]);

  const maxDaily = Math.max(...reportData.dailyData.map(d => d.total), 1);

  return (
    <div className="mb-8 rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                {view === 'week' ? 'Weekly' : 'Monthly'} Report
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold">
                {view === 'week' ? 'Last 7 days' : 'Last 30 days'} performance overview
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            {(['week', 'month'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                  view === v
                    ? 'bg-lime-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {v === 'week' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 sm:p-6 border-b border-slate-800">
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
          <div className="text-xl sm:text-2xl font-black text-lime-400">{reportData.overallRate}%</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</div>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
          <div className="text-xl sm:text-2xl font-black text-cyan-400">{reportData.totalStudyHours}h</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Study Hours</div>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
          <div className="text-xl sm:text-2xl font-black text-emerald-400">{reportData.bestDay?.dayOfWeek || '-'}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Day</div>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
          <div className="text-xl sm:text-2xl font-black text-rose-400">{reportData.worstDay?.dayOfWeek || '-'}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weakest Day</div>
        </div>
      </div>

      {/* Daily Activity Bars */}
      <div className="p-5 sm:p-6 border-b border-slate-800">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-purple-400" />
          Daily Completions
        </h4>
        <div className="flex items-end gap-1 h-24 sm:h-32">
          {reportData.dailyData.map((day, i) => {
            const heightPercent = maxDaily > 0 ? (day.completed / maxDaily) * 100 : 0;
            const isToday = i === reportData.dailyData.length - 1;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-[8px] font-bold text-slate-500">{day.completed}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPercent, 4)}%` }}
                  transition={{ duration: 0.4, delay: i * 0.02 }}
                  className={`w-full rounded-t-md min-h-[3px] ${
                    isToday
                      ? 'bg-gradient-to-t from-lime-500 to-emerald-400'
                      : day.completed === day.total && day.total > 0
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        : day.completed > 0
                          ? 'bg-gradient-to-t from-slate-600 to-slate-500'
                          : 'bg-slate-800'
                  }`}
                />
                {(view === 'week' || i % 5 === 0 || isToday) && (
                  <span className={`text-[8px] font-bold ${isToday ? 'text-lime-400' : 'text-slate-600'}`}>
                    {day.dayOfWeek}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Habit Breakdown */}
      <div className="p-5 sm:p-6">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          Per-Habit Performance
        </h4>
        <div className="space-y-2.5">
          {reportData.habitStats.map((item, i) => (
            <div key={item.habit.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-white truncate min-w-0 flex-1 max-w-[180px]">
                {item.habit.title}
              </span>
              <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden min-w-[80px]">
                <motion.div
                  className={`h-full rounded-full ${
                    item.rate >= 80 ? 'bg-gradient-to-r from-lime-500 to-emerald-400' :
                    item.rate >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                    'bg-gradient-to-r from-rose-500 to-red-400'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.rate}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              </div>
              <span className="text-xs font-black text-slate-300 w-12 text-right">
                {Math.round(item.rate)}%
              </span>
              <span className="text-[10px] text-slate-500 font-bold w-14 text-right">
                {item.completions}/{item.total}d
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
