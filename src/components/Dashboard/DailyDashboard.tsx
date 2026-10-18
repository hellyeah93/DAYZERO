import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  Flame,
  AlertTriangle,
  Moon,
  RotateCcw,
  Calendar,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDisplayDate, getTodayDateString } from '../../utils/dateUtils';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import { StudyTimerCard } from '../Timer/StudyTimerCard';
import { formatDurationHuman } from '../../utils/timerEngine';
import { Task } from '../../types';

interface DailyDashboardProps {
  onOpenEndDayModal: () => void;
  onOpenWeeklyPlanner: () => void;
}

export const DailyDashboard: React.FC<DailyDashboardProps> = ({
  onOpenEndDayModal,
  onOpenWeeklyPlanner,
}) => {
  const {
    selectedDate,
    selectedDaySummary,
    tasks,
    toggleRestDay,
    settings,
  } = useApp();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'incomplete' | 'completed'>('all');

  const todayStr = getTodayDateString();
  const isSelectedToday = selectedDate === todayStr;

  // Filter tasks for this selected date
  const dayTasks = tasks.filter((t) => t.scheduledDate === selectedDate && !t.isSkipped);
  const filteredTasks = dayTasks.filter((t) => {
    if (taskFilter === 'incomplete') return !t.isCompleted;
    if (taskFilter === 'completed') return t.isCompleted;
    return true;
  });

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateNewTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  // Study target progress
  const targetMinutes = settings.dailyTargetStudyMinutes || 300;
  const studyProgressPct = Math.min(
    100,
    Math.round((selectedDaySummary.actualTrackedMinutes / targetMinutes) * 100)
  );

  return (
    <div className="space-y-5 font-sans">
      {/* Top Banner: Date, Status Badges, and Rest Day Toggle */}
      <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-mono-tech uppercase tracking-widest text-slate-400">
              PLANNING TIMELINE
            </span>
            {isSelectedToday && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono-tech font-bold uppercase tracking-wider">
                TODAY
              </span>
            )}
            {selectedDaySummary.isRestDay && (
              <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono-tech font-bold uppercase tracking-wider">
                REST DAY
              </span>
            )}
            {selectedDaySummary.isFinalized && (
              <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono-tech font-bold uppercase tracking-wider">
                FINALIZED
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-100 tracking-wide">
            {formatDisplayDate(selectedDate)}
          </h1>
        </div>

        {/* Quick Day Controls: Toggle Rest Day & Add Task */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => toggleRestDay(selectedDate)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono-tech transition-colors border flex items-center space-x-1.5 cursor-pointer ${
              selectedDaySummary.isRestDay
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/50'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle Rest Day"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{selectedDaySummary.isRestDay ? 'Rest Day Active' : 'Mark Rest Day'}</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNewTask}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Persistent Study Timer HUD */}
      <StudyTimerCard onOpenEndDay={onOpenEndDayModal} />

      {/* Progress Bars & Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Task Completion Progress Bar Card */}
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-tech text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Task Completion (Required)
            </span>
            <span className="text-base font-mono-tech font-bold text-emerald-400">
              {selectedDaySummary.completionPercentage}%
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full bg-[#1a202c] rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${selectedDaySummary.completionPercentage}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono-tech text-slate-400">
            <span>
              Completed: <strong className="text-slate-200">{selectedDaySummary.completedRequiredTasks}</strong> /{' '}
              {selectedDaySummary.totalRequiredTasks}
            </span>
            <span>
              Remaining:{' '}
              <strong className="text-amber-400">
                {Math.max(0, selectedDaySummary.totalRequiredTasks - selectedDaySummary.completedRequiredTasks)}
              </strong>
            </span>
          </div>
        </div>

        {/* Study Time Achievement Progress Bar Card */}
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-tech text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              Study Time Achievement
            </span>
            <span className="text-base font-mono-tech font-bold text-blue-400">
              {studyProgressPct}%
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full bg-[#1a202c] rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${studyProgressPct}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono-tech text-slate-400">
            <span>
              Tracked:{' '}
              <strong className="text-slate-200">
                {formatDurationHuman(selectedDaySummary.actualTrackedMinutes * 60000)}
              </strong>
            </span>
            <span>
              Target: <strong className="text-slate-300">{formatDurationHuman(targetMinutes * 60000)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Task Execution Area */}
      <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 font-sans">
        {/* Header with Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="font-heading font-bold text-slate-100 text-base tracking-wide">
              EXECUTION SCHEDULE ({dayTasks.length})
            </h2>
          </div>

          <div className="flex items-center space-x-1.5 font-mono-tech text-xs">
            {(['all', 'incomplete', 'completed'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTaskFilter(filter)}
                className={`px-3 py-1 rounded transition-colors cursor-pointer capitalize ${
                  taskFilter === filter
                    ? 'bg-slate-700 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-dashed border-slate-800 space-y-3">
            <p className="text-xs font-mono-tech text-slate-400">
              {dayTasks.length === 0
                ? 'No tasks scheduled for this date.'
                : `No ${taskFilter} tasks found.`}
            </p>
            {dayTasks.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateNewTask}
                  className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-semibold"
                >
                  Schedule Single Task
                </button>
                <button
                  type="button"
                  onClick={onOpenWeeklyPlanner}
                  className="px-3.5 py-1.5 rounded bg-[#181d27] border border-slate-700 hover:bg-[#202735] text-slate-200 font-mono-tech text-xs"
                >
                  Import Structured Weekly Plan
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((t) => (
              <TaskItem key={t.id} task={t} onEdit={handleEditTask} />
            ))}
          </div>
        )}
      </div>

      {/* Task Create/Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        defaultDate={selectedDate}
      />
    </div>
  );
};
