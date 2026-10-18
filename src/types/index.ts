export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  subject: string;
  plannedDurationMinutes: number;
  priority: Priority;
  isRequired: boolean;
  scheduledDate: string; // YYYY-MM-DD
  originalScheduledDate: string; // YYYY-MM-DD
  deadline?: string;
  isCompleted: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  rescheduleCount: number;
  rescheduledFrom?: string[];
  isSkipped?: boolean;
  linkedMonthlyGoalId?: string;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended';

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD (session start date)
  startTime: number; // Wall-clock ms
  lastResumeTime: number; // Wall-clock ms
  accumulatedElapsedMs: number;
  pausedAt?: number;
  endTime?: number;
  status: TimerStatus;
  taskId?: string;
  taskTitle?: string;
  subject: string;
  notes?: string;
  crossedMidnight?: boolean;
  attributionHandled?: boolean;
  createdAt: number;
}

export interface TimeAttribution {
  id: string;
  sessionId: string;
  date: string; // YYYY-MM-DD
  attributedDurationMs: number;
  note?: string;
  createdAt: number;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  isRestDay: boolean;
  isFinalized: boolean;
  finalizedAt?: number;
  dailySummaryNotes?: string;
  plannedStudyMinutes?: number;
}

export interface MonthlyGoal {
  id: string;
  monthKey: string; // YYYY-MM
  title: string;
  subject: string;
  targetTaskCount: number;
  targetStudyHours: number;
  isCompleted: boolean;
  notes?: string;
  createdAt: number;
}

export interface PlanningDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export type NotificationTone = 'neutral' | 'motivational' | 'strict';

export interface NotificationPreferences {
  morningSummary: boolean;
  morningTime: string;
  taskReminders: boolean;
  overdueReminders: boolean;
  studyMilestones: boolean;
  eveningSummary: boolean;
  eveningTime: string;
  endOfDayReminder: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  tone: NotificationTone;
}

export type MidnightAttributionPolicy = 'prompt' | 'split' | 'assign_start' | 'assign_end';

export interface UserSettings {
  dailyTargetStudyMinutes: number;
  defaultPriority: Priority;
  subjects: string[];
  notificationPreferences: NotificationPreferences;
  midnightPolicy: MidnightAttributionPolicy;
  weekStartsOn: 0 | 1; // 0=Sunday, 1=Monday
  heatmapMetric: 'completion' | 'hours';
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert' | 'taunt';
  timestamp: number;
  isRead: boolean;
  actionDate?: string;
}

export interface DayStatusSummary {
  date: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isRestDay: boolean;
  isFinalized: boolean;
  totalRequiredTasks: number;
  completedRequiredTasks: number;
  totalOptionalTasks: number;
  completedOptionalTasks: number;
  overdueTasksCount: number;
  completionPercentage: number;
  plannedMinutes: number;
  actualTrackedMinutes: number;
  statusType: 'unplanned' | 'rest' | 'future_planned' | 'completed' | 'partial' | 'failed' | 'overdue';
}
