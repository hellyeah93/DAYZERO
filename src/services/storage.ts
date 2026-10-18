import {
  Task,
  StudySession,
  TimeAttribution,
  DailyRecord,
  MonthlyGoal,
  PlanningDateRange,
  UserSettings,
  InAppNotification,
} from '../types';
import { getTodayDateString, addDaysToDate } from '../utils/dateUtils';

const STORAGE_KEYS = {
  TASKS: 'dayzero_tasks_v1',
  SESSIONS: 'dayzero_sessions_v1',
  ATTRIBUTIONS: 'dayzero_attributions_v1',
  DAILY_RECORDS: 'dayzero_daily_records_v1',
  MONTHLY_GOALS: 'dayzero_monthly_goals_v1',
  DATE_RANGE: 'dayzero_date_range_v1',
  SETTINGS: 'dayzero_settings_v1',
  NOTIFICATIONS: 'dayzero_notifications_v1',
  ACTIVE_TIMER: 'dayzero_active_timer_v1',
};

export const DEFAULT_PLANNING_RANGE: PlanningDateRange = {
  startDate: '2026-10-18',
  endDate: '2027-01-20',
};

export const DEFAULT_SETTINGS: UserSettings = {
  dailyTargetStudyMinutes: 300, // 5 hours target
  defaultPriority: 'medium',
  subjects: ['Physics', 'Chemistry', 'Maths', 'Revision', 'General'],
  notificationPreferences: {
    morningSummary: true,
    morningTime: '08:00',
    taskReminders: true,
    overdueReminders: true,
    studyMilestones: true,
    eveningSummary: true,
    eveningTime: '21:30',
    endOfDayReminder: true,
    quietHoursStart: '23:00',
    quietHoursEnd: '07:00',
    tone: 'strict',
  },
  midnightPolicy: 'prompt',
  weekStartsOn: 1, // Monday
  heatmapMetric: 'completion',
  firebaseConfig: {
    apiKey: "AIzaSyANVO7HC1TUOhClok6UeKyC9X6iOifYdOY",
    authDomain: "dayzero-e40a9.firebaseapp.com",
    projectId: "dayzero-e40a9",
    storageBucket: "dayzero-e40a9.firebasestorage.app",
    messagingSenderId: "670380538395",
    appId: "1:670380538395:web:44d3788096b1ed502e16be",
  },
};

/**
 * Generates realistic seed tasks around the default date range (e.g. 18-25 Oct 2026)
 */
export function getInitialSeedTasks(): Task[] {
  const seed: Task[] = [
    // 18 October 2026 (Start Date)
    {
      id: 'task_seed_1',
      title: 'Planning & Syllabus Mapping',
      subject: 'Revision',
      plannedDurationMinutes: 60,
      priority: 'high',
      isRequired: true,
      scheduledDate: '2026-10-18',
      originalScheduledDate: '2026-10-18',
      isCompleted: true,
      completedAt: 1792340000000,
      createdAt: 1792300000000,
      updatedAt: 1792340000000,
      rescheduleCount: 0,
    },
    {
      id: 'task_seed_2',
      title: 'Maths — Calculus Diagnostic Set',
      subject: 'Maths',
      plannedDurationMinutes: 90,
      priority: 'medium',
      isRequired: true,
      scheduledDate: '2026-10-18',
      originalScheduledDate: '2026-10-18',
      isCompleted: true,
      completedAt: 1792350000000,
      createdAt: 1792300000000,
      updatedAt: 1792350000000,
      rescheduleCount: 0,
    },
    // 19 October 2026 (Monday)
    {
      id: 'task_seed_3',
      title: 'EMI revision — Theory & Key Formulas',
      subject: 'Physics',
      plannedDurationMinutes: 90,
      priority: 'high',
      isRequired: true,
      scheduledDate: '2026-10-19',
      originalScheduledDate: '2026-10-19',
      isCompleted: true,
      completedAt: 1792420000000,
      createdAt: 1792300000000,
      updatedAt: 1792420000000,
      rescheduleCount: 0,
    },
    {
      id: 'task_seed_4',
      title: 'Chemical kinetics PYQs (1-30)',
      subject: 'Chemistry',
      plannedDurationMinutes: 120,
      priority: 'critical',
      isRequired: true,
      scheduledDate: '2026-10-19',
      originalScheduledDate: '2026-10-19',
      isCompleted: true,
      completedAt: 1792430000000,
      createdAt: 1792300000000,
      updatedAt: 1792430000000,
      rescheduleCount: 0,
    },
    {
      id: 'task_seed_5',
      title: 'Differential equations — Homogeneous & Exact',
      subject: 'Maths',
      plannedDurationMinutes: 90,
      priority: 'high',
      isRequired: true,
      scheduledDate: '2026-10-19',
      originalScheduledDate: '2026-10-19',
      isCompleted: false,
      createdAt: 1792300000000,
      updatedAt: 1792300000000,
      rescheduleCount: 0,
    },
    {
      id: 'task_seed_6',
      title: 'Short notes review — Inorganic exceptions',
      subject: 'Chemistry',
      plannedDurationMinutes: 30,
      priority: 'low',
      isRequired: false,
      scheduledDate: '2026-10-19',
      originalScheduledDate: '2026-10-19',
      isCompleted: false,
      createdAt: 1792300000000,
      updatedAt: 1792300000000,
      rescheduleCount: 0,
    },
    // 20 October 2026 (Tuesday)
    {
      id: 'task_seed_7',
      title: 'Physics — EMI practice & Lenz Law problems',
      subject: 'Physics',
      plannedDurationMinutes: 90,
      priority: 'high',
      isRequired: true,
      scheduledDate: '2026-10-20',
      originalScheduledDate: '2026-10-20',
      isCompleted: false,
      createdAt: 1792300000000,
      updatedAt: 1792300000000,
      rescheduleCount: 0,
    },
    {
      id: 'task_seed_8',
      title: 'Chemistry — Organic reaction mechanisms revision',
      subject: 'Chemistry',
      plannedDurationMinutes: 90,
      priority: 'high',
      isRequired: true,
      scheduledDate: '2026-10-20',
      originalScheduledDate: '2026-10-20',
      isCompleted: false,
      createdAt: 1792300000000,
      updatedAt: 1792300000000,
      rescheduleCount: 0,
    },
    {
      id: 'task_seed_9',
      title: 'Maths — Differential equations PYQs',
      subject: 'Maths',
      plannedDurationMinutes: 90,
      priority: 'high',
      isRequired: true,
      scheduledDate: '2026-10-20',
      originalScheduledDate: '2026-10-20',
      isCompleted: false,
      createdAt: 1792300000000,
      updatedAt: 1792300000000,
      rescheduleCount: 0,
    },
  ];

  return seed;
}

export function getInitialSeedMonthlyGoals(): MonthlyGoal[] {
  return [
    {
      id: 'goal_oct_physics',
      monthKey: '2026-10',
      title: 'Complete EMI & AC Electromagnetism chapters',
      subject: 'Physics',
      targetTaskCount: 15,
      targetStudyHours: 25,
      isCompleted: false,
      createdAt: Date.now(),
    },
    {
      id: 'goal_oct_chem',
      monthKey: '2026-10',
      title: 'Complete Kinetics, Solutions & Coordination compounds',
      subject: 'Chemistry',
      targetTaskCount: 18,
      targetStudyHours: 30,
      isCompleted: false,
      createdAt: Date.now(),
    },
    {
      id: 'goal_oct_maths',
      monthKey: '2026-10',
      title: 'Differential Equations & Area under curve mastery',
      subject: 'Maths',
      targetTaskCount: 20,
      targetStudyHours: 35,
      isCompleted: false,
      createdAt: Date.now(),
    },
  ];
}

// Local Storage helpers
export function loadFromLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key "${key}":`, err);
    return fallback;
  }
}

export function saveToLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key "${key}":`, err);
  }
}

export const LocalStore = {
  getTasks: (): Task[] => loadFromLocal(STORAGE_KEYS.TASKS, getInitialSeedTasks()),
  setTasks: (tasks: Task[]) => saveToLocal(STORAGE_KEYS.TASKS, tasks),

  getSessions: (): StudySession[] => loadFromLocal(STORAGE_KEYS.SESSIONS, []),
  setSessions: (sessions: StudySession[]) => saveToLocal(STORAGE_KEYS.SESSIONS, sessions),

  getAttributions: (): TimeAttribution[] => loadFromLocal(STORAGE_KEYS.ATTRIBUTIONS, []),
  setAttributions: (attr: TimeAttribution[]) => saveToLocal(STORAGE_KEYS.ATTRIBUTIONS, attr),

  getDailyRecords: (): Record<string, DailyRecord> => loadFromLocal(STORAGE_KEYS.DAILY_RECORDS, {}),
  setDailyRecords: (records: Record<string, DailyRecord>) => saveToLocal(STORAGE_KEYS.DAILY_RECORDS, records),

  getMonthlyGoals: (): MonthlyGoal[] => loadFromLocal(STORAGE_KEYS.MONTHLY_GOALS, getInitialSeedMonthlyGoals()),
  setMonthlyGoals: (goals: MonthlyGoal[]) => saveToLocal(STORAGE_KEYS.MONTHLY_GOALS, goals),

  getDateRange: (): PlanningDateRange => loadFromLocal(STORAGE_KEYS.DATE_RANGE, DEFAULT_PLANNING_RANGE),
  setDateRange: (range: PlanningDateRange) => saveToLocal(STORAGE_KEYS.DATE_RANGE, range),

  getSettings: (): UserSettings => loadFromLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  setSettings: (settings: UserSettings) => saveToLocal(STORAGE_KEYS.SETTINGS, settings),

  getNotifications: (): InAppNotification[] => loadFromLocal(STORAGE_KEYS.NOTIFICATIONS, []),
  setNotifications: (notifs: InAppNotification[]) => saveToLocal(STORAGE_KEYS.NOTIFICATIONS, notifs),

  getActiveTimer: (): StudySession | null => loadFromLocal<StudySession | null>(STORAGE_KEYS.ACTIVE_TIMER, null),
  setActiveTimer: (session: StudySession | null) => saveToLocal(STORAGE_KEYS.ACTIVE_TIMER, session),

  exportAllData: (): string => {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tasks: LocalStore.getTasks(),
      sessions: LocalStore.getSessions(),
      attributions: LocalStore.getAttributions(),
      dailyRecords: LocalStore.getDailyRecords(),
      monthlyGoals: LocalStore.getMonthlyGoals(),
      dateRange: LocalStore.getDateRange(),
      settings: LocalStore.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.tasks) LocalStore.setTasks(data.tasks);
      if (data.sessions) LocalStore.setSessions(data.sessions);
      if (data.attributions) LocalStore.setAttributions(data.attributions);
      if (data.dailyRecords) LocalStore.setDailyRecords(data.dailyRecords);
      if (data.monthlyGoals) LocalStore.setMonthlyGoals(data.monthlyGoals);
      if (data.dateRange) LocalStore.setDateRange(data.dateRange);
      if (data.settings) LocalStore.setSettings(data.settings);
      return true;
    } catch (e) {
      console.error('Import parse error:', e);
      return false;
    }
  },
};
