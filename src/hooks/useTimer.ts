import { useState, useEffect, useCallback, useRef } from 'react';

type TimerState = 'idle' | 'running' | 'paused';

interface UseTimerOptions {
    onExpire?: () => void;
}

export function useTimer(initialMinutes: number = 25, options?: UseTimerOptions) {
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
        if (state === 'running' && totalSeconds > 0) {
            intervalRef.current = window.setInterval(() => {
                setElapsedSeconds(prev => {
                    if (prev >= totalSeconds - 1) {
                        // Timer complete (prev is about to hit totalSeconds)
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        setState('idle');
                        // Call onExpire if provided
                        if (options?.onExpire) {
                            options.onExpire();
                        }
                        return prev + 1; // Or return totalSeconds
                    }
                    return prev + 1;
                });
            }, 1000);
        } else if (state === 'running' && totalSeconds <= 0) {
            // If initialized with 0 minutes, keep timer idle until time is added.
            setState('idle');
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state, totalSeconds]);

    const start = useCallback(() => {
        if (totalSeconds <= 0) {
            setState('idle');
            return;
        }
        setState('running');
    }, [totalSeconds]);

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

    const addTime = useCallback((minutes: number) => {
        setTotalSeconds(prev => prev + (minutes * 60));
    }, []);

    const remainingSeconds = totalSeconds - elapsedSeconds;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

    return {
        state,
        displayTime,
        progress,
        start,
        pause,
        reset,
        toggle,
        addTime,
        isRunning: state === 'running',
    };
}
