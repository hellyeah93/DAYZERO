import React, { useState } from 'react';
import {
  Check,
  Clock,
  Calendar,
  Play,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  AlertTriangle,
  History,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { getTodayDateString, addDaysToDate, formatShortDisplayDate } from '../../utils/dateUtils';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit }) => {
  const {
    toggleTaskCompletion,
    deleteTask,
    rescheduleTask,
    carryForwardTask,
    startTimer,
    activeTimer,
  } = useApp();

  const [showMenu, setShowMenu] = useState(false);
  const [showRescheduleInput, setShowRescheduleInput] = useState(false);
  const [targetDate, setTargetDate] = useState(addDaysToDate(task.scheduledDate, 1));

  const todayStr = getTodayDateString();
  const isPast = task.scheduledDate < todayStr;
  const isOverdue = !task.isCompleted && isPast;

  const getPriorityStyle = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-red-950/10';
      case 'high':
        return 'border-l-4 border-l-amber-500 bg-amber-950/10';
      case 'medium':
        return 'border-l-4 border-l-blue-500 bg-blue-950/5';
      case 'low':
        return 'border-l-4 border-l-slate-600 bg-transparent';
    }
  };

  const handleRescheduleSubmit = () => {
    if (targetDate) {
      rescheduleTask(task.id, targetDate, 'Manual reschedule from dashboard');
      setShowRescheduleInput(false);
      setShowMenu(false);
    }
  };

  return (
    <div
      className={`p-3.5 rounded-lg border border-slate-800 transition-all font-sans relative ${getPriorityStyle(
        task.priority
      )} ${task.isCompleted ? 'opacity-65 bg-[#101318]' : 'hover:border-slate-700 bg-[#141820]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkbox & Content */}
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => toggleTaskCompletion(task.id)}
            className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              task.isCompleted
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'border-slate-600 hover:border-emerald-400 bg-[#191f2b]'
            }`}
            aria-label={task.isCompleted ? 'Mark task as incomplete' : 'Mark task as completed'}
          >
            {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`font-semibold text-xs sm:text-sm break-words ${
                  task.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                }`}
              >
                {task.title}
              </span>

              {/* Subject Tag */}
              <span className="text-[10px] font-mono-tech px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                {task.subject}
              </span>

              {/* Overdue Badge */}
              {isOverdue && (
                <span className="text-[10px] font-mono-tech px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-bold uppercase animate-pulse flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  OVERDUE
                </span>
              )}

              {/* Reschedule history badge */}
              {task.rescheduleCount > 0 && (
                <span
                  className="text-[10px] font-mono-tech px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800 flex items-center gap-0.5"
                  title={`Rescheduled ${task.rescheduleCount} time(s)`}
                >
                  <History className="w-2.5 h-2.5" />
                  Rescheduled ({task.rescheduleCount}x)
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-slate-400 break-words">{task.description}</p>
            )}

            {/* Metadata Footer: Duration, Deadline, Notes */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono-tech text-slate-400 pt-0.5">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{task.plannedDurationMinutes}m</span>
              </span>

              {task.deadline && (
                <span className="text-amber-400 flex items-center space-x-1">
                  <span>Due {task.deadline}</span>
                </span>
              )}

              {task.isRequired && (
                <span className="text-[10px] text-emerald-400/90 font-medium uppercase tracking-wider">
                  Required
                </span>
              )}
            </div>

            {task.notes && (
              <p className="text-[11px] text-slate-400 italic bg-[#101318] p-1.5 rounded border border-slate-800/80 mt-1">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right Actions: Play Timer + Overflow Menu */}
        <div className="flex items-center space-x-1 shrink-0">
          {!task.isCompleted && (!activeTimer || activeTimer.taskId !== task.id) && (
            <button
              type="button"
              onClick={() => startTimer(task.subject, task.id, task.title)}
              className="p-1.5 rounded hover:bg-[#1f2633] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              title="Start study timer for this task"
            >
              <Play className="w-4 h-4 fill-emerald-400" />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded hover:bg-[#1f2633] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-20 w-48 bg-[#171c26] border border-slate-700 rounded-lg shadow-xl py-1 text-xs font-mono-tech animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    onEdit(task);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-700/50 flex items-center space-x-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Task</span>
                </button>

                {isOverdue && (
                  <button
                    type="button"
                    onClick={() => {
                      carryForwardTask(task.id, todayStr);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-emerald-400 hover:bg-slate-700/50 flex items-center space-x-2"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Carry to Today</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowRescheduleInput(true)}
                  className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-700/50 flex items-center space-x-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reschedule...</span>
                </button>

                <div className="border-t border-slate-800 my-1"></div>

                <button
                  type="button"
                  onClick={() => {
                    deleteTask(task.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-950/30 flex items-center space-x-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Reschedule Date Picker */}
      {showRescheduleInput && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-mono-tech">Move to date:</span>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="bg-[#1b212b] border border-slate-700 rounded px-2 py-1 text-xs font-mono-tech text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleRescheduleSubmit}
            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono-tech text-xs font-semibold"
          >
            Confirm Move
          </button>
          <button
            type="button"
            onClick={() => setShowRescheduleInput(false)}
            className="px-2 py-1 rounded border border-slate-700 text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
