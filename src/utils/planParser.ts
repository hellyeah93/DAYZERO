import type { Task, Priority } from '../types/index.ts';
import {
  formatLocalDate,
  parseLocalDate,
  addDaysToDate,
  MONTH_NAMES_SHORT,
  MONTH_NAMES_FULL,
  getTodayDateString,
  getWeekRange,
} from './dateUtils.ts';

export interface ParsedTaskItem {
  rawLine: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  dayLabel: string;
  plannedMinutes: number;
  priority: Priority;
  isValid: boolean;
  validationError?: string;
}

export interface PlanParseResult {
  detectedWeekStart?: string;
  detectedWeekEnd?: string;
  tasks: ParsedTaskItem[];
  warnings: string[];
  totalParsed: number;
}

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

/**
 * Extracts a date from a string like "19 October", "19 Oct", "19 October 2026", "2026-10-19"
 */
function tryExtractDate(str: string, fallbackYear: number): string | null {
  // Check ISO format YYYY-MM-DD
  const isoMatch = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Check "19 October [2026]" or "19 Oct [2026]"
  const words = str.replace(/[,\-–—]/g, ' ').trim().split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const day = parseInt(words[i], 10);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      const monthWord = words[i + 1].toLowerCase();
      let monthIndex = -1;

      for (let m = 0; m < 12; m++) {
        if (
          MONTH_NAMES_FULL[m].toLowerCase() === monthWord ||
          MONTH_NAMES_SHORT[m].toLowerCase() === monthWord
        ) {
          monthIndex = m;
          break;
        }
      }

      if (monthIndex !== -1) {
        let year = fallbackYear;
        if (i + 2 < words.length) {
          const possibleYear = parseInt(words[i + 2], 10);
          if (possibleYear >= 2020 && possibleYear <= 2040) {
            year = possibleYear;
          }
        }
        const mStr = String(monthIndex + 1).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        return `${year}-${mStr}-${dStr}`;
      }
    }
  }

  return null;
}

/**
 * Extracts subject and title from a line like:
 * "Physics — EMI revision" -> { subject: "Physics", title: "EMI revision" }
 * "Maths: Integration PYQs" -> { subject: "Maths", title: "Integration PYQs" }
 * "[Chemistry] Organic reactions" -> { subject: "Chemistry", title: "Organic reactions" }
 */
export function extractSubjectAndTitle(rawText: string): { subject: string; title: string } {
  let cleaned = rawText.trim().replace(/^[-*•\d.)\]]\s*/, '').trim();

  // Pattern: [Subject] Title
  const bracketMatch = cleaned.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (bracketMatch) {
    return {
      subject: bracketMatch[1].trim(),
      title: bracketMatch[2].trim() || bracketMatch[1].trim(),
    };
  }

  // Pattern: Subject — Title, Subject: Title, Subject - Title
  const separatorMatch = cleaned.match(/^([^:—–-]+)\s*[:—–-]\s*(.+)$/);
  if (separatorMatch && separatorMatch[1].trim().length < 30) {
    const possibleSubject = separatorMatch[1].trim();
    const possibleTitle = separatorMatch[2].trim();
    // Only treat as subject if it's 1-4 words
    if (possibleSubject.split(/\s+/).length <= 4) {
      return {
        subject: possibleSubject,
        title: possibleTitle,
      };
    }
  }

  return {
    subject: 'General',
    title: cleaned,
  };
}

/**
 * Offline natural language parser for weekly/daily plans.
 */
export function parseNaturalLanguagePlan(
  text: string,
  referenceDateStr: string = getTodayDateString(),
  configuredRange?: { startDate: string; endDate: string }
): PlanParseResult {
  const lines = text.split('\n');
  const warnings: string[] = [];
  const tasks: ParsedTaskItem[] = [];

  const refDate = parseLocalDate(referenceDateStr);
  const fallbackYear = refDate.getFullYear();

  let detectedWeekStart: string | null = null;
  let detectedWeekEnd: string | null = null;

  // 1. First scan for Week declaration
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^week\b/i.test(trimmed) || /to|–|-/.test(trimmed)) {
      const parts = trimmed.split(/to|–|—|-/i);
      if (parts.length >= 2) {
        const startCandidate = tryExtractDate(parts[0], fallbackYear);
        const endCandidate = tryExtractDate(parts[1], fallbackYear);
        if (startCandidate) {
          detectedWeekStart = startCandidate;
          detectedWeekEnd = endCandidate || addDaysToDate(startCandidate, 6);
          break;
        }
      }
    }
  }

  // Fallback week range if not explicitly declared in text: use the week of referenceDateStr
  if (!detectedWeekStart) {
    const defaultWeek = getWeekRange(referenceDateStr);
    detectedWeekStart = defaultWeek.start;
    detectedWeekEnd = defaultWeek.end;
  }

  // Calculate Monday of the detected week:
  const weekStartMonday = detectedWeekStart;

  let currentTargetDate = weekStartMonday;
  let currentDayLabel = 'Monday';

  // 2. Parse lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Ignore top-level WEEKLY PLAN headers
    if (/^weekly\s+plan/i.test(line) || /^week:\s*/i.test(line)) {
      continue;
    }

    // Check if line is a Day heading (e.g. "Monday:", "Tuesday", "Wed - 21 Oct", "19 October:")
    const cleanHeader = line.replace(/[:\-–—]+$/, '').trim().toLowerCase();
    
    // Check if it's a weekday name
    const weekdayKey = cleanHeader.split(/[\s,–—-]+/)[0];
    if (WEEKDAY_MAP[weekdayKey] !== undefined) {
      const targetDayOfWeek = WEEKDAY_MAP[weekdayKey]; // 0=Sun, 1=Mon, ..., 6=Sat
      currentDayLabel = line.replace(/[:\-–—]+$/, '').trim();

      // Find date for this weekday relative to Monday
      // If week starts on Monday:
      // Mon is offset 0, Tue offset 1, ..., Sun offset 6
      const offset = targetDayOfWeek === 0 ? 6 : targetDayOfWeek - 1;
      currentTargetDate = addDaysToDate(weekStartMonday, offset);
      continue;
    }

    // Check if it's an explicit date heading e.g. "19 October:" or "2026-10-19"
    const explicitDate = tryExtractDate(line, fallbackYear);
    if (explicitDate && line.length < 40 && !line.includes('—') && !line.includes(': ')) {
      currentTargetDate = explicitDate;
      currentDayLabel = line.replace(/[:\-–—]+$/, '').trim();
      continue;
    }

    // Otherwise, treat as a task under currentTargetDate!
    // Skip general notes like "Weekly revision and backlog recovery" if empty or non-task
    const { subject, title } = extractSubjectAndTitle(line);

    if (!title || title.length < 2) {
      continue;
    }

    let isValid = true;
    let validationError: string | undefined;

    // Range checking
    if (configuredRange) {
      if (currentTargetDate < configuredRange.startDate || currentTargetDate > configuredRange.endDate) {
        isValid = false;
        validationError = `Date ${currentTargetDate} is outside configured range (${configuredRange.startDate} to ${configuredRange.endDate})`;
        warnings.push(`Task "${title}" assigned to ${currentTargetDate} is outside planning range.`);
      }
    }

    tasks.push({
      rawLine: line,
      title,
      subject,
      date: currentTargetDate,
      dayLabel: currentDayLabel,
      plannedMinutes: 60, // default 1 hour
      priority: 'medium',
      isValid,
      validationError,
    });
  }

  return {
    detectedWeekStart: weekStartMonday,
    detectedWeekEnd: addDaysToDate(weekStartMonday, 6),
    tasks,
    warnings,
    totalParsed: tasks.length,
  };
}

/**
 * Converts parsed items to Task records with duplicate prevention and preservation of completed tasks.
 */
export function convertParsedTasksToModels(
  parsedTasks: ParsedTaskItem[],
  existingTasks: Task[]
): { tasksToCreate: Task[]; skippedCount: number } {
  const existingKeys = new Set(
    existingTasks.map((t) => `${t.scheduledDate}_${t.title.trim().toLowerCase()}`)
  );

  const tasksToCreate: Task[] = [];
  let skippedCount = 0;

  for (const item of parsedTasks) {
    if (!item.isValid) continue;

    const key = `${item.date}_${item.title.trim().toLowerCase()}`;
    if (existingKeys.has(key)) {
      skippedCount++;
      continue;
    }

    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: item.title,
      subject: item.subject,
      plannedDurationMinutes: item.plannedMinutes || 60,
      priority: item.priority,
      isRequired: true,
      scheduledDate: item.date,
      originalScheduledDate: item.date,
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rescheduleCount: 0,
    };

    tasksToCreate.push(newTask);
    existingKeys.add(key); // prevent duplicates within the same import batch
  }

  return { tasksToCreate, skippedCount };
}
