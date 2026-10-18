import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Task,
  StudySession,
  TimeAttribution,
  DailyRecord,
  MonthlyGoal,
  PlanningDateRange,
  UserSettings,
  InAppNotification,
  DayStatusSummary,
} from '../types/index.ts';
import {
  LocalStore,
  DEFAULT_PLANNING_RANGE,
  DEFAULT_SETTINGS,
} from '../services/storage';
import {
  formatLocalDate,
  getTodayDateString,
  addDaysToDate,
  generateDateRange,
} from '../utils/dateUtils';
import {
  calculateElapsedMs,
  evaluateMidnightCrossover,
  createAttributionRecords,
  MidnightSplitResult,
} from '../utils/timerEngine';
import {
  computeDaySummary,
  calculateStreak,
} from '../utils/analyticsEngine';
import {
  dispatchSystemNotification,
  generateAccountabilityMessage,
} from '../utils/notifications';
import {
  initFirebase,
  syncTaskToCloud,
  deleteTaskFromCloud,
  syncSessionToCloud,
  syncAttributionToCloud,
  syncDailyRecordToCloud,
  syncMonthlyGoalToCloud,
  subscribeToAuth,
  subscribeToCloudTasks,
  logoutUser,
  SyncStatus,
} from '../services/firebase';
import type { User } from 'firebase/auth';

interface AppContextValue {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateRange: PlanningDateRange;
  setDateRange: (range: PlanningDateRange) => void;
  allDatesInRange: string[];
  tasks: Task[];
  sessions: StudySession[];
  attributions: TimeAttribution[];
  dailyRecords: Record<string, DailyRecord>;
  monthlyGoals: MonthlyGoal[];
  settings: UserSettings;
  notifications: InAppNotification[];
  activeTimer: StudySession | null;
  timerElapsedMs: number;
  midnightPromptData: MidnightSplitResult | null;
  syncStatus: SyncStatus;
  firebaseUser: User | null;

  // Selected date statistics
  selectedDaySummary: DayStatusSummary;
  todaySummary: DayStatusSummary;
  streakInfo: { currentStreak: number; longestStreak: number };

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'rescheduleCount'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskCompletion: (id: string) => void;
  rescheduleTask: (id: string, newDate: string, reason?: string) => void;
  carryForwardTask: (id: string, targetDate?: string) => void;
  deleteTask: (id: string) => void;

  // Timer actions
  startTimer: (subject?: string, taskId?: string, taskTitle?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  restartTimer: () => void;
  endCurrentSession: (notes?: string) => void;
  resolveMidnightCrossover: (choice: 'assign_start' | 'assign_end' | 'split') => void;
  dismissMidnightPrompt: () => void;

  // Day & Plan actions
  toggleRestDay: (date: string) => void;
  finalizeDay: (date: string, notes?: string) => void;
  reopenDay: (date: string) => void;
  importTasks: (newTasks: Task[]) => void;
  addMonthlyGoal: (goal: Omit<MonthlyGoal, 'id' | 'createdAt'>) => void;
  updateMonthlyGoal: (id: string, updates: Partial<MonthlyGoal>) => void;
  deleteMonthlyGoal: (id: string) => void;

  // Settings & notifications
  updateSettings: (newSettings: UserSettings) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  triggerManualNotification: () => void;
  handleLogout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dateRange, setDateRangeState] = useState<PlanningDateRange>(() => LocalStore.getDateRange());
  const [tasks, setTasksState] = useState<Task[]>(() => LocalStore.getTasks());
  const [sessions, setSessionsState] = useState<StudySession[]>(() => LocalStore.getSessions());
  const [attributions, setAttributionsState] = useState<TimeAttribution[]>(() => LocalStore.getAttributions());
  const [dailyRecords, setDailyRecordsState] = useState<Record<string, DailyRecord>>(() => LocalStore.getDailyRecords());
  const [monthlyGoals, setMonthlyGoalsState] = useState<MonthlyGoal[]>(() => LocalStore.getMonthlyGoals());
  const [settings, setSettingsState] = useState<UserSettings>(() => LocalStore.getSettings());
  const [notifications, setNotificationsState] = useState<InAppNotification[]>(() => LocalStore.getNotifications());
  
  // Timer State
  const [activeTimer, setActiveTimerState] = useState<StudySession | null>(() => LocalStore.getActiveTimer());
  const [timerElapsedMs, setTimerElapsedMs] = useState<number>(0);
  const [midnightPromptData, setMidnightPromptData] = useState<MidnightSplitResult | null>(null);

  // Sync & Firebase
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  // Default selected date: today if in range, otherwise 2026-10-19 (first planning day)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = getTodayDateString();
    const range = LocalStore.getDateRange();
    if (today >= range.startDate && today <= range.endDate) {
      return today;
    }
    return range.startDate;
  });

  // Calculate all dates in configured range
  const allDatesInRange = useMemo(() => {
    return generateDateRange(dateRange.startDate, dateRange.endDate);
  }, [dateRange.startDate, dateRange.endDate]);

  // Sync state saves
  const setDateRange = useCallback((range: PlanningDateRange) => {
    setDateRangeState(range);
    LocalStore.setDateRange(range);
  }, []);

  const setTasks = useCallback((newTasks: Task[]) => {
    setTasksState(newTasks);
    LocalStore.setTasks(newTasks);
  }, []);

  const setSessions = useCallback((updater: StudySession[] | ((prev: StudySession[]) => StudySession[])) => {
    setSessionsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      LocalStore.setSessions(next);
      return next;
    });
  }, []);

  const setAttributions = useCallback((updater: TimeAttribution[] | ((prev: TimeAttribution[]) => TimeAttribution[])) => {
    setAttributionsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      LocalStore.setAttributions(next);
      return next;
    });
  }, []);

  const setDailyRecords = useCallback((records: Record<string, DailyRecord>) => {
    setDailyRecordsState(records);
    LocalStore.setDailyRecords(records);
  }, []);

  const setMonthlyGoals = useCallback((goals: MonthlyGoal[]) => {
    setMonthlyGoalsState(goals);
    LocalStore.setMonthlyGoals(goals);
  }, []);

  const updateSettings = useCallback((newSettings: UserSettings) => {
    setSettingsState(newSettings);
    LocalStore.setSettings(newSettings);
  }, []);

  const setNotifications = useCallback((updater: InAppNotification[] | ((prev: InAppNotification[]) => InAppNotification[])) => {
    setNotificationsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      LocalStore.setNotifications(next);
      return next;
    });
  }, []);

  // Initialize Firebase and subscribe to Auth
  useEffect(() => {
    const initialized = initFirebase(settings.firebaseConfig);
    if (!initialized) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('synced');
    const unsubscribe = subscribeToAuth((user) => {
      setFirebaseUser(user);
      if (user) {
        setSyncStatus('synced');
        // Subscribe to cloud task sync
        const unsubCloud = subscribeToCloudTasks(user.uid, (cloudTasks) => {
          if (cloudTasks && cloudTasks.length > 0) {
            setTasksState((prev) => {
              // Merge preserving local updates
              const map = new Map(prev.map((t) => [t.id, t]));
              cloudTasks.forEach((ct) => map.set(ct.id, ct));
              const merged = Array.from(map.values());
              LocalStore.setTasks(merged);
              return merged;
            });
          }
        });
        return () => unsubCloud();
      } else {
        setSyncStatus('offline');
      }
    });

    return () => unsubscribe();
  }, [settings.firebaseConfig]);

  // Persistent Timer Interval Engine
  useEffect(() => {
    if (!activeTimer) {
      setTimerElapsedMs(0);
      return;
    }

    // Initial calculation from timestamps
    setTimerElapsedMs(calculateElapsedMs(activeTimer, Date.now()));

    // Check midnight crossover
    const crossover = evaluateMidnightCrossover(activeTimer, Date.now());
    if (crossover.hasCrossedMidnight && !activeTimer.attributionHandled && !midnightPromptData) {
      if (settings.midnightPolicy === 'prompt') {
        setMidnightPromptData(crossover);
      } else {
        // Auto resolve according to policy
        const choice = settings.midnightPolicy;
        const attrs = createAttributionRecords(activeTimer, choice, Date.now());
        setAttributions((prev) => [...prev, ...attrs]);
        const updated = { ...activeTimer, attributionHandled: true, crossedMidnight: true };
        setActiveTimerState(updated);
        LocalStore.setActiveTimer(updated);
      }
    }

    if (activeTimer.status !== 'running') {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setTimerElapsedMs(calculateElapsedMs(activeTimer, now));

      // Periodic midnight check during live run
      const liveCrossover = evaluateMidnightCrossover(activeTimer, now);
      if (liveCrossover.hasCrossedMidnight && !activeTimer.attributionHandled && !midnightPromptData) {
        if (settings.midnightPolicy === 'prompt') {
          setMidnightPromptData(liveCrossover);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activeTimer, settings.midnightPolicy, midnightPromptData, setAttributions]);

  // Handle visibility change (App wake / screen unlock / tab refocus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeTimer) {
        const now = Date.now();
        setTimerElapsedMs(calculateElapsedMs(activeTimer, now));
        const crossover = evaluateMidnightCrossover(activeTimer, now);
        if (crossover.hasCrossedMidnight && !activeTimer.attributionHandled) {
          setMidnightPromptData(crossover);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [activeTimer]);

  // Task Actions
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'rescheduleCount'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rescheduleCount: 0,
      originalScheduledDate: taskData.scheduledDate,
    };

    setTasksState((prev) => {
      const next = [newTask, ...prev];
      LocalStore.setTasks(next);
      return next;
    });

    if (firebaseUser) {
      syncTaskToCloud(firebaseUser.uid, newTask).catch(console.error);
    }

    return newTask;
  }, [firebaseUser]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasksState((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates, updatedAt: Date.now() };
          if (firebaseUser) {
            syncTaskToCloud(firebaseUser.uid, updated).catch(console.error);
          }
          return updated;
        }
        return t;
      });
      LocalStore.setTasks(next);
      return next;
    });
  }, [firebaseUser]);

  const toggleTaskCompletion = useCallback((id: string) => {
    setTasksState((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          const willComplete = !t.isCompleted;
          const updated: Task = {
            ...t,
            isCompleted: willComplete,
            completedAt: willComplete ? Date.now() : undefined,
            updatedAt: Date.now(),
          };
          if (firebaseUser) {
            syncTaskToCloud(firebaseUser.uid, updated).catch(console.error);
          }
          return updated;
        }
        return t;
      });
      LocalStore.setTasks(next);
      return next;
    });
  }, [firebaseUser]);

  const rescheduleTask = useCallback((id: string, newDate: string, reason?: string) => {
    setTasksState((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          const history = t.rescheduledFrom || [];
          const updated: Task = {
            ...t,
            scheduledDate: newDate,
            rescheduleCount: t.rescheduleCount + 1,
            rescheduledFrom: [...history, t.scheduledDate],
            notes: reason ? `${t.notes ? t.notes + '\n' : ''}[Rescheduled to ${newDate}: ${reason}]` : t.notes,
            updatedAt: Date.now(),
          };
          if (firebaseUser) {
            syncTaskToCloud(firebaseUser.uid, updated).catch(console.error);
          }
          return updated;
        }
        return t;
      });
      LocalStore.setTasks(next);
      return next;
    });
  }, [firebaseUser]);

  const carryForwardTask = useCallback((id: string, targetDate: string = getTodayDateString()) => {
    rescheduleTask(id, targetDate, 'Carried forward from backlog');
  }, [rescheduleTask]);

  const deleteTask = useCallback((id: string) => {
    setTasksState((prev) => {
      const next = prev.filter((t) => t.id !== id);
      LocalStore.setTasks(next);
      return next;
    });
    if (firebaseUser) {
      deleteTaskFromCloud(firebaseUser.uid, id).catch(console.error);
    }
  }, [firebaseUser]);

  // Timer Actions
  const startTimer = useCallback((subject: string = 'General', taskId?: string, taskTitle?: string) => {
    const now = Date.now();
    const currentDate = formatLocalDate(new Date(now));

    const newSession: StudySession = {
      id: `sess_${now}_${Math.random().toString(36).substring(2, 6)}`,
      date: currentDate,
      startTime: now,
      lastResumeTime: now,
      accumulatedElapsedMs: 0,
      status: 'running',
      taskId,
      taskTitle,
      subject,
      createdAt: now,
    };

    setActiveTimerState(newSession);
    LocalStore.setActiveTimer(newSession);
    setTimerElapsedMs(0);
    setMidnightPromptData(null);
  }, []);

  const pauseTimer = useCallback(() => {
    if (!activeTimer || activeTimer.status !== 'running') return;
    const now = Date.now();
    const delta = Math.max(0, now - activeTimer.lastResumeTime);
    const updated: StudySession = {
      ...activeTimer,
      status: 'paused',
      pausedAt: now,
      accumulatedElapsedMs: activeTimer.accumulatedElapsedMs + delta,
    };
    setActiveTimerState(updated);
    LocalStore.setActiveTimer(updated);
    setTimerElapsedMs(updated.accumulatedElapsedMs);
  }, [activeTimer]);

  const resumeTimer = useCallback(() => {
    if (!activeTimer || activeTimer.status !== 'paused') return;
    const now = Date.now();
    const updated: StudySession = {
      ...activeTimer,
      status: 'running',
      lastResumeTime: now,
      pausedAt: undefined,
    };
    setActiveTimerState(updated);
    LocalStore.setActiveTimer(updated);
  }, [activeTimer]);

  const restartTimer = useCallback(() => {
    if (!activeTimer) return;
    const now = Date.now();
    const restarted: StudySession = {
      ...activeTimer,
      startTime: now,
      lastResumeTime: now,
      accumulatedElapsedMs: 0,
      pausedAt: undefined,
      status: 'running',
    };
    setActiveTimerState(restarted);
    LocalStore.setActiveTimer(restarted);
    setTimerElapsedMs(0);
    setMidnightPromptData(null);
  }, [activeTimer]);

  const endCurrentSession = useCallback((notes?: string) => {
    if (!activeTimer) return;
    const now = Date.now();
    const finalElapsed = calculateElapsedMs(activeTimer, now);

    if (finalElapsed < 5000) {
      // Discard accidental clicks < 5 seconds
      setActiveTimerState(null);
      LocalStore.setActiveTimer(null);
      setTimerElapsedMs(0);
      setMidnightPromptData(null);
      return;
    }

    const endedSession: StudySession = {
      ...activeTimer,
      status: 'ended',
      endTime: now,
      accumulatedElapsedMs: finalElapsed,
      notes: notes || activeTimer.notes,
    };

    // Save session to history
    setSessions((prev) => [endedSession, ...prev]);

    // Create time attributions (default assign to session date if not already split)
    if (!activeTimer.attributionHandled) {
      const attributionsToAdd = createAttributionRecords(endedSession, 'assign_start', now);
      setAttributions((prev) => [...prev, ...attributionsToAdd]);
      if (firebaseUser) {
        attributionsToAdd.forEach((a) => syncAttributionToCloud(firebaseUser.uid, a).catch(console.error));
      }
    }

    if (firebaseUser) {
      syncSessionToCloud(firebaseUser.uid, endedSession).catch(console.error);
    }

    setActiveTimerState(null);
    LocalStore.setActiveTimer(null);
    setTimerElapsedMs(0);
    setMidnightPromptData(null);
  }, [activeTimer, setSessions, setAttributions, firebaseUser]);

  const resolveMidnightCrossover = useCallback((choice: 'assign_start' | 'assign_end' | 'split') => {
    if (!activeTimer) return;
    const now = Date.now();
    const attributionsToAdd = createAttributionRecords(activeTimer, choice, now);
    setAttributions((prev) => [...prev, ...attributionsToAdd]);

    if (firebaseUser) {
      attributionsToAdd.forEach((a) => syncAttributionToCloud(firebaseUser.uid, a).catch(console.error));
    }

    const updated: StudySession = {
      ...activeTimer,
      attributionHandled: true,
      crossedMidnight: true,
    };
    setActiveTimerState(updated);
    LocalStore.setActiveTimer(updated);
    setMidnightPromptData(null);
  }, [activeTimer, setAttributions, firebaseUser]);

  const dismissMidnightPrompt = useCallback(() => {
    setMidnightPromptData(null);
  }, []);

  // Day & Plan Actions
  const toggleRestDay = useCallback((date: string) => {
    setDailyRecordsState((prev) => {
      const existing = prev[date] || { date, isRestDay: false, isFinalized: false };
      const updated: DailyRecord = {
        ...existing,
        isRestDay: !existing.isRestDay,
      };
      const next = { ...prev, [date]: updated };
      LocalStore.setDailyRecords(next);
      if (firebaseUser) {
        syncDailyRecordToCloud(firebaseUser.uid, updated).catch(console.error);
      }
      return next;
    });
  }, [firebaseUser]);

  const finalizeDay = useCallback((date: string, notes?: string) => {
    setDailyRecordsState((prev) => {
      const existing = prev[date] || { date, isRestDay: false, isFinalized: false };
      const updated: DailyRecord = {
        ...existing,
        isFinalized: true,
        finalizedAt: Date.now(),
        dailySummaryNotes: notes || existing.dailySummaryNotes,
      };
      const next = { ...prev, [date]: updated };
      LocalStore.setDailyRecords(next);
      if (firebaseUser) {
        syncDailyRecordToCloud(firebaseUser.uid, updated).catch(console.error);
      }
      return next;
    });
  }, [firebaseUser]);

  const reopenDay = useCallback((date: string) => {
    setDailyRecordsState((prev) => {
      const existing = prev[date];
      if (!existing) return prev;
      const updated: DailyRecord = {
        ...existing,
        isFinalized: false,
      };
      const next = { ...prev, [date]: updated };
      LocalStore.setDailyRecords(next);
      if (firebaseUser) {
        syncDailyRecordToCloud(firebaseUser.uid, updated).catch(console.error);
      }
      return next;
    });
  }, [firebaseUser]);

  const importTasks = useCallback((newTasks: Task[]) => {
    setTasksState((prev) => {
      const next = [...newTasks, ...prev];
      LocalStore.setTasks(next);
      return next;
    });
    if (firebaseUser) {
      newTasks.forEach((t) => syncTaskToCloud(firebaseUser.uid, t).catch(console.error));
    }
  }, [firebaseUser]);

  const addMonthlyGoal = useCallback((goalData: Omit<MonthlyGoal, 'id' | 'createdAt'>) => {
    const newGoal: MonthlyGoal = {
      ...goalData,
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    setMonthlyGoalsState((prev) => {
      const next = [newGoal, ...prev];
      LocalStore.setMonthlyGoals(next);
      return next;
    });
    if (firebaseUser) {
      syncMonthlyGoalToCloud(firebaseUser.uid, newGoal).catch(console.error);
    }
  }, [firebaseUser]);

  const updateMonthlyGoal = useCallback((id: string, updates: Partial<MonthlyGoal>) => {
    setMonthlyGoalsState((prev) => {
      const next = prev.map((g) => {
        if (g.id === id) {
          const updated = { ...g, ...updates };
          if (firebaseUser) {
            syncMonthlyGoalToCloud(firebaseUser.uid, updated).catch(console.error);
          }
          return updated;
        }
        return g;
      });
      LocalStore.setMonthlyGoals(next);
      return next;
    });
  }, [firebaseUser]);

  const deleteMonthlyGoal = useCallback((id: string) => {
    setMonthlyGoalsState((prev) => {
      const next = prev.filter((g) => g.id !== id);
      LocalStore.setMonthlyGoals(next);
      return next;
    });
  }, []);

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, [setNotifications]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  const triggerManualNotification = useCallback(async () => {
    const todayStr = getTodayDateString();
    const todaySummary = computeDaySummary(todayStr, tasks, dailyRecords, attributions, todayStr);
    const streak = calculateStreak(allDatesInRange, tasks, dailyRecords, attributions, todayStr);

    const messagePayload = generateAccountabilityMessage(settings.notificationPreferences, {
      totalTasks: todaySummary.totalRequiredTasks,
      completedTasks: todaySummary.completedRequiredTasks,
      overdueCount: todaySummary.overdueTasksCount,
      trackedMinutes: todaySummary.actualTrackedMinutes,
      targetMinutes: settings.dailyTargetStudyMinutes,
      streakDays: streak.currentStreak,
    });

    const notifItem = await dispatchSystemNotification(
      messagePayload.title,
      messagePayload.message,
      messagePayload.type,
      todayStr
    );

    setNotifications((prev) => [notifItem, ...prev]);
  }, [tasks, dailyRecords, attributions, allDatesInRange, settings, setNotifications]);

  const handleLogout = useCallback(async () => {
    await logoutUser();
    setFirebaseUser(null);
    setSyncStatus('offline');
  }, []);

  // Statistics calculation
  const todayStr = getTodayDateString();
  const selectedDaySummary = useMemo(() => {
    return computeDaySummary(selectedDate, tasks, dailyRecords, attributions, todayStr);
  }, [selectedDate, tasks, dailyRecords, attributions, todayStr]);

  const todaySummary = useMemo(() => {
    return computeDaySummary(todayStr, tasks, dailyRecords, attributions, todayStr);
  }, [todayStr, tasks, dailyRecords, attributions]);

  const streakInfo = useMemo(() => {
    return calculateStreak(allDatesInRange, tasks, dailyRecords, attributions, todayStr);
  }, [allDatesInRange, tasks, dailyRecords, attributions, todayStr]);

  const value: AppContextValue = {
    selectedDate,
    setSelectedDate,
    dateRange,
    setDateRange,
    allDatesInRange,
    tasks,
    sessions,
    attributions,
    dailyRecords,
    monthlyGoals,
    settings,
    notifications,
    activeTimer,
    timerElapsedMs,
    midnightPromptData,
    syncStatus,
    firebaseUser,

    selectedDaySummary,
    todaySummary,
    streakInfo,

    addTask,
    updateTask,
    toggleTaskCompletion,
    rescheduleTask,
    carryForwardTask,
    deleteTask,

    startTimer,
    pauseTimer,
    resumeTimer,
    restartTimer,
    endCurrentSession,
    resolveMidnightCrossover,
    dismissMidnightPrompt,

    toggleRestDay,
    finalizeDay,
    reopenDay,
    importTasks,
    addMonthlyGoal,
    updateMonthlyGoal,
    deleteMonthlyGoal,

    updateSettings,
    markNotificationRead,
    clearAllNotifications,
    triggerManualNotification,
    handleLogout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
