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
    title: 'Morning 20-min HIIT Workout',
    description: 'Get the heart pumping and skyrocket energy for the day',
    category: 'fitness',
    color: 'from-amber-500 to-red-500',
    icon: 'Dumbbell',
    targetCount: 1,
    unit: 'session',
    reminderTime: '07:30',
    reminderEnabled: true,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    streakShields: 1,
  },
  {
    id: 'habit-2',
    title: 'Hydrate 3 Liters Water',
    description: 'Fuel your focus and stay peak energized',
    category: 'health',
    color: 'from-cyan-400 to-blue-600',
    icon: 'Droplets',
    targetCount: 3,
    unit: 'Liters',
    reminderTime: '10:00',
    reminderEnabled: true,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    streakShields: 1,
  },
  {
    id: 'habit-3',
    title: 'Deep Work Reading 30m',
    description: 'Read high-impact mental growth or skill books',
    category: 'learning',
    color: 'from-purple-500 to-indigo-600',
    icon: 'BookOpen',
    targetCount: 30,
    unit: 'mins',
    reminderTime: '20:00',
    reminderEnabled: false,
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString(),
    streakShields: 0,
  },
  {
    id: 'habit-4',
    title: 'Mindfulness & Gratitude',
    description: '10 minutes structured meditation & evening reflections',
    category: 'mindset',
    color: 'from-emerald-400 to-teal-600',
    icon: 'Brain',
    targetCount: 10,
    unit: 'mins',
    reminderTime: '21:30',
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

export function loadDarkMode(): boolean {
  try {
    const saved = localStorage.getItem(DARKMODE_KEY);
    return saved !== null ? JSON.parse(saved) : true; // Default dark for vibrant high energy UI
  } catch {
    return true;
  }
}

export function saveDarkMode(isDark: boolean): void {
  try {
    localStorage.setItem(DARKMODE_KEY, JSON.stringify(isDark));
  } catch {
    // Ignore
  }
}

// Recalculate habit streak based on logs
export function calculateStreak(habitId: string, logs: HabitLog[]): { current: number; best: number } {
  const habitLogs = logs
    .filter(l => l.habitId === habitId && l.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (habitLogs.length === 0) return { current: 0, best: 0 };

  const logDates = new Set(habitLogs.map(l => l.date));
  const today = getTodayString();
  const yesterday = getYesterdayString();

  let currentStreak = 0;
  let datePointer = new Date();

  // If today isn't logged yet, start checking from yesterday to preserve streak continuity
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

  // Calculate best streak historically
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
