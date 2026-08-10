import { Habit } from '../types';

export class NotificationManager {
  private static permissionGranted: boolean = false;

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public static getPermissionState(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    
    try {
      const result = await Notification.requestPermission();
      this.permissionGranted = result === 'granted';
      return this.permissionGranted;
    } catch {
      return false;
    }
  }

  public static sendPush(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported()) return false;
    
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
        return true;
      } catch (err) {
        console.warn('Push notification failed:', err);
      }
    }
    return false;
  }

  public static triggerTestNotification() {
    const sent = this.sendPush('🔥 HabitPulse: Streak On Fire!', {
      body: 'Keep your momentum going! Check off your daily habits now to level up.',
      tag: 'habitpulse-test',
    });

    return sent;
  }

  public static sendHabitReminder(habit: Habit) {
    return this.sendPush(`⏰ Reminder: ${habit.title}`, {
      body: `Time to crush your ${habit.title} habit! Current Streak: ${habit.streak} days 🔥`,
      tag: `habit-reminder-${habit.id}`,
    });
  }
}
