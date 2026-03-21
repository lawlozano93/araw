import { useCallback, useRef } from 'react';
import { loadConfig, saveConfig } from './useStorage';

const SOUND_LS_KEY = 'araw-sound-enabled';

export function isSoundEnabled(): boolean {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem(SOUND_LS_KEY) !== 'false';
}

export function setSoundEnabledPreference(enabled: boolean): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SOUND_LS_KEY, enabled ? 'true' : 'false');
}

/** Updates localStorage and vault `config.json` (best-effort). */
export async function persistSoundEnabled(enabled: boolean): Promise<void> {
    setSoundEnabledPreference(enabled);
    try {
        const c = await loadConfig();
        await saveConfig({ ...c, soundEnabled: enabled });
    } catch {
        /* Tauri / vault unavailable — localStorage still applies in this session */
    }
    window.dispatchEvent(new CustomEvent('araw-sound-preference'));
}

export function useSound(soundPath: string = '/sounds/drop_003.ogg') {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio element once
    if (!audioRef.current) {
        audioRef.current = new Audio(soundPath);
        // Preload the audio to avoid delay
        audioRef.current.preload = 'auto';
    }

    const playSound = useCallback(() => {
        if (!isSoundEnabled()) return;
        if (!audioRef.current) return;

        // Reset the audio to the start if it's already playing
        audioRef.current.currentTime = 0;

        // Play and catch any potential errors (e.g. if the user hasn't interacted with the page yet)
        audioRef.current.play().catch(error => {
            console.warn('Audio playback failed:', error);
        });
    }, []);

    return playSound;
}
