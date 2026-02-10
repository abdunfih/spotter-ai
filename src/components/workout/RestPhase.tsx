'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Exercise } from '@/types';

interface RestPhaseProps {
    exercise: Exercise;
    currentSet: number;
    totalSets: number;
    timerSec: number;
    onTimerComplete: () => void;
    onSkipRest: () => void;
    onReadyForNext: () => void;
    isCooling?: boolean;
}

export function RestPhase({
    exercise,
    currentSet,
    totalSets,
    timerSec,
    onTimerComplete,
    onSkipRest,
    onReadyForNext,
    isCooling = false,
}: RestPhaseProps) {
    const [isPaused, setIsPaused] = useState(false);
    const [localTimer, setLocalTimer] = useState(timerSec);
    const [showReadyButton, setShowReadyButton] = useState(false);

    // Sync with prop
    useEffect(() => {
        setLocalTimer(timerSec);
    }, [timerSec]);

    // Timer countdown
    useEffect(() => {
        if (isPaused || localTimer <= 0) return;

        const interval = setInterval(() => {
            setLocalTimer((prev) => {
                if (prev <= 1) {
                    onTimerComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused, localTimer, onTimerComplete]);

    // Show ready button when timer is low
    useEffect(() => {
        if (localTimer <= 3 && localTimer > 0) {
            setShowReadyButton(true);
        }
    }, [localTimer]);

    // Handle manual ready
    const handleReady = useCallback(() => {
        onReadyForNext();
    }, [onReadyForNext]);

    // Handle skip rest
    const handleSkip = useCallback(() => {
        onSkipRest();
    }, [onSkipRest]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleReady();
            }
            if (e.key === 'Escape') {
                handleSkip();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleReady, handleSkip]);

    const phaseColor = isCooling ? '#00d1ff' : '#00ff41';
    const phaseLabel = isCooling ? 'RECOVERY' : 'REST';

    return (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 animate-fade-in">
            {/* Phase Indicator */}
            <div className="absolute top-24 left-0 right-0 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/50 rounded-full border border-white/20">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: phaseColor }}
                    />
                    <span
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: phaseColor }}
                    >
                        PHASE 3 — {phaseLabel}
                    </span>
                </div>
            </div>

            {/* Timer Display */}
            <div className="mb-8">
                <div
                    className="massive-counter !text-white transition-all duration-300"
                    style={{
                        textShadow: `0 0 50px ${phaseColor}50`,
                        color: phaseColor,
                    }}
                >
                    {localTimer}
                </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex gap-3 mb-8">
                {[1, 2, 3].map((phase) => (
                    <div
                        key={phase}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${phase === 3
                                ? `w-8 bg-[${phaseColor}]`
                                : 'bg-white/20'
                            }`}
                        style={{ backgroundColor: phase === 3 ? phaseColor : undefined }}
                    />
                ))}
            </div>

            {/* Set Progress */}
            {!isCooling && (
                <div className="mb-8 text-center">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">
                        Set Progress
                    </p>
                    <p className="text-white text-lg font-bold italic">
                        {currentSet} / {totalSets}
                    </p>
                    <div className="flex justify-center gap-2 mt-3">
                        {Array.from({ length: totalSets }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${i < currentSet ? 'bg-[#00ff41]' : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Breathing hint */}
            <div className="mb-8 text-center">
                <p className="text-white/30 text-xs font-mono uppercase tracking-wide animate-pulse">
                    {isCooling ? 'Deep breaths...' : 'Stay hydrated...'}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                {showReadyButton && (
                    <button
                        onClick={handleReady}
                        className="px-8 py-4 bg-white text-black rounded-full font-black italic text-sm uppercase tracking-widest hover:bg-white/90 hover:scale-105 transition-all animate-fade-in"
                    >
                        I am Ready
                    </button>
                )}

                <button
                    onClick={handleSkip}
                    className="px-6 py-4 bg-white/5 text-white/60 rounded-full font-bold text-xs uppercase tracking-widest border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                >
                    Skip Rest
                </button>
            </div>

            {/* Upcoming Exercise Preview */}
            {!isCooling && (
                <div className="absolute bottom-32 left-0 right-0 text-center">
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">
                        Up Next
                    </p>
                    <p className="text-white text-lg font-bold italic uppercase">
                        {exercise.name}
                    </p>
                </div>
            )}

            {/* Exit option */}
            <button
                onClick={handleSkip}
                className="absolute bottom-6 right-6 text-white/30 hover:text-white/60 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
                End Session
            </button>

            {/* Timer pause indicator */}
            <button
                onClick={() => setIsPaused(!isPaused)}
                className="absolute bottom-6 left-6 text-white/30 hover:text-white/60 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
                {isPaused ? 'RESUME' : 'PAUSE'}
            </button>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
