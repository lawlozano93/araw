import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, X, Maximize2 } from 'lucide-react';
import { useSound } from '../../hooks/useSound';
import './TitleBar.css';

export function TitleBar() {
    const appWindow = getCurrentWindow();
    const playSound = useSound();

    const handleMinimize = () => {
        playSound();
        appWindow.minimize();
    };
    const handleMaximize = () => {
        playSound();
        appWindow.toggleMaximize();
    };
    const handleClose = async () => {
        playSound();
        const isWindows = navigator.userAgent.toLowerCase().includes('windows');
        if (isWindows) {
            appWindow.close();
        } else {
            appWindow.hide();
        }
    };

    return (
        <div className="titlebar">
            <div className="titlebar-leading">
                <button
                    type="button"
                    className="titlebar-button close"
                    onClick={handleClose}
                    aria-label="Close"
                >
                    <X size={9} strokeWidth={2.75} aria-hidden />
                </button>
                <button
                    type="button"
                    className="titlebar-button minimize"
                    onClick={handleMinimize}
                    aria-label="Minimize"
                >
                    <Minus size={9} strokeWidth={2.75} aria-hidden />
                </button>
                <button
                    type="button"
                    className="titlebar-button maximize"
                    onClick={handleMaximize}
                    aria-label="Zoom"
                >
                    <Maximize2 size={8} strokeWidth={2.75} aria-hidden />
                </button>
            </div>
            <div className="titlebar-drag" data-tauri-drag-region aria-hidden="true" />
        </div>
    );
}
