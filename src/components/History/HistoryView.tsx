import React from 'react';
import {
  History,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatDisplayDate,
  addDaysToDate,
  getTodayDateString,
  formatShortDisplayDate,
} from '../../utils/dateUtils';
import { computeDaySummary, calculateSubjectBreakdown } from '../../utils/analyticsEngine';
import { formatDurationHuman } from '../../utils/timerEngine';

export const HistoryView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    tasks,
    sessions,
    attributions,
    dailyRecords,
  } = useApp();

  const todayStr = getTodayDateString();
  const summary = computeDaySummary(selectedDate, tasks, dailyRecords, attributions, todayStr);

  // Previous day summary for day-to-day comparison
  const prevDate = addDaysToDate(selectedDate, -1);
  const prevSummary = computeDaySummary(prevDate, tasks, dailyRecords, attributions, todayStr);

  // Sessions on or attributed to this date
  const dayAttributions = attributions.filter((a) => a.date === selectedDate);
  const daySessions = sessions.filter((s) => s.date === selectedDate);
  const dayTasks = tasks.filter((t) => t.scheduledDate === selectedDate);
  const completedTasks = dayTasks.filter((t) => t.isCompleted);
  const overdueTasks = dayTasks.filter((t) => !t.isCompleted && t.scheduledDate < todayStr);

  // Subject breakdown for this date
  const subjectBreakdown = calculateSubjectBreakdown(dayAttributions, dayTasks);

  // Comparison metrics
  const taskDiff = summary.completedRequiredTasks - prevSummary.completedRequiredTasks;
  const timeDiffMinutes = summary.actualTrackedMinutes - prevSummary.actualTrackedMinutes;

  return (
    <div className="space-y-5 font-sans">
      {/* Date Navigation Bar */}
      <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <History className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h2 className="font-heading font-bold text-slate-100 text-base sm:text-lg tracking-wide">
              HISTORICAL AUDIT & LOGS
            </h2>
            <span className="text-xs font-mono-tech text-slate-400">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>
        </div>

        {/* Previous / Next Day Steppers */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setSelectedDate(addDaysToDate(selectedDate, -1))}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-[#181d27] hover:bg-[#202735] border border-slate-700 text-xs font-mono-tech text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Day</span>
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#181d27] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono-tech text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <button
            type="button"
            onClick={() => setSelectedDate(addDaysToDate(selectedDate, 1))}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-[#181d27] hover:bg-[#202735] border border-slate-700 text-xs font-mono-tech text-slate-300 transition-colors cursor-pointer"
          >
            <span>Next Day</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics & Day-to-Day Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#12161e] border border-slate-800 p-4 rounded-xl space-y-1 font-mono-tech">
          <span className="text-xs text-slate-400">Tasks Completed</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-400">
              {summary.completedRequiredTasks} / {summary.totalRequiredTasks}
            </span>
            <span className="text-xs text-slate-400">{summary.completionPercentage}%</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            vs previous day:
            <span className={taskDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {taskDiff >= 0 ? `+${taskDiff}` : taskDiff} tasks
            </span>
          </div>
        </div>

        <div className="bg-[#12161e] border border-slate-800 p-4 rounded-xl space-y-1 font-mono-tech">
          <span className="text-xs text-slate-400">Actual Tracked Study</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-blue-400">
              {formatDurationHuman(summary.actualTrackedMinutes * 60000)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            vs previous day:
            <span className={timeDiffMinutes >= 0 ? 'text-blue-400' : 'text-amber-400'}>
              {timeDiffMinutes >= 0 ? `+${timeDiffMinutes}m` : `${timeDiffMinutes}m`}
            </span>
          </div>
        </div>

        <div className="bg-[#12161e] border border-slate-800 p-4 rounded-xl space-y-1 font-mono-tech">
          <span className="text-xs text-slate-400">Planned vs Actual Time</span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-slate-200">
              {summary.plannedMinutes}m planned
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              {summary.actualTrackedMinutes}m logged
            </span>
          </div>
          <div className="w-full bg-[#1e2533] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  summary.plannedMinutes > 0
                    ? Math.round((summary.actualTrackedMinutes / summary.plannedMinutes) * 100)
                    : 0
                )}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="bg-[#12161e] border border-slate-800 p-4 rounded-xl space-y-1 font-mono-tech">
          <span className="text-xs text-slate-400">Day Record Status</span>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                summary.isFinalized
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {summary.isFinalized ? 'FINALIZED' : 'OPEN / UNFINALIZED'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            {summary.isRestDay ? 'Designated Rest Day' : 'Active Training Day'}
          </span>
        </div>
      </div>

      {/* Historical Sessions & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Study Sessions Recorded */}
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 font-sans">
          <h3 className="font-heading font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            RECORDED STUDY SESSIONS ({daySessions.length})
          </h3>

          {daySessions.length === 0 ? (
            <p className="text-xs font-mono-tech text-slate-500 py-4 text-center">
              No individual study sessions logged on this date.
            </p>
          ) : (
            <div className="space-y-2">
              {daySessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-lg bg-[#161b24] border border-slate-800 flex items-center justify-between text-xs font-mono-tech"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200 block">
                      {sess.subject} {sess.taskTitle ? `• ${sess.taskTitle}` : ''}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Started: {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-emerald-400 font-bold">
                    {formatDurationHuman(sess.accumulatedElapsedMs)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject Breakdown Chart */}
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 font-sans">
          <h3 className="font-heading font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            SUBJECT-WISE ATTRIBUTION
          </h3>

          {subjectBreakdown.length === 0 ? (
            <p className="text-xs font-mono-tech text-slate-500 py-4 text-center">
              No time attributions recorded on this date.
            </p>
          ) : (
            <div className="space-y-3">
              {subjectBreakdown.map((item) => (
                <div key={item.subject} className="space-y-1 font-mono-tech text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">{item.subject}</span>
                    <span className="text-slate-400">
                      {formatDurationHuman(item.minutes * 60000)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#1b212c] rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Reflection Notes from Record */}
      {dailyRecords[selectedDate]?.dailySummaryNotes && (
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2">
          <h3 className="font-heading font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            END-OF-DAY REVIEW & REFLECTIONS
          </h3>
          <p className="text-xs text-slate-300 font-sans leading-relaxed bg-[#161a22] p-3 rounded border border-slate-800">
            {dailyRecords[selectedDate].dailySummaryNotes}
          </p>
        </div>
      )}
    </div>
  );
};
