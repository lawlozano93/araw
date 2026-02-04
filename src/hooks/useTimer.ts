import { useState, useEffect, useCallback, useRef } from 'react';

type TimerState = 'idle' | 'running' | 'paused';

export function useTimer(initialMinutes: number = 25) {
    const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
    const [state, setState] = useState<TimerState>('idle');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const intervalRef = useRef<number | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Timer tick
    useEffect(() => {
        if (state === 'running') {
            intervalRef.current = window.setInterval(() => {
                setElapsedSeconds(prev => {
                    if (prev >= totalSeconds) {
                        // Timer complete
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        setState('idle');
                        return 0;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state, totalSeconds]);

    const start = useCallback(() => {
        setState('running');
    }, []);

    const pause = useCallback(() => {
        setState('paused');
    }, []);

    const reset = useCallback(() => {
        setState('idle');
        setElapsedSeconds(0);
    }, []);

    const toggle = useCallback(() => {
        if (state === 'running') {
            pause();
        } else {
            start();
        }
    }, [state, start, pause]);

    const remainingSeconds = totalSeconds - elapsedSeconds;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const progress = elapsedSeconds / totalSeconds;

    return {
        state,
        displayTime,
        progress,
        start,
        pause,
        reset,
        toggle,
        isRunning: state === 'running',
    };
}
