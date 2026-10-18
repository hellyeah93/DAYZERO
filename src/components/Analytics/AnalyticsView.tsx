import React, { useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  PieChart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString, addDaysToDate, diffDays } from '../../utils/dateUtils';
import { computeDaySummary, calculateSubjectBreakdown } from '../../utils/analyticsEngine';
import { formatDurationHuman } from '../../utils/timerEngine';

export const AnalyticsView: React.FC = () => {
  const {
    allDatesInRange,
    tasks,
    sessions,
    attributions,
    dailyRecords,
    streakInfo,
    todaySummary,
  } = useApp();

  const todayStr = getTodayDateString();

  // Filter dates up to today
  const elapsedDates = useMemo(() => {
    return allDatesInRange.filter((d) => d <= todayStr);
  }, [allDatesInRange, todayStr]);

  // Compute 7-day and 30-day metrics
  const analyticsData = useMemo(() => {
    const last7Dates = elapsedDates.slice(-7);
    const last30Dates = elapsedDates.slice(-30);

    const getAvgCompletion = (dates: string[]) => {
      if (dates.length === 0) return 0;
      let sumPct = 0;
      let count = 0;
      dates.forEach((d) => {
        const s = computeDaySummary(d, tasks, dailyRecords, attributions, todayStr);
        if (!s.isRestDay && s.totalRequiredTasks > 0) {
          sumPct += s.completionPercentage;
          count++;
        }
      });
      return count > 0 ? Math.round(sumPct / count) : 0;
    };

    const avg7 = getAvgCompletion(last7Dates);
    const avg30 = getAvgCompletion(last30Dates);

    // Total tracked time across all elapsed dates
    const totalTrackedMs = attributions.reduce((s, a) => s + a.attributedDurationMs, 0);
    const activeDaysCount = Math.max(1, elapsedDates.length);
    const dailyAvgMinutes = Math.round(totalTrackedMs / (1000 * 60 * activeDaysCount));

    // Best days
    let bestDayCompletion = { date: '', pct: 0 };
    let bestDayTime = { date: '', minutes: 0 };
    let fullCompletedDays = 0;
    let partialCompletedDays = 0;

    elapsedDates.forEach((d) => {
      const s = computeDaySummary(d, tasks, dailyRecords, attributions, todayStr);
      if (s.statusType === 'completed') {
        fullCompletedDays++;
      } else if (s.statusType === 'partial') {
        partialCompletedDays++;
      }

      if (s.completionPercentage > bestDayCompletion.pct) {
        bestDayCompletion = { date: d, pct: s.completionPercentage };
      }
      if (s.actualTrackedMinutes > bestDayTime.minutes) {
        bestDayTime = { date: d, minutes: s.actualTrackedMinutes };
      }
    });

    return {
      avg7,
      avg30,
      totalTrackedMs,
      dailyAvgMinutes,
      bestDayCompletion,
      bestDayTime,
      fullCompletedDays,
      partialCompletedDays,
    };
  }, [elapsedDates, tasks, dailyRecords, attributions, todayStr]);

  const subjectBreakdown = useMemo(() => {
    return calculateSubjectBreakdown(attributions, tasks);
  }, [attributions, tasks]);

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-heading font-bold text-slate-100 text-lg tracking-wide">
              EXECUTION & PRODUCTIVITY ANALYTICS
            </h2>
            <p className="text-xs text-slate-400 font-mono-tech">
              Mathematical performance metrics computed from verified records
            </p>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Streak Card */}
        <div className="bg-[#12161e] border border-slate-800 p-4 rounded-xl space-y-1 font-mono-tech">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-500/20" />
            Consistency Streak
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">
              {streakInfo.currentStreak} Days
            </span>
            <span className="text-xs text-slate-400">Best: {streakInfo.longestStreak}d</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Preserved across designated rest days
          </span>
        </div>

        {/* 7-Day Completion */}
        <div className="bg-[#12161e] border border-slate-800 p-4 rounded-xl space-y-1 font-mono-tech">
          <span className="text-xs text-slate-400">Last 7 Days Avg Completion</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">
              {analyticsData.avg7}%
            </span>
            <span className="text-xs text-slate-400">30-day: {analyticsData.avg30}%</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Required tasks ratio</span>
        </div>

        {/* Total Tracked Time */}
        <div className="bg-[#12161e] border border-slate-800 p-4 rounded-xl space-y-1 font-mono-tech">
          <span className="text-xs text-slate-400">Total Tracked Time</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-400">
              {formatDurationHuman(analyticsData.totalTrackedMs)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Avg: {formatDurationHuman(analyticsData.dailyAvgMinutes * 60000)} / day
          </span>
        </div>

        {/* Fully Completed Days */}
        <div className="bg-[#12161e] border border-slate-800 p-4 rounded-xl space-y-1 font-mono-tech">
          <span className="text-xs text-slate-400">100% Execution Days</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">
              {analyticsData.fullCompletedDays}
            </span>
            <span className="text-xs text-slate-400">
              Partial: {analyticsData.partialCompletedDays}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">All required tasks checked</span>
        </div>
      </div>

      {/* Secondary Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject Distribution */}
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 font-sans">
          <h3 className="font-heading font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            CUMULATIVE SUBJECT TIME DISTRIBUTION
          </h3>

          {subjectBreakdown.length === 0 ? (
            <p className="text-xs font-mono-tech text-slate-500 py-6 text-center">
              No session attributions yet. Start timer sessions to populate analytics.
            </p>
          ) : (
            <div className="space-y-3 pt-1">
              {subjectBreakdown.map((item) => (
                <div key={item.subject} className="space-y-1 font-mono-tech text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-200">{item.subject}</span>
                    <span className="text-slate-400">
                      {formatDurationHuman(item.minutes * 60000)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#1b212c] rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestone Records */}
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 font-sans">
          <h3 className="font-heading font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            RECORD PEAKS & BENCHMARKS
          </h3>

          <div className="space-y-2.5 font-mono-tech text-xs">
            <div className="p-3 rounded-lg bg-[#161b24] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Best Day by Task Completion</span>
                <span className="text-slate-200 font-bold">
                  {analyticsData.bestDayCompletion.date || 'N/A'}
                </span>
              </div>
              <span className="text-emerald-400 font-bold text-sm">
                {analyticsData.bestDayCompletion.pct}%
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#161b24] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Best Day by Tracked Study Time</span>
                <span className="text-slate-200 font-bold">
                  {analyticsData.bestDayTime.date || 'N/A'}
                </span>
              </div>
              <span className="text-blue-400 font-bold text-sm">
                {formatDurationHuman(analyticsData.bestDayTime.minutes * 60000)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#161b24] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Longest Consistency Streak</span>
                <span className="text-slate-200 font-bold">Maintained Unbroken</span>
              </div>
              <span className="text-amber-400 font-bold text-sm">
                {streakInfo.longestStreak} Days
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
