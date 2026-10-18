import React from 'react';
import {
  X,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Calendar,
  FolderArchive,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString, formatShortDisplayDate } from '../../utils/dateUtils';
import { Task } from '../../types';

interface BacklogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BacklogDrawer: React.FC<BacklogDrawerProps> = ({ isOpen, onClose }) => {
  const { tasks, carryForwardTask, toggleTaskCompletion, updateTask } = useApp();

  if (!isOpen) return null;

  const todayStr = getTodayDateString();
  const backlogTasks = tasks.filter(
    (t) => t.scheduledDate < todayStr && !t.isCompleted && !t.isSkipped
  );

  const totalBacklogMinutes = backlogTasks.reduce(
    (sum, t) => sum + (t.plannedDurationMinutes || 0),
    0
  );

  const handleCarryAllToToday = () => {
    backlogTasks.forEach((t) => carryForwardTask(t.id, todayStr));
    onClose();
  };

  const handleSkipTask = (taskId: string) => {
    updateTask(taskId, { isSkipped: true, notes: 'Intentionally skipped from backlog' });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#12161f] border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 bg-[#171d27] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <FolderArchive className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="font-heading font-bold text-slate-100 text-base tracking-wide">
                ACCOUNTABILITY BACKLOG
              </h2>
              <span className="text-[11px] font-mono-tech text-amber-400">
                {backlogTasks.length} pending / overdue task(s)
              </span>
            </div>
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

        {/* Action Banner */}
        {backlogTasks.length > 0 && (
          <div className="p-4 bg-[#151a24] border-b border-slate-800 flex items-center justify-between">
            <div className="text-xs font-mono-tech text-slate-400">
              Backlog Load:{' '}
              <strong className="text-amber-400">
                {Math.floor(totalBacklogMinutes / 60)}h {totalBacklogMinutes % 60}m
              </strong>
            </div>
            <button
              type="button"
              onClick={handleCarryAllToToday}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Carry All to Today</span>
            </button>
          </div>
        )}

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {backlogTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-400 stroke-1" />
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-slate-200 text-base">
                  NO BACKLOG DEFICIT
                </h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  All tasks from previous days have been completed or scheduled cleanly. Outstanding execution.
                </p>
              </div>
            </div>
          ) : (
            backlogTasks.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg bg-[#161b24] border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-100 block">{t.title}</span>
                    <div className="flex items-center space-x-2 text-[10px] font-mono-tech text-slate-400">
                      <span className="text-amber-400">
                        Originally: {formatShortDisplayDate(t.scheduledDate)}
                      </span>
                      <span>•</span>
                      <span>{t.subject}</span>
                      <span>•</span>
                      <span>{t.plannedDurationMinutes}m</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 uppercase font-bold shrink-0">
                    Overdue
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-800/80 font-mono-tech text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSkipTask(t.id)}
                    className="px-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTaskCompletion(t.id)}
                    className="px-2 py-1 text-emerald-400 hover:bg-emerald-950/40 rounded border border-emerald-800/50 cursor-pointer"
                  >
                    Mark Done
                  </button>
                  <button
                    type="button"
                    onClick={() => carryForwardTask(t.id, todayStr)}
                    className="px-2.5 py-1 bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 rounded border border-amber-500/40 cursor-pointer flex items-center space-x-1"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>Carry to Today</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
