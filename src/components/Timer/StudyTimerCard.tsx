import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Clock,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDurationHMS } from '../../utils/timerEngine';

interface StudyTimerCardProps {
  onOpenEndDay: () => void;
}

export const StudyTimerCard: React.FC<StudyTimerCardProps> = ({ onOpenEndDay }) => {
  const {
    activeTimer,
    timerElapsedMs,
    startTimer,
    pauseTimer,
    resumeTimer,
    restartTimer,
    endCurrentSession,
    settings,
    tasks,
    selectedDate,
  } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<string>(settings.subjects[0] || 'Physics');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  // Uncompleted tasks for the selected date
  const dayTasks = tasks.filter((t) => t.scheduledDate === selectedDate && !t.isCompleted);

  const handleStart = () => {
    const taskObj = tasks.find((t) => t.id === selectedTaskId);
    startTimer(selectedSubject, selectedTaskId || undefined, taskObj?.title);
  };

  const handleEndSessionSubmit = () => {
    endCurrentSession(sessionNotes);
    setShowEndSessionModal(false);
    setSessionNotes('');
  };

  const formattedTime = formatDurationHMS(timerElapsedMs);

  return (
    <div className="bg-[#12161d] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden font-sans">
      {/* Background Tech Glow Accent */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Timer Display & Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono-tech uppercase font-bold tracking-wider ${
                activeTimer?.status === 'running'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 animate-pulse'
                  : activeTimer?.status === 'paused'
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-700/60'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeTimer?.status === 'running'
                    ? 'bg-emerald-400'
                    : activeTimer?.status === 'paused'
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              ></span>
              <span>{activeTimer?.status || 'IDLE'}</span>
            </span>

            {activeTimer && (
              <span className="text-xs font-mono-tech text-slate-400">
                Subject: <strong className="text-slate-200">{activeTimer.subject}</strong>
                {activeTimer.taskTitle && ` • ${activeTimer.taskTitle}`}
              </span>
            )}
          </div>

          {/* Time Digits */}
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl sm:text-5xl font-mono-tech font-bold tracking-wider text-slate-100">
              {formattedTime}
            </span>
            <span className="text-xs font-mono-tech text-slate-500 uppercase">
              {activeTimer?.status === 'running' ? 'Active Wall-Clock' : 'Accumulated'}
            </span>
          </div>

          {/* Subject & Task Selection (when idle) */}
          {!activeTimer && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-[#181d26] border border-slate-700 rounded px-2.5 py-1 text-xs font-mono-tech text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {settings.subjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {dayTasks.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="bg-[#181d26] border border-slate-700 rounded px-2.5 py-1 text-xs font-mono-tech text-slate-200 focus:outline-none focus:border-emerald-500 max-w-[200px] truncate cursor-pointer"
                  >
                    <option value="">Link to Task (Optional)</option>
                    {dayTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Timer Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!activeTimer ? (
            <button
              type="button"
              onClick={handleStart}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>START STUDY SESSION</span>
            </button>
          ) : (
            <>
              {activeTimer.status === 'running' ? (
                <button
                  type="button"
                  onClick={pauseTimer}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300 font-mono-tech text-xs font-bold transition-colors cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>PAUSE</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeTimer}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-mono-tech text-xs font-bold transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-emerald-300" />
                  <span>RESUME</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowRestartConfirm(true)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono-tech text-xs transition-colors cursor-pointer"
                title="Restart session timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restart</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEndSessionModal(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 font-mono-tech text-xs font-bold transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-red-400" />
                <span>END SESSION</span>
              </button>
            </>
          )}

          {/* End Day Button */}
          <button
            type="button"
            onClick={onOpenEndDay}
            className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono-tech text-xs transition-colors cursor-pointer"
            title="Finalize day review"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>End Day</span>
          </button>
        </div>
      </div>

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161a22] border border-slate-700 rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-heading font-bold text-base">CONFIRM RESTART</h3>
            </div>
            <p className="text-xs text-slate-300">
              Restarting resets the current active session clock to 00:00:00. This un-saved session time will be reset.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowRestartConfirm(false)}
                className="px-3 py-1.5 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  restartTimer();
                  setShowRestartConfirm(false);
                }}
                className="px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono-tech text-xs font-semibold cursor-pointer"
              >
                Restart Clock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Review Modal */}
      {showEndSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161a22] border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Clock className="w-5 h-5" />
              <h3 className="font-heading font-bold text-base">SAVE STUDY SESSION</h3>
            </div>

            <div className="bg-[#111419] p-3 rounded border border-slate-800 text-xs font-mono-tech space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Duration:</span>
                <span className="text-emerald-400 font-bold text-sm">{formattedTime}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Subject:</span>
                <span className="text-slate-200">{activeTimer?.subject}</span>
              </div>
              {activeTimer?.taskTitle && (
                <div className="flex justify-between text-slate-400">
                  <span>Task:</span>
                  <span className="text-slate-200 truncate max-w-[200px]">{activeTimer.taskTitle}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono-tech text-slate-400 mb-1">
                Session Notes (Optional)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Key concepts reviewed, formulas solved, questions completed..."
                rows={3}
                className="w-full bg-[#1b212b] border border-slate-700 rounded p-2 text-xs text-slate-100 font-sans focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowEndSessionModal(false)}
                className="px-3 py-1.5 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Continue Timer
              </button>
              <button
                type="button"
                onClick={handleEndSessionSubmit}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-semibold shadow-md cursor-pointer"
              >
                Record & Save Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
