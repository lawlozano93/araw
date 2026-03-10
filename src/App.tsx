import { useState, useEffect } from 'react';
import { History, Settings as SettingsIcon, Moon, Sun, ZoomIn, ZoomOut } from 'lucide-react';
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
  const [zoomLevel, setZoomLevel] = useState(1);

  // TEST MODE: Removed test date selector

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomLevel((prev) => Math.min(prev + 0.1, 2.0));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { session, loading, updateSession, onboardingComplete, completeOnboarding } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { actions, toggleAction, addAction, deleteAction, refresh: refreshActions } = useActions();

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
    return <TrayApp />;
  }

  if (loading || !session) {
    return (
      <div className="app-container" style={{ zoom: zoomLevel }}>
        <TitleBar />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!onboardingComplete) {
    return (
      <div className="app-container" style={{ zoom: zoomLevel }}>
        <TitleBar />
        <div className="app-main">
          <Onboarding onComplete={completeOnboarding} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ zoom: zoomLevel }}>
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
                  <Dashboard
                    onStartSession={() => setView('wizard')}
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
                    <History size={16} />
                  </button>
                  <button
                    className="bottom-nav-btn"
                    onClick={() => setView('settings')}
                    title="Settings"
                  >
                    <SettingsIcon size={16} />
                  </button>
                </div>
                <div className="bottom-nav-right">
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      className="bottom-nav-btn"
                      onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.5))}
                      title="Zoom Out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <button
                      className="bottom-nav-btn"
                      onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 2.0))}
                      title="Zoom In"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                  <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
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
