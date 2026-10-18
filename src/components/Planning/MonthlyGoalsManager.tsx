import React, { useState } from 'react';
import { Target, Plus, Check, Clock, Trash2, Edit2, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MonthlyGoal } from '../../types';
import { formatMonthName } from '../../utils/dateUtils';

export const MonthlyGoalsManager: React.FC = () => {
  const { monthlyGoals, addMonthlyGoal, updateMonthlyGoal, deleteMonthlyGoal, tasks, settings } = useApp();

  const [activeMonthKey, setActiveMonthKey] = useState('2026-10');
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(settings.subjects[0] || 'Physics');
  const [targetTaskCount, setTargetTaskCount] = useState(15);
  const [targetStudyHours, setTargetStudyHours] = useState(25);

  const filteredGoals = monthlyGoals.filter((g) => g.monthKey === activeMonthKey);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addMonthlyGoal({
      monthKey: activeMonthKey,
      title: title.trim(),
      subject,
      targetTaskCount: Number(targetTaskCount) || 10,
      targetStudyHours: Number(targetStudyHours) || 20,
      isCompleted: false,
    });

    setTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5 font-sans">
      <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        {/* Month Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="font-heading font-bold text-slate-100 text-lg tracking-wide">
              MONTHLY HIGH-LEVEL GOALS
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={activeMonthKey}
              onChange={(e) => setActiveMonthKey(e.target.value)}
              className="bg-[#161a22] border border-slate-700 rounded px-3 py-1.5 text-xs font-mono-tech text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="2026-10">October 2026</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-12">December 2026</option>
              <option value="2027-01">January 2027</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </button>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {filteredGoals.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-dashed border-slate-800 text-xs font-mono-tech text-slate-400">
              No monthly goals defined for {formatMonthName(activeMonthKey)}. Click "New Goal" to add one.
            </div>
          ) : (
            filteredGoals.map((goal) => {
              // Calculate progress from linked tasks
              const linkedTasks = tasks.filter((t) => t.linkedMonthlyGoalId === goal.id);
              const completedTasksCount = linkedTasks.filter((t) => t.isCompleted).length;
              const progressPct =
                goal.targetTaskCount > 0
                  ? Math.min(100, Math.round((completedTasksCount / goal.targetTaskCount) * 100))
                  : 0;

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-lg bg-[#161b24] border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono-tech px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {goal.subject}
                        </span>
                        <h3 className="font-semibold text-slate-100 text-sm">{goal.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400 font-mono-tech">
                        Target: {goal.targetTaskCount} tasks • {goal.targetStudyHours} study hours
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteMonthlyGoal(goal.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono-tech text-slate-400">
                      <span>
                        Tasks Progress: <strong className="text-slate-200">{completedTasksCount}</strong> /{' '}
                        {goal.targetTaskCount}
                      </span>
                      <span className="text-emerald-400 font-bold">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-[#1e2533] rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161b23] border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-heading font-bold text-slate-100 text-base">
              ADD MONTHLY GOAL ({formatMonthName(activeMonthKey)})
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-mono-tech mb-1 uppercase text-[11px]">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Complete Differential Equations Mastery"
                  className="w-full bg-[#1a202c] border border-slate-700 rounded p-2 text-slate-100 font-sans focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-mono-tech mb-1 uppercase text-[11px]">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#1a202c] border border-slate-700 rounded p-2 font-mono-tech text-slate-100"
                  >
                    {settings.subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-mono-tech mb-1 uppercase text-[11px]">
                    Target Task Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetTaskCount}
                    onChange={(e) => setTargetTaskCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#1a202c] border border-slate-700 rounded p-2 font-mono-tech text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-mono-tech mb-1 uppercase text-[11px]">
                  Target Study Hours
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetStudyHours}
                  onChange={(e) => setTargetStudyHours(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-[#1a202c] border border-slate-700 rounded p-2 font-mono-tech text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech font-semibold"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
