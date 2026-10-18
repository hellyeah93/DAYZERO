import React, { useState } from 'react';
import { X, Calendar, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { diffDays, formatDisplayDate } from '../utils/dateUtils';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({ isOpen, onClose }) => {
  const { dateRange, setDateRange } = useApp();

  const [fromInput, setFromInput] = useState<string>(dateRange.startDate);
  const [toInput, setToInput] = useState<string>(dateRange.endDate);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalDays = fromInput && toInput ? diffDays(fromInput, toInput) + 1 : 0;

  const handleSave = () => {
    if (!fromInput || !toInput) {
      setError('Please select both a start date and an end date.');
      return;
    }
    if (fromInput > toInput) {
      setError('Invalid date range: End date cannot be earlier than start date.');
      return;
    }
    if (totalDays > 730) {
      setError('Planning period cannot exceed 2 years.');
      return;
    }

    setError(null);
    setDateRange({
      startDate: fromInput,
      endDate: toInput,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleSetDefault = () => {
    setFromInput('2026-10-18');
    setToInput('2027-01-20');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12161c] border border-slate-700/80 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#161b22]">
          <div className="flex items-center space-x-2.5">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h2 className="font-heading font-bold text-slate-100 text-lg tracking-wide">
              CONFIGURE PLANNING PERIOD
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

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          <p className="text-xs text-slate-300 leading-relaxed">
            The planning period defines the primary calendar timeline for your tasks, study logs, and milestones.
            Month boundaries, year transitions, and leap years are generated automatically.
          </p>

          {/* Date Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-tech text-slate-400 mb-1.5 uppercase tracking-wider">
                FROM DATE
              </label>
              <input
                type="date"
                value={fromInput}
                onChange={(e) => {
                  setFromInput(e.target.value);
                  setError(null);
                }}
                className="w-full bg-[#1b212b] border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 font-mono-tech focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <span className="block text-[11px] text-slate-400 mt-1">
                {fromInput ? formatDisplayDate(fromInput) : 'Select date'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono-tech text-slate-400 mb-1.5 uppercase tracking-wider">
                TO DATE
              </label>
              <input
                type="date"
                value={toInput}
                onChange={(e) => {
                  setToInput(e.target.value);
                  setError(null);
                }}
                className="w-full bg-[#1b212b] border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 font-mono-tech focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <span className="block text-[11px] text-slate-400 mt-1">
                {toInput ? formatDisplayDate(toInput) : 'Select date'}
              </span>
            </div>
          </div>

          {/* Calculated Duration & Info */}
          <div className="bg-[#171c24] border border-slate-800 rounded p-3 flex items-center justify-between font-mono-tech text-xs">
            <span className="text-slate-400">Total Planning Duration:</span>
            <span className="text-emerald-400 font-bold">
              {totalDays > 0 ? `${totalDays} Days` : 'Invalid Range'}
            </span>
          </div>

          {/* Safety Notice */}
          <div className="flex items-start space-x-2.5 p-3 rounded bg-blue-950/20 border border-blue-900/40 text-blue-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Data Safety Guarantee:</strong> Changing the planning date range preserves all existing tasks, historical sessions, and notes. No data is lost or deleted.
            </span>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-2.5 rounded bg-red-950/40 border border-red-800/60 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="flex items-center space-x-2 p-2.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono-tech">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Planning timeline updated successfully.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#161b22] border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSetDefault}
            className="text-xs font-mono-tech text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Reset to Default (18 Oct 2026 - 20 Jan 2027)
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-semibold transition-colors shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
            >
              Update Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
