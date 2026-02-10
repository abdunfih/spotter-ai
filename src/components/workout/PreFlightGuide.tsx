'use client';

import React from 'react';
import { useEffect, useCallback, useMemo } from 'react';
import { Exercise } from '@/types';

interface PreFlightGuideProps {
    exercise: Exercise;
    onReady: () => void;
}

export function PreFlightGuide({ exercise, onReady }: PreFlightGuideProps) {
    const [countdown, setCountdown] = React.useState(5);
    const [isReadyEnabled, setIsReadyEnabled] = React.useState(false);

    // Countdown timer for auto-enable
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setIsReadyEnabled(true);
        }
    }, [countdown]);

    // Keyboard shortcut - press Enter or Space to ready up
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && isReadyEnabled) {
            e.preventDefault();
            onReady();
        }
    }, [isReadyEnabled, onReady]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Get tips from exercise or use defaults
    const tips = exercise.tips || [
        "Watch the demo",
        "Follow the form",
        "Maintain rhythm"
    ];

    // Get GIF from exercise or use placeholder
    const gifUrl = exercise.gif || "https://media.giphy.com/media/l3vRhTG2a3aM3Y7a8/giphy.gif";

    return (
        <div className="demo-container">
            <div className="gif-frame">
                <img src={gifUrl} className="gif-img" alt={exercise.name} />
            </div>
            <div className="w-full max-w-xs space-y-4 mb-10">
                {tips.map((tip, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-[#00ff41] rounded-full"></div>
                        <p className="text-sm font-bold uppercase text-white/80">{tip}</p>
                    </div>
                ))}
            </div>
            <button
                onClick={onReady}
                disabled={!isReadyEnabled}
                className={`w-full max-w-xs bg-[#00ff41] text-black font-black py-5 rounded-2xl shadow-lg uppercase tracking-widest active:scale-95 transition-all ${!isReadyEnabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                {isReadyEnabled ? "I'm Ready" : `Get Ready... ${countdown}`}
            </button>
        </div>
    );
}
