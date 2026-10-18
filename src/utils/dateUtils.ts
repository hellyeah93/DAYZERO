/**
 * Pure local-calendar date calculations.
 * Avoids UTC timezone conversion shifts by manipulating year, month, and day directly.
 */

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Returns YYYY-MM-DD string from a Date object in the user's local timezone.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's local date as YYYY-MM-DD.
 */
export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

/**
 * Parses YYYY-MM-DD into a local Date object set at 00:00:00 local time.
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateStr}, expected YYYY-MM-DD`);
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Adds `days` to a local YYYY-MM-DD string and returns the new YYYY-MM-DD string.
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

/**
 * Returns difference in days (dateB - dateA)
 */
export function diffDays(dateAStr: string, dateBStr: string): number {
  const a = parseLocalDate(dateAStr).getTime();
  const b = parseLocalDate(dateBStr).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Generates an array of all YYYY-MM-DD dates between start and end inclusive.
 */
export function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  if (startDateStr > endDateStr) {
    return [];
  }
  const result: string[] = [];
  let current = startDateStr;
  while (current <= endDateStr) {
    result.push(current);
    current = addDaysToDate(current, 1);
  }
  return result;
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getWeekdayShort(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return WEEKDAY_SHORT[d.getDay()];
}

export function getWeekdayFull(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return WEEKDAY_FULL[d.getDay()];
}

export function formatDisplayDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const dayName = WEEKDAY_FULL[d.getDay()];
  const day = d.getDate();
  const monthName = MONTH_NAMES_FULL[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function formatShortDisplayDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDate();
  const monthName = MONTH_NAMES_SHORT[d.getMonth()];
  return `${day} ${monthName}`;
}

export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7); // "YYYY-MM"
}

export function formatMonthName(monthKey: string): string {
  const parts = monthKey.split('-');
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${MONTH_NAMES_FULL[monthIdx]} ${year}`;
}

/**
 * Returns start and end of week (Monday to Sunday) containing target date
 */
export function getWeekRange(dateStr: string): { start: string; end: string } {
  const d = parseLocalDate(dateStr);
  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = addDaysToDate(dateStr, distanceToMonday);
  const sunday = addDaysToDate(monday, 6);
  return { start: monday, end: sunday };
}
