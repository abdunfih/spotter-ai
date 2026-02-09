'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseTimerOptions {
    initialSeconds?: number;
    onComplete?: () => void;
    autoStart?: boolean;
}

export function useTimer({
    initialSeconds = 30,
    onComplete,
    autoStart = false
}: UseTimerOptions = {}) {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(autoStart);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning && seconds > 0) {
            interval = setInterval(() => {
                setSeconds(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        onComplete?.();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, seconds, onComplete]);

    const start = useCallback(() => setIsRunning(true), []);
    const stop = useCallback(() => setIsRunning(false), []);
    const reset = useCallback(() => {
        setSeconds(initialSeconds);
        setIsRunning(false);
    }, [initialSeconds]);

    const restart = useCallback(() => {
        setSeconds(initialSeconds);
        setIsRunning(true);
    }, [initialSeconds]);

    return { seconds, isRunning, start, stop, reset, restart };
}
