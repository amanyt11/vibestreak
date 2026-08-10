export interface StreakBadge {
  id: string;
  minStreak: number;
  label: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  borderColor: string;
  textColor: string;
  shadowColor: string;
}

export const STREAK_MILESTONES: StreakBadge[] = [
  {
    id: 'streak-3',
    minStreak: 3,
    label: '3D',
    title: '3-Day Ignition',
    description: 'Maintained habit consistency for 3 consecutive days.',
    icon: '⚡',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-400/50',
    textColor: 'text-amber-300',
    shadowColor: 'shadow-amber-500/20',
  },
  {
    id: 'streak-7',
    minStreak: 7,
    label: '7D',
    title: '7-Day Week Hero',
    description: 'Completed an entire 7-day uninterrupted streak.',
    icon: '🔥',
    gradient: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-400/60',
    textColor: 'text-orange-300',
    shadowColor: 'shadow-orange-500/20',
  },
  {
    id: 'streak-14',
    minStreak: 14,
    label: '14D',
    title: '14-Day Fortnight Master',
    description: 'Two full weeks of relentless dedication.',
    icon: '🛡️',
    gradient: 'from-indigo-500/20 to-blue-500/20',
    borderColor: 'border-indigo-400/60',
    textColor: 'text-indigo-300',
    shadowColor: 'shadow-indigo-500/20',
  },
  {
    id: 'streak-30',
    minStreak: 30,
    label: '30D',
    title: '30-Day Monthly Titan',
    description: 'Achieved a legendary 30-day streak milestone.',
    icon: '🏆',
    gradient: 'from-yellow-500/25 to-amber-500/25',
    borderColor: 'border-yellow-400/70',
    textColor: 'text-yellow-300',
    shadowColor: 'shadow-yellow-500/30',
  },
  {
    id: 'streak-60',
    minStreak: 60,
    label: '60D',
    title: '60-Day Diamond Streak',
    description: '60 consecutive days of habit mastery.',
    icon: '💎',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    borderColor: 'border-cyan-400/70',
    textColor: 'text-cyan-300',
    shadowColor: 'shadow-cyan-500/30',
  },
  {
    id: 'streak-100',
    minStreak: 100,
    label: '100D',
    title: '100-Day Centurion',
    description: 'Reached 100 days of habit perfection.',
    icon: '👑',
    gradient: 'from-purple-500/25 to-pink-500/25',
    borderColor: 'border-purple-400/70',
    textColor: 'text-purple-300',
    shadowColor: 'shadow-purple-500/30',
  },
  {
    id: 'streak-365',
    minStreak: 365,
    label: '365D',
    title: '365-Day Grand Immortal',
    description: 'One full year of non-stop habit excellence!',
    icon: '🌟',
    gradient: 'from-lime-400/25 to-emerald-400/25',
    borderColor: 'border-lime-400/80',
    textColor: 'text-lime-300',
    shadowColor: 'shadow-lime-500/40',
  },
];

export function getEarnedBadges(streak: number): StreakBadge[] {
  return STREAK_MILESTONES.filter(badge => streak >= badge.minStreak);
}

export function getHighestBadge(streak: number): StreakBadge | null {
  const earned = getEarnedBadges(streak);
  return earned.length > 0 ? earned[earned.length - 1] : null;
}

export function getNextBadge(streak: number): { badge: StreakBadge; daysNeeded: number } | null {
  const next = STREAK_MILESTONES.find(badge => streak < badge.minStreak);
  if (!next) return null;
  return {
    badge: next,
    daysNeeded: next.minStreak - streak,
  };
}
