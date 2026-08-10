import { Habit, HabitLog, UserStats } from '../types';
import { getTodayString } from './storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'completion' | 'xp' | 'special';
  requirement: (habits: Habit[], logs: HabitLog[], stats: UserStats) => boolean;
  progress: (habits: Habit[], logs: HabitLog[], stats: UserStats) => number; // 0..1
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Streak Achievements ──
  {
    id: 'streak-3',
    title: '3-Day Starter',
    description: 'Maintain a 3-day streak on any habit',
    icon: '🌱',
    category: 'streak',
    requirement: (h) => h.some(x => x.streak >= 3),
    progress: (h) => Math.min(1, Math.max(...h.map(x => x.streak), 0) / 3),
  },
  {
    id: 'streak-7',
    title: '7-Day Warrior',
    description: 'Maintain a 7-day streak on any habit',
    icon: '⚔️',
    category: 'streak',
    requirement: (h) => h.some(x => x.streak >= 7),
    progress: (h) => Math.min(1, Math.max(...h.map(x => x.streak), 0) / 7),
  },
  {
    id: 'streak-14',
    title: '2-Week Champion',
    description: 'Maintain a 14-day streak on any habit',
    icon: '🏅',
    category: 'streak',
    requirement: (h) => h.some(x => x.streak >= 14),
    progress: (h) => Math.min(1, Math.max(...h.map(x => x.streak), 0) / 14),
  },
  {
    id: 'streak-30',
    title: '30-Day Legend',
    description: 'Maintain a 30-day streak on any habit',
    icon: '👑',
    category: 'streak',
    requirement: (h) => h.some(x => x.streak >= 30),
    progress: (h) => Math.min(1, Math.max(...h.map(x => x.streak), 0) / 30),
  },
  {
    id: 'streak-100',
    title: '100-Day Immortal',
    description: 'Maintain a 100-day streak on any habit',
    icon: '💎',
    category: 'streak',
    requirement: (h) => h.some(x => x.streak >= 100),
    progress: (h) => Math.min(1, Math.max(...h.map(x => x.streak), 0) / 100),
  },

  // ── Completion Achievements ──
  {
    id: 'first-checkin',
    title: 'First Check-In',
    description: 'Complete your very first habit check-in',
    icon: '✅',
    category: 'completion',
    requirement: (_h, l) => l.some(x => x.completed),
    progress: (_h, l) => l.some(x => x.completed) ? 1 : 0,
  },
  {
    id: 'perfect-day',
    title: '100% Day',
    description: 'Complete every single habit in one day',
    icon: '🌟',
    category: 'completion',
    requirement: (h, l) => {
      if (h.length === 0) return false;
      const dates = new Set(l.filter(x => x.completed).map(x => x.date));
      for (const date of dates) {
        const completedIds = new Set(l.filter(x => x.date === date && x.completed).map(x => x.habitId));
        if (h.every(x => completedIds.has(x.id))) return true;
      }
      return false;
    },
    progress: (h, l) => {
      if (h.length === 0) return 0;
      const today = getTodayString();
      const todayCompleted = l.filter(x => x.date === today && x.completed).length;
      return Math.min(1, todayCompleted / h.length);
    },
  },
  {
    id: 'completions-10',
    title: 'Getting Warmed Up',
    description: 'Complete 10 total habit check-ins',
    icon: '🔥',
    category: 'completion',
    requirement: (_h, _l, s) => s.totalCompletions >= 10,
    progress: (_h, _l, s) => Math.min(1, s.totalCompletions / 10),
  },
  {
    id: 'completions-50',
    title: 'Half Century',
    description: 'Complete 50 total habit check-ins',
    icon: '🎯',
    category: 'completion',
    requirement: (_h, _l, s) => s.totalCompletions >= 50,
    progress: (_h, _l, s) => Math.min(1, s.totalCompletions / 50),
  },
  {
    id: 'completions-100',
    title: 'Century Club',
    description: 'Complete 100 total habit check-ins',
    icon: '💯',
    category: 'completion',
    requirement: (_h, _l, s) => s.totalCompletions >= 100,
    progress: (_h, _l, s) => Math.min(1, s.totalCompletions / 100),
  },

  // ── XP Achievements ──
  {
    id: 'xp-500',
    title: 'XP Hunter',
    description: 'Earn 500 XP total',
    icon: '⚡',
    category: 'xp',
    requirement: (_h, _l, s) => s.xp >= 500,
    progress: (_h, _l, s) => Math.min(1, s.xp / 500),
  },
  {
    id: 'xp-2000',
    title: 'XP Master',
    description: 'Earn 2,000 XP total',
    icon: '🌩️',
    category: 'xp',
    requirement: (_h, _l, s) => s.xp >= 2000,
    progress: (_h, _l, s) => Math.min(1, s.xp / 2000),
  },
  {
    id: 'level-5',
    title: 'Level 5 Elite',
    description: 'Reach Level 5',
    icon: '🎖️',
    category: 'xp',
    requirement: (_h, _l, s) => s.level >= 5,
    progress: (_h, _l, s) => Math.min(1, s.level / 5),
  },
  {
    id: 'level-10',
    title: 'Level 10 Master',
    description: 'Reach Level 10',
    icon: '🏆',
    category: 'xp',
    requirement: (_h, _l, s) => s.level >= 10,
    progress: (_h, _l, s) => Math.min(1, s.level / 10),
  },

  // ── Special Achievements ──
  {
    id: 'early-bird',
    title: 'Early Riser',
    description: 'Have "Wake Up" or "Morning" habit with 7+ day streak',
    icon: '🌅',
    category: 'special',
    requirement: (h) => h.some(x => (x.title.toLowerCase().includes('wake') || x.title.toLowerCase().includes('morning')) && x.streak >= 7),
    progress: (h) => {
      const wakeHabit = h.find(x => x.title.toLowerCase().includes('wake') || x.title.toLowerCase().includes('morning'));
      return wakeHabit ? Math.min(1, wakeHabit.streak / 7) : 0;
    },
  },
  {
    id: 'gym-rat',
    title: 'Gym Rat',
    description: 'Maintain a 14-day gym streak',
    icon: '💪',
    category: 'special',
    requirement: (h) => h.some(x => (x.title.toLowerCase().includes('gym') || x.category === 'fitness') && x.streak >= 14),
    progress: (h) => {
      const gym = h.find(x => x.title.toLowerCase().includes('gym') || x.category === 'fitness');
      return gym ? Math.min(1, gym.streak / 14) : 0;
    },
  },
  {
    id: 'hydration-hero',
    title: 'Hydration Hero',
    description: 'Maintain a 7-day water drinking streak',
    icon: '💧',
    category: 'special',
    requirement: (h) => h.some(x => (x.title.toLowerCase().includes('water') || x.title.toLowerCase().includes('hydrat')) && x.streak >= 7),
    progress: (h) => {
      const water = h.find(x => x.title.toLowerCase().includes('water') || x.title.toLowerCase().includes('hydrat'));
      return water ? Math.min(1, water.streak / 7) : 0;
    },
  },
  {
    id: 'study-machine',
    title: 'Study Machine',
    description: 'Maintain 7-day streaks on all study habits simultaneously',
    icon: '📚',
    category: 'special',
    requirement: (h) => {
      const studyHabits = h.filter(x => x.title.toLowerCase().includes('study') || x.category === 'learning');
      return studyHabits.length >= 2 && studyHabits.every(x => x.streak >= 7);
    },
    progress: (h) => {
      const studyHabits = h.filter(x => x.title.toLowerCase().includes('study') || x.category === 'learning');
      if (studyHabits.length === 0) return 0;
      const avgStreak = studyHabits.reduce((sum, x) => sum + Math.min(x.streak, 7), 0) / (studyHabits.length * 7);
      return Math.min(1, avgStreak);
    },
  },
  {
    id: 'all-categories',
    title: 'Renaissance Human',
    description: 'Have active habits in 3+ different categories',
    icon: '🦋',
    category: 'special',
    requirement: (h) => {
      const cats = new Set(h.map(x => x.category));
      return cats.size >= 3;
    },
    progress: (h) => {
      const cats = new Set(h.map(x => x.category));
      return Math.min(1, cats.size / 3);
    },
  },
];

export function getUnlockedAchievements(habits: Habit[], logs: HabitLog[], stats: UserStats): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.requirement(habits, logs, stats));
}

export function getAchievementProgress(achievement: Achievement, habits: Habit[], logs: HabitLog[], stats: UserStats): number {
  return achievement.progress(habits, logs, stats);
}
