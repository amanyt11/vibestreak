import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, Flame, RefreshCw, Quote, ArrowLeft } from 'lucide-react';
import { Habit, UserStats } from '../types';
import { soundFX } from '../utils/audio';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  stats: UserStats;
}

export const AICoachModal: React.FC<AICoachModalProps> = ({
  isOpen,
  onClose,
  habits,
  stats,
}) => {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string>(
    "🔥 High Energy Alert! Consistency is your superpower. Every check-in today builds an unstoppable momentum for your future self!"
  );
  const [motto, setMotto] = useState<string>("Small daily wins build unstoppable momentum.");

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

  const fetchCoachHype = async () => {
    setLoading(true);
    try {
      const activeTitles = habits.map(h => `${h.title} (${h.streak}d streak)`);
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeHabits: activeTitles,
          totalStreak: stats.currentStreakTotal,
          level: stats.level,
          xp: stats.xp,
        }),
      });

      const data = await response.json();
      if (data.advice) setAdvice(data.advice);
      if (data.motto) setMotto(data.motto);
      soundFX.playLevelUpSound();
    } catch {
      setAdvice("🔥 Keep the fire burning! Every small habit completed today compounds into massive long-term success.");
      setMotto("Never break the chain!");
    } finally {
      setLoading(false);
    }
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
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white my-8"
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-fuchsia-500/20">
              ⚡
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                PULSE AI COACH HYPE
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/30" />
              </h2>
              <p className="text-xs text-slate-400">Personalized AI motivation & streak strategy.</p>
            </div>
          </div>

          {/* Advice Card */}
          <div className="p-6 rounded-3xl bg-slate-950/90 border border-fuchsia-500/40 shadow-2xl mb-6 relative">
            <Quote className="w-8 h-8 text-fuchsia-500/20 absolute top-4 right-4" />
            
            <p className="text-sm font-semibold text-slate-200 leading-relaxed mb-4 italic">
              "{advice}"
            </p>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-fuchsia-400" /> DAILY MOTTO
              </span>
              <span className="text-xs font-bold text-amber-300">"{motto}"</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchCoachHype}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-fuchsia-500/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Generating Hype...' : 'Generate New Hype'}</span>
            </motion.button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase rounded-2xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
};
