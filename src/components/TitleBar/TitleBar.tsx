import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, X, Maximize2 } from 'lucide-react';
import './TitleBar.css';

interface TitleBarProps {
    title?: string;
}

export function TitleBar({ title = 'Araw' }: TitleBarProps) {
    const appWindow = getCurrentWindow();

    const handleMinimize = () => appWindow.minimize();
    const handleMaximize = () => appWindow.toggleMaximize();
    const handleClose = async () => {
        const isWindows = navigator.userAgent.toLowerCase().includes('windows');
        if (isWindows) {
            appWindow.close();
        } else {
            appWindow.hide();
        }
    };

    return (
        <div className="titlebar" data-tauri-drag-region>
            <div className="titlebar-title titlebar-logo">{title}</div>
            <div className="titlebar-buttons">
                <button className="titlebar-button close" onClick={handleClose}>
                    <X size={10} />
                </button>
                <button className="titlebar-button minimize" onClick={handleMinimize}>
                    <Minus size={10} />
                </button>
                <button className="titlebar-button maximize" onClick={handleMaximize}>
                    <Maximize2 size={10} />
                </button>
            </div>
        </div>
    );
}
