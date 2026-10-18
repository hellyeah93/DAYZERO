import React from 'react';
import {
  Bell,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Send,
  ShieldAlert,
  Volume2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { requestNotificationPermission } from '../../utils/notifications';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationRead,
    clearAllNotifications,
    triggerManualNotification,
    settings,
  } = useApp();

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'alert':
      case 'taunt':
        return 'border-l-4 border-l-red-500 bg-red-950/20 text-red-300';
      case 'success':
        return 'border-l-4 border-l-emerald-500 bg-emerald-950/20 text-emerald-300';
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-amber-950/20 text-amber-300';
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-950/20 text-blue-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#12161f] border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 bg-[#171d27] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Bell className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-heading font-bold text-slate-100 text-base tracking-wide">
                ACCOUNTABILITY ALERTS
              </h2>
              <span className="text-[11px] font-mono-tech text-slate-400">
                Tone: <strong className="uppercase text-amber-400">{settings.notificationPreferences.tone}</strong>
              </span>
            </div>
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

        {/* Action Controls */}
        <div className="p-3 bg-[#151a24] border-b border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={triggerManualNotification}
            className="px-3 py-1.5 rounded bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-mono-tech text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Trigger Briefing</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono-tech text-[11px] transition-colors cursor-pointer"
              title="Request OS Notification Permission"
            >
              OS Permission
            </button>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                className="p-1.5 rounded text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-slate-600" />
              <p className="text-xs font-mono-tech text-slate-400">
                No recent accountability alerts. Trigger a briefing or complete tasks to receive status updates.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3.5 rounded-lg border border-slate-800 transition-all cursor-pointer ${getTypeStyle(
                  n.type
                )} ${n.isRead ? 'opacity-70' : 'shadow-md'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-heading font-bold text-xs tracking-wide block">
                    {n.title}
                  </span>
                  <span className="text-[10px] font-mono-tech text-slate-400 shrink-0">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed font-sans">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
