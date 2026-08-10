import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, BellOff, Check, Send, Clock, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Habit } from '../types';
import { NotificationManager } from '../utils/notifications';
import { soundFX } from '../utils/audio';

interface PushNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onToggleHabitReminder: (habitId: string, enabled: boolean, timeStr?: string) => void;
}

export const PushNotificationCenter: React.FC<PushNotificationCenterProps> = ({
  isOpen,
  onClose,
  habits,
  onToggleHabitReminder,
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermissionState(NotificationManager.getPermissionState());
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

  const handleEnablePermissions = async () => {
    const granted = await NotificationManager.requestPermission();
    setPermissionState(NotificationManager.getPermissionState());
    if (granted) {
      soundFX.playCheerSound();
      NotificationManager.triggerTestNotification();
    }
  };

  const handleFireTest = () => {
    soundFX.playCheerSound();
    NotificationManager.triggerTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
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
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white my-8"
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
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-2xl">
              🔔
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                Push Notifications & Alarms
              </h2>
              <p className="text-xs text-slate-400">Never break a streak with high-energy timed reminders.</p>
            </div>
          </div>

          {/* Permission Status Banner */}
          <div className="p-4 rounded-2xl border mb-6 flex items-center justify-between gap-3 bg-slate-950/80 border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                permissionState === 'granted' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {permissionState === 'granted' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs font-black text-white">
                  Browser Permission: {permissionState.toUpperCase()}
                </div>
                <div className="text-[11px] text-slate-400">
                  {permissionState === 'granted'
                    ? 'Push alerts are active and armed!'
                    : 'Grant permission to receive push alerts on device.'}
                </div>
              </div>
            </div>

            {permissionState !== 'granted' ? (
              <button
                onClick={handleEnablePermissions}
                className="px-3.5 py-2 bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
              >
                Allow Alerts
              </button>
            ) : (
              <button
                onClick={handleFireTest}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                {testSent ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Send className="w-3.5 h-3.5" />}
                <span>{testSent ? 'Sent!' : 'Test Alarm'}</span>
              </button>
            )}
          </div>

          {/* Scheduled Habit Reminders List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Habit Reminder Schedules
            </h3>

            {habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-sm border border-slate-700">
                    {habit.icon || '⚡'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{habit.title}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{habit.reminderTime || '08:00 AM'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={habit.reminderTime || '08:00'}
                    onChange={(e) => onToggleHabitReminder(habit.id, habit.reminderEnabled, e.target.value)}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-amber-400 focus:outline-none"
                  />
                  <button
                    onClick={() => onToggleHabitReminder(habit.id, !habit.reminderEnabled, habit.reminderTime)}
                    className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                      habit.reminderEnabled ? 'bg-amber-400 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-slate-950" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end pt-3 border-t border-slate-800">
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
