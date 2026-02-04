import { getCurrentWindow } from '@tauri-apps/api/window';
import './TitleBar.css';

interface TitleBarProps {
    title?: string;
}

export function TitleBar({ title = 'Frontal Lobe' }: TitleBarProps) {
    const appWindow = getCurrentWindow();

    const handleMinimize = () => appWindow.minimize();
    const handleMaximize = () => appWindow.toggleMaximize();
    const handleClose = () => appWindow.close();

    return (
        <div className="titlebar" data-tauri-drag-region>
            <div className="titlebar-title">{title}</div>
            <div className="titlebar-buttons">
                <button className="titlebar-button" onClick={handleMinimize}>
                    <svg width="10" height="1" viewBox="0 0 10 1">
                        <rect width="10" height="1" fill="currentColor" />
                    </svg>
                </button>
                <button className="titlebar-button" onClick={handleMaximize}>
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <rect width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" />
                    </svg>
                </button>
                <button className="titlebar-button close" onClick={handleClose}>
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
                        <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
