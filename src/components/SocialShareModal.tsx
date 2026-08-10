import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Copy, Check, Flame, Award, Heart, Sparkles, Users, Send, ArrowLeft } from 'lucide-react';
import { Habit, UserStats, Buddy } from '../types';
import { soundFX } from '../utils/audio';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  stats: UserStats;
}

const INITIAL_BUDDIES: Buddy[] = [
  { id: 'b1', name: 'Alex Rivera', avatar: '⚡', streak: 18, habitTitle: '20-min Morning HIIT', lastActive: '10m ago', cheersReceived: 42, isUserFriend: true },
  { id: 'b2', name: 'Sarah Chen', avatar: '🔥', streak: 24, habitTitle: 'Hydrate 3 Liters', lastActive: '2h ago', cheersReceived: 89, isUserFriend: true },
  { id: 'b3', name: 'Marcus Vance', avatar: '🧠', streak: 14, habitTitle: 'Mindfulness & Meditation', lastActive: '5m ago', cheersReceived: 31, isUserFriend: true },
  { id: 'b4', name: 'Elena Rostova', avatar: '📚', streak: 30, habitTitle: 'Deep Focus Reading', lastActive: 'Just now', cheersReceived: 112, isUserFriend: false },
];

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  habits,
  stats,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [buddies, setBuddies] = useState<Buddy[]>(INITIAL_BUDDIES);
  const [cheeredIds, setCheeredIds] = useState<Set<string>>(new Set());

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

  const topHabit = habits.reduce((prev, current) => (prev.streak > current.streak ? prev : current), habits[0] || { title: 'Daily Habits', streak: 0 });

  const shareText = `🔥 I'm on a ${stats.currentStreakTotal}-day streak on HabitPulse!
Level ${stats.level} | ${stats.totalCompletions} Total Completions
Top Habit: ${topHabit ? topHabit.title : 'Consistency'} (${topHabit ? topHabit.streak : 0}d)
Join me and elevate your daily momentum! ⚡`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    soundFX.playCheerSound();
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCheerBuddy = (buddyId: string) => {
    soundFX.playCheerSound();
    setCheeredIds(prev => new Set(prev).add(buddyId));
    setBuddies(prev => prev.map(b => b.id === buddyId ? { ...b, cheersReceived: b.cheersReceived + 1 } : b));
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
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white my-8"
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-cyan-500/20">
              🚀
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Social Motivation & Buddy Feed
              </h2>
              <p className="text-xs text-slate-400">Share your streak card and high-five your habit crew!</p>
            </div>
          </div>

          {/* High-Energy Social Card Preview */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-lime-400/50 shadow-2xl relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-lime-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> HABITPULSE CARD
              </span>
              <span className="text-xs font-black text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                Lvl {stats.level} Titan
              </span>
            </div>

            <div className="text-center my-4">
              <div className="text-4xl font-black tracking-tight text-white mb-1 flex items-center justify-center gap-2">
                <Flame className="w-8 h-8 text-amber-400 fill-amber-400 animate-bounce" />
                {stats.currentStreakTotal} DAYS ON FIRE
              </div>
              <p className="text-xs text-slate-400 italic">"Unstoppable momentum builds legendary results."</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-extrabold uppercase">Top Active Habit</div>
                <div className="font-bold text-lime-300 truncate">{topHabit?.title || 'Daily Win'}</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-extrabold uppercase">Total Check-Ins</div>
                <div className="font-bold text-cyan-300">{stats.totalCompletions} Check-Ins</div>
              </div>
            </div>
          </div>

          {/* Copy Share Text Button */}
          <div className="mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyText}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-lime-500/20 cursor-pointer"
            >
              {copiedText ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedText ? 'Copied Streak Card to Clipboard!' : 'Copy Shareable Streak Post'}</span>
            </motion.button>
          </div>

          {/* Buddy Leaderboard & Cheers */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> Active Habit Crew & Cheers ✋
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {buddies.map((buddy) => {
                const hasCheered = cheeredIds.has(buddy.id);

                return (
                  <div
                    key={buddy.id}
                    className="flex items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg border border-slate-700">
                        {buddy.avatar}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {buddy.name}
                          <span className="text-[10px] text-slate-500">• {buddy.lastActive}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {buddy.habitTitle} (<span className="text-amber-400 font-bold">{buddy.streak}d 🔥</span>)
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleCheerBuddy(buddy.id)}
                      disabled={hasCheered}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                        hasCheered
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasCheered ? 'fill-emerald-400' : ''}`} />
                      <span>{buddy.cheersReceived}</span>
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800/80 mt-6">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
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
