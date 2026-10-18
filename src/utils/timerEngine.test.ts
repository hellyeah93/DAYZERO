import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateElapsedMs,
  formatDurationHMS,
  formatDurationHuman,
  evaluateMidnightCrossover,
  createAttributionRecords,
} from './timerEngine.ts';
import type { StudySession } from '../types/index.ts';

test('timerEngine - calculateElapsedMs returns accurate elapsed time for running session', () => {
  const session: StudySession = {
    id: 's1',
    date: '2026-10-18',
    startTime: 1000000,
    lastResumeTime: 1000000,
    accumulatedElapsedMs: 5000,
    status: 'running',
    subject: 'Physics',
    createdAt: 1000000,
  };

  const now = 1003000; // +3000ms
  assert.equal(calculateElapsedMs(session, now), 8000);
});

test('timerEngine - calculateElapsedMs preserves exact accumulated time when paused', () => {
  const session: StudySession = {
    id: 's1',
    date: '2026-10-18',
    startTime: 1000000,
    lastResumeTime: 1000000,
    accumulatedElapsedMs: 125000,
    pausedAt: 1050000,
    status: 'paused',
    subject: 'Chemistry',
    createdAt: 1000000,
  };

  const now = 2000000; // much later
  assert.equal(calculateElapsedMs(session, now), 125000);
});

test('timerEngine - formatDurationHMS formats correctly', () => {
  assert.equal(formatDurationHMS(0), '00:00:00');
  assert.equal(formatDurationHMS(65000), '00:01:05');
  assert.equal(formatDurationHMS(3665000), '01:01:05');
});

test('timerEngine - formatDurationHuman formats readable string', () => {
  assert.equal(formatDurationHuman(3600000), '1h');
  assert.equal(formatDurationHuman(5400000), '1h 30m');
  assert.equal(formatDurationHuman(120000), '2m');
});

test('timerEngine - midnight crossover detection and split', () => {
  // Session starts on 2026-10-18 at 23:00 (11:00 PM) local time
  // Next day midnight is 2026-10-19 00:00:00
  // Suppose it ends at 2026-10-19 02:00 (2:00 AM) local time
  // Total elapsed: 3 hours = 3 * 3600 * 1000 ms
  const startLocalMidnight = new Date(2026, 9, 18, 0, 0, 0, 0).getTime();
  const start23h = startLocalMidnight + 23 * 3600 * 1000;
  const endNext2h = startLocalMidnight + 26 * 3600 * 1000;

  const session: StudySession = {
    id: 'midnight_sess_1',
    date: '2026-10-18',
    startTime: start23h,
    lastResumeTime: start23h,
    accumulatedElapsedMs: 3 * 3600 * 1000,
    endTime: endNext2h,
    status: 'ended',
    subject: 'Physics',
    createdAt: start23h,
  };

  const splitResult = evaluateMidnightCrossover(session, endNext2h);
  assert.equal(splitResult.hasCrossedMidnight, true);
  assert.equal(splitResult.startDate, '2026-10-18');
  assert.equal(splitResult.endDate, '2026-10-19');
  assert.equal(splitResult.totalElapsedMs, 3 * 3600 * 1000);

  // 1 hour before midnight (23:00 to 00:00), 2 hours after midnight (00:00 to 02:00)
  assert.equal(splitResult.startDayMs, 1 * 3600 * 1000);
  assert.equal(splitResult.endDayMs, 2 * 3600 * 1000);

  // Test split attribution creation
  const splitAttributions = createAttributionRecords(session, 'split', endNext2h);
  assert.equal(splitAttributions.length, 2);
  assert.equal(splitAttributions[0].date, '2026-10-18');
  assert.equal(splitAttributions[0].attributedDurationMs, 1 * 3600 * 1000);
  assert.equal(splitAttributions[1].date, '2026-10-19');
  assert.equal(splitAttributions[1].attributedDurationMs, 2 * 3600 * 1000);

  // Total attributed duration must never exceed actual total
  const sumAttributed = splitAttributions.reduce((s, a) => s + a.attributedDurationMs, 0);
  assert.equal(sumAttributed, session.accumulatedElapsedMs);
});
