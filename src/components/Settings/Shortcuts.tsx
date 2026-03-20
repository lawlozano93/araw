import './Shortcuts.css';

export function Shortcuts() {
  return (
    <div className="shortcuts">
      <div className="shortcuts-title">Shortcuts</div>

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

