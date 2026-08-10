import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Calendar, CheckCircle2, Circle, Filter, X, 
  ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, 
  Sparkles, FileText, Check, ArrowRight
} from 'lucide-react';
import { Habit, HabitLog, HabitCategory } from '../types';
import { getPastDates, getTodayString, CATEGORY_COLORS } from '../utils/storage';

interface StreakHeatmapProps {
  habits: Habit[];
  logs: HabitLog[];
  onToggleDateLog?: (habitId: string, dateStr: string) => void;
  onSaveDateNote?: (habitId: string, dateStr: string, note: string) => void;
}

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({
  habits,
  logs,
  onToggleDateLog,
  onSaveDateNote,
}) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'calendar' | 'split'>('matrix');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inspectedDate, setInspectedDate] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string>('');

  const past30Days = getPastDates(30);
  const today = getTodayString();

  // Create quick log lookup map: "habitId_dateStr" -> HabitLog
  const logMap = new Map<string, HabitLog>();
  logs.forEach(l => {
    if (l.completed) {
      logMap.set(`${l.habitId}_${l.date}`, l);
    }
  });

  // Filtered habits according to selected category filter
  const filteredHabits = habits.filter(h => 
    selectedCategory === 'all' || h.category === selectedCategory
  );

  // Compute daily completion scores for past 30 days
  const dateSummaries = past30Days.map(dStr => {
    const totalHabits = filteredHabits.length;
    const completedCount = filteredHabits.filter(h => logMap.has(`${h.id}_${dStr}`)).length;
    const percent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
    
    return {
      date: dStr,
      completedCount,
      totalHabits,
      percent,
    };
  });

  // Open Inspector Modal for a date
  const handleOpenInspector = (dateStr: string) => {
    setInspectedDate(dateStr);
    // Find notes for this date if any
    const existingLogWithNote = logs.find(l => l.date === dateStr && l.notes && l.notes.trim().length > 0);
    setEditingNote(existingLogWithNote?.notes || '');
  };

  // Close Inspector Modal
  const handleCloseInspector = () => {
    setInspectedDate(null);
    setEditingNote('');
  };

  useEffect(() => {
    if (inspectedDate) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleCloseInspector();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [inspectedDate]);

  // Navigate date in inspector
  const handleStepInspectorDate = (deltaDays: number) => {
    if (!inspectedDate) return;
    const curr = new Date(inspectedDate);
    curr.setDate(curr.getDate() + deltaDays);
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const nextStr = `${y}-${m}-${d}`;
    handleOpenInspector(nextStr);
  };

  // Helper for heatmap cell color intensity
  const getHeatmapColor = (percent: number, isDone = false) => {
    if (isDone) {
      return 'bg-gradient-to-tr from-lime-400 to-emerald-400 border-lime-300 text-slate-950 font-black shadow-md shadow-lime-500/20';
    }
    if (percent === 0) return 'bg-slate-800/60 border-slate-700/50 text-slate-500';
    if (percent <= 25) return 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400';
    if (percent <= 50) return 'bg-emerald-800/90 border-emerald-600/70 text-emerald-200';
    if (percent <= 75) return 'bg-emerald-600 border-emerald-400 text-white font-bold shadow-sm shadow-emerald-500/20';
    return 'bg-gradient-to-tr from-lime-400 to-emerald-400 border-lime-300 text-slate-950 font-black shadow-md shadow-lime-500/30';
  };

  // Build true Calendar Week Matrix (Sun - Sat) for past 30 days window
  // Find weekday of first date in past30Days
  const firstDateObj = new Date(past30Days[0]);
  const startDayOfWeek = firstDateObj.getDay(); // 0 = Sun, 1 = Mon, ...
  
  // Create padding blank slots before first date
  const calendarGridCells: Array<{ dateStr: string | null; dateObj?: Date; summary?: typeof dateSummaries[0] }> = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarGridCells.push({ dateStr: null });
  }
  past30Days.forEach(dStr => {
    const summary = dateSummaries.find(s => s.date === dStr);
    calendarGridCells.push({
      dateStr: dStr,
      dateObj: new Date(dStr),
      summary,
    });
  });

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl text-white my-8 relative overflow-hidden">
      
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Controls & View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-lime-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-white">
              30-Day Activity Heatmap & Calendar Matrix
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">
              Synthesized visual matrix grid and interactive month calendar with activity density.
            </p>
          </div>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start lg:self-auto">
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Matrix Grid</span>
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Calendar View</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Synthesized Split</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills & Heatmap Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-800/80 relative z-10">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Habits' },
            { id: 'fitness', label: 'Fitness' },
            { id: 'mindset', label: 'Mindset' },
            { id: 'productivity', label: 'Productivity' },
            { id: 'health', label: 'Health' },
            { id: 'learning', label: 'Growth' },
            { id: 'creativity', label: 'Creativity' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-slate-200 text-slate-950 border-white'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <span className="text-[11px] font-bold">Activity:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-md bg-slate-800 border border-slate-700/50" title="0%" />
            <span className="w-3 h-3 rounded-md bg-emerald-950 border border-emerald-800" title="1-25%" />
            <span className="w-3 h-3 rounded-md bg-emerald-700 border border-emerald-600" title="26-50%" />
            <span className="w-3 h-3 rounded-md bg-emerald-500 border border-emerald-400" title="51-75%" />
            <span className="w-3 h-3 rounded-md bg-lime-400 border border-lime-300" title="76-100%" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold">Less → More</span>
        </div>
      </div>

      {/* MATRIX VIEW */}
      {(viewMode === 'matrix' || viewMode === 'split') && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-lime-400" />
              Habit Rows × 30-Day Column Matrix
            </h4>
            <span className="text-[11px] text-slate-400 font-semibold">
              Click any cell to toggle completion • Click date header to inspect day
            </span>
          </div>

          <div className="overflow-x-auto pb-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <div className="min-w-[700px]">
              
              {/* Date Column Headers */}
              <div className="flex items-center gap-1.5 mb-3 pl-40">
                {past30Days.map((dStr, idx) => {
                  const d = new Date(dStr);
                  const dayNum = d.getDate();
                  const isToday = dStr === today;

                  return (
                    <button
                      key={dStr}
                      onClick={() => handleOpenInspector(dStr)}
                      className={`w-6 text-center text-[10px] font-extrabold transition-all cursor-pointer rounded-md ${
                        isToday 
                          ? 'text-lime-400 bg-lime-400/20 py-1 border border-lime-400/40 font-black' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800 py-0.5'
                      }`}
                      title={`Inspect ${dStr}`}
                    >
                      {idx % 5 === 0 || isToday ? dayNum : ''}
                    </button>
                  );
                })}
              </div>

              {/* Habit Matrix Rows */}
              <div className="space-y-2.5">
                {filteredHabits.map((habit) => {
                  const completedCount = past30Days.filter(d => logMap.has(`${habit.id}_${d}`)).length;
                  const rate = Math.round((completedCount / 30) * 100);

                  return (
                    <div key={habit.id} className="flex items-center gap-1.5 group">
                      
                      {/* Habit Name & Completion Rate Column */}
                      <div className="w-40 shrink-0 flex items-center justify-between pr-3">
                        <span className="text-xs font-bold text-slate-200 truncate group-hover:text-lime-400 transition-colors">
                          {habit.icon} {habit.title}
                        </span>
                        <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                          {rate}%
                        </span>
                      </div>

                      {/* Day Cells */}
                      {past30Days.map((dStr) => {
                        const isDone = logMap.has(`${habit.id}_${dStr}`);
                        const isToday = dStr === today;

                        return (
                          <motion.button
                            key={dStr}
                            whileHover={{ scale: 1.3, zIndex: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onToggleDateLog && onToggleDateLog(habit.id, dStr)}
                            className={`w-6 h-6 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer border ${
                              isDone
                                ? 'bg-gradient-to-tr from-lime-400 to-emerald-400 border-lime-300 shadow-sm shadow-lime-500/30 text-slate-950 font-black'
                                : isToday
                                ? 'bg-slate-800/90 border-lime-400/60 hover:bg-slate-700'
                                : 'bg-slate-900 hover:bg-slate-800 border-slate-800'
                            }`}
                            title={`${habit.title} on ${dStr}: ${isDone ? 'Completed 🔥' : 'Click to mark done'}`}
                          >
                            {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SYNTHESIZED CALENDAR VIEW */}
      {(viewMode === 'calendar' || viewMode === 'split') && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-lime-400" />
              Synthesized Calendar Heatmap (Sun - Sat Grid)
            </h4>
            <span className="text-[11px] text-slate-400 font-semibold">
              Click any calendar day to open detailed day inspector & journal
            </span>
          </div>

          {/* 7-Column Calendar Grid Header */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-[11px] font-black uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-800">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarGridCells.map((cell, idx) => {
                if (!cell.dateStr || !cell.dateObj) {
                  return <div key={`blank-${idx}`} className="h-16 sm:h-20 rounded-2xl bg-slate-950/30 border border-slate-900/40" />;
                }

                const { dateStr, dateObj, summary } = cell;
                const isToday = dateStr === today;
                const dayNum = dateObj.getDate();
                const monthName = dateObj.toLocaleString('default', { month: 'short' });
                const percent = summary ? summary.percent : 0;
                const completedCount = summary ? summary.completedCount : 0;
                const totalHabits = summary ? summary.totalHabits : 0;

                // Completed habit icons for this date
                const doneHabitsForDate = filteredHabits.filter(h => logMap.has(`${h.id}_${dateStr}`));

                return (
                  <motion.div
                    key={dateStr}
                    whileHover={{ scale: 1.04, zIndex: 10 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleOpenInspector(dateStr)}
                    className={`h-20 sm:h-24 p-2 sm:p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                      isToday
                        ? 'ring-2 ring-lime-400/80 shadow-lg shadow-lime-500/20'
                        : ''
                    } ${getHeatmapColor(percent)}`}
                  >
                    {/* Top Row: Day Number & Month Label */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs sm:text-sm font-black ${percent > 75 ? 'text-slate-950' : 'text-white'}`}>
                        {dayNum} <span className="text-[9px] font-bold opacity-75">{dayNum === 1 ? monthName : ''}</span>
                      </span>

                      {/* Today Badge */}
                      {isToday && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-950 text-lime-400 border border-lime-400/40">
                          TODAY
                        </span>
                      )}

                      {/* Completion Ratio Pill */}
                      {totalHabits > 0 && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                          percent > 75 
                            ? 'bg-slate-950 text-lime-400' 
                            : percent > 0 
                            ? 'bg-slate-900/80 text-emerald-300' 
                            : 'bg-slate-900/60 text-slate-500'
                        }`}>
                          {completedCount}/{totalHabits}
                        </span>
                      )}
                    </div>

                    {/* Mini Habit Completion Indicators */}
                    <div className="flex flex-wrap items-center gap-1 my-1">
                      {doneHabitsForDate.slice(0, 4).map(h => (
                        <span 
                          key={h.id} 
                          className="w-2 h-2 rounded-full bg-lime-400 border border-lime-200 shadow-sm"
                          title={h.title}
                        />
                      ))}
                      {doneHabitsForDate.length > 4 && (
                        <span className="text-[8px] font-bold text-slate-300">+{doneHabitsForDate.length - 4}</span>
                      )}
                    </div>

                    {/* Bottom Progress Bar */}
                    <div className="w-full bg-slate-950/40 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          percent > 75 ? 'bg-slate-950' : 'bg-lime-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE DAY INSPECTOR MODAL */}
      <AnimatePresence>
        {inspectedDate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseInspector}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg max-h-[90vh] overflow-y-auto w-full shadow-2xl text-white relative my-8"
            >
              {/* Glow background */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-lime-400/10 rounded-full blur-2xl pointer-events-none" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-lime-400 tracking-wider">
                      DAY INSPECTOR & JOURNAL
                    </span>
                    {inspectedDate === today && (
                      <span className="text-[10px] font-black px-2 py-0.5 bg-lime-400/20 text-lime-400 rounded-full border border-lime-400/30">
                        TODAY
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    {new Date(inspectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>
                </div>

                <button
                  onClick={handleCloseInspector}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Day Date Stepper Controls */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800 mb-6">
                <button
                  onClick={() => handleStepInspectorDate(-1)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Day
                </button>

                <span className="text-xs font-extrabold text-slate-400">
                  {inspectedDate}
                </span>

                <button
                  onClick={() => handleStepInspectorDate(1)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Next Day <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Habit Checklist for Inspected Date */}
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Habit Log Checklist ({filteredHabits.filter(h => logMap.has(`${h.id}_${inspectedDate}`)).length} / {filteredHabits.length} Done)
                </h4>

                {filteredHabits.map(habit => {
                  const isDone = logMap.has(`${habit.id}_${inspectedDate}`);

                  return (
                    <motion.div
                      key={habit.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => onToggleDateLog && onToggleDateLog(habit.id, inspectedDate)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-lime-400/10 border-lime-400/40 text-white'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                          isDone 
                            ? 'bg-lime-400 border-lime-300 text-slate-950' 
                            : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Circle className="w-3.5 h-3.5 text-slate-600" />}
                        </div>
                        <div>
                          <div className="text-xs font-black flex items-center gap-1.5">
                            <span>{habit.icon}</span>
                            <span>{habit.title}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Target: {habit.targetCount} {habit.unit}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isDone 
                          ? 'bg-lime-400/20 text-lime-400 border-lime-400/30' 
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        {isDone ? 'Completed 🔥' : 'Pending'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Reflection / Journal Notes Input */}
              <div className="mb-6">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Day Reflection & Journal Note
                </label>
                <textarea
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  placeholder="Record your mindset, key wins, energy levels, or notes for this date..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-lime-400 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors h-20 resize-none"
                />
                {editingNote.trim().length > 0 && (
                  <button
                    onClick={() => {
                      if (filteredHabits.length > 0 && onSaveDateNote) {
                        onSaveDateNote(filteredHabits[0].id, inspectedDate, editingNote);
                      }
                    }}
                    className="mt-2 text-xs font-bold text-lime-400 hover:text-lime-300 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Save Journal Note
                  </button>
                )}
              </div>

              {/* Modal Footer */}
              <button
                onClick={handleCloseInspector}
                className="w-full py-3 bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg cursor-pointer"
              >
                Done Inspecting Day
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

