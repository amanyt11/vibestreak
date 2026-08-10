import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { 
  Check, Flame, Plus, Minus, Bell, BellOff, MoreVertical, 
  Edit3, Trash2, Shield, StickyNote, Award, Lock, Sparkles, X, ArrowLeft, Mic, MicOff,
  AlertTriangle, TrendingDown, ChevronDown, ChevronUp, ShieldAlert
} from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { CATEGORY_COLORS, getTodayString } from '../utils/storage';
import { soundFX } from '../utils/audio';
import { 
  STREAK_MILESTONES, getEarnedBadges, getHighestBadge, getNextBadge, StreakBadge 
} from '../utils/badges';

const AnimatedStreakNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        setDisplayValue(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span className="tabular-nums font-bold inline-block">{displayValue}</span>;
};

interface HabitCardProps {
  habit: Habit;
  todayLog?: HabitLog;
  onToggleComplete: (habitId: string, event?: React.MouseEvent) => void;
  onUpdateCount: (habitId: string, delta: number, event?: React.MouseEvent) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onSaveNote: (habitId: string, note: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  todayLog,
  onToggleComplete,
  onUpdateCount,
  onEdit,
  onDelete,
  onSaveNote,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [noteText, setNoteText] = useState(todayLog?.notes || '');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Synchronize modal state & clean speech recognition when closed
  useEffect(() => {
    if (showNoteModal) {
      setNoteText(todayLog?.notes || '');
      setSpeechError(null);
    } else if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
    }
  }, [showNoteModal, todayLog?.notes]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Web Speech API is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        const initialBase = noteText;

        recognition.onstart = () => {
          setIsListening(true);
          soundFX.playClickSound();
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          const updated = initialBase ? `${initialBase} ${transcript}`.trim() : transcript.trim();
          setNoteText(updated);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone permission denied.');
          } else if (event.error !== 'no-speech') {
            setSpeechError(`Speech error: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        setSpeechError('Could not start speech recognition.');
        setIsListening(false);
      }
    }
  };

  const isCompletedToday = todayLog?.completed ?? false;
  const currentCount = todayLog?.count ?? 0;
  const isMultiStep = habit.targetCount > 1;
  const categoryStyle = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.fitness;

  const isOverdueSchedule = React.useMemo(() => {
    if (isCompletedToday || !habit.reminderTime) return false;
    const now = new Date();
    const [remHour, remMin] = habit.reminderTime.split(':').map(Number);
    if (isNaN(remHour) || isNaN(remMin)) return false;
    const habitMinutes = remHour * 60 + remMin;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes > habitMinutes;
  }, [isCompletedToday, habit.reminderTime]);

  // Synchronized streak badge state tracking
  const [earnedBadges, setEarnedBadges] = useState<StreakBadge[]>(() => getEarnedBadges(habit.streak));
  const [highestBadge, setHighestBadge] = useState<StreakBadge | null>(() => getHighestBadge(habit.streak));
  const [nextBadgeInfo, setNextBadgeInfo] = useState<{ badge: StreakBadge; daysNeeded: number } | null>(() => getNextBadge(habit.streak));

  // Synchronize badge icons immediately upon streak state mutation
  useEffect(() => {
    setEarnedBadges(getEarnedBadges(habit.streak));
    setHighestBadge(getHighestBadge(habit.streak));
    setNextBadgeInfo(getNextBadge(habit.streak));
  }, [habit.streak]);

  const handleCheckIn = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onToggleComplete(habit.id, e);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateCount(habit.id, 1, e);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentCount > 0) {
      onUpdateCount(habit.id, -1);
    }
  };

  const handleSaveNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNote(habit.id, noteText);
    setShowNoteModal(false);
  };

  // Progress ratio calculation
  const progressPercent = Math.min(100, Math.round((currentCount / habit.targetCount) * 100));

  // Swipe-to-complete motion values
  const x = useMotionValue(0);
  const backgroundOpacity = useTransform(x, [0, 80], [0, 1]);
  const checkScale = useTransform(x, [0, 80], [0.6, 1.2]);
  const textOpacity = useTransform(x, [10, 60], [0, 1]);

  const handleDragEnd = (_event: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x > 70 || info.velocity.x > 250) {
      handleCheckIn();
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden group/swipe select-none">
      {/* Swipe Background Action Banner */}
      <motion.div
        style={{ opacity: backgroundOpacity }}
        className={`absolute inset-0 z-0 rounded-3xl flex items-center justify-start pl-6 pr-6 pointer-events-none transition-colors ${
          isCompletedToday
            ? 'bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-red-500/90 text-slate-950 font-black'
            : 'bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 text-slate-950 font-black'
        }`}
      >
        <div className="flex items-center gap-3 text-sm font-black uppercase tracking-wider">
          <motion.div style={{ scale: checkScale }} className="p-2 bg-slate-950 text-lime-400 rounded-xl shadow-lg">
            <Check className="w-5 h-5 stroke-[3]" />
          </motion.div>
          <motion.span style={{ opacity: textOpacity }}>
            {isCompletedToday ? 'Undo Check-In' : 'Release to Complete! 🔥'}
          </motion.span>
        </div>
      </motion.div>

      {/* Main Draggable Card Surface */}
      <motion.div
        layout
        drag="x"
        dragConstraints={{ left: 0, right: 140 }}
        dragSnapToOrigin={true}
        dragElastic={0.15}
        style={{ x }}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -3 }}
        className={`relative z-10 rounded-3xl p-5 transition-colors duration-300 border touch-pan-y cursor-grab active:cursor-grabbing ${
          isCompletedToday
            ? 'bg-slate-900/95 dark:bg-slate-900/95 border-lime-400/50 shadow-xl shadow-lime-500/10'
            : 'bg-slate-900/90 dark:bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
        }`}
      >
      {/* Top Bar: Category Pill & Actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
            {habit.category}
          </span>
          {habit.reminderEnabled && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
              <Bell className="w-3 h-3 text-amber-400" />
              {habit.reminderTime || 'Daily'}
            </span>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-500 bg-slate-950/40 px-2 py-0.5 rounded-full border border-slate-800/80 opacity-70 group-hover/swipe:opacity-100 transition-opacity pointer-events-none">
            Swipe 👉
          </span>
        </div>

        {/* Streak Count & Best Record */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowBadgesModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer hover:scale-105 ${
              habit.streak > 0 
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10' 
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}
            title={`Current Streak: ${habit.streak} days (Best: ${habit.bestStreak}d) - Click to view badges`}
          >
            <Flame className={`w-4 h-4 ${habit.streak > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="flex items-center gap-0.5">
              <AnimatedStreakNumber value={habit.streak} />
              <span>d</span>
            </span>
            {highestBadge && (
              <span className="ml-1 text-sm leading-none" title={highestBadge.title}>{highestBadge.icon}</span>
            )}
          </button>

          {/* Quick Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Menu Dropdown */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-30"
                >
                  <button
                    onClick={() => { setShowMenu(false); setShowNoteModal(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <StickyNote className="w-4 h-4 text-cyan-400" />
                    <span>Add Note / Reflection</span>
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onEdit(habit); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span>Edit Habit</span>
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onDelete(habit.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Habit</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content: Title & Goal Description */}
      <div className="mb-3">
        <h3 className={`text-lg font-black tracking-tight transition-colors ${
          isCompletedToday ? 'text-lime-300 line-through decoration-lime-400/50' : 'text-white'
        }`}>
          {habit.title}
        </h3>
        {habit.description && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{habit.description}</p>
        )}

        {/* Dynamic Streak Milestone Badges Row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {earnedBadges.length > 0 ? (
            earnedBadges.map((badge) => (
              <button
                key={badge.id}
                onClick={() => setShowBadgesModal(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black border bg-gradient-to-r ${badge.gradient} ${badge.borderColor} ${badge.textColor} ${badge.shadowColor} shadow-md transition-all hover:scale-105 cursor-pointer`}
                title={`${badge.title}: ${badge.description}`}
              >
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </button>
            ))
          ) : (
            nextBadgeInfo && (
              <button
                onClick={() => setShowBadgesModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-slate-400 bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                title="Click to view streak badges roadmap"
              >
                <span className="text-amber-400">{nextBadgeInfo.badge.icon}</span>
                <span>Next Badge: {nextBadgeInfo.badge.title} ({nextBadgeInfo.daysNeeded}d left)</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Progress Bar (if multi-step goal or counter) */}
      {isMultiStep && (
        <div className="mb-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/60">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Progress</span>
            <span className="text-lime-400">
              {currentCount} / {habit.targetCount} {habit.unit}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Overdue Schedule Warning Banner */}
      {isOverdueSchedule && (
        <div className="mb-3 p-3 bg-gradient-to-r from-rose-950 via-slate-950 to-rose-900 border border-rose-500/70 rounded-2xl shadow-lg shadow-rose-500/20">
          <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 animate-pulse" />
            <span>⚠️ OVERDUE SCHEDULED TASK ({habit.reminderTime})</span>
          </div>
          <p className="text-xs text-rose-200 font-bold leading-relaxed">
            "{habit.personalPromise || 'I promised her I would do this every day and protect our future'}"
          </p>
          <div className="mt-1 text-[10px] text-amber-300 font-extrabold flex items-center gap-1">
            <span>💔 If you skip this, you break your promise to her and lose everything!</span>
          </div>
        </div>
      )}

      {/* Consequences / Risk Warning Toggle & Banner for Uncompleted Habits */}
      {!isCompletedToday && (
        <div className="mb-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowRiskWarning(!showRiskWarning);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
              showRiskWarning 
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-3.5 h-3.5 ${habit.streak > 0 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
              <span>What you'll lose if missed today</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase">
              <span className="opacity-80">{showRiskWarning ? 'Hide' : 'View Risk'}</span>
              {showRiskWarning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          <AnimatePresence>
            {showRiskWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3.5 rounded-2xl bg-slate-950/90 border border-rose-500/30 text-xs text-slate-300 space-y-2">
                  <div className="font-black text-rose-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    <span>Consequence Warning Breakdown</span>
                  </div>

                  <ul className="space-y-1.5 text-[11px] font-medium leading-relaxed">
                    <li className="flex items-start gap-2 bg-rose-950/40 p-2 rounded-xl border border-rose-500/30">
                      <span className="text-rose-400 font-bold shrink-0">💔</span>
                      <span>
                        <strong className="text-rose-300 font-black">Broken Promise & Loss:</strong>{' '}
                        "{habit.personalPromise || 'I promised her I would do this every day and protect our future'}" — <strong className="text-white">You lose her trust and everything if you fail!</strong>
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold shrink-0">❌</span>
                      <span>
                        <strong className="text-white font-black">Streak Loss:</strong>{' '}
                        {habit.streak > 0 ? (
                          <>
                            Your <span className="text-amber-400 font-bold">{habit.streak}-day streak</span> will reset to 0 tomorrow!
                          </>
                        ) : (
                          <>Your streak remains stuck at 0 days.</>
                        )}
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">⚡</span>
                      <span>
                        <strong className="text-white font-black">XP Forfeited:</strong> You lose{' '}
                        <span className="text-amber-400 font-bold">+50 XP</span> towards leveling up.
                      </span>
                    </li>

                    {nextBadgeInfo && (
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold shrink-0">🏆</span>
                        <span>
                          <strong className="text-white font-black">Badge Delayed:</strong> Delays unlocking{' '}
                          <span className="text-cyan-300 font-bold">{nextBadgeInfo.badge.title}</span> ({nextBadgeInfo.daysNeeded}d left).
                        </span>
                      </li>
                    )}

                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold shrink-0">🧠</span>
                      <span>
                        <strong className="text-white font-black">Momentum Loss:</strong> Missing 1 day increases likelihood of habit decay by 61%.
                      </span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={handleCheckIn}
                    className="w-full mt-2 py-2 bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-lime-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Protect My Streak & Complete!</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Check-In Controls */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        
        {/* Multi-step Counter +/- Controls */}
        {isMultiStep ? (
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleDecrement}
              disabled={currentCount === 0}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 rounded-xl cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </motion.button>

            <span className="text-sm font-black text-white px-2 min-w-[28px] text-center">
              {currentCount}
            </span>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleIncrement}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-lime-400 border border-slate-700 rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        ) : (
          <div className="text-xs font-semibold text-slate-400">
            Target: <span className="text-slate-200 font-bold">{habit.targetCount} {habit.unit}</span>
          </div>
        )}

        {/* Big Complete Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleCheckIn}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all ${
            isCompletedToday
              ? 'bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 shadow-lime-500/25 ring-2 ring-lime-400/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-slate-900/50'
          }`}
        >
          <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
            isCompletedToday ? 'bg-slate-950 text-lime-400' : 'bg-slate-700 text-slate-400'
          }`}>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{isCompletedToday ? 'Done 🔥' : 'Check In'}</span>
        </motion.button>
      </div>

      {/* Display Note if user recorded reflection */}
      {todayLog?.notes && (
        <div className="mt-3 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 italic flex items-center gap-2">
          <StickyNote className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">"{todayLog.notes}"</span>
        </div>
      )}

      {/* Note Reflection Modal */}
      <AnimatePresence>
        {showNoteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowNoteModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-white"
            >
              <h4 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-cyan-400" />
                Add Reflection Note
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Record how you felt completing <strong>{habit.title}</strong> today.
              </p>
              <form onSubmit={handleSaveNoteSubmit}>
                <div className="relative mb-3">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Felt highly focused after HIIT, drank 1L right after..."
                    rows={3}
                    className="w-full p-3 pr-11 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? "Stop speech dictation" : "Dictate reflection using microphone"}
                    className={`absolute right-2.5 top-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse'
                        : 'bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 border border-slate-700/60'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {isListening && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1.5 mb-3 font-medium animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                    Listening... Speak your reflection now.
                  </p>
                )}

                {speechError && (
                  <p className="text-[11px] text-amber-400 mb-3 font-medium">
                    ⚠️ {speechError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening && recognitionRef.current) {
                        try { recognitionRef.current.stop(); } catch (e) {}
                        setIsListening(false);
                      }
                      setShowNoteModal(false);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Badges Showcase Modal (Portaled to document.body to prevent parent CSS transform glitches) */}
      {showBadgesModal && createPortal(
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowBadgesModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white my-8"
            >
              <button
                onClick={() => setShowBadgesModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-400/20 to-orange-400/20 text-amber-400 border border-amber-400/30 rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{habit.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Streak Milestones & Badges</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      <AnimatedStreakNumber value={habit.streak} /> Days Active
                    </span>
                  </p>
                </div>
              </div>

              {/* Milestones Grid */}
              <div className="space-y-3 my-6">
                {STREAK_MILESTONES.map((badge) => {
                  const isUnlocked = habit.streak >= badge.minStreak;
                  const daysLeft = Math.max(0, badge.minStreak - habit.streak);
                  const progressPct = Math.min(100, Math.round((habit.streak / badge.minStreak) * 100));

                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isUnlocked
                          ? `bg-slate-950/80 ${badge.borderColor} ${badge.shadowColor} shadow-lg`
                          : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                            isUnlocked
                              ? `bg-gradient-to-br ${badge.gradient} border ${badge.borderColor}`
                              : 'bg-slate-800/80 border border-slate-700/60 grayscale'
                          }`}>
                            {badge.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-black ${isUnlocked ? badge.textColor : 'text-slate-300'}`}>
                                {badge.title}
                              </h4>
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{badge.description}</p>
                          </div>
                        </div>

                        {/* Status Tag */}
                        <div className="shrink-0">
                          {isUnlocked ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20 text-xs font-black">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Unlocked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700 text-xs font-bold">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              {daysLeft}d left
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar if Locked */}
                      {!isUnlocked && (
                        <div className="mt-2 pt-2 border-t border-slate-800/60">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                            <span>Streak Progress</span>
                            <span>{habit.streak} / {badge.minStreak} days</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-500 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  onClick={() => setShowBadgesModal(false)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Habit</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  </div>
);
};
