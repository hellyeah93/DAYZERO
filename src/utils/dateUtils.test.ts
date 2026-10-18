import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLocalDate,
  parseLocalDate,
  addDaysToDate,
  diffDays,
  generateDateRange,
  getWeekdayShort,
  getWeekRange,
} from './dateUtils.ts';

test('dateUtils - format and parse local date accurately', () => {
  const date = new Date(2026, 9, 18); // 18 October 2026
  assert.equal(formatLocalDate(date), '2026-10-18');

  const parsed = parseLocalDate('2026-10-18');
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 9); // October
  assert.equal(parsed.getDate(), 18);
});

test('dateUtils - adds days across month and year boundaries correctly', () => {
  assert.equal(addDaysToDate('2026-10-31', 1), '2026-11-01');
  assert.equal(addDaysToDate('2026-12-31', 1), '2027-01-01');
  assert.equal(addDaysToDate('2028-02-28', 1), '2028-02-29'); // Leap year
});

test('dateUtils - diffDays calculates correct day distance', () => {
  assert.equal(diffDays('2026-10-18', '2026-10-25'), 7);
  assert.equal(diffDays('2026-10-18', '2027-01-20'), 94);
});

test('dateUtils - generateDateRange includes start and end date', () => {
  const range = generateDateRange('2026-10-18', '2026-10-21');
  assert.deepEqual(range, ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21']);
});

test('dateUtils - weekday calculation', () => {
  assert.equal(getWeekdayShort('2026-10-18'), 'Sun');
  assert.equal(getWeekdayShort('2026-10-19'), 'Mon');
});

test('dateUtils - getWeekRange returns Monday to Sunday', () => {
  const week = getWeekRange('2026-10-21'); // Wednesday
  assert.equal(week.start, '2026-10-19'); // Monday
  assert.equal(week.end, '2026-10-25'); // Sunday
});
