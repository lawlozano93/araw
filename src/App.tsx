import { useState, useEffect, useRef } from 'react';
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
import { useSound, setSoundEnabledPreference } from './hooks/useSound';
import { listen } from '@tauri-apps/api/event';
import { getToday, loadConfig } from './hooks/useStorage';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import './App.css';

type View = 'dashboard' | 'wizard' | 'entry' | 'settings';
function App() {
  const windowLabel = useWindowLabel();
  const [view, setView] = useState<View>('dashboard');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedEntryDate, setSelectedEntryDate] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const playSound = useSound();
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (windowLabel !== 'main') return;
    loadConfig()
      .then((c) => setSoundEnabledPreference(c.soundEnabled !== false))
      .catch(() => {});
  }, [windowLabel]);

  useEffect(() => {
    if (windowLabel !== 'main') return;

    const run = async () => {
      try {
        const ignored = localStorage.getItem('araw:updateCheck:ignoredVersion');
        const result = await invoke<{
          current_version: string;
          latest_version: string | null;
          latest_tag: string | null;
          release_url: string | null;
          update_available: boolean;
        }>('check_for_updates');

        if (!result.update_available) return;
        const latest = result.latest_version || result.latest_tag;
        if (!latest) return;
        if (ignored && ignored === latest) return;

        const ok = window.confirm(
          `A new version of Araw is available.\n\nCurrent: ${result.current_version}\nLatest: ${latest}\n\nOpen the download page now?`
        );

        if (ok && result.release_url) {
          await openUrl(result.release_url);
        } else if (!ok) {
          // If they dismiss, don't nag again today; they can also "skip" by ignoring this version.
          // (We only set ignore on explicit cancel below to keep behavior simple.)
          localStorage.setItem('araw:updateCheck:ignoredVersion', latest);
        }
      } catch {
        // Silent failure: update checks should never block app startup.
      }
    };

    run();
  }, [windowLabel]);

  // TEST MODE: Removed test date selector

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only apply shortcuts in the main window.
      if (windowLabel !== 'main') return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingElement =
        tag === 'input' || tag === 'textarea' || (target ? (target as any).isContentEditable : false);
      if (isTypingElement) return;

      const hasMod = e.ctrlKey || e.metaKey;
      if (!hasMod) return;

      const key = e.key;
      const keyLower = key.toLowerCase();

      // Main shortcuts
      if (key === ',') {
        e.preventDefault();
        playSound();
        setHistoryOpen(false);
        setView('settings');
        return;
      }

      if (keyLower === 'h') {
        e.preventDefault();
        playSound();
        if (view === 'dashboard') {
          setHistoryOpen(prev => !prev);
        }
        return;
      }

      if (key === 'Enter') {
        e.preventDefault();
        playSound();
        const currentSession = sessionRef.current;
        if (view === 'dashboard' && currentSession) {
          if (currentSession.promptAnswered) {
            setSelectedEntryDate(getToday());
            setHistoryOpen(false);
            setView('entry');
          } else {
            setSelectedEntryDate(null);
            setHistoryOpen(false);
            setView('wizard');
          }
        }
        return;
      }

      // Zoom shortcuts
      if (key === '=' || key === '+') {
        e.preventDefault();
        setZoomLevel((prev) => Math.min(prev + 0.1, 2.0));
      } else if (key === '-') {
        e.preventDefault();
        setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
      } else if (key === '0') {
        e.preventDefault();
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [windowLabel, view, playSound]);

  const { session, loading, updateSession, onboardingComplete, completeOnboarding } = useSession();
  // Keep latest session in a ref so key handlers can read it without re-registering.
  sessionRef.current = session;
  const { theme, toggleTheme } = useTheme();
  const { actions, toggleAction, addAction, deleteAction, refresh: refreshActions } = useActions();

  useEffect(() => {
    if (windowLabel !== 'main') return;

    const openWizard = () => {
      setSelectedEntryDate(null);
      setHistoryOpen(false);
      setView('wizard');
    };

    let unlisten: undefined | (() => void);

    const init = async () => {
      // Fallback for when we trigger from the tray UI before listeners are ready.
      if (localStorage.getItem('openWizardOnStart') === 'true') {
        localStorage.removeItem('openWizardOnStart');
        openWizard();
      }

      try {
        unlisten = await listen('start-session', () => {
          openWizard();
        });
      } catch {
        // If the event API isn't available yet, the localStorage fallback will still work.
      }
    };

    init();

    return () => {
      if (unlisten) unlisten();
    };
  }, [windowLabel]);

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
                    type="button"
                    className="bottom-nav-btn"
                    onClick={() => {
                      playSound();
                      setHistoryOpen(true);
                    }}
                    title="History"
                    aria-label="Open journal history"
                  >
                    <History size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="bottom-nav-btn"
                    onClick={() => {
                      playSound();
                      setView('settings');
                    }}
                    title="Settings"
                    aria-label="Open settings"
                  >
                    <SettingsIcon size={16} aria-hidden />
                  </button>
                </div>
                <div className="bottom-nav-right">
                  <div className="bottom-nav-zoom">
                    <button
                      type="button"
                      className="bottom-nav-btn"
                      onClick={() => {
                        playSound();
                        setZoomLevel((z) => Math.max(z - 0.1, 0.5));
                      }}
                      title="Zoom Out"
                      aria-label="Zoom out"
                    >
                      <ZoomOut size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="bottom-nav-btn"
                      onClick={() => {
                        playSound();
                        setZoomLevel((z) => Math.min(z + 0.1, 2.0));
                      }}
                      title="Zoom In"
                      aria-label="Zoom in"
                    >
                      <ZoomIn size={16} aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="theme-toggle"
                    onClick={() => {
                      playSound();
                      toggleTheme();
                    }}
                    aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    aria-pressed={theme === 'dark'}
                  >
                    {theme === 'light' ? (
                      <Moon size={16} aria-hidden />
                    ) : (
                      <Sun size={16} aria-hidden />
                    )}
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
