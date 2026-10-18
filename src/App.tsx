import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { HorizontalCalendar } from './components/HorizontalCalendar';
import { DailyDashboard } from './components/Dashboard/DailyDashboard';
import { PlanningHub } from './components/Planning/PlanningHub';
import { ProductivityHeatmap } from './components/Heatmap/ProductivityHeatmap';
import { HistoryView } from './components/History/HistoryView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { SettingsView } from './components/Settings/SettingsView';
import { DateRangeModal } from './components/DateRangeModal';
import { BacklogDrawer } from './components/Dashboard/BacklogDrawer';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { EndDayModal } from './components/Timer/EndDayModal';
import { MidnightCrossoverModal } from './components/Timer/MidnightCrossoverModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'planning' | 'heatmap' | 'history' | 'analytics' | 'settings'
  >('dashboard');

  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [isBacklogDrawerOpen, setIsBacklogDrawerOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isEndDayModalOpen, setIsEndDayModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e2e8f0] flex flex-col font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Tactical App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDateRangeModal={() => setIsDateRangeModalOpen(true)}
        onOpenBacklogDrawer={() => setIsBacklogDrawerOpen(true)}
        onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
        onOpenEndDayModal={() => setIsEndDayModalOpen(true)}
      />

      {/* Horizontal Date Tiles Calendar for Dashboard and History */}
      {(activeTab === 'dashboard' || activeTab === 'history') && (
        <HorizontalCalendar />
      )}

      {/* Main View Area with Responsive Padding & Safe Margins */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-6">
        {activeTab === 'dashboard' && (
          <DailyDashboard
            onOpenEndDayModal={() => setIsEndDayModalOpen(true)}
            onOpenWeeklyPlanner={() => setActiveTab('planning')}
          />
        )}
        {activeTab === 'planning' && (
          <PlanningHub onOpenEndDayModal={() => setIsEndDayModalOpen(true)} />
        )}
        {activeTab === 'heatmap' && <ProductivityHeatmap />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Persistent Modals & Drawers */}
      <DateRangeModal
        isOpen={isDateRangeModalOpen}
        onClose={() => setIsDateRangeModalOpen(false)}
      />

      <BacklogDrawer
        isOpen={isBacklogDrawerOpen}
        onClose={() => setIsBacklogDrawerOpen(false)}
      />

      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />

      <EndDayModal
        isOpen={isEndDayModalOpen}
        onClose={() => setIsEndDayModalOpen(false)}
      />

      {/* Autonomous Midnight Crossover Modal (Triggers when clock crosses 00:00) */}
      <MidnightCrossoverModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
