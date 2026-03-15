import { useCallback, useRef } from 'react';

export function useSound(soundPath: string = '/sounds/drop_003.ogg') {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio element once
    if (!audioRef.current) {
        audioRef.current = new Audio(soundPath);
        // Preload the audio to avoid delay
        audioRef.current.preload = 'auto';
    }

    const playSound = useCallback(() => {
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
