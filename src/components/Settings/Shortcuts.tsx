import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, persistSoundEnabled } from '../../hooks/useSound';
import './Shortcuts.css';

function SoundPreferenceRow() {
  const [on, setOn] = useState(isSoundEnabled);

  useEffect(() => {
    const sync = () => setOn(isSoundEnabled());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('araw-sound-preference', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('araw-sound-preference', sync);
    };
  }, []);

  const toggle = async () => {
    const next = !on;
    setOn(next);
    await persistSoundEnabled(next);
    if (next) {
      const a = new Audio('/sounds/drop_003.ogg');
      a.volume = 0.55;
      a.play().catch(() => {});
    }
  };

  return (
    <div className="shortcuts-section">
      <div className="shortcuts-section-title">Sound</div>
      <button type="button" className="sound-pref-toggle" onClick={toggle}>
        {on ? <Volume2 size={18} strokeWidth={2} aria-hidden /> : <VolumeX size={18} strokeWidth={2} aria-hidden />}
        <span>{on ? 'Sound effects on' : 'Sound effects muted'}</span>
      </button>
      <p className="sound-pref-hint">Saved in your vault config and shared across windows.</p>
    </div>
  );
}

export function Shortcuts() {
  return (
    <div className="shortcuts">
      <div className="shortcuts-title">Shortcuts</div>

      <SoundPreferenceRow />

      <div className="shortcuts-section">
        <div className="shortcuts-section-title">Main Window</div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘,</span>
          <span className="shortcut-desc">Open Settings</span>
        </div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘H</span>
          <span className="shortcut-desc">Toggle History sidebar</span>
        </div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘Enter</span>
          <span className="shortcut-desc">Start / Continue Session</span>
        </div>
      </div>

      <div className="shortcuts-section">
        <div className="shortcuts-section-title">Zoom</div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘/= or ⌘+</span>
          <span className="shortcut-desc">Zoom in</span>
        </div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘−</span>
          <span className="shortcut-desc">Zoom out</span>
        </div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘0</span>
          <span className="shortcut-desc">Reset zoom</span>
        </div>
      </div>

      <div className="shortcuts-section">
        <div className="shortcuts-section-title">Tray Popover</div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘N</span>
          <span className="shortcut-desc">Focus “Add action” input</span>
        </div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘O</span>
          <span className="shortcut-desc">Open Main App</span>
        </div>
      </div>

      <div className="shortcuts-section">
        <div className="shortcuts-section-title">Editor Formatting</div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘B</span>
          <span className="shortcut-desc">Bold</span>
        </div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘I</span>
          <span className="shortcut-desc">Italic</span>
        </div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘U</span>
          <span className="shortcut-desc">Underline</span>
        </div>
        <div className="shortcut-row">
          <span className="shortcut-key">⌘⇧X</span>
          <span className="shortcut-desc">Strikethrough</span>
        </div>
      </div>
    </div>
  );
}

