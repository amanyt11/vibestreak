export type HabitCategory = 'fitness' | 'mindset' | 'productivity' | 'health' | 'learning' | 'creativity';

export type FrequencyType = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: HabitCategory;
  color: string; // Tailind background/accent name or hex
  icon: string; // Lucide icon name
  targetCount: number;
  unit: string;
  reminderTime?: string; // e.g., "08:30"
  reminderEnabled: boolean;
  personalPromise?: string; // High stakes promise to her / personal oath
  streak: number;
  bestStreak: number;
  createdAt: string; // ISO string
  archived?: boolean;
  streakShields: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  count: number;
  notes?: string;
  timestamp: number;
}

export interface UserStats {
  xp: number;
  level: number;
  totalCompletions: number;
  currentStreakTotal: number;
  longestStreakEver: number;
  streakShieldsAvailable: number;
  joinedDate: string;
  syncToken?: string;
  lastSyncedAt?: string;
}

export interface Buddy {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  habitTitle: string;
  lastActive: string;
  cheersReceived: number;
  isUserFriend?: boolean;
}

export interface NotificationSetting {
  enabled: boolean;
  soundEnabled: boolean;
  permissionGranted: boolean;
  dailyReminderHour: number; // 0-23
}

export type FilterTab = 'all' | 'today' | 'fitness' | 'mindset' | 'productivity' | 'health' | 'learning' | 'creativity';
