import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  parseLocalDate,
  getWeekdayShort,
  getMonthKey,
  formatMonthName,
  getTodayDateString,
} from '../utils/dateUtils';
import { computeDaySummary } from '../utils/analyticsEngine';
import type { DayStatusSummary } from '../types/index.ts';

export const HorizontalCalendar: React.FC = () => {
  const {
    allDatesInRange,
    selectedDate,
    setSelectedDate,
    tasks,
    dailyRecords,
    attributions,
  } = useApp();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLegend, setShowLegend] = useState(false);
  const todayStr = getTodayDateString();

  // Find all distinct months in the range for month-level navigation
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allDatesInRange.forEach((d) => set.add(getMonthKey(d)));
    return Array.from(set).sort();
  }, [allDatesInRange]);

  const currentSelectedMonthKey = getMonthKey(selectedDate);

  // Auto-scroll selected date tile into view on mount or change
  useEffect(() => {
    const tileElement = document.getElementById(`calendar-tile-${selectedDate}`);
    if (tileElement && scrollContainerRef.current) {
      tileElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedDate]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const jumpToMonth = (monthKey: string) => {
    // Find first date in that month that is in range
    const firstDateInMonth = allDatesInRange.find((d) => getMonthKey(d) === monthKey);
    if (firstDateInMonth) {
      setSelectedDate(firstDateInMonth);
    }
  };

  const jumpToToday = () => {
    if (allDatesInRange.includes(todayStr)) {
      setSelectedDate(todayStr);
    } else if (allDatesInRange.length > 0) {
      setSelectedDate(allDatesInRange[0]);
    }
  };

  // Helper for status colors
  const getTileStyles = (summary: DayStatusSummary, isSelected: boolean) => {
    let bg = 'bg-[#141920]';
    let border = 'border-[#232b38]';
    let text = 'text-slate-300';
    let indicator = 'bg-slate-600';

    if (summary.isRestDay) {
      bg = 'bg-purple-950/20';
      border = 'border-purple-800/40';
      text = 'text-purple-300';
      indicator = 'bg-purple-500';
    } else if (summary.statusType === 'completed') {
      bg = 'bg-emerald-950/30';
      border = 'border-emerald-700/60';
      text = 'text-emerald-300';
      indicator = 'bg-emerald-500';
    } else if (summary.statusType === 'partial') {
      bg = 'bg-amber-950/25';
      border = 'border-amber-700/50';
      text = 'text-amber-300';
      indicator = 'bg-amber-500';
    } else if (summary.statusType === 'failed') {
      bg = 'bg-red-950/20';
      border = 'border-red-900/40';
      text = 'text-red-300';
      indicator = 'bg-red-500';
    } else if (summary.statusType === 'future_planned') {
      bg = 'bg-blue-950/20';
      border = 'border-blue-900/40';
      text = 'text-blue-300';
      indicator = 'bg-blue-500';
    }

    if (isSelected) {
      border = 'border-emerald-400 ring-2 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]';
    }

    return { bg, border, text, indicator };
  };

  return (
    <section className="bg-[#0f1216] border-b border-[#1f2530] px-4 sm:px-6 lg:px-8 py-3.5 select-none font-sans">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Navigation Bar: Month Controls, Today, and Legend Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Month Selector & Controls */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                value={currentSelectedMonthKey}
                onChange={(e) => jumpToMonth(e.target.value)}
                className="appearance-none bg-[#161b22] border border-slate-700 rounded px-3 py-1.5 pr-8 text-xs font-mono-tech text-slate-200 font-bold tracking-wide focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {availableMonths.map((mKey) => (
                  <option key={mKey} value={mKey}>
                    {formatMonthName(mKey).toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="p-1.5 rounded bg-[#161b22] hover:bg-[#202734] border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Scroll previous dates"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="p-1.5 rounded bg-[#161b22] hover:bg-[#202734] border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Scroll next dates"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Shortcuts: Today & Legend */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={jumpToToday}
              className={`px-3 py-1.5 rounded text-xs font-mono-tech transition-colors cursor-pointer border ${
                selectedDate === todayStr
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-semibold'
                  : 'bg-[#161b22] text-slate-300 border-slate-800 hover:bg-[#202734]'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-[#161b22] hover:bg-[#202734] border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Show color legend"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Legend</span>
            </button>
          </div>
        </div>

        {/* Legend Drawer */}
        {showLegend && (
          <div className="p-3 bg-[#13171e] border border-slate-800 rounded-md text-xs font-mono-tech grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 animate-fade-in">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
              <span className="text-slate-300">100% Completed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">Partial (1-99%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-slate-300">0% Incomplete</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-300">Future Planned</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-slate-300">Rest Day</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
              <span className="text-slate-400">Unplanned</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">!</span>
              <span className="text-slate-300">Overdue Task</span>
            </div>
          </div>
        )}

        {/* Horizontal Scrolling Date Tiles */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          aria-label="Horizontal Calendar Dates"
          className="flex items-center space-x-2 overflow-x-auto py-2 px-1 no-scrollbar focus:outline-none focus:ring-1 focus:ring-emerald-500/40 rounded scroll-smooth"
        >
          {allDatesInRange.map((dateStr) => {
            const summary = computeDaySummary(dateStr, tasks, dailyRecords, attributions, todayStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const parsed = parseLocalDate(dateStr);
            const dayNum = parsed.getDate();
            const weekday = getWeekdayShort(dateStr);
            const styles = getTileStyles(summary, isSelected);

            return (
              <button
                key={dateStr}
                id={`calendar-tile-${dateStr}`}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                className={`flex-shrink-0 w-16 sm:w-18 h-22 sm:h-24 rounded-lg p-2 flex flex-col justify-between items-center transition-all cursor-pointer border ${styles.bg} ${styles.border} ${
                  isSelected ? 'scale-105 z-10' : 'hover:border-slate-600 hover:scale-102'
                }`}
                title={`${dateStr} - ${summary.statusType.toUpperCase()} (${summary.completedRequiredTasks}/${summary.totalRequiredTasks} tasks, ${summary.actualTrackedMinutes}m tracked)`}
              >
                {/* Top: Weekday and Overdue/Today badge */}
                <div className="w-full flex items-center justify-between text-[11px] font-mono-tech leading-none">
                  <span className={`${isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                    {weekday}
                  </span>
                  {summary.overdueTasksCount > 0 && (
                    <span
                      className="px-1 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold leading-none animate-pulse"
                      title={`${summary.overdueTasksCount} overdue tasks`}
                    >
                      !
                    </span>
                  )}
                  {isToday && summary.overdueTasksCount === 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </div>

                {/* Center: Day Number */}
                <div className="flex flex-col items-center">
                  <span className={`text-base sm:text-lg font-heading font-bold ${styles.text}`}>
                    {dayNum}
                  </span>
                  {summary.totalRequiredTasks > 0 ? (
                    <span className="text-[10px] font-mono-tech text-slate-400 leading-none">
                      {summary.completedRequiredTasks}/{summary.totalRequiredTasks}
                    </span>
                  ) : summary.isRestDay ? (
                    <span className="text-[9px] font-mono-tech text-purple-400 leading-none">REST</span>
                  ) : (
                    <span className="text-[10px] font-mono-tech text-slate-500 leading-none">-</span>
                  )}
                </div>

                {/* Bottom: Tracked Time & Completion Pill */}
                <div className="w-full flex items-center justify-between text-[10px] font-mono-tech">
                  {summary.actualTrackedMinutes > 0 ? (
                    <span className="text-[9px] text-emerald-400/90 truncate flex items-center">
                      <Clock className="w-2.5 h-2.5 mr-0.5 inline" />
                      {summary.actualTrackedMinutes >= 60
                        ? `${Math.floor(summary.actualTrackedMinutes / 60)}h`
                        : `${summary.actualTrackedMinutes}m`}
                    </span>
                  ) : (
                    <span className="text-transparent">0</span>
                  )}

                  <span className={`w-2 h-2 rounded-full ${styles.indicator}`}></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
