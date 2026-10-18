import type {
  Task,
  DailyRecord,
  TimeAttribution,
  DayStatusSummary,
} from '../types/index.ts';
import {
  getTodayDateString,
  addDaysToDate,
  diffDays,
} from './dateUtils.ts';

/**
 * Computes day status summary for a given date.
 */
export function computeDaySummary(
  date: string,
  tasks: Task[],
  dailyRecords: Record<string, DailyRecord>,
  attributions: TimeAttribution[],
  todayStr: string = getTodayDateString()
): DayStatusSummary {
  const isToday = date === todayStr;
  const isPast = date < todayStr;
  const isFuture = date > todayStr;

  const dayRecord = dailyRecords[date];
  const isRestDay = dayRecord?.isRestDay ?? false;
  const isFinalized = dayRecord?.isFinalized ?? false;

  // Filter tasks for this scheduled date
  const dayTasks = tasks.filter((t) => t.scheduledDate === date && !t.isSkipped);
  const requiredTasks = dayTasks.filter((t) => t.isRequired);
  const optionalTasks = dayTasks.filter((t) => !t.isRequired);

  const completedRequired = requiredTasks.filter((t) => t.isCompleted).length;
  const completedOptional = optionalTasks.filter((t) => t.isCompleted).length;

  const totalRequired = requiredTasks.length;
  const totalOptional = optionalTasks.length;

  // Completion %: based on required tasks. If 0 required tasks but has optional, use optional. If 0 tasks total, 0.
  let completionPercentage = 0;
  if (totalRequired > 0) {
    completionPercentage = Math.round((completedRequired / totalRequired) * 100);
  } else if (totalOptional > 0) {
    completionPercentage = Math.round((completedOptional / totalOptional) * 100);
  }

  // Overdue count: tasks scheduled for this date (or earlier) that are past/today and not completed
  const overdueTasksCount = dayTasks.filter(
    (t) => !t.isCompleted && (isPast || (isToday && t.deadline && new Date().toTimeString().slice(0, 5) > t.deadline))
  ).length;

  // Planned minutes
  const plannedMinutes = dayTasks.reduce((sum, t) => sum + (t.plannedDurationMinutes || 0), 0);

  // Actual tracked minutes from time attributions for this date
  const dayAttributions = attributions.filter((a) => a.date === date);
  const actualTrackedMs = dayAttributions.reduce((sum, a) => sum + a.attributedDurationMs, 0);
  const actualTrackedMinutes = Math.round(actualTrackedMs / (1000 * 60));

  // Determine statusType
  let statusType: DayStatusSummary['statusType'] = 'unplanned';

  if (isRestDay) {
    statusType = 'rest';
  } else if (dayTasks.length === 0 && actualTrackedMinutes === 0) {
    statusType = 'unplanned';
  } else if (isFuture) {
    statusType = 'future_planned';
  } else if (totalRequired > 0 && completedRequired === totalRequired) {
    statusType = 'completed';
  } else if (completionPercentage > 0) {
    statusType = 'partial';
  } else if (overdueTasksCount > 0) {
    statusType = 'overdue';
  } else if (totalRequired > 0 && completedRequired === 0 && (isPast || isToday)) {
    statusType = 'failed';
  } else if (dayTasks.length > 0) {
    statusType = 'partial';
  }

  return {
    date,
    isToday,
    isPast,
    isFuture,
    isRestDay,
    isFinalized,
    totalRequiredTasks: totalRequired,
    completedRequiredTasks: completedRequired,
    totalOptionalTasks: totalOptional,
    completedOptionalTasks: completedOptional,
    overdueTasksCount,
    completionPercentage,
    plannedMinutes: dayRecord?.plannedStudyMinutes || plannedMinutes,
    actualTrackedMinutes,
    statusType,
  };
}

/**
 * Computes streaks:
 * A day qualifies if completedRequired == totalRequired (or completion >= 80% if tasks > 0).
 * Rest days do NOT break streak!
 */
export function calculateStreak(
  dateRange: string[],
  tasks: Task[],
  dailyRecords: Record<string, DailyRecord>,
  attributions: TimeAttribution[],
  todayStr: string = getTodayDateString()
): { currentStreak: number; longestStreak: number } {
  let longestStreak = 0;
  let tempStreak = 0;
  let currentStreak = 0;

  // Sort past dates up to today
  const eligibleDates = dateRange.filter((d) => d <= todayStr).sort();

  for (const date of eligibleDates) {
    const summary = computeDaySummary(date, tasks, dailyRecords, attributions, todayStr);

    if (summary.isRestDay) {
      // Rest day preserves streak, does not increment
      continue;
    }

    if (summary.totalRequiredTasks === 0 && summary.actualTrackedMinutes === 0) {
      // Unplanned day: does not break if in past unless user had unfinished business
      continue;
    }

    // Success condition: 100% completion of required tasks, or at least 1 completed task with 80%+
    const isSuccessful =
      summary.totalRequiredTasks > 0 &&
      summary.completedRequiredTasks >= summary.totalRequiredTasks;

    if (isSuccessful) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // For current streak, count backward from today (or yesterday if today is still in progress)
  let checkDate = todayStr;

  // If today has tasks but is not yet finished, check backwards starting from yesterday
  const todaySummary = computeDaySummary(todayStr, tasks, dailyRecords, attributions, todayStr);
  const todayHasTasks = todaySummary.totalRequiredTasks > 0;
  const todayFinished = todayHasTasks && todaySummary.completedRequiredTasks >= todaySummary.totalRequiredTasks;

  if (todayHasTasks && !todayFinished) {
    // Today is in progress; don't break streak, but don't count today until finished
    checkDate = addDaysToDate(todayStr, -1);
  }

  while (eligibleDates.includes(checkDate)) {
    const s = computeDaySummary(checkDate, tasks, dailyRecords, attributions, todayStr);
    if (s.isRestDay) {
      checkDate = addDaysToDate(checkDate, -1);
      continue;
    }
    if (s.totalRequiredTasks === 0 && s.actualTrackedMinutes === 0) {
      checkDate = addDaysToDate(checkDate, -1);
      continue;
    }
    if (s.totalRequiredTasks > 0 && s.completedRequiredTasks >= s.totalRequiredTasks) {
      currentStreak++;
      checkDate = addDaysToDate(checkDate, -1);
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

/**
 * Subject-wise tracked time breakdown
 */
export function calculateSubjectBreakdown(
  attributions: TimeAttribution[],
  tasks: Task[]
): { subject: string; minutes: number; percentage: number; color: string }[] {
  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, t));

  const subjectTotals: Record<string, number> = {};
  let grandTotalMs = 0;

  for (const attr of attributions) {
    // If attribution note or session links to subject
    // We attribute by subject
    const subject = 'General Study'; // fallback
    subjectTotals[subject] = (subjectTotals[subject] || 0) + attr.attributedDurationMs;
    grandTotalMs += attr.attributedDurationMs;
  }

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const result = Object.entries(subjectTotals).map(([subject, ms], idx) => {
    const minutes = Math.round(ms / 60000);
    const percentage = grandTotalMs > 0 ? Math.round((ms / grandTotalMs) * 100) : 0;
    return {
      subject,
      minutes,
      percentage,
      color: colors[idx % colors.length],
    };
  });

  return result.sort((a, b) => b.minutes - a.minutes);
}
