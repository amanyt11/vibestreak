import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Bell, Target, Layers, Loader2, Wand2, Brain, Check, Clock, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Habit, HabitCategory } from '../types';
import { playSound } from '../utils/audio';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  editingHabit?: Habit | null;
}

interface SmartGoalOption {
  smartTitle: string;
  targetCount: number;
  unit: string;
  timeframe: string;
  reminderTime: string;
  smartObjective: string;
  rationale: string;
}

const CATEGORIES: { id: HabitCategory; label: string; icon: string; color: string }[] = [
  { id: 'fitness', label: 'Fitness & HIIT', icon: '🏃', color: 'from-amber-500 to-orange-600' },
  { id: 'mindset', label: 'Mindset & Zen', icon: '🧠', color: 'from-emerald-400 to-teal-600' },
  { id: 'productivity', label: 'Productivity', icon: '⚡', color: 'from-fuchsia-500 to-pink-600' },
  { id: 'health', label: 'Health & Hydration', icon: '💧', color: 'from-cyan-400 to-blue-600' },
  { id: 'learning', label: 'Growth & Books', icon: '📚', color: 'from-purple-500 to-indigo-600' },
  { id: 'creativity', label: 'Creativity', icon: '🎨', color: 'from-rose-500 to-red-600' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHabit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('fitness');
  const [targetCount, setTargetCount] = useState<number>(1);
  const [unit, setUnit] = useState('times');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [personalPromise, setPersonalPromise] = useState('');

  // AI Suggestion State
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [userHasModifiedDesc, setUserHasModifiedDesc] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // SMART Goal Generator State
  const [showSmartGenerator, setShowSmartGenerator] = useState(false);
  const [isGeneratingSmartGoals, setIsGeneratingSmartGoals] = useState(false);
  const [smartGoals, setSmartGoals] = useState<SmartGoalOption[]>([]);
  const [selectedSmartGoalIndex, setSelectedSmartGoalIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category);
      setTargetCount(editingHabit.targetCount);
      setUnit(editingHabit.unit);
      setReminderTime(editingHabit.reminderTime || '08:00');
      setReminderEnabled(editingHabit.reminderEnabled);
      setPersonalPromise(editingHabit.personalPromise || 'I promised her I would do this every day and protect our future');
      setUserHasModifiedDesc(true); // Don't overwrite existing habit details
      setAiSuggested(false);
      setShowSmartGenerator(false);
      setSmartGoals([]);
    } else {
      setTitle('');
      setDescription('');
      setCategory('fitness');
      setTargetCount(1);
      setUnit('times');
      setReminderTime('08:00');
      setReminderEnabled(true);
      setPersonalPromise('I promised her I would stick to this and protect our future');
      setUserHasModifiedDesc(false);
      setAiSuggested(false);
      setShowSmartGenerator(false);
      setSmartGoals([]);
    }
  }, [editingHabit, isOpen]);

  // Fetch SMART goals for selected category
  const fetchSmartGoals = async (selectedCat: HabitCategory = category) => {
    setIsGeneratingSmartGoals(true);
    setShowSmartGenerator(true);
    try {
      const res = await fetch('/api/smart-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCat,
          currentTitle: title,
          currentTargetCount: targetCount,
          currentUnit: unit,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.goals && Array.isArray(data.goals)) {
          setSmartGoals(data.goals);
        }
      }
    } catch (err) {
      console.error('Failed to generate SMART goals:', err);
    } finally {
      setIsGeneratingSmartGoals(false);
    }
  };

  // Apply a SMART Goal Option
  const handleApplySmartGoal = (goal: SmartGoalOption, index: number) => {
    setTitle(goal.smartTitle);
    setDescription(goal.smartObjective || goal.rationale);
    setTargetCount(goal.targetCount);
    setUnit(goal.unit);
    if (goal.reminderTime) {
      setReminderTime(goal.reminderTime);
      setReminderEnabled(true);
    }
    setAiSuggested(true);
    setUserHasModifiedDesc(true);
    setSelectedSmartGoalIndex(index);
    playSound('achievement');
  };

  // AI Suggestion fetch function
  const fetchAISuggestion = async (habitTitle: string, force = false) => {
    if (!habitTitle.trim() || habitTitle.trim().length < 3) return;
    setIsSuggesting(true);

    try {
      const res = await fetch('/api/suggest-habit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: habitTitle }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.description && (!userHasModifiedDesc || force)) {
          setDescription(data.description);
          if (data.category && CATEGORIES.some(c => c.id === data.category)) {
            setCategory(data.category as HabitCategory);
          }
          if (data.targetCount) {
            setTargetCount(data.targetCount);
          }
          if (data.unit) {
            setUnit(data.unit);
          }
          setAiSuggested(true);
          playSound('achievement');
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI habit suggestion:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Debounce typing in title input to trigger AI suggestion
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setAiSuggested(false);

    if (editingHabit) return; // Only auto-suggest for new habits

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 3 && !userHasModifiedDesc) {
      debounceTimerRef.current = setTimeout(() => {
        fetchAISuggestion(val);
      }, 700);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      targetCount: Math.max(1, Number(targetCount)),
      unit: unit.trim() || 'times',
      reminderTime,
      reminderEnabled,
      personalPromise: personalPromise.trim() || 'I promised her I would stick to this and protect our future',
      color: CATEGORIES.find(c => c.id === category)?.color || 'from-lime-400 to-emerald-500',
      icon: CATEGORIES.find(c => c.id === category)?.icon || '⚡',
    });

    onClose();
  };

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
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white my-8"
          >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                {editingHabit ? 'Edit High-Energy Habit' : 'Create New Habit'}
              </h2>
              <p className="text-xs text-slate-400">Build daily momentum with clear target goals.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => fetchSmartGoals(category)}
                  disabled={isGeneratingSmartGoals}
                  className="flex items-center gap-1.5 text-xs font-extrabold text-lime-400 hover:text-lime-300 bg-lime-400/10 hover:bg-lime-400/20 border border-lime-400/30 px-3 py-1 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingSmartGoals ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating SMART Goals...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-3.5 h-3.5" />
                      <span>AI SMART Goal Generator</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (showSmartGenerator) {
                        fetchSmartGoals(cat.id);
                      }
                    }}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      category === cat.id
                        ? 'bg-lime-400/20 border-lime-400 text-lime-300 ring-2 ring-lime-400/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI SMART Goal Generator Drawer */}
            <AnimatePresence>
              {showSmartGenerator && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-950/90 border border-lime-400/30 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-lime-400/20 text-lime-400 rounded-lg">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-lime-300">
                          SMART Objectives ({CATEGORIES.find(c => c.id === category)?.label})
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Measurable & time-bound objectives boost completion rates by +42%.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSmartGenerator(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>

                  {isGeneratingSmartGoals ? (
                    <div className="py-6 flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <Loader2 className="w-6 h-6 text-lime-400 animate-spin" />
                      <p className="text-xs font-bold text-slate-300">
                        Designing category-tuned SMART goals...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {smartGoals.map((goal, idx) => {
                        const isSelected = selectedSmartGoalIndex === idx;
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-lime-400/15 border-lime-400 text-white'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                                  <span>{goal.smartTitle}</span>
                                </h5>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                                  {goal.smartObjective || goal.rationale}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleApplySmartGoal(goal, idx)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black shrink-0 flex items-center gap-1 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-lime-400 text-slate-950 shadow-md shadow-lime-500/20'
                                    : 'bg-slate-800 hover:bg-lime-400 hover:text-slate-950 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    Applied!
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-3 h-3" />
                                    Apply SMART
                                  </>
                                )}
                              </button>
                            </div>

                            {/* SMART Badges */}
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 flex items-center gap-1">
                                <Target className="w-2.5 h-2.5" /> Goal: {goal.targetCount} {goal.unit}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> Time: {goal.timeframe}
                              </span>
                              {goal.reminderTime && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 flex items-center gap-1">
                                  <Bell className="w-2.5 h-2.5" /> Alarm: {goal.reminderTime}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Habit Title Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Habit Title *
                </label>
                {title.trim().length >= 3 && !editingHabit && (
                  <button
                    type="button"
                    onClick={() => fetchAISuggestion(title, true)}
                    disabled={isSuggesting}
                    className="flex items-center gap-1 text-[11px] font-bold text-lime-400 hover:text-lime-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSuggesting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        AI Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        AI Suggest Motivation
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. 20-min HIIT, 3L Water, 10-page Reading..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-lime-400 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                {isSuggesting && (
                  <div className="absolute right-3 top-3 text-lime-400 animate-spin">
                    <Loader2 className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>

            {/* Habit Description & Motivation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Motivation / SMART Objective
                </label>
                {aiSuggested && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 bg-lime-400/20 text-lime-400 border border-lime-400/40 rounded-full"
                  >
                    <Sparkles className="w-3 h-3" /> AI Formulated
                  </motion.span>
                )}
              </div>
              <input
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setUserHasModifiedDesc(true);
                }}
                placeholder="e.g. Specific: 20-min HIIT | Time-bound: Finish before 7:30 AM"
                className={`w-full px-4 py-3 bg-slate-950 border rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                  aiSuggested ? 'border-lime-400/80 ring-2 ring-lime-400/20' : 'border-slate-800 focus:border-lime-400'
                }`}
              />
            </div>

            {/* Target Goal & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-lime-400" /> Target Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-lime-400 rounded-2xl text-sm font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Unit
                </label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. Liters, mins, times, pages"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-lime-400 rounded-2xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Scheduled Alarm Time</div>
                  <div className="text-[10px] text-slate-400">Time schedule for accountability alert</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {reminderEnabled && (
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-lime-400 focus:outline-none"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                    reminderEnabled ? 'bg-lime-400 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
                </button>
              </div>
            </div>

            {/* Personal Promise & High Stakes Oath */}
            <div className="p-4 bg-gradient-to-r from-rose-950/40 via-slate-950 to-amber-950/30 rounded-2xl border border-rose-500/30">
              <label className="block text-xs font-black uppercase tracking-wider text-rose-300 mb-1 flex items-center gap-1.5">
                <span>💔 Personal Promise / Emotional Stakes</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-2 leading-tight">
                What promise or commitment will you break if you fail to complete this habit after the scheduled time?
              </p>
              <input
                type="text"
                value={personalPromise}
                onChange={(e) => setPersonalPromise(e.target.value)}
                placeholder="e.g. I promised her I would do this every day and protect our future"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-rose-500/30 focus:border-rose-400 rounded-xl text-xs font-medium text-rose-200 placeholder-slate-600 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-lime-500/20 cursor-pointer hover:opacity-95"
              >
                {editingHabit ? 'Save Changes' : 'Launch Habit 🔥'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
};

