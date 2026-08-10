import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Lock, Sparkles } from 'lucide-react';
import { Habit, HabitLog, UserStats } from '../types';
import { ACHIEVEMENTS, getAchievementProgress } from '../utils/achievements';

interface AchievementsWallProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  logs: HabitLog[];
  stats: UserStats;
}

export const AchievementsWall: React.FC<AchievementsWallProps> = ({
  isOpen,
  onClose,
  habits,
  logs,
  stats,
}) => {
  const categoryLabels: Record<string, string> = {
    streak: '🔥 Streak Milestones',
    completion: '✅ Completion Goals',
    xp: '⚡ XP & Level',
    special: '🌟 Special Achievements',
  };

  const categories = ['streak', 'completion', 'xp', 'special'] as const;
  const unlockedCount = ACHIEVEMENTS.filter(a => a.requirement(habits, logs, stats)).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl text-white my-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 p-5 sm:p-6 bg-gradient-to-r from-amber-950/90 via-slate-900 to-purple-950/90 border-b border-amber-500/30 backdrop-blur-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl text-slate-950 shadow-lg">
                    <Trophy className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      Achievements Wall
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </h2>
                    <p className="text-xs text-slate-300 font-bold">
                      {unlockedCount} / {ACHIEVEMENTS.length} Unlocked
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Overall progress bar */}
              <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-lime-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Achievement Categories */}
            <div className="p-5 sm:p-6 space-y-6">
              {categories.map((cat) => {
                const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
                return (
                  <div key={cat}>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                      {categoryLabels[cat]}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {catAchievements.map((achievement, i) => {
                        const isUnlocked = achievement.requirement(habits, logs, stats);
                        const progress = getAchievementProgress(achievement, habits, logs, stats);
                        return (
                          <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`relative p-4 rounded-2xl border transition-all ${
                              isUnlocked
                                ? 'bg-gradient-to-br from-amber-950/60 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/10'
                                : 'bg-slate-950/60 border-slate-800 opacity-60'
                            }`}
                          >
                            {/* Glow effect for unlocked */}
                            {isUnlocked && (
                              <div className="absolute -top-1 -right-1">
                                <span className="flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
                                </span>
                              </div>
                            )}

                            <div className="text-3xl mb-2">
                              {isUnlocked ? achievement.icon : <Lock className="w-7 h-7 text-slate-600" />}
                            </div>
                            <h4 className={`text-xs font-black mb-0.5 ${isUnlocked ? 'text-amber-300' : 'text-slate-500'}`}>
                              {achievement.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-tight mb-2">
                              {achievement.description}
                            </p>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  isUnlocked
                                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                                    : 'bg-slate-600'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress * 100}%` }}
                                transition={{ duration: 0.6, delay: i * 0.05 }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 mt-1 block">
                              {Math.round(progress * 100)}%
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
