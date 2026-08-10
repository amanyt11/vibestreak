import React from 'react';
import { motion } from 'motion/react';
import { Flame, Moon, Sun, Volume2, VolumeX, Sparkles, Share2, Bell, Download, Shield, Trophy, Palette } from 'lucide-react';
import { UserStats } from '../types';
import { ThemeMode, THEME_CONFIG } from '../utils/storage';

interface HeaderProps {
  stats: UserStats;
  isDark: boolean;
  onToggleDark: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAICoach: () => void;
  onOpenSocial: () => void;
  onOpenNotifications: () => void;
  onOpenStats: () => void;
  onOpenAchievements: () => void;
  theme: ThemeMode;
  onCycleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isDark,
  onToggleDark,
  soundEnabled,
  onToggleSound,
  onOpenAICoach,
  onOpenSocial,
  onOpenNotifications,
  onOpenStats,
  onOpenAchievements,
  theme,
  onCycleTheme,
}) => {
  // Calculate level progress (each level is 500 XP)
  const xpForNextLevel = stats.level * 500;
  const currentLevelXp = stats.xp % 500;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / 500) * 100));

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 dark:bg-slate-950/80 border-b border-slate-800/80 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-400 via-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-lime-500/20 text-slate-950 font-black text-xl tracking-wider cursor-pointer"
              onClick={onOpenStats}
            >
              ⚡
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent uppercase italic">
                  HABITPULSE
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-lime-400/20 text-lime-400 rounded-full border border-lime-400/30">
                  VIBRANT
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">High Energy Streak Engine</p>
            </div>
          </div>

          {/* Gamification Stats Bar */}
          <div className="flex items-center gap-2 sm:gap-4 bg-slate-800/60 p-1.5 sm:p-2 rounded-2xl border border-slate-700/60">
            {/* Total Streak Badge */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl cursor-pointer"
              onClick={onOpenStats}
              title="Total Active Days Streak"
            >
              <Flame className="w-5 h-5 text-amber-400 animate-pulse fill-amber-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-300/80 leading-none">Streak</div>
                <div className="text-sm font-black text-amber-400 leading-none">{stats.currentStreakTotal}d</div>
              </div>
            </motion.div>

            {/* Level & XP */}
            <div 
              className="hidden md:flex flex-col min-w-[120px] cursor-pointer"
              onClick={onOpenStats}
              title={`${currentLevelXp} / 500 XP to Level ${stats.level + 1}`}
            >
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-lime-400 uppercase tracking-wider">Lvl {stats.level}</span>
                <span className="text-slate-400 text-[10px]">{stats.xp} XP</span>
              </div>
              <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>

            {/* Streak Shield Token */}
            <div 
              className="flex items-center gap-1 px-2 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-xl cursor-pointer text-indigo-300"
              onClick={onOpenStats}
              title={`${stats.streakShieldsAvailable} Streak Shield Protection(s)`}
            >
              <Shield className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
              <span className="text-xs font-black">{stats.streakShieldsAvailable}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* AI Coach Hype */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onOpenAICoach}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-md shadow-fuchsia-500/20 transition-all cursor-pointer"
              title="Get AI Energy Hype"
            >
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/30" />
              <span className="hidden lg:inline">AI Hype</span>
            </motion.button>

            {/* Social Share */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onOpenSocial}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl cursor-pointer"
              title="Social Share & Leaderboard"
            >
              <Share2 className="w-4 h-4" />
            </motion.button>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onOpenNotifications}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-lime-400 border border-slate-700 rounded-xl cursor-pointer relative"
              title="Push Notification Settings"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-lime-400 rounded-full animate-ping" />
            </motion.button>

            {/* Stats / Export */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onOpenStats}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl cursor-pointer"
              title="Stats, Charts & CSV Export"
            >
              <Download className="w-4 h-4" />
            </motion.button>

            {/* Audio Toggle */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onToggleSound}
              className={`p-2 border rounded-xl cursor-pointer transition-colors ${
                soundEnabled 
                  ? 'bg-slate-800 border-slate-700 text-amber-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </motion.button>

            {/* Achievements */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onOpenAchievements}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl cursor-pointer"
              title="Achievements Wall"
            >
              <Trophy className="w-4 h-4" />
            </motion.button>

            {/* Theme Cycle */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onCycleTheme}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl cursor-pointer flex items-center gap-1"
              title={`Theme: ${THEME_CONFIG[theme].label}`}
            >
              <span className="text-sm">{THEME_CONFIG[theme].icon}</span>
            </motion.button>
          </div>

        </div>
      </div>
    </header>
  );
};
