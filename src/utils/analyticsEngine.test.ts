import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDaySummary,
  calculateStreak,
} from './analyticsEngine.ts';
import type { Task, DailyRecord, TimeAttribution } from '../types/index.ts';

test('analyticsEngine - computeDaySummary calculates completion % correctly', () => {
  const tasks: Task[] = [
    {
      id: 't1',
      title: 'Task 1',
      subject: 'Physics',
      plannedDurationMinutes: 60,
      priority: 'high',
      isRequired: true,
      scheduledDate: '2026-10-19',
      originalScheduledDate: '2026-10-19',
      isCompleted: true,
      createdAt: 1,
      updatedAt: 1,
      rescheduleCount: 0,
    },
    {
      id: 't2',
      title: 'Task 2',
      subject: 'Maths',
      plannedDurationMinutes: 60,
      priority: 'high',
      isRequired: true,
      scheduledDate: '2026-10-19',
      originalScheduledDate: '2026-10-19',
      isCompleted: false,
      createdAt: 1,
      updatedAt: 1,
      rescheduleCount: 0,
    },
    {
      id: 't3',
      title: 'Optional Task',
      subject: 'Chemistry',
      plannedDurationMinutes: 30,
      priority: 'low',
      isRequired: false,
      scheduledDate: '2026-10-19',
      originalScheduledDate: '2026-10-19',
      isCompleted: true,
      createdAt: 1,
      updatedAt: 1,
      rescheduleCount: 0,
    },
  ];

  const attributions: TimeAttribution[] = [
    {
      id: 'a1',
      sessionId: 's1',
      date: '2026-10-19',
      attributedDurationMs: 90 * 60 * 1000, // 90 min
      createdAt: 1,
    },
  ];

  const summary = computeDaySummary('2026-10-19', tasks, {}, attributions, '2026-10-19');
  assert.equal(summary.totalRequiredTasks, 2);
  assert.equal(summary.completedRequiredTasks, 1);
  assert.equal(summary.completionPercentage, 50); // 1 / 2 = 50%
  assert.equal(summary.actualTrackedMinutes, 90);
  assert.equal(summary.statusType, 'partial');
});

test('analyticsEngine - calculateStreak respects rest days without breaking', () => {
  const dates = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21'];
  const tasks: Task[] = [
    // 18 Oct completed
    {
      id: 't1',
      title: 'Work 18',
      subject: 'Physics',
      plannedDurationMinutes: 60,
      priority: 'high',
      isRequired: true,
      scheduledDate: '2026-10-18',
      originalScheduledDate: '2026-10-18',
      isCompleted: true,
      createdAt: 1,
      updatedAt: 1,
      rescheduleCount: 0,
    },
    // 20 Oct completed
    {
      id: 't2',
      title: 'Work 20',
      subject: 'Maths',
      plannedDurationMinutes: 60,
      priority: 'high',
      isRequired: true,
      scheduledDate: '2026-10-20',
      originalScheduledDate: '2026-10-20',
      isCompleted: true,
      createdAt: 1,
      updatedAt: 1,
      rescheduleCount: 0,
    },
  ];

  // 19 Oct is marked as rest day!
  const dailyRecords: Record<string, DailyRecord> = {
    '2026-10-19': {
      date: '2026-10-19',
      isRestDay: true,
      isFinalized: true,
    },
  };

  const { currentStreak, longestStreak } = calculateStreak(
    dates,
    tasks,
    dailyRecords,
    [],
    '2026-10-20'
  );

  // Both 18 and 20 are complete, 19 is a rest day, so streak is maintained across the rest day
  assert.equal(longestStreak, 2);
  assert.equal(currentStreak, 2);
});
