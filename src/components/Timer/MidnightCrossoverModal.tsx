import React from 'react';
import { Moon, Split, ArrowLeft, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDisplayDate, formatShortDisplayDate } from '../../utils/dateUtils';
import { formatDurationHuman } from '../../utils/timerEngine';

export const MidnightCrossoverModal: React.FC = () => {
  const {
    midnightPromptData,
    resolveMidnightCrossover,
    dismissMidnightPrompt,
    activeTimer,
  } = useApp();

  if (!midnightPromptData || !activeTimer) return null;

  const {
    startDate,
    endDate,
    totalElapsedMs,
    startDayMs,
    endDayMs,
  } = midnightPromptData;

  const formattedStartTime = new Date(activeTimer.startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedNowTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#12161d] border border-amber-500/50 rounded-xl max-w-lg w-full shadow-[0_0_30px_rgba(245,158,11,0.15)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#181d27] border-b border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Moon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-slate-100 text-base tracking-wide">
              MIDNIGHT CROSSOVER DETECTED
            </h2>
            <p className="text-[11px] font-mono-tech text-amber-400">
              Session crossed into a new calendar date
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Your study session started on <strong>{formatDisplayDate(startDate)}</strong> at {formattedStartTime} and continued past 00:00 midnight into <strong>{formatDisplayDate(endDate)}</strong> (current time: {formattedNowTime}).
          </p>

          {/* Session Timing Summary Card */}
          <div className="bg-[#171c26] border border-slate-800 rounded-lg p-3.5 font-mono-tech space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Total Elapsed Study Time:</span>
              <strong className="text-emerald-400">{formatDurationHuman(totalElapsedMs)}</strong>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Pre-Midnight ({formatShortDisplayDate(startDate)}):</span>
              <span className="text-slate-300">{formatDurationHuman(startDayMs)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Post-Midnight ({formatShortDisplayDate(endDate)}):</span>
              <span className="text-slate-300">{formatDurationHuman(endDayMs)}</span>
            </div>
          </div>

          <p className="text-slate-400 text-[11px]">
            How would you like to record and attribute this tracked time?
          </p>

          {/* Attribution Options */}
          <div className="space-y-2.5">
            {/* Option 1: Assign to start date */}
            <button
              type="button"
              onClick={() => resolveMidnightCrossover('assign_start')}
              className="w-full p-3 rounded-lg bg-[#181d27] hover:bg-[#202735] border border-slate-700 hover:border-slate-500 text-left transition-all flex items-start space-x-3 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono-tech font-semibold text-slate-200 block text-xs">
                  1. Assign entire session to {formatShortDisplayDate(startDate)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Attributes the full {formatDurationHuman(totalElapsedMs)} to {formatShortDisplayDate(startDate)}'s daily total.
                </span>
              </div>
            </button>

            {/* Option 2: Split at midnight (Recommended) */}
            <button
              type="button"
              onClick={() => resolveMidnightCrossover('split')}
              className="w-full p-3 rounded-lg bg-emerald-950/20 hover:bg-emerald-950/30 border border-emerald-500/40 hover:border-emerald-500 text-left transition-all flex items-start space-x-3 cursor-pointer"
            >
              <Split className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono-tech font-semibold text-emerald-300 block text-xs flex items-center gap-1.5">
                  2. Split mathematically at midnight
                  <span className="px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 text-[9px] uppercase">
                    Recommended
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Attributes {formatDurationHuman(startDayMs)} to {formatShortDisplayDate(startDate)} and {formatDurationHuman(endDayMs)} to {formatShortDisplayDate(endDate)}. Zero double-counting.
                </span>
              </div>
            </button>

            {/* Option 3: Assign to end date */}
            <button
              type="button"
              onClick={() => resolveMidnightCrossover('assign_end')}
              className="w-full p-3 rounded-lg bg-[#181d27] hover:bg-[#202735] border border-slate-700 hover:border-slate-500 text-left transition-all flex items-start space-x-3 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono-tech font-semibold text-slate-200 block text-xs">
                  3. Assign entire session to {formatShortDisplayDate(endDate)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Attributes the full {formatDurationHuman(totalElapsedMs)} to {formatShortDisplayDate(endDate)}'s daily total.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#181d27] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono-tech">
            Total attributed will strictly equal {formatDurationHuman(totalElapsedMs)}.
          </span>
          <button
            type="button"
            onClick={dismissMidnightPrompt}
            className="px-3.5 py-1.5 rounded border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono-tech hover:bg-slate-800 cursor-pointer"
          >
            Decide Later
          </button>
        </div>
      </div>
    </div>
  );
};
