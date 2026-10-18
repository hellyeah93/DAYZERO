import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Check,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { parseNaturalLanguagePlan, convertParsedTasksToModels, PlanParseResult } from '../../utils/planParser';
import { formatShortDisplayDate, getTodayDateString } from '../../utils/dateUtils';

const SAMPLE_WEEKLY_TEMPLATE = `WEEKLY PLAN — 19 OCTOBER TO 25 OCTOBER

Monday:
Physics — EMI revision
Chemistry — Chemical kinetics PYQs
Maths — Differential equations

Tuesday:
Physics — EMI practice
Chemistry — Organic reaction revision
Maths — Differential equations PYQs

Wednesday:
Physics — Capacitors
Chemistry — Coordination compounds
Maths — Definite integration

Thursday:
Physics — Circuit questions
Chemistry — Organic mechanisms
Maths — Area under the curve

Friday:
Physics — Revision test
Chemistry — Mixed practice
Maths — Differential equations

Saturday:
Physics — Mock test analysis
Chemistry — Weak-topic revision
Maths — Mixed problems

Sunday:
Revision — Weekly revision and backlog recovery`;

export const WeeklyPlanEditor: React.FC = () => {
  const { dateRange, tasks, importTasks, setSelectedDate } = useApp();

  const [rawText, setRawText] = useState(SAMPLE_WEEKLY_TEMPLATE);
  const [parseResult, setParseResult] = useState<PlanParseResult | null>(null);
  const [committedSuccess, setCommittedSuccess] = useState<string | null>(null);

  const handleParse = () => {
    const result = parseNaturalLanguagePlan(rawText, '2026-10-19', {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    setParseResult(result);
    setCommittedSuccess(null);
  };

  const handleCommit = () => {
    if (!parseResult || parseResult.tasks.length === 0) return;

    const { tasksToCreate, skippedCount } = convertParsedTasksToModels(
      parseResult.tasks,
      tasks
    );

    if (tasksToCreate.length > 0) {
      importTasks(tasksToCreate);
      setCommittedSuccess(
        `Successfully imported ${tasksToCreate.length} task(s) onto your calendar! ${
          skippedCount > 0 ? `(${skippedCount} duplicate(s) preserved)` : ''
        }`
      );
      if (parseResult.detectedWeekStart) {
        setSelectedDate(parseResult.detectedWeekStart);
      }
      setParseResult(null);
    } else {
      setCommittedSuccess(
        `All ${skippedCount} parsed tasks already exist on these dates. Preserved existing records.`
      );
    }
  };

  return (
    <div className="space-y-5 font-sans">
      <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="font-heading font-bold text-slate-100 text-lg tracking-wide flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              INTELLIGENT WEEKLY PLAN DISTRIBUTOR
            </h2>
            <p className="text-xs text-slate-400 font-mono-tech mt-0.5">
              Type or paste a structured schedule. The offline parser maps subjects and dates automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setRawText(SAMPLE_WEEKLY_TEMPLATE);
              setParseResult(null);
            }}
            className="px-3 py-1.5 rounded bg-[#181d27] hover:bg-[#202735] border border-slate-700 text-xs font-mono-tech text-slate-300 transition-colors cursor-pointer shrink-0"
          >
            Load Sample Template
          </button>
        </div>

        {/* Text Input Area */}
        <div>
          <label className="block text-xs font-mono-tech text-slate-300 uppercase tracking-wider mb-2">
            Weekly Schedule Text
          </label>
          <textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setParseResult(null);
              setCommittedSuccess(null);
            }}
            rows={12}
            className="w-full bg-[#161a22] border border-slate-700 rounded-lg p-3 text-xs sm:text-sm font-mono-tech text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
            placeholder="Type your weekly plan here..."
          />
        </div>

        {/* Parse Button */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono-tech text-slate-500">
            Offline natural language parser • No API keys required
          </span>
          <button
            type="button"
            onClick={handleParse}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
          >
            Parse & Preview Schedule
          </button>
        </div>

        {committedSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono-tech flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{committedSuccess}</span>
          </div>
        )}
      </div>

      {/* Parse Preview Table */}
      {parseResult && (
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 animate-fade-in font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-heading font-bold text-slate-100 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                PARSE PREVIEW ({parseResult.totalParsed} Tasks Detected)
              </h3>
              <p className="text-xs font-mono-tech text-slate-400">
                Week Range: {parseResult.detectedWeekStart} to {parseResult.detectedWeekEnd}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCommit}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply All to Calendar</span>
            </button>
          </div>

          {/* Warnings */}
          {parseResult.warnings.length > 0 && (
            <div className="p-3 rounded bg-amber-950/30 border border-amber-800 text-amber-300 text-xs font-mono-tech space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Parser Notices:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {parseResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tasks Table */}
          <div className="overflow-x-auto no-scrollbar border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono-tech">
              <thead className="bg-[#171c26] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Day</th>
                  <th className="p-2.5">Subject</th>
                  <th className="p-2.5">Task Title</th>
                  <th className="p-2.5">Duration</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {parseResult.tasks.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#161a24] text-slate-300">
                    <td className="p-2.5 font-semibold text-emerald-400 whitespace-nowrap">
                      {formatShortDisplayDate(item.date)}
                    </td>
                    <td className="p-2.5 text-slate-400 whitespace-nowrap">{item.dayLabel}</td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase text-[10px]">
                        {item.subject}
                      </span>
                    </td>
                    <td className="p-2.5 font-sans font-medium text-slate-100">{item.title}</td>
                    <td className="p-2.5 text-slate-400 whitespace-nowrap">{item.plannedMinutes}m</td>
                    <td className="p-2.5 whitespace-nowrap">
                      {item.isValid ? (
                        <span className="text-emerald-400 text-[11px]">Ready</span>
                      ) : (
                        <span className="text-red-400 text-[11px]">{item.validationError}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
