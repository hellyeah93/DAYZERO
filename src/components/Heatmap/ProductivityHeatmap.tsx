import React, { useState } from 'react';
import { Grid, Eye, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { computeDaySummary } from '../../utils/analyticsEngine';
import { formatDisplayDate, getTodayDateString } from '../../utils/dateUtils';
import { DayStatusSummary } from '../../types';
import { formatDurationHuman } from '../../utils/timerEngine';

export const ProductivityHeatmap: React.FC = () => {
  const {
    allDatesInRange,
    selectedDate,
    setSelectedDate,
    tasks,
    dailyRecords,
    attributions,
  } = useApp();

  const [metric, setMetric] = useState<'completion' | 'hours'>('completion');
  const [hoveredSummary, setHoveredSummary] = useState<DayStatusSummary | null>(null);

  const todayStr = getTodayDateString();

  const getHeatmapColor = (summary: DayStatusSummary) => {
    if (summary.isRestDay) return 'bg-purple-900/40 border-purple-800 text-purple-300';
    if (summary.isFuture) return 'bg-[#151922] border-slate-800/60 opacity-60';

    if (metric === 'completion') {
      if (summary.totalRequiredTasks === 0 && summary.actualTrackedMinutes === 0) {
        return 'bg-[#13171f] border-slate-800/80';
      }
      const pct = summary.completionPercentage;
      if (pct === 0) return 'bg-red-950/40 border-red-900/60';
      if (pct <= 25) return 'bg-emerald-950/60 border-emerald-900/60';
      if (pct <= 50) return 'bg-emerald-900/60 border-emerald-800/80';
      if (pct <= 75) return 'bg-emerald-700/70 border-emerald-600/80';
      if (pct < 100) return 'bg-emerald-600/90 border-emerald-500';
      return 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    } else {
      // Hours metric
      const hours = summary.actualTrackedMinutes / 60;
      if (hours === 0) return 'bg-[#13171f] border-slate-800/80';
      if (hours < 1.5) return 'bg-blue-950/60 border-blue-900/60';
      if (hours < 3) return 'bg-blue-900/70 border-blue-800/80';
      if (hours < 5) return 'bg-blue-700/80 border-blue-600';
      return 'bg-blue-500 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
    }
  };

  return (
    <div className="space-y-5 font-sans">
      <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        {/* Header & Metric Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-heading font-bold text-slate-100 text-lg tracking-wide">
                PRODUCTIVITY HEATMAP MATRIX
              </h2>
              <p className="text-xs text-slate-400 font-mono-tech">
                Grid mapping consistency across the configured planning timeline
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 font-mono-tech text-xs">
            <span className="text-slate-400 mr-1 hidden sm:inline">Intensity:</span>
            <button
              type="button"
              onClick={() => setMetric('completion')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                metric === 'completion'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'bg-[#181d27] text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              Task Completion %
            </button>
            <button
              type="button"
              onClick={() => setMetric('hours')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                metric === 'hours'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50 font-bold'
                  : 'bg-[#181d27] text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              Tracked Hours
            </button>
          </div>
        </div>

        {/* Heatmap Grid Area */}
        <div className="p-3 bg-[#0d1015] border border-slate-800 rounded-lg overflow-x-auto no-scrollbar">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[700px] p-1">
            {allDatesInRange.map((dateStr) => {
              const summary = computeDaySummary(dateStr, tasks, dailyRecords, attributions, todayStr);
              const colorClass = getHeatmapColor(summary);
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  onMouseEnter={() => setHoveredSummary(summary)}
                  className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-xs border transition-all cursor-pointer ${colorClass} ${
                    isSelected ? 'ring-2 ring-emerald-400 scale-125 z-10' : 'hover:scale-120'
                  }`}
                  title={`${dateStr} • ${summary.completionPercentage}% tasks • ${summary.actualTrackedMinutes}m`}
                />
              );
            })}
          </div>
        </div>

        {/* Scale Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono-tech text-slate-400 pt-1">
          <div className="flex items-center space-x-2">
            <span>Less</span>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-xs bg-[#13171f] border border-slate-800"></span>
              <span className="w-3 h-3 rounded-xs bg-emerald-950/60 border border-emerald-900"></span>
              <span className="w-3 h-3 rounded-xs bg-emerald-900/60 border border-emerald-800"></span>
              <span className="w-3 h-3 rounded-xs bg-emerald-700/70 border border-emerald-600"></span>
              <span className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-400"></span>
            </div>
            <span>More</span>
          </div>

          <div className="flex items-center space-x-3 text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-purple-900/60 border border-purple-700"></span>
              Rest Day
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-red-950/60 border border-red-800"></span>
              0% Incomplete
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#151922] opacity-60"></span>
              Future
            </span>
          </div>
        </div>

        {/* Interactive Tooltip Card */}
        {hoveredSummary && (
          <div className="p-3 bg-[#171c26] border border-slate-700/80 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono-tech animate-fade-in">
            <div className="space-y-0.5">
              <span className="text-slate-100 font-bold block">{formatDisplayDate(hoveredSummary.date)}</span>
              <span className="text-slate-400">
                Status: <strong className="text-emerald-400 uppercase">{hoveredSummary.statusType}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-4 text-slate-300">
              <div>
                Tasks:{' '}
                <strong className="text-slate-100">
                  {hoveredSummary.completedRequiredTasks}/{hoveredSummary.totalRequiredTasks}
                </strong>{' '}
                ({hoveredSummary.completionPercentage}%)
              </div>
              <div>
                Study Time:{' '}
                <strong className="text-blue-400">
                  {formatDurationHuman(hoveredSummary.actualTrackedMinutes * 60000)}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(hoveredSummary.date)}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
            >
              Open Date
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
