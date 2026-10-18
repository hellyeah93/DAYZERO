import React, { useState } from 'react';
import {
  Sliders,
  Bell,
  Cloud,
  Moon,
  Shield,
  Download,
  Upload,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LocalStore } from '../../services/storage';
import { authenticateUser, DEFAULT_FIREBASE_CONFIG } from '../../services/firebase';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    dateRange,
    setDateRange,
    syncStatus,
    firebaseUser,
    handleLogout,
  } = useApp();

  const [dailyTargetHours, setDailyTargetHours] = useState(
    Math.round(settings.dailyTargetStudyMinutes / 60)
  );
  const [tone, setTone] = useState(settings.notificationPreferences.tone);
  const [midnightPolicy, setMidnightPolicy] = useState(settings.midnightPolicy);
  const [newSubject, setNewSubject] = useState('');

  // Firebase auth state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Custom Firebase Config form
  const [apiKey, setApiKey] = useState(settings.firebaseConfig?.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey);
  const [projectId, setProjectId] = useState(settings.firebaseConfig?.projectId || DEFAULT_FIREBASE_CONFIG.projectId);
  const [authDomain, setAuthDomain] = useState(settings.firebaseConfig?.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain);

  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveGeneral = () => {
    updateSettings({
      ...settings,
      dailyTargetStudyMinutes: dailyTargetHours * 60,
      midnightPolicy,
      notificationPreferences: {
        ...settings.notificationPreferences,
        tone,
      },
    });
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    if (settings.subjects.includes(newSubject.trim())) return;
    const updated = [...settings.subjects, newSubject.trim()];
    updateSettings({ ...settings, subjects: updated });
    setNewSubject('');
  };

  const handleRemoveSubject = (sub: string) => {
    if (settings.subjects.length <= 1) return;
    const updated = settings.subjects.filter((s) => s !== sub);
    updateSettings({ ...settings, subjects: updated });
  };

  const handleSaveFirebaseConfig = () => {
    updateSettings({
      ...settings,
      firebaseConfig: {
        apiKey: apiKey.trim(),
        projectId: projectId.trim(),
        authDomain: authDomain.trim(),
      },
    });
    setAuthSuccess('Firebase configuration updated. Reinitializing connection...');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    try {
      await authenticateUser(authEmail, authPassword, isSignUp);
      setAuthSuccess(
        isSignUp ? 'Account created and signed in!' : 'Successfully signed in to Firebase!'
      );
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    }
  };

  const handleExportData = () => {
    const jsonStr = LocalStore.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dayzero_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = LocalStore.importData(content);
      if (success) {
        setImportStatus('Data imported successfully! Reloading...');
        setTimeout(() => window.location.reload(), 800);
      } else {
        setImportStatus('Error importing file: Invalid JSON structure.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 font-sans pb-8">
      {/* Header */}
      <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-heading font-bold text-slate-100 text-lg tracking-wide">
              SYSTEM CONFIGURATION & INTEGRATIONS
            </h2>
            <p className="text-xs text-slate-400 font-mono-tech">
              Tailor accountability rules, timing policies, subjects, and Firebase sync
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Study Target & Timing Rules */}
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 font-sans">
          <h3 className="font-heading font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <Moon className="w-4 h-4 text-emerald-400" />
            TIMING & ACCOUNTABILITY POLICIES
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-mono-tech mb-1 uppercase text-[11px]">
                Daily Study Target (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="18"
                value={dailyTargetHours}
                onChange={(e) => setDailyTargetHours(parseInt(e.target.value, 10) || 5)}
                className="w-full bg-[#181d27] border border-slate-700 rounded p-2 text-slate-100 font-mono-tech focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-mono-tech mb-1 uppercase text-[11px]">
                Accountability Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full bg-[#181d27] border border-slate-700 rounded p-2 text-slate-100 font-mono-tech focus:outline-none focus:border-emerald-500"
              >
                <option value="strict">Strict Accountability (Direct, tough, honest)</option>
                <option value="motivational">Motivational (Encouraging, momentum-focused)</option>
                <option value="neutral">Neutral (Objective metric logs only)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-mono-tech mb-1 uppercase text-[11px]">
                Midnight Session Attribution Policy
              </label>
              <select
                value={midnightPolicy}
                onChange={(e) => setMidnightPolicy(e.target.value as any)}
                className="w-full bg-[#181d27] border border-slate-700 rounded p-2 text-slate-100 font-mono-tech focus:outline-none focus:border-emerald-500"
              >
                <option value="prompt">Prompt on App Resume (Recommended)</option>
                <option value="split">Always Split Mathematically Across Midnight</option>
                <option value="assign_start">Always Assign to Session Start Date</option>
                <option value="assign_end">Always Assign to Current / Ending Date</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSaveGeneral}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech text-xs font-semibold shadow-md transition-colors"
            >
              Save Timing Rules
            </button>
          </div>
        </div>

        {/* Subjects Manager */}
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 font-sans">
          <h3 className="font-heading font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            SUBJECT CATEGORIES
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="New subject (e.g. Biology, Revision)"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="flex-1 bg-[#181d27] border border-slate-700 rounded p-2 text-slate-100 font-sans focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddSubject}
                className="px-3.5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono-tech font-bold"
              >
                Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {settings.subjects.map((sub) => (
                <div
                  key={sub}
                  className="flex items-center justify-between p-2 rounded bg-[#161a24] border border-slate-800 font-mono-tech"
                >
                  <span className="text-slate-200">{sub}</span>
                  {settings.subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(sub)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Firebase Cloud Synchronization & Auth */}
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 font-sans md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-heading font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400" />
                FIREBASE CLOUD BACKEND & CROSS-DEVICE AUTH
              </h3>
              <p className="text-xs text-slate-400 font-mono-tech">
                Synchronize seamlessly between Windows PC and Android mobile devices
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded text-xs font-mono-tech uppercase font-bold border ${
                syncStatus === 'synced'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Status: {syncStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Account Sign-In / User Info */}
            <div className="space-y-3 bg-[#151923] p-4 rounded-lg border border-slate-800">
              <span className="font-mono-tech uppercase text-slate-300 font-bold block text-[11px]">
                User Account Authentication
              </span>

              {firebaseUser ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-slate-200 font-mono-tech">
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    <span>{firebaseUser.email}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Your tasks, sessions, and daily records are synchronizing in real time across all logged-in devices.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono-tech text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <div>
                    <label className="block text-slate-400 font-mono-tech mb-1 uppercase text-[10px]">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="user@dayzero.app"
                      className="w-full bg-[#1b212c] border border-slate-700 rounded p-2 text-slate-100 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono-tech mb-1 uppercase text-[10px]">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1b212c] border border-slate-700 rounded p-2 text-slate-100 font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 font-mono-tech text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSignUp}
                        onChange={(e) => setIsSignUp(e.target.checked)}
                        className="rounded text-emerald-500"
                      />
                      <span>Create New Account</span>
                    </label>

                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech font-bold"
                    >
                      {isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                  </div>
                </form>
              )}

              {authError && (
                <div className="p-2 rounded bg-red-950/40 border border-red-800 text-red-400 text-xs font-mono-tech flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono-tech flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}
            </div>

            {/* Custom Firebase Config */}
            <div className="space-y-3 bg-[#151923] p-4 rounded-lg border border-slate-800">
              <span className="font-mono-tech uppercase text-slate-300 font-bold block text-[11px]">
                Firebase Project Keys (Optional Overrides)
              </span>

              <div className="space-y-2">
                <div>
                  <label className="block text-slate-400 font-mono-tech mb-0.5 text-[10px]">
                    API KEY
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#1b212c] border border-slate-700 rounded p-1.5 font-mono-tech text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono-tech mb-0.5 text-[10px]">
                    PROJECT ID
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="dayzero-prod"
                    className="w-full bg-[#1b212c] border border-slate-700 rounded p-1.5 font-mono-tech text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono-tech mb-0.5 text-[10px]">
                    AUTH DOMAIN
                  </label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="dayzero-prod.firebaseapp.com"
                    className="w-full bg-[#1b212c] border border-slate-700 rounded p-1.5 font-mono-tech text-xs text-slate-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveFirebaseConfig}
                  className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono-tech text-xs transition-colors"
                >
                  Save Project Keys
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Backup & Export / Import */}
        <div className="bg-[#12161e] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 font-sans md:col-span-2">
          <h3 className="font-heading font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            DATA INTEGRITY, BACKUP & JSON RESTORE
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs font-mono-tech">
            <p className="text-slate-400 max-w-md">
              Export a complete snapshot of all tasks, timestamp sessions, midnight attributions, and settings as a JSON archive.
            </p>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#181d27] hover:bg-[#202735] border border-slate-700 text-slate-200 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#181d27] hover:bg-[#202735] border border-slate-700 text-slate-200 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Restore JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {importStatus && (
            <div className="p-2.5 rounded bg-blue-950/40 border border-blue-800 text-blue-300 text-xs font-mono-tech">
              {importStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
