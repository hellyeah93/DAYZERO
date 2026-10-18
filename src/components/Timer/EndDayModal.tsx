import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ListTodo,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import { formatDurationHuman } from '../../utils/timerEngine';

interface EndDayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EndDayModal: React.FC<EndDayModalProps> = ({ isOpen, onClose }) => {
  const {
    selectedDate,
    selectedDaySummary,
    tasks,
    activeTimer,
    endCurrentSession,
    finalizeDay,
    reopenDay,
    dailyRecords,
  } = useApp();

  const [notes, setNotes] = useState(dailyRecords[selectedDate]?.dailySummaryNotes || '');
  const [handleTimerAction, setHandleTimerAction] = useState<'stop' | 'keep'>('stop');

  if (!isOpen) return null;

  const dayTasks = tasks.filter((t) => t.scheduledDate === selectedDate && !t.isSkipped);
  const completedTasks = dayTasks.filter((t) => t.isCompleted);
  const incompleteTasks = dayTasks.filter((t) => !t.isCompleted);

  const isAlreadyFinalized = selectedDaySummary.isFinalized;

  const handleFinalize = () => {
    if (activeTimer && handleTimerAction === 'stop') {
      endCurrentSession('Finalized during End Day review');
    }
    finalizeDay(selectedDate, notes);
    onClose();
  };

  const handleReopen = () => {
    reopenDay(selectedDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#12161e] border border-slate-700 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#171d26] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="font-heading font-bold text-slate-100 text-lg tracking-wide">
              {isAlreadyFinalized ? 'DAILY RECORD REVIEW' : 'END DAY REVIEW'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <div className="border-b border-slate-800 pb-2">
            <span className="text-slate-400 font-mono-tech block">DATE BEING FINALIZED</span>
            <span className="text-sm font-semibold text-slate-100 font-heading">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono-tech">
            <div className="bg-[#171c25] border border-slate-800 p-3 rounded">
              <span className="text-slate-400 block text-[11px]">Tasks Done</span>
              <span className="text-base font-bold text-emerald-400">
                {completedTasks.length} / {dayTasks.length}
              </span>
            </div>
            <div className="bg-[#171c25] border border-slate-800 p-3 rounded">
              <span className="text-slate-400 block text-[11px]">Completion Rate</span>
              <span className="text-base font-bold text-slate-200">
                {selectedDaySummary.completionPercentage}%
              </span>
            </div>
            <div className="bg-[#171c25] border border-slate-800 p-3 rounded col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[11px]">Tracked Study</span>
              <span className="text-base font-bold text-blue-400">
                {formatDurationHuman(selectedDaySummary.actualTrackedMinutes * 60 * 1000)}
              </span>
            </div>
          </div>

          {/* Active Timer Warning */}
          {activeTimer && !isAlreadyFinalized && (
            <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/60 text-amber-300 space-y-2">
              <div className="flex items-center space-x-2 font-mono-tech font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>ACTIVE TIMER DETECTED</span>
              </div>
              <p className="text-[11px] text-slate-300">
                A study session is currently running. How would you like to handle it before finalizing?
              </p>
              <div className="flex items-center space-x-4 pt-1 font-mono-tech text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timer_action"
                    checked={handleTimerAction === 'stop'}
                    onChange={() => setHandleTimerAction('stop')}
                    className="text-emerald-500 focus:ring-0"
                  />
                  <span>Save & Stop Timer</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timer_action"
                    checked={handleTimerAction === 'keep'}
                    onChange={() => setHandleTimerAction('keep')}
                    className="text-emerald-500 focus:ring-0"
                  />
                  <span>Keep Running</span>
                </label>
              </div>
            </div>
          )}

          {/* Incomplete Tasks Review */}
          {incompleteTasks.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-mono-tech text-[11px] text-amber-400 block font-semibold">
                REMAINING INCOMPLETE TASKS ({incompleteTasks.length})
              </span>
              <ul className="space-y-1 bg-[#151a23] p-2.5 rounded border border-slate-800 max-h-32 overflow-y-auto no-scrollbar">
                {incompleteTasks.map((t) => (
                  <li key={t.id} className="text-slate-300 flex items-center justify-between text-xs py-0.5">
                    <span className="truncate pr-2">• {t.title}</span>
                    <span className="text-[10px] font-mono-tech text-slate-500 shrink-0">
                      [{t.subject}]
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-400">
                Note: Incomplete tasks will remain accessible in your Backlog and can be rescheduled or carried forward.
              </p>
            </div>
          )}

          {/* Reflection Notes */}
          <div>
            <label className="block text-xs font-mono-tech text-slate-400 mb-1">
              Daily Reflection & Summary Note
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What went well today? What hindered progress? Adjustments for tomorrow..."
              rows={3}
              className="w-full bg-[#181d28] border border-slate-700 rounded p-2.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#171d26] border-t border-slate-800 flex items-center justify-between">
          {isAlreadyFinalized ? (
            <button
              type="button"
              onClick={handleReopen}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded border border-amber-600/60 text-amber-400 hover:bg-amber-950/30 text-xs font-mono-tech transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen This Day</span>
            </button>
          ) : (
            <span className="text-[11px] font-mono-tech text-slate-500">
              Can be reopened if plans change.
            </span>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
            {!isAlreadyFinalized && (
              <button
                type="button"
                onClick={handleFinalize}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
              >
                Confirm & Finalize Day
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
