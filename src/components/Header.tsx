import React from 'react';
import {
  Calendar,
  Clock,
  Bell,
  Sliders,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatShortDisplayDate } from '../utils/dateUtils';

interface HeaderProps {
  activeTab: 'dashboard' | 'planning' | 'heatmap' | 'history' | 'analytics' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'planning' | 'heatmap' | 'history' | 'analytics' | 'settings') => void;
  onOpenDateRangeModal: () => void;
  onOpenBacklogDrawer: () => void;
  onOpenNotificationCenter: () => void;
  onOpenEndDayModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDateRangeModal,
  onOpenBacklogDrawer,
  onOpenNotificationCenter,
  onOpenEndDayModal,
}) => {
  const {
    dateRange,
    syncStatus,
    notifications,
    streakInfo,
  } = useApp();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 bg-[#0f1216]/95 backdrop-blur-md border-b border-[#1f2530] px-4 sm:px-6 lg:px-8 py-2.5 transition-colors font-sans">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Row 1: Brand, Date Range, Streak, Sync, and Quick Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 rounded bg-[#161b22] border border-emerald-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <span className="font-heading font-bold text-emerald-400 text-sm tracking-wider">D0</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-heading font-bold tracking-widest text-slate-100 text-sm sm:text-base leading-none">
                  DAYZERO
                </span>
                <span className="text-[9px] font-mono-tech px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase">
                  MIL-TECH
                </span>
              </div>
            </div>
          </div>

          {/* Quick Date Range Pill */}
          <button
            type="button"
            onClick={onOpenDateRangeModal}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#161a22] hover:bg-[#1d232e] border border-slate-700/60 text-xs font-mono-tech text-slate-300 transition-colors cursor-pointer"
            title="Configure planning period"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {formatShortDisplayDate(dateRange.startDate)} → {formatShortDisplayDate(dateRange.endDate)}
            </span>
          </button>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Mobile Date Range Pill */}
            <button
              type="button"
              onClick={onOpenDateRangeModal}
              className="sm:hidden flex items-center space-x-1 px-2 py-1 rounded bg-[#161a22] border border-slate-700 text-[10px] font-mono-tech text-slate-300"
              title="Configure planning period"
            >
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span>{formatShortDisplayDate(dateRange.startDate)}</span>
            </button>

            {/* Consistency Streak Badge */}
            <div
              className="flex items-center space-x-1 px-2 py-1 rounded bg-[#161a22] border border-amber-500/30 text-amber-400 text-[11px] font-mono-tech"
              title="Consistency Streak"
            >
              <Flame className="w-3 h-3 fill-amber-500/30" />
              <span>{streakInfo.currentStreak}d</span>
            </div>

            {/* Sync Status Badge */}
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-mono-tech border ${
                syncStatus === 'synced'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                  : syncStatus === 'syncing'
                  ? 'bg-blue-950/40 text-blue-400 border-blue-800/60 animate-pulse'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/60'
              }`}
              title={`Sync status: ${syncStatus}`}
            >
              {syncStatus === 'synced' && <Cloud className="w-3 h-3 text-emerald-400" />}
              {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />}
              {syncStatus === 'offline' && <CloudOff className="w-3 h-3 text-slate-400" />}
              <span className="capitalize hidden md:inline">{syncStatus}</span>
            </div>

            {/* Backlog Drawer Button */}
            <button
              type="button"
              onClick={onOpenBacklogDrawer}
              className="p-1.5 rounded bg-[#161a22] hover:bg-[#1d232e] border border-slate-700/60 text-slate-300 transition-colors cursor-pointer"
              title="Open Backlog Drawer"
              aria-label="Open Backlog"
            >
              <FolderArchive className="w-3.5 h-3.5 text-purple-400" />
            </button>

            {/* Notifications Center Bell */}
            <button
              type="button"
              onClick={onOpenNotificationCenter}
              className="p-1.5 rounded bg-[#161a22] hover:bg-[#1d232e] border border-slate-700/60 text-slate-300 transition-colors relative cursor-pointer"
              title="Accountability Alerts"
              aria-label="Accountability Alerts"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-red-600 text-white font-mono-tech text-[9px] flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* End Day Button */}
            <button
              type="button"
              onClick={onOpenEndDayModal}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-xs font-mono-tech font-semibold transition-all cursor-pointer"
              title="Review and End Day"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">End Day</span>
            </button>
          </div>
        </div>

        {/* Row 2: Main Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto no-scrollbar pt-0.5 text-xs font-mono-tech">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'planning', label: 'Planning Hub' },
            { id: 'heatmap', label: 'Heatmap' },
            { id: 'history', label: 'History' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
