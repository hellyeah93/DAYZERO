import React, { useState } from 'react';
import { Calendar, FileText, Target } from 'lucide-react';
import { WeeklyPlanEditor } from './WeeklyPlanEditor';
import { MonthlyGoalsManager } from './MonthlyGoalsManager';
import { DailyDashboard } from '../Dashboard/DailyDashboard';

interface PlanningHubProps {
  onOpenEndDayModal: () => void;
}

export const PlanningHub: React.FC<PlanningHubProps> = ({ onOpenEndDayModal }) => {
  const [planningMode, setPlanningMode] = useState<'week' | 'month' | 'day'>('week');

  return (
    <div className="space-y-5 font-sans">
      {/* Mode Switcher */}
      <div className="bg-[#12161e] border border-slate-800 rounded-xl p-3 sm:p-4 flex items-center justify-between">
        <span className="text-xs font-mono-tech text-slate-400 uppercase tracking-wider hidden sm:inline">
          PLANNING STRATEGY MODE:
        </span>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          {[
            { id: 'week', label: 'Week-Wise Plan Parser', icon: FileText },
            { id: 'month', label: 'Monthly Goals', icon: Target },
            { id: 'day', label: 'Day-Wise Scheduler', icon: Calendar },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = planningMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setPlanningMode(mode.id as any)}
                className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono-tech transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Planning Content */}
      {planningMode === 'week' && <WeeklyPlanEditor />}
      {planningMode === 'month' && <MonthlyGoalsManager />}
      {planningMode === 'day' && (
        <DailyDashboard
          onOpenEndDayModal={onOpenEndDayModal}
          onOpenWeeklyPlanner={() => setPlanningMode('week')}
        />
      )}
    </div>
  );
};
