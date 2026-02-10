import { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar/TitleBar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Wizard } from './components/Wizard/Wizard';
import { HistorySidebar } from './components/HistorySidebar/HistorySidebar';
import { EntryViewer } from './components/EntryViewer/EntryViewer';
import { TrayApp } from './components/TrayApp/TrayApp';
import { Onboarding } from './components/Onboarding/Onboarding';
import { Settings } from './components/Settings/Settings';
import { useSession, useTheme, useActions } from './hooks/useSession';
import { useWindowLabel } from './hooks/useWindowLabel';
import './App.css';

type View = 'dashboard' | 'wizard' | 'entry' | 'settings';
function App() {
  const windowLabel = useWindowLabel();
  const [view, setView] = useState<View>('dashboard');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedEntryDate, setSelectedEntryDate] = useState<string | null>(null);
  // TEST MODE: Allow selecting different dates for testing
  const [testDate, setTestDate] = useState(() => {
    return localStorage.getItem('testDate') || new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    localStorage.setItem('testDate', testDate);
  }, [testDate]);

  const { session, loading, updateSession, onboardingComplete, completeOnboarding } = useSession(testDate); // Pass testDate
  const { theme, toggleTheme } = useTheme();
  const { actions, toggleAction, addAction, deleteAction, refresh: refreshActions } = useActions(testDate);

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
                    onAddAction={addAction}
                    onDeleteAction={deleteAction}
                  />
                </div>
              </div>

              <div className="bottom-nav">
                <div className="bottom-nav-left">
                  <button
                    className="bottom-nav-btn"
                    onClick={() => setHistoryOpen(true)}
                    title="History"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /></svg>
                  </button>
                  <button
                    className="bottom-nav-btn"
                    onClick={() => setView('settings')}
                    title="Settings"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.22 2h-.44a2 2 0 0 1-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 0 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </div>
                <div className="bottom-nav-right">
                  <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === 'light' ? '🌙' : '☀️'}
                  </button>
                </div>
              </div>
            </>
          )}

          {view === 'settings' && (
            <Settings onBack={() => setView('dashboard')} />
          )}

          {view === 'wizard' && (
            <Wizard
              session={session}
              onUpdateSession={updateSession}
              onComplete={() => {
                refreshActions();
                setView('dashboard');
              }}
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
