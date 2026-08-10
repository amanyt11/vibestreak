import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Flame, Filter, Sparkles, Trophy, Calendar, 
  CheckCircle2, RotateCcw, Search, Dumbbell, Brain, Zap, 
  Droplets, BookOpen, Palette, AlertTriangle, TrendingDown, ShieldAlert, Check, X
} from 'lucide-react';
import { Habit, HabitLog, UserStats, FilterTab, HabitCategory } from './types';
import { 
  loadStoredHabits, saveStoredHabits, 
  loadStoredLogs, saveStoredLogs, 
  loadStoredStats, saveStoredStats, 
  loadDarkMode, saveDarkMode, 
  loadTheme, saveTheme, THEME_CONFIG, ThemeMode,
  getTodayString, calculateStreak, INITIAL_HABITS 
} from './utils/storage';
import { soundFX } from './utils/audio';
import { NotificationManager } from './utils/notifications';

import { Header } from './components/Header';
import { HabitCard } from './components/HabitCard';
import { HabitModal } from './components/HabitModal';
import { StreakHeatmap } from './components/StreakHeatmap';
import { StatsAnalytics } from './components/StatsAnalytics';
import { SocialShareModal } from './components/SocialShareModal';
import { PushNotificationCenter } from './components/PushNotificationCenter';
import { AICoachModal } from './components/AICoachModal';
import { ConfettiExplosion, ConfettiBurst } from './components/ConfettiExplosion';
import { HabitWidgets } from './components/HabitWidgets';
import { BackgroundMusicPlayer } from './components/BackgroundMusicPlayer';
import { ProgressRing } from './components/ProgressRing';
import { AchievementsWall } from './components/AchievementsWall';
import { PomodoroTimer } from './components/PomodoroTimer';
import { WeeklyReport } from './components/WeeklyReport';

const MOTIVATIONAL_QUOTES = [
  { quote: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { quote: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { quote: "Consistency is the DNA of mastery.", author: "Robin Sharma" },
  { quote: "Success doesn't come from what you do occasionally, it comes from what you do consistently.", author: "Marie Forleo" },
  { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { quote: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" }
];


export default function App() {
  // Primary State
  const [habits, setHabits] = useState<Habit[]>(() => loadStoredHabits());
  const [logs, setLogs] = useState<HabitLog[]>(() => loadStoredLogs());
  const [stats, setStats] = useState<UserStats>(() => loadStoredStats());
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [isDark, setIsDark] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals Visibility
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [overdueAlertHabit, setOverdueAlertHabit] = useState<Habit | null>(null);
  const notifiedScheduleSetRef = React.useRef<Set<string>>(new Set());

  // Daily Motivational Quote calculation
  const dailyQuote = React.useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
  }, []);

  const handleCycleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'amoled' : prev === 'amoled' ? 'midnight' : 'dark'));
  };

  // Sync theme to LocalStorage & document root
  useEffect(() => {
    saveTheme(theme);
    document.documentElement.classList.remove('dark', 'theme-amoled', 'theme-midnight');
    document.documentElement.classList.add('dark');
    if (theme === 'amoled') document.documentElement.classList.add('theme-amoled');
    if (theme === 'midnight') document.documentElement.classList.add('theme-midnight');
  }, [theme]);

  // Simple check-in video popup
  const [showCheckInVideo, setShowCheckInVideo] = useState(false);
  const checkInVideoRef = useRef<HTMLVideoElement | null>(null);

  const playCheckInVideo = () => {
    setShowCheckInVideo(true);
    setTimeout(() => {
      if (checkInVideoRef.current) {
        checkInVideoRef.current.currentTime = 0;
        checkInVideoRef.current.play().catch(() => {
          // If autoplay blocked, try muted
          if (checkInVideoRef.current) {
            checkInVideoRef.current.muted = true;
            checkInVideoRef.current.play().catch(() => {});
          }
        });
      }
    }, 50);
  };

  const closeCheckInVideo = () => {
    if (checkInVideoRef.current) {
      checkInVideoRef.current.pause();
    }
    setShowCheckInVideo(false);
  };



  // Sync state to LocalStorage
  useEffect(() => {
    saveStoredHabits(habits);
  }, [habits]);

  useEffect(() => {
    saveStoredLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveStoredStats(stats);
  }, [stats]);

  useEffect(() => {
    saveDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    soundFX.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Global Escape key failsafe to close all open modals
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHabitModalOpen(false);
        setEditingHabit(null);
        setIsStatsOpen(false);
        setIsSocialOpen(false);
        setIsNotificationsOpen(false);
        setIsAICoachOpen(false);
        setIsWarningModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Recalculate total streak and stats whenever logs or habits change
  useEffect(() => {
    const today = getTodayString();
    let totalStreakSum = 0;
    let maxStreakEver = stats.longestStreakEver;

    const updatedHabits = habits.map(h => {
      const { current, best } = calculateStreak(h.id, logs);
      totalStreakSum += current;
      if (best > maxStreakEver) maxStreakEver = best;
      
      return {
        ...h,
        streak: current,
        bestStreak: Math.max(h.bestStreak, best),
      };
    });

    setStats(prev => ({
      ...prev,
      currentStreakTotal: totalStreakSum,
      longestStreakEver: maxStreakEver,
    }));
  }, [logs]);

  // Confetti Explosion state
  const [confettiBursts, setConfettiBursts] = useState<ConfettiBurst[]>([]);

  const triggerConfetti = (event?: React.MouseEvent) => {
    soundFX.playCompleteSound();

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;

    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    const burst: ConfettiBurst = {
      id: `burst-${Date.now()}-${Math.random()}`,
      x,
      y,
      particleCount: 50,
    };
    setConfettiBursts(prev => [...prev, burst]);
  };

  const handleRemoveBurst = (id: string) => {
    setConfettiBursts(prev => prev.filter(b => b.id !== id));
  };

  // Today Logs map lookup: habitId -> HabitLog
  const todayStr = getTodayString();
  const todayLogsMap = new Map<string, HabitLog>();
  logs.filter(l => l.date === todayStr).forEach(l => todayLogsMap.set(l.habitId, l));

  // Real-time schedule monitoring ticker for overdue high-stakes alerts
  useEffect(() => {
    const checkScheduledOverdue = () => {
      const now = new Date();
      const today = getTodayString();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      habits.forEach(habit => {
        if (!habit.reminderEnabled || !habit.reminderTime) return;
        const log = todayLogsMap.get(habit.id);
        if (log && log.completed) return; // Already completed today

        const [remHour, remMin] = habit.reminderTime.split(':').map(Number);
        if (isNaN(remHour) || isNaN(remMin)) return;
        const habitMinutes = remHour * 60 + remMin;

        const notifKey = `${today}-${habit.id}-${habit.reminderTime}`;

        // Trigger alert if current time is at or past scheduled time and not yet alerted
        if (currentMinutes >= habitMinutes && !notifiedScheduleSetRef.current.has(notifKey)) {
          notifiedScheduleSetRef.current.add(notifKey);

          soundFX.playWarningSound();

          const promiseText = habit.personalPromise || 'I promised her I would do this every day and protect our future';
          NotificationManager.sendPush(`💔 SCHEDULE ALERT: ${habit.title}`, {
            body: `Scheduled time (${habit.reminderTime}) has passed! "${promiseText}". If you fail, you break your promise to her and lose everything!`,
            tag: `scheduled-overdue-${habit.id}`,
          });

          setOverdueAlertHabit(habit);
        }
      });
    };

    checkScheduledOverdue();
    const interval = setInterval(checkScheduledOverdue, 10000);
    return () => clearInterval(interval);
  }, [habits, logs]);

  // Toggle Habit Completion for Today
  const handleToggleComplete = (habitId: string, event?: React.MouseEvent) => {
    const existing = todayLogsMap.get(habitId);
    const targetHabit = habits.find(h => h.id === habitId);
    if (!targetHabit) return;

    if (existing && existing.completed) {
      // Uncheck completion
      const updatedLogs = logs.filter(l => l.id !== existing.id);
      setLogs(updatedLogs);
    } else {
      // Check as completed!
      const newLog: HabitLog = {
        id: `log-${habitId}-${todayStr}`,
        habitId,
        date: todayStr,
        completed: true,
        count: targetHabit.targetCount,
        timestamp: Date.now(),
      };

      const updatedLogs = [...logs.filter(l => l.id !== newLog.id), newLog];
      setLogs(updatedLogs);

      // Award XP (+50 XP per completed habit)
      awardXP(50);
      triggerConfetti(event);
      playCheckInVideo();
    }
  };

  // Update multi-step count
  const handleUpdateCount = (habitId: string, delta: number, event?: React.MouseEvent) => {
    const existing = todayLogsMap.get(habitId);
    const targetHabit = habits.find(h => h.id === habitId);
    if (!targetHabit) return;

    const currentCount = existing ? existing.count : 0;
    const newCount = Math.max(0, currentCount + delta);
    const isCompleted = newCount >= targetHabit.targetCount;

    const newLog: HabitLog = {
      id: `log-${habitId}-${todayStr}`,
      habitId,
      date: todayStr,
      completed: isCompleted,
      count: newCount,
      timestamp: Date.now(),
    };

    setLogs(prev => [...prev.filter(l => l.id !== newLog.id), newLog]);

    if (!existing?.completed && isCompleted) {
      awardXP(50);
      triggerConfetti(event);
      playCheckInVideo();

    } else if (delta > 0) {
      soundFX.playCheerSound();
    }
  };

  // XP & Level Up logic
  const awardXP = (amount: number) => {
    setStats(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 500) + 1;
      
      if (newLevel > prev.level) {
        soundFX.playLevelUpSound();
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        totalCompletions: prev.totalCompletions + 1,
      };
    });
  };

  // Save Habit from Modal (Create or Edit)
  const handleSaveHabit = (habitData: Partial<Habit>) => {
    if (editingHabit) {
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...habitData } as Habit : h));
      setEditingHabit(null);
    } else {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        title: habitData.title || 'New Habit',
        description: habitData.description || '',
        category: habitData.category || 'fitness',
        color: habitData.color || 'from-lime-400 to-emerald-500',
        icon: habitData.icon || '⚡',
        targetCount: habitData.targetCount || 1,
        unit: habitData.unit || 'times',
        reminderTime: habitData.reminderTime || '08:00',
        reminderEnabled: habitData.reminderEnabled ?? true,
        streak: 0,
        bestStreak: 0,
        createdAt: new Date().toISOString(),
        streakShields: 0,
      };
      setHabits(prev => [newHabit, ...prev]);
      awardXP(25); // Bonus XP for creating habit
    }
  };

  // Save Reflection Note
  const handleSaveNote = (habitId: string, note: string) => {
    const existing = todayLogsMap.get(habitId);
    const targetHabit = habits.find(h => h.id === habitId);
    if (!targetHabit) return;

    const newLog: HabitLog = {
      id: existing ? existing.id : `log-${habitId}-${todayStr}`,
      habitId,
      date: todayStr,
      completed: existing ? existing.completed : false,
      count: existing ? existing.count : 0,
      notes: note,
      timestamp: Date.now(),
    };

    setLogs(prev => [...prev.filter(l => l.id !== newLog.id), newLog]);
  };

  // Toggle Habit Completion for any specific Date
  const handleToggleDateLog = (habitId: string, dateStr: string) => {
    const targetHabit = habits.find(h => h.id === habitId);
    if (!targetHabit) return;

    const existing = logs.find(l => l.habitId === habitId && l.date === dateStr);

    if (existing && existing.completed) {
      // Uncheck completion
      setLogs(prev => prev.filter(l => l.id !== existing.id));
    } else {
      // Mark completed for date
      const newLog: HabitLog = {
        id: existing ? existing.id : `log-${habitId}-${dateStr}`,
        habitId,
        date: dateStr,
        completed: true,
        count: targetHabit.targetCount,
        timestamp: Date.now(),
      };
      setLogs(prev => [...prev.filter(l => l.id !== newLog.id), newLog]);
      awardXP(30);
      triggerConfetti();
    }
  };

  // Save Reflection Note for any specific Date
  const handleSaveDateNote = (habitId: string, dateStr: string, note: string) => {
    const existing = logs.find(l => l.habitId === habitId && l.date === dateStr);
    const targetHabit = habits.find(h => h.id === habitId);
    if (!targetHabit) return;

    const newLog: HabitLog = {
      id: existing ? existing.id : `log-${habitId}-${dateStr}`,
      habitId,
      date: dateStr,
      completed: existing ? existing.completed : false,
      count: existing ? existing.count : 0,
      notes: note,
      timestamp: Date.now(),
    };

    setLogs(prev => [...prev.filter(l => l.id !== newLog.id), newLog]);
  };

  // Delete Habit
  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setLogs(prev => prev.filter(l => l.habitId !== habitId));
  };

  // Redeem Streak Shield
  const handleRedeemShield = () => {
    if (stats.xp >= 200) {
      setStats(prev => ({
        ...prev,
        xp: prev.xp - 200,
        streakShieldsAvailable: prev.streakShieldsAvailable + 1,
      }));
      soundFX.playLevelUpSound();
    }
  };

  // Import JSON Backup Payload
  const handleImportJSON = (data: { habits: Habit[]; logs: HabitLog[]; stats: UserStats }) => {
    if (data.habits) setHabits(data.habits);
    if (data.logs) setLogs(data.logs);
    if (data.stats) setStats(data.stats);
  };

  // Reset Demo Seed Data
  const handleResetSeedData = () => {
    setHabits(INITIAL_HABITS);
    setLogs([]);
    setStats({
      xp: 650,
      level: 3,
      totalCompletions: 48,
      currentStreakTotal: 12,
      longestStreakEver: 15,
      streakShieldsAvailable: 2,
      joinedDate: getTodayString(),
    });
  };

  // Reset Progress to 0
  const handleResetProgressToZero = () => {
    setLogs([]);
    setHabits(prev => prev.map(h => ({ ...h, streak: 0, bestStreak: 0 })));
    setStats({
      xp: 0,
      level: 1,
      totalCompletions: 0,
      currentStreakTotal: 0,
      longestStreakEver: 0,
      streakShieldsAvailable: 1,
      joinedDate: getTodayString(),
    });
  };

  // Filter & Search Logic
  const filteredHabits = habits.filter(h => {
    const matchesCategory = activeTab === 'all' || activeTab === 'today' || h.category === activeTab;
    const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (h.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate Today's Summary Progress
  const totalHabitsCount = habits.length;
  const completedTodayCount = habits.filter(h => todayLogsMap.get(h.id)?.completed).length;
  const todayPercent = totalHabitsCount > 0 ? Math.round((completedTodayCount / totalHabitsCount) * 100) : 0;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${THEME_CONFIG[theme].bg} text-slate-100`}>
      
      {/* Header */}
      <Header
        stats={stats}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenAICoach={() => setIsAICoachOpen(true)}
        onOpenSocial={() => setIsSocialOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        theme={theme}
        onCycleTheme={handleCycleTheme}
      />

      {/* Main Body Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* High-Energy Hero Dashboard Summary */}
        <div className={`relative rounded-3xl p-6 sm:p-8 ${THEME_CONFIG[theme].card} ${THEME_CONFIG[theme].border} border shadow-2xl mb-6 overflow-hidden`}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-lime-400/20 text-lime-400 border border-lime-400/30 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                  <Flame className="w-4 h-4 fill-lime-400 animate-pulse" /> DAILY DASHBOARD
                </span>
                <span className="text-xs text-slate-400 font-extrabold">{todayStr}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
                CRUSH TODAY'S GOALS 🔥
              </h2>
              <p className="text-sm text-slate-300 max-w-xl">
                {completedTodayCount === totalHabitsCount && totalHabitsCount > 0
                  ? "🎉 Incredible! You completed 100% of your habits today. You're an unstoppable force!"
                  : `You've completed ${completedTodayCount} of ${totalHabitsCount} habits today (${todayPercent}%). Keep pushing!`}
              </p>
            </div>

            {/* Progress Ring & Launch New Habit Button */}
            <div className="flex items-center gap-6">
              {/* Circular Progress Ring */}
              <div className="shrink-0">
                <ProgressRing
                  percent={todayPercent}
                  size={96}
                  strokeWidth={9}
                  label={`${todayPercent}%`}
                  sublabel="Score"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setEditingHabit(null); setIsHabitModalOpen(true); }}
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-lime-500/20 cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>Launch Habit</span>
              </motion.button>
            </div>

          </div>
        </div>

        {/* Daily Motivational Quote Card */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-purple-500/20 shadow-md flex items-center gap-4"
        >
          <div className="text-2xl sm:text-3xl shrink-0">💡</div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-purple-200 font-bold italic">
              "{dailyQuote.quote}"
            </p>
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider mt-0.5 block">
              — {dailyQuote.author}
            </span>
          </div>
        </motion.div>

        {/* Daily Risk & Consequence Warning Banner if uncompleted habits exist */}
        {totalHabitsCount > 0 && completedTodayCount < totalHabitsCount && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/50 border border-rose-500/40 shadow-xl relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/40 shrink-0 animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      ⚠️ WARNING: {totalHabitsCount - completedTodayCount} TASK{totalHabitsCount - completedTodayCount > 1 ? 'S' : ''} AT RISK TODAY!
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                    If left uncompleted by midnight, you risk losing <strong className="text-amber-400">{habits.filter(h => !todayLogsMap.get(h.id)?.completed).reduce((acc, h) => acc + h.streak, 0)} active streak days</strong> and <strong className="text-amber-400">{(totalHabitsCount - completedTodayCount) * 50} XP</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsWarningModalOpen(true)}
                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 flex items-center justify-center gap-2"
              >
                <span>What You Stand To Lose</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Habit Widgets Section */}
        <HabitWidgets
          habits={habits}
          logs={logs}
          stats={stats}
          todayLogsMap={todayLogsMap}
          onToggleComplete={handleToggleComplete}
          onUpdateCount={handleUpdateCount}
          onRedeemShield={handleRedeemShield}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenAICoach={() => setIsAICoachOpen(true)}
        />

        {/* Category Filters & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Habits', icon: '⚡' },
              { id: 'fitness', label: 'Fitness', icon: '🏃' },
              { id: 'mindset', label: 'Mindset', icon: '🧠' },
              { id: 'productivity', label: 'Productivity', icon: '⚡' },
              { id: 'health', label: 'Health', icon: '💧' },
              { id: 'learning', label: 'Growth', icon: '📚' },
              { id: 'creativity', label: 'Creativity', icon: '🎨' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-lime-400 text-slate-950 border-lime-300 shadow-md shadow-lime-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search habits..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-lime-400 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

        </div>

        {/* Habits Cards Grid */}
        {filteredHabits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <AnimatePresence mode="popLayout">
              {filteredHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  todayLog={todayLogsMap.get(habit.id)}
                  onToggleComplete={handleToggleComplete}
                  onUpdateCount={handleUpdateCount}
                  onEdit={(h) => { setEditingHabit(h); setIsHabitModalOpen(true); }}
                  onDelete={handleDeleteHabit}
                  onSaveNote={handleSaveNote}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 mb-8 p-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-3xl mx-auto mb-4">
              🚀
            </div>
            <h3 className="text-lg font-black text-white mb-1">No Habits Found</h3>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              {searchQuery ? `No habits match "${searchQuery}"` : 'Launch your first habit to start building unstoppable daily streaks!'}
            </p>
            <button
              onClick={() => { setEditingHabit(null); setIsHabitModalOpen(true); }}
              className="px-6 py-3 bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 font-black text-xs uppercase rounded-2xl shadow-lg cursor-pointer"
            >
              Create New Habit
            </button>
          </div>
        )}

        {/* Weekly & Monthly Performance Report */}
        <WeeklyReport habits={habits} logs={logs} />

        {/* 30-Day Activity Heatmap Matrix */}
        <StreakHeatmap 
          habits={habits} 
          logs={logs} 
          onToggleDateLog={handleToggleDateLog}
          onSaveDateNote={handleSaveDateNote}
        />

      </main>

      {/* Floating Pomodoro Timer */}
      <PomodoroTimer habits={habits} onTimerComplete={(habitId) => handleToggleComplete(habitId)} />

      {/* Modals */}
      <AchievementsWall
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        habits={habits}
        logs={logs}
        stats={stats}
      />

      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        editingHabit={editingHabit}
      />

      <StatsAnalytics
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        habits={habits}
        logs={logs}
        stats={stats}
        onRedeemShield={handleRedeemShield}
        onImportJSON={handleImportJSON}
        onResetSeedData={handleResetSeedData}
        onResetProgressToZero={handleResetProgressToZero}
      />

      <SocialShareModal
        isOpen={isSocialOpen}
        onClose={() => setIsSocialOpen(false)}
        habits={habits}
        stats={stats}
      />

      <PushNotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        habits={habits}
        onToggleHabitReminder={(habitId, enabled, timeStr) => {
          setHabits(prev => prev.map(h => h.id === habitId ? {
            ...h,
            reminderEnabled: enabled,
            reminderTime: timeStr || h.reminderTime,
          } : h));
        }}
      />

      <AICoachModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        habits={habits}
        stats={stats}
      />

      {/* Daily Consequence & Risk Warning Modal */}
      <AnimatePresence>
        {isWarningModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsWarningModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white my-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsWarningModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest rounded-full">
                    Accountability Warning
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    What You Stand To Lose Today ⚠️
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                Consistency is the secret ingredient of compound progress. Here is the exact breakdown of streaks, XP, and habit momentum at risk if you leave today's tasks uncompleted:
              </p>

              {/* Summary Impact Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-center">
                  <div className="text-xl sm:text-2xl font-black text-rose-400">
                    {habits.filter(h => !todayLogsMap.get(h.id)?.completed).length}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Pending Tasks
                  </div>
                </div>

                <div className="p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-center">
                  <div className="text-xl sm:text-2xl font-black text-amber-400">
                    {habits.filter(h => !todayLogsMap.get(h.id)?.completed).reduce((acc, h) => acc + h.streak, 0)}d
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Streaks at Risk
                  </div>
                </div>

                <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-center">
                  <div className="text-xl sm:text-2xl font-black text-cyan-400">
                    -{(habits.filter(h => !todayLogsMap.get(h.id)?.completed).length) * 50} XP
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Forfeited XP
                  </div>
                </div>
              </div>

              {/* Pending Habits List */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span>Uncompleted Tasks & Specific Risk Stakes</span>
                </h4>

                {habits.filter(h => !todayLogsMap.get(h.id)?.completed).map(h => (
                  <div 
                    key={h.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                        {h.icon || '⚡'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-sm text-white">{h.title}</h5>
                          <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            {h.streak}d streak
                          </span>
                        </div>
                        <p className="text-xs text-rose-300 font-medium mt-0.5">
                          ❌ Risk: "{h.personalPromise || 'I promised her I would do this every day and protect our future'}"
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        handleToggleComplete(h.id, e);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Protect Streak</span>
                    </button>
                  </div>
                ))}

                {habits.filter(h => !todayLogsMap.get(h.id)?.completed).length === 0 && (
                  <div className="p-6 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    🎉 Outstanding! Every single task is completed today. No risks pending!
                  </div>
                )}
              </div>

              {/* Motivational Footer */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                <p className="text-xs italic text-slate-400">
                  "Never break the chain. 1 missed day is an accident; 2 missed days is the start of a new bad habit."
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsWarningModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Close Warning
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Stakes Overdue Schedule Promise Alert Modal */}
      <AnimatePresence>
        {overdueAlertHabit && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOverdueAlertHabit(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white my-8 text-center"
            >
              <button
                onClick={() => setOverdueAlertHabit(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/50 flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
                💔
              </div>

              <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-widest rounded-full">
                High-Stakes Promise Alert ⚠️
              </span>

              <h2 className="text-xl sm:text-2xl font-black text-white mt-2 mb-1">
                You Are Breaking Your Promise!
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-medium mb-4">
                The scheduled time (<strong className="text-amber-400">{overdueAlertHabit.reminderTime}</strong>) for <strong className="text-white font-extrabold">{overdueAlertHabit.title}</strong> has passed!
              </p>

              <div className="p-4 bg-slate-950/80 rounded-2xl border border-rose-500/40 text-left mb-6 space-y-2">
                <div className="text-[10px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Personal Oath at Risk</span>
                </div>
                <p className="text-xs text-rose-200 font-bold leading-relaxed italic">
                  "{overdueAlertHabit.personalPromise || 'I promised her I would do this every day and protect our future'}"
                </p>
                <p className="text-[11px] text-slate-300 font-semibold border-t border-slate-800 pt-2">
                  💔 <strong className="text-white">What happens if you fail:</strong> You break your word, sacrifice your commitment, and lose her trust and everything you promised to protect.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={(e) => {
                    handleToggleComplete(overdueAlertHabit.id, e);
                    setOverdueAlertHabit(null);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-lime-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Honor My Promise & Complete Now 🔥</span>
                </button>

                <button
                  onClick={() => setOverdueAlertHabit(null)}
                  className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer shrink-0"
                >
                  Dismiss Alert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Explosion Animation */}
      <ConfettiExplosion
        bursts={confettiBursts}
        onCompleteBurst={handleRemoveBurst}
      />

      {/* Smooth Background Focus Music Player ("United in Grief") */}
      <BackgroundMusicPlayer />


      {/* Simple Check-In Video Popup */}
      {showCheckInVideo && (
        <div
          onClick={closeCheckInVideo}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <video
            ref={checkInVideoRef}
            src="/modiwin.mp4"
            playsInline
            autoPlay
            onEnded={closeCheckInVideo}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '16px',
              boxShadow: '0 0 60px rgba(249,115,22,0.4)',
            }}
          />
        </div>
      )}

    </div>
  );
}
