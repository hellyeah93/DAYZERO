import { InAppNotification, NotificationPreferences } from '../types';

declare global {
  interface Window {
    electronAPI?: {
      sendNotification: (title: string, body: string) => void;
      isElectron?: boolean;
    };
    Capacitor?: any;
  }
}

/**
 * Checks if running inside Electron desktop wrapper
 */
export function isElectronEnv(): boolean {
  return typeof window !== 'undefined' && (!!window.electronAPI?.isElectron || !!(window as any).process?.versions?.electron);
}

/**
 * Checks if running inside Capacitor Android wrapper
 */
export function isCapacitorEnv(): boolean {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}

/**
 * Request notification permission across platforms
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Android Capacitor
    if (isCapacitorEnv()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    }

    // 2. Electron
    if (isElectronEnv()) {
      return true; // Electron main process has native desktop notification rights
    }

    // 3. Web Notification API
    if ('Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
    }
  } catch (err) {
    console.warn('Notification permission request error:', err);
  }
  return false;
}

/**
 * Dispatches an accountability notification to system notification center and returns in-app record
 */
export async function dispatchSystemNotification(
  title: string,
  body: string,
  type: InAppNotification['type'] = 'info',
  actionDate?: string
): Promise<InAppNotification> {
  const inAppItem: InAppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    message: body,
    type,
    timestamp: Date.now(),
    isRead: false,
    actionDate,
  };

  try {
    // 1. Capacitor Native Android Local Notification
    if (isCapacitorEnv()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 100) },
            sound: undefined,
            channelId: 'dayzero-accountability',
          },
        ],
      });
      return inAppItem;
    }

    // 2. Electron Desktop Notification
    if (isElectronEnv() && window.electronAPI?.sendNotification) {
      window.electronAPI.sendNotification(title, body);
      return inAppItem;
    }

    // 3. Browser Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `dayzero-${Date.now()}`,
      });
    }
  } catch (e) {
    console.warn('System notification delivery notice:', e);
  }

  return inAppItem;
}

/**
 * Generates tailored accountability messages based on user tone preference and real data
 */
export function generateAccountabilityMessage(
  prefs: NotificationPreferences,
  data: {
    totalTasks: number;
    completedTasks: number;
    overdueCount: number;
    trackedMinutes: number;
    targetMinutes: number;
    streakDays: number;
    yesterdayCompleted?: number;
    yesterdayTotal?: number;
  }
): { title: string; message: string; type: InAppNotification['type'] } {
  const { tone } = prefs;
  const remaining = Math.max(0, data.totalTasks - data.completedTasks);

  if (tone === 'strict') {
    if (data.overdueCount > 0) {
      return {
        title: 'ACCOUNTABILITY DEFICIT',
        message: `${data.overdueCount} overdue task${data.overdueCount > 1 ? 's are' : ' is'} waiting. Reschedule them deliberately or finish them now.`,
        type: 'alert',
      };
    }
    if (data.completedTasks < data.totalTasks && remaining > 0) {
      return {
        title: 'EXECUTION CHECK',
        message: `You planned ${data.totalTasks} tasks and completed ${data.completedTasks}. ${remaining} remain. Fix the gap.`,
        type: 'taunt',
      };
    }
    if (data.streakDays >= 3) {
      return {
        title: 'STREAK PROTECTION',
        message: `${data.streakDays} consecutive days of consistent work. Do not let today slip.`,
        type: 'success',
      };
    }
    return {
      title: 'DAYZERO BRIEFING',
      message: `Target study time: ${Math.round(data.targetMinutes / 60)}h. Logged: ${Math.round(data.trackedMinutes / 60)}h. Keep pushing.`,
      type: 'info',
    };
  }

  if (tone === 'motivational') {
    if (data.completedTasks === data.totalTasks && data.totalTasks > 0) {
      return {
        title: 'DAILY TARGET REACHED',
        message: `Outstanding execution. All ${data.totalTasks} planned tasks finished today!`,
        type: 'success',
      };
    }
    if (data.streakDays > 1) {
      return {
        title: 'MOMENTUM HIGH',
        message: `Streak active: ${data.streakDays} days! You're making measurable progress.`,
        type: 'success',
      };
    }
    return {
      title: 'DAILY FOCUS',
      message: `${data.completedTasks}/${data.totalTasks} tasks complete. You've got this!`,
      type: 'info',
    };
  }

  // Neutral
  return {
    title: 'DAYZERO STATUS',
    message: `${data.completedTasks} of ${data.totalTasks} tasks completed. ${Math.round(data.trackedMinutes / 60)}h tracked.`,
    type: 'info',
  };
}
