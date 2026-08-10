import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, X, Timer, ChevronDown, Check } from 'lucide-react';
import { Habit } from '../types';
import { soundFX } from '../utils/audio';

interface PomodoroTimerProps {
  habits: Habit[];
  onTimerComplete: (habitId: string, event?: React.MouseEvent) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ habits, onTimerComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHabitPicker, setShowHabitPicker] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-suggest study/timed habits
  const timedHabits = habits.filter(h => h.unit === 'mins' || h.unit === 'session');
  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  const selectHabit = useCallback((habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    setSelectedHabitId(habitId);
    setShowHabitPicker(false);
    setIsRunning(false);
    setIsCompleted(false);
    if (habit && habit.unit === 'mins') {
      const secs = habit.targetCount * 60;
      setTotalSeconds(secs);
      setRemainingSeconds(secs);
    } else {
      setTotalSeconds(25 * 60);
      setRemainingSeconds(25 * 60);
    }
  }, [habits]);

  // Timer countdown
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            soundFX.playLevelUpSound();
            // Auto-complete the habit
            if (selectedHabitId) {
              onTimerComplete(selectedHabitId);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remainingSeconds, selectedHabitId, onTimerComplete]);

  const toggleTimer = () => {
    if (isCompleted) return;
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setRemainingSeconds(totalSeconds);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  // Ring dimensions
  const size = 140;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-2xl shadow-2xl cursor-pointer transition-all ${
          isRunning
            ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-slate-950 shadow-lime-500/30 animate-pulse'
            : 'bg-slate-800 text-lime-400 border border-slate-700 hover:border-lime-500/50'
        }`}
        title="Pomodoro Timer"
      >
        <Timer className="w-6 h-6" />
        {isRunning && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-slate-950 text-lime-400 text-[9px] font-black rounded-full border border-lime-500/50">
            {formatTime(remainingSeconds)}
          </span>
        )}
      </motion.button>

      {/* Timer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-6 z-40 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-slate-950/80 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-lime-400" />
                <span className="text-sm font-black text-white uppercase tracking-wider">Focus Timer</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-700 rounded-lg cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center">
              {/* Habit Picker */}
              <div className="w-full mb-4 relative">
                <button
                  onClick={() => setShowHabitPicker(!showHabitPicker)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white cursor-pointer hover:border-lime-500/50 transition-colors"
                >
                  <span className="truncate">
                    {selectedHabit ? selectedHabit.title : 'Select a habit to focus on...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>

                <AnimatePresence>
                  {showHabitPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 max-h-40 overflow-y-auto"
                    >
                      {timedHabits.length > 0 ? (
                        <>
                          <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-700">
                            Suggested (timed habits)
                          </div>
                          {timedHabits.map(h => (
                            <button
                              key={h.id}
                              onClick={() => selectHabit(h.id)}
                              className="w-full px-3 py-2 text-left text-xs text-white hover:bg-slate-700 cursor-pointer flex items-center justify-between"
                            >
                              <span className="truncate">{h.title}</span>
                              <span className="text-[10px] text-slate-500 shrink-0 ml-2">{h.targetCount} {h.unit}</span>
                            </button>
                          ))}
                        </>
                      ) : null}
                      {habits.filter(h => !timedHabits.includes(h)).length > 0 && (
                        <>
                          <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-700">
                            Other habits
                          </div>
                          {habits.filter(h => !timedHabits.includes(h)).map(h => (
                            <button
                              key={h.id}
                              onClick={() => selectHabit(h.id)}
                              className="w-full px-3 py-2 text-left text-xs text-white hover:bg-slate-700 cursor-pointer"
                            >
                              {h.title}
                            </button>
                          ))}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Timer Ring */}
              <div className="relative mb-4">
                <svg width={size} height={size} className="transform -rotate-90">
                  <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={strokeWidth}
                  />
                  <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={isCompleted ? '#a3e635' : isRunning ? '#22d3ee' : '#64748b'}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black tabular-nums ${
                    isCompleted ? 'text-lime-400' : isRunning ? 'text-cyan-400' : 'text-white'
                  }`}>
                    {formatTime(remainingSeconds)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {isCompleted ? '🎉 Done!' : isRunning ? 'Focusing...' : 'Ready'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={resetTimer}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-5 h-5 text-slate-400" />
                </button>

                <button
                  onClick={toggleTimer}
                  disabled={!selectedHabitId || isCompleted}
                  className={`p-4 rounded-2xl font-black cursor-pointer transition-all ${
                    !selectedHabitId || isCompleted
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : isRunning
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/30'
                        : 'bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 hover:from-lime-300 hover:to-emerald-300 shadow-lg shadow-lime-500/30'
                  }`}
                  title={isRunning ? 'Pause' : 'Start'}
                >
                  {isRunning ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950" />}
                </button>

                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-3 bg-lime-500/20 rounded-xl border border-lime-500/40"
                  >
                    <Check className="w-5 h-5 text-lime-400" />
                  </motion.div>
                )}
              </div>

              {isCompleted && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-xs font-bold text-lime-400 text-center"
                >
                  ✅ Habit auto-completed! +50 XP
                </motion.p>
              )}

              {!selectedHabitId && (
                <p className="mt-3 text-[10px] text-slate-500 text-center font-bold">
                  Select a habit above to start the timer
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
