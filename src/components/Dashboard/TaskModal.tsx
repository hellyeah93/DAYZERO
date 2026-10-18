import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Clock, Tag, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Priority } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultDate,
}) => {
  const { addTask, updateTask, settings, monthlyGoals, selectedDate } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(settings.subjects[0] || 'Physics');
  const [plannedDurationMinutes, setPlannedDurationMinutes] = useState(60);
  const [priority, setPriority] = useState<Priority>('medium');
  const [isRequired, setIsRequired] = useState(true);
  const [scheduledDate, setScheduledDate] = useState(defaultDate || selectedDate);
  const [deadline, setDeadline] = useState('');
  const [linkedMonthlyGoalId, setLinkedMonthlyGoalId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setSubject(taskToEdit.subject);
      setPlannedDurationMinutes(taskToEdit.plannedDurationMinutes);
      setPriority(taskToEdit.priority);
      setIsRequired(taskToEdit.isRequired);
      setScheduledDate(taskToEdit.scheduledDate);
      setDeadline(taskToEdit.deadline || '');
      setLinkedMonthlyGoalId(taskToEdit.linkedMonthlyGoalId || '');
      setNotes(taskToEdit.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setSubject(settings.subjects[0] || 'Physics');
      setPlannedDurationMinutes(60);
      setPriority(settings.defaultPriority);
      setIsRequired(true);
      setScheduledDate(defaultDate || selectedDate);
      setDeadline('');
      setLinkedMonthlyGoalId('');
      setNotes('');
    }
    setError(null);
  }, [taskToEdit, defaultDate, selectedDate, isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        subject,
        plannedDurationMinutes: Number(plannedDurationMinutes) || 60,
        priority,
        isRequired,
        scheduledDate,
        deadline: deadline || undefined,
        linkedMonthlyGoalId: linkedMonthlyGoalId || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        subject,
        plannedDurationMinutes: Number(plannedDurationMinutes) || 60,
        priority,
        isRequired,
        scheduledDate,
        originalScheduledDate: scheduledDate,
        deadline: deadline || undefined,
        isCompleted: false,
        linkedMonthlyGoalId: linkedMonthlyGoalId || undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#12161e] border border-slate-700 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#171d26] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h2 className="font-heading font-bold text-slate-100 text-base tracking-wide">
              {taskToEdit ? 'EDIT TASK' : 'SCHEDULE NEW TASK'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-slate-300 font-mono-tech mb-1 uppercase tracking-wider text-[11px]">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="e.g., Physics — EMI Revision & PYQs"
              className="w-full bg-[#181d27] border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Subject & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-mono-tech mb-1 uppercase tracking-wider text-[11px]">
                Subject / Category
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#181d27] border border-slate-700 rounded px-3 py-2 text-xs font-mono-tech text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {settings.subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-mono-tech mb-1 uppercase tracking-wider text-[11px]">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[#181d27] border border-slate-700 rounded px-3 py-2 text-xs font-mono-tech text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical / Mission Essential</option>
              </select>
            </div>
          </div>

          {/* Date & Planned Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-mono-tech mb-1 uppercase tracking-wider text-[11px]">
                Scheduled Date
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-[#181d27] border border-slate-700 rounded px-3 py-2 text-xs font-mono-tech text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-mono-tech mb-1 uppercase tracking-wider text-[11px]">
                Planned Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={plannedDurationMinutes}
                onChange={(e) => setPlannedDurationMinutes(Math.max(5, parseInt(e.target.value, 10) || 30))}
                className="w-full bg-[#181d27] border border-slate-700 rounded px-3 py-2 text-xs font-mono-tech text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Required Status & Optional Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
            <label className="flex items-center space-x-2.5 p-2 rounded bg-[#181d27] border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-slate-200 font-mono-tech text-xs">
                Required for 100% Day Completion
              </span>
            </label>

            <div>
              <label className="block text-slate-300 font-mono-tech mb-1 uppercase tracking-wider text-[11px]">
                Daily Deadline (Optional)
              </label>
              <input
                type="time"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#181d27] border border-slate-700 rounded px-3 py-2 text-xs font-mono-tech text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Monthly Goal Link */}
          {monthlyGoals.length > 0 && (
            <div>
              <label className="block text-slate-300 font-mono-tech mb-1 uppercase tracking-wider text-[11px]">
                Link to Monthly Goal (Optional)
              </label>
              <select
                value={linkedMonthlyGoalId}
                onChange={(e) => setLinkedMonthlyGoalId(e.target.value)}
                className="w-full bg-[#181d27] border border-slate-700 rounded px-3 py-2 text-xs font-mono-tech text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">No Goal Linked</option>
                {monthlyGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.subject}] {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description & Notes */}
          <div>
            <label className="block text-slate-300 font-mono-tech mb-1 uppercase tracking-wider text-[11px]">
              Notes / Sub-topics
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Page numbers, exercise numbers, specific theorem to master..."
              rows={2}
              className="w-full bg-[#181d27] border border-slate-700 rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-2 rounded bg-red-950/40 border border-red-800 text-red-400 text-xs font-mono-tech">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="px-1 pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              {taskToEdit ? 'Save Changes' : 'Schedule Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
