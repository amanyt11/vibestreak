import { Habit, HabitLog, UserStats, HabitCategory } from '../types';

const HABITS_STORAGE_KEY = 'habitpulse_habits_v1';
const LOGS_STORAGE_KEY = 'habitpulse_logs_v1';
const STATS_STORAGE_KEY = 'habitpulse_stats_v1';
const DARKMODE_KEY = 'habitpulse_darkmode_v1';

// Format Date as YYYY-MM-DD in local time
export function formatDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayString(): string {
  return formatDate(new Date());
}

export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDate(yesterday);
}

// Generate past N days array of YYYY-MM-DD
export function getPastDates(daysCount: number): string[] {
  const list: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    list.push(formatDate(d));
  }
  return list;
}

// Sample Seed Data for immediate high-energy demo
export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: 'Morning Wake Up at 6 AM',
    description: 'Rise and shine early to start the day with discipline',
    category: 'health',
    color: 'from-amber-400 to-orange-500',
    icon: 'Sun',
    targetCount: 1,
    unit: 'check-in',
    reminderTime: '06:00',
    reminderEnabled: true,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    streakShields: 1,
  },
  {
    id: 'habit-2',
    title: 'Gym Workout (6:30 AM – 1 Hour)',
    description: 'Hit the gym at 6:30 AM for a solid 1-hour session',
    category: 'fitness',
    color: 'from-red-500 to-rose-600',
    icon: 'Dumbbell',
    targetCount: 1,
    unit: 'session',
    reminderTime: '06:30',
    reminderEnabled: true,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    streakShields: 1,
  },
  {
    id: 'habit-3',
    title: 'Drink 4 Liters of Water',
    description: 'Stay hydrated throughout the day — 4L target',
    category: 'health',
    color: 'from-cyan-400 to-blue-600',
    icon: 'Droplets',
    targetCount: 4,
    unit: 'Liters',
    reminderTime: '10:00',
    reminderEnabled: true,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    streakShields: 1,
  },
  {
    id: 'habit-4',
    title: 'Study Maths (2 Hours)',
    description: 'Deep focus maths study session — 2 hours daily',
    category: 'learning',
    color: 'from-purple-500 to-indigo-600',
    icon: 'Brain',
    targetCount: 120,
    unit: 'mins',
    reminderTime: '14:00',
    reminderEnabled: true,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    streakShields: 1,
  },
  {
    id: 'habit-5',
    title: 'Study English (1 Hour)',
    description: 'English language practice and study — 1 hour daily',
    category: 'learning',
    color: 'from-emerald-400 to-teal-600',
    icon: 'BookOpen',
    targetCount: 60,
    unit: 'mins',
    reminderTime: '16:00',
    reminderEnabled: true,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    streakShields: 0,
  },
  {
    id: 'habit-6',
    title: 'Study GK (1 Hour)',
    description: 'General Knowledge study session — 1 hour daily',
    category: 'learning',
    color: 'from-fuchsia-500 to-pink-600',
    icon: 'Zap',
    targetCount: 60,
    unit: 'mins',
    reminderTime: '17:00',
    reminderEnabled: true,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    streakShields: 0,
  },
  {
    id: 'habit-7',
    title: 'No Porn (Clean Mindset)',
    description: 'Stay pure, disciplined, and focused — zero porn/PMO daily oath',
    category: 'mindset',
    color: 'from-emerald-500 to-teal-600',
    icon: 'Shield',
    targetCount: 1,
    unit: 'day',
    reminderTime: '22:00',
    reminderEnabled: true,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    streakShields: 1,
  },
];

// Helper to seed logs for demo habits so charts and heatmaps look stunning right away
function generateSeedLogs(): HabitLog[] {
  const logs: HabitLog[] = [];
  const past30Days = getPastDates(30);
  const today = getTodayString();

  INITIAL_HABITS.forEach(habit => {
    // Fill in completion for past days according to streak
    past30Days.forEach(dateStr => {
      // Simulate higher completion rate for active habits
      const dayOffset = (new Date(today).getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24);
      let isDone = false;

      if (dayOffset === 0) {
        // Today randomly done for demo
        isDone = habit.streak > 5;
      } else if (dayOffset <= habit.streak) {
        isDone = true;
      } else {
        isDone = Math.random() > 0.4;
      }

      if (isDone) {
        logs.push({
          id: `log-${habit.id}-${dateStr}`,
          habitId: habit.id,
          date: dateStr,
          completed: true,
          count: habit.targetCount,
          timestamp: new Date(dateStr).getTime(),
        });
      }
    });
  });

  return logs;
}

export function loadStoredHabits(): Habit[] {
  try {
    const item = localStorage.getItem(HABITS_STORAGE_KEY);
    if (!item) {
      saveStoredHabits(INITIAL_HABITS);
      return INITIAL_HABITS;
    }
    return JSON.parse(item);
  } catch {
    return INITIAL_HABITS;
  }
}

export function saveStoredHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits:', err);
  }
}

export function loadStoredLogs(): HabitLog[] {
  try {
    const item = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!item) {
      saveStoredLogs([]);
      return [];
    }
    return JSON.parse(item);
  } catch {
    return [];
  }
}

export function saveStoredLogs(logs: HabitLog[]): void {
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save logs:', err);
  }
}

export function loadStoredStats(): UserStats {
  try {
    const item = localStorage.getItem(STATS_STORAGE_KEY);
    if (!item) {
      const defaultStats: UserStats = {
        xp: 0,
        level: 1,
        totalCompletions: 0,
        currentStreakTotal: 0,
        longestStreakEver: 0,
        streakShieldsAvailable: 1,
        joinedDate: getTodayString(),
        syncToken: 'HP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        lastSyncedAt: new Date().toLocaleTimeString(),
      };
      saveStoredStats(defaultStats);
      return defaultStats;
    }
    return JSON.parse(item);
  } catch {
    return {
      xp: 0,
      level: 1,
      totalCompletions: 0,
      currentStreakTotal: 0,
      longestStreakEver: 0,
      streakShieldsAvailable: 1,
      joinedDate: getTodayString(),
    };
  }
}

export function saveStoredStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save stats:', err);
  }
}

export type ThemeMode = 'dark' | 'amoled' | 'midnight';

export function loadDarkMode(): boolean {
  // Legacy compat — still returns true for dark-class usage
  return true;
}

export function saveDarkMode(_isDark: boolean): void {
  // No-op — theme system handles this now
}

export function loadTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('habitpulse_theme_v1');
    if (saved && ['dark', 'amoled', 'midnight'].includes(saved)) {
      return saved as ThemeMode;
    }
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem('habitpulse_theme_v1', theme);
  } catch {
    // Ignore
  }
}

export const THEME_CONFIG: Record<ThemeMode, { bg: string; card: string; border: string; label: string; icon: string }> = {
  dark: {
    bg: 'bg-slate-950',
    card: 'bg-slate-900',
    border: 'border-slate-800',
    label: 'Dark',
    icon: '🌙',
  },
  amoled: {
    bg: 'bg-black',
    card: 'bg-zinc-950',
    border: 'border-zinc-900',
    label: 'AMOLED',
    icon: '⚫',
  },
  midnight: {
    bg: 'bg-[#0a1628]',
    card: 'bg-[#0f1d32]',
    border: 'border-[#1a2d4a]',
    label: 'Midnight',
    icon: '🌊',
  },
};

// Recalculate overall streak based on 100% completion of ALL active habits for each day
export function calculateOverallDayStreak(habits: Habit[], logs: HabitLog[]): { current: number; best: number } {
  if (habits.length === 0) return { current: 0, best: 0 };

  // Find all dates with logs
  const datesSet = new Set(logs.map(l => l.date));
  const perfectDatesSet = new Set<string>();

  // A date is PERFECT (1) if and only if EVERY habit was completed on that date
  datesSet.forEach(dateStr => {
    const completedForDate = new Set(
      logs.filter(l => l.date === dateStr && l.completed).map(l => l.habitId)
    );
    const is100Percent = habits.every(h => completedForDate.has(h.id));
    if (is100Percent) {
      perfectDatesSet.add(dateStr);
    }
  });

  const today = getTodayString();
  const yesterday = getYesterdayString();

  let currentStreak = 0;
  let datePointer = new Date();

  // If today is not 100% complete yet:
  if (!perfectDatesSet.has(today)) {
    // If yesterday was 100% complete, count starting from yesterday
    if (perfectDatesSet.has(yesterday)) {
      datePointer.setDate(datePointer.getDate() - 1);
    } else {
      // Neither today nor yesterday was 100% complete -> streak is broken (0)
      currentStreak = 0;
    }
  }

  // Count backwards consecutive perfect days
  if (perfectDatesSet.has(formatDate(datePointer))) {
    while (perfectDatesSet.has(formatDate(datePointer))) {
      currentStreak++;
      datePointer.setDate(datePointer.getDate() - 1);
    }
  }

  // Calculate best streak historically
  const sortedDatesAsc = Array.from(perfectDatesSet).sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  sortedDatesAsc.forEach(dStr => {
    const curDate = new Date(dStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
    prevDate = curDate;
  });

  return {
    current: currentStreak,
    best: Math.max(bestStreak, currentStreak),
  };
}

// Recalculate individual habit streak or overall streak
export function calculateStreak(habitId: string, logs: HabitLog[], habits?: Habit[]): { current: number; best: number } {
  if (habits && habits.length > 0) {
    return calculateOverallDayStreak(habits, logs);
  }

  const habitLogs = logs
    .filter(l => l.habitId === habitId && l.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (habitLogs.length === 0) return { current: 0, best: 0 };

  const logDates = new Set(habitLogs.map(l => l.date));
  const today = getTodayString();
  const yesterday = getYesterdayString();

  let currentStreak = 0;
  let datePointer = new Date();

  if (!logDates.has(today)) {
    if (logDates.has(yesterday)) {
      datePointer.setDate(datePointer.getDate() - 1);
    } else {
      currentStreak = 0;
    }
  }

  if (logDates.has(formatDate(datePointer))) {
    while (logDates.has(formatDate(datePointer))) {
      currentStreak++;
      datePointer.setDate(datePointer.getDate() - 1);
    }
  }

  const sortedDatesAsc = Array.from(logDates).sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  sortedDatesAsc.forEach(dStr => {
    const curDate = new Date(dStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
    prevDate = curDate;
  });

  return {
    current: currentStreak,
    best: Math.max(bestStreak, currentStreak),
  };
}

// Export Habits & Logs to CSV File
export function downloadHabitsCSV(habits: Habit[], logs: HabitLog[]): void {
  const headers = ['Habit ID', 'Title', 'Category', 'Target', 'Unit', 'Current Streak', 'Best Streak', 'Total Completions', 'Created Date'];
  
  const rows = habits.map(h => {
    const totalCompletions = logs.filter(l => l.habitId === h.id && l.completed).length;
    return [
      `"${h.id}"`,
      `"${h.title.replace(/"/g, '""')}"`,
      `"${h.category}"`,
      h.targetCount,
      `"${h.unit}"`,
      h.streak,
      h.bestStreak,
      totalCompletions,
      `"${h.createdAt.split('T')[0]}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `habitpulse_habits_${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadLogsCSV(habits: Habit[], logs: HabitLog[]): void {
  const habitMap = new Map(habits.map(h => [h.id, h.title]));
  const headers = ['Log ID', 'Date', 'Habit ID', 'Habit Title', 'Completed', 'Count', 'Notes', 'Timestamp'];

  const rows = logs.map(l => {
    const title = habitMap.get(l.habitId) || 'Unknown Habit';
    return [
      `"${l.id}"`,
      `"${l.date}"`,
      `"${l.habitId}"`,
      `"${title.replace(/"/g, '""')}"`,
      l.completed ? 'TRUE' : 'FALSE',
      l.count,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      l.timestamp,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `habitpulse_activity_logs_${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export JSON Backup
export function exportDataJSON(habits: Habit[], logs: HabitLog[], stats: UserStats): string {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    habits,
    logs,
    stats,
  };
  return JSON.stringify(payload, null, 2);
}

// Category Color Helper maps
export const CATEGORY_COLORS: Record<HabitCategory, { bg: string; text: string; border: string; gradient: string }> = {
  fitness: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500 dark:text-amber-400',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500 to-orange-600',
  },
  mindset: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-400 to-teal-600',
  },
  productivity: {
    bg: 'bg-fuchsia-500/10',
    text: 'text-fuchsia-500 dark:text-fuchsia-400',
    border: 'border-fuchsia-500/30',
    gradient: 'from-fuchsia-500 to-pink-600',
  },
  health: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-500 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    gradient: 'from-cyan-400 to-blue-600',
  },
  learning: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500 dark:text-purple-400',
    border: 'border-purple-500/30',
    gradient: 'from-purple-500 to-indigo-600',
  },
  creativity: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-500 dark:text-rose-400',
    border: 'border-rose-500/30',
    gradient: 'from-rose-500 to-red-600',
  },
};
