import type { StudySession, TimeAttribution } from '../types/index.ts';
import { formatLocalDate, parseLocalDate, addDaysToDate } from './dateUtils.ts';

/**
 * Calculates total elapsed milliseconds for a session at a given reference time (defaults to Date.now()).
 * Prevents double-counting: if paused or ended, only accumulatedElapsedMs is returned.
 * If running, returns accumulatedElapsedMs + (now - lastResumeTime).
 */
export function calculateElapsedMs(session: StudySession, now: number = Date.now()): number {
  if (session.status === 'running') {
    const delta = Math.max(0, now - session.lastResumeTime);
    return session.accumulatedElapsedMs + delta;
  }
  return session.accumulatedElapsedMs;
}

/**
 * Formats milliseconds into HH:MM:SS or string representation.
 */
export function formatDurationHMS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hStr = hours < 10 ? `0${hours}` : `${hours}`;
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const sStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${hStr}:${mStr}:${sStr}`;
}

export function formatDurationHuman(ms: number): string {
  const totalMinutes = Math.round(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) {
    const seconds = Math.round(ms / 1000);
    return `${seconds}s`;
  }
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

export interface MidnightSplitResult {
  hasCrossedMidnight: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalElapsedMs: number;
  startDayMs: number;
  endDayMs: number;
}

/**
 * Checks if a session crossed midnight (or multiple midnights) between its start time and the current/end time.
 * Calculates exact millisecond allocation split at 00:00:00 of the new day.
 */
export function evaluateMidnightCrossover(
  session: StudySession,
  now: number = Date.now()
): MidnightSplitResult {
  const totalElapsed = calculateElapsedMs(session, now);
  const startDateStr = session.date;
  const currentOrEndDateStr = session.endTime
    ? formatLocalDate(new Date(session.endTime))
    : formatLocalDate(new Date(now));

  if (startDateStr === currentOrEndDateStr) {
    return {
      hasCrossedMidnight: false,
      startDate: startDateStr,
      endDate: currentOrEndDateStr,
      totalElapsedMs: totalElapsed,
      startDayMs: totalElapsed,
      endDayMs: 0,
    };
  }

  // Crosses midnight!
  // Find local midnight timestamp between startDate and the next day:
  const nextDayDate = parseLocalDate(addDaysToDate(startDateStr, 1));
  const midnightTimestamp = nextDayDate.getTime();

  // Active elapsed time before midnight:
  // If session started at startTime and continued across midnight:
  const rawBeforeMidnight = Math.max(0, midnightTimestamp - session.startTime);
  const startDayMs = Math.min(totalElapsed, rawBeforeMidnight);
  const endDayMs = Math.max(0, totalElapsed - startDayMs);

  return {
    hasCrossedMidnight: true,
    startDate: startDateStr,
    endDate: currentOrEndDateStr,
    totalElapsedMs: totalElapsed,
    startDayMs,
    endDayMs,
  };
}

/**
 * Creates TimeAttribution records based on the chosen attribution strategy:
 * - 'assign_start': 100% to session start date
 * - 'assign_end': 100% to session end/current date
 * - 'split': mathematically split across midnight
 */
export function createAttributionRecords(
  session: StudySession,
  choice: 'assign_start' | 'assign_end' | 'split',
  now: number = Date.now()
): TimeAttribution[] {
  const splitInfo = evaluateMidnightCrossover(session, now);
  const attributions: TimeAttribution[] = [];

  if (!splitInfo.hasCrossedMidnight || choice === 'assign_start') {
    attributions.push({
      id: `attr_${session.id}_${splitInfo.startDate}`,
      sessionId: session.id,
      date: splitInfo.startDate,
      attributedDurationMs: splitInfo.totalElapsedMs,
      note: splitInfo.hasCrossedMidnight ? 'Assigned entire session to start day' : undefined,
      createdAt: Date.now(),
    });
  } else if (choice === 'assign_end') {
    attributions.push({
      id: `attr_${session.id}_${splitInfo.endDate}`,
      sessionId: session.id,
      date: splitInfo.endDate,
      attributedDurationMs: splitInfo.totalElapsedMs,
      note: 'Assigned entire session to ending day',
      createdAt: Date.now(),
    });
  } else if (choice === 'split') {
    if (splitInfo.startDayMs > 0) {
      attributions.push({
        id: `attr_${session.id}_${splitInfo.startDate}`,
        sessionId: session.id,
        date: splitInfo.startDate,
        attributedDurationMs: splitInfo.startDayMs,
        note: `Pre-midnight split (${formatDurationHuman(splitInfo.startDayMs)})`,
        createdAt: Date.now(),
      });
    }
    if (splitInfo.endDayMs > 0) {
      attributions.push({
        id: `attr_${session.id}_${splitInfo.endDate}`,
        sessionId: session.id,
        date: splitInfo.endDate,
        attributedDurationMs: splitInfo.endDayMs,
        note: `Post-midnight split (${formatDurationHuman(splitInfo.endDayMs)})`,
        createdAt: Date.now(),
      });
    }
  }

  return attributions;
}
