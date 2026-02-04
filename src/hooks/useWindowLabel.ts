import { getCurrentWindow } from '@tauri-apps/api/window';
import { useState, useEffect } from 'react';

// Simplified hook for now, assuming v2 API
export function useWindowLabel() {
    const [label, setLabel] = useState<string | null>(null);

    useEffect(() => {
        // In v2, getCurrentWindow returns the WebviewWindow instance
        const win = getCurrentWindow();
        // The label is available directly on the instance in some versions, or via async call
        // Let's try to get it. If it fails, we default to null.
        try {
            setLabel(win.label);
        } catch (e) {
            console.error("Failed to get window label", e);
        }
    }, []);

    return label;
}
