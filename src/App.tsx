import { useState } from 'react';
import { TitleBar } from './components/TitleBar/TitleBar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Wizard } from './components/Wizard/Wizard';
import { HistorySidebar } from './components/HistorySidebar/HistorySidebar';
import { EntryViewer } from './components/EntryViewer/EntryViewer';
import { TrayApp } from './components/TrayApp/TrayApp';
import { Onboarding } from './components/Onboarding/Onboarding';
import { useSession, useTheme, useActions } from './hooks/useSession';
import { useTimer } from './hooks/useTimer';
import { useWindowLabel } from './hooks/useWindowLabel';
import './App.css';

type View = 'dashboard' | 'wizard' | 'entry';
function App() {
  const windowLabel = useWindowLabel();
  const [view, setView] = useState<View>('dashboard');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedEntryDate, setSelectedEntryDate] = useState<string | null>(null);
  // TEST MODE: Allow selecting different dates for testing
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);

  const { session, loading, updateSession, onboardingComplete, completeOnboarding } = useSession(testDate); // Pass testDate
  const { theme, toggleTheme } = useTheme();
  const { actions, toggleAction } = useActions(testDate);
  const timer = useTimer(25);

  const handleSelectEntry = (date: string) => {
    setSelectedEntryDate(date);
    setView('entry');
    setHistoryOpen(false);
  };

  const handleBackToToday = () => {
    setSelectedEntryDate(null);
    setView('dashboard');
  };

  // If in tray window, render TrayApp
  if (windowLabel === 'tray') {
    return (
      <TrayApp />
    );
  }

  if (loading || !session) {
    return (
      <div className="app-container">
        <TitleBar />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!onboardingComplete) {
    return (
      <div className="app-container">
        <TitleBar />
        <div className="app-main">
          <Onboarding onComplete={completeOnboarding} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <TitleBar />

      {/* History Sidebar */}
      {historyOpen && (
        <>
          <div className="history-overlay" onClick={() => setHistoryOpen(false)} />
          <HistorySidebar
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
            onSelectEntry={handleSelectEntry}
          />
        </>
      )}

      <div className="app-main">
        <div className="content">
          {view === 'dashboard' && (
            <>
              <div className="editor-container">
                <div className="editor">
                  {/* TEST MODE: Date selector */}
                  <div className="test-date-picker">
                    <label>
                      <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginRight: '8px' }}>TEST DATE:</span>
                      <input
                        type="date"
                        value={testDate}
                        onChange={(e) => setTestDate(e.target.value)}
                        style={{
                          background: 'var(--input)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: '4px 8px',
                          fontSize: '12px',
                          color: 'var(--foreground)'
                        }}
                      />
                    </label>
                  </div>
                  <Dashboard
                    onStartSession={() => setView('wizard')}
                    testDate={testDate}
                    session={session}
                    actions={actions}
                    onToggleAction={toggleAction}
                  />
                </div>
              </div>

              <div className="bottom-nav">
                <div className="bottom-nav-left">
                  <span className="bottom-nav-item" onClick={() => setHistoryOpen(true)}>
                    History
                  </span>
                </div>
                <div className="bottom-nav-right">
                  <span
                    className={`timer ${timer.isRunning ? 'running' : ''}`}
                    onClick={timer.toggle}
                    title={timer.isRunning ? 'Click to pause' : 'Click to start'}
                  >
                    {timer.displayTime}
                  </span>
                  <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === 'light' ? '🌙' : '☀️'}
                  </button>
                </div>
              </div>
            </>
          )}

          {view === 'wizard' && (
            <Wizard
              session={session}
              onUpdateSession={updateSession}
              onComplete={() => setView('dashboard')}
              onBack={() => setView('dashboard')}
            />
          )}

          {view === 'entry' && selectedEntryDate && (
            <EntryViewer
              date={selectedEntryDate}
              onClose={handleBackToToday}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
