'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Exercise, PoseLandmark } from '@/types';
import { PoseCanvas } from './PoseCanvas';
import { RepCounter } from './RepCounter';

interface ActionPhaseProps {
    exercise: Exercise;
    reps: number;
    currentSet: number;
    landmarks: PoseLandmark[] | null;
    onCompleteSet: () => void;
    onExitAction: () => void;
    stage?: 'neutral' | 'peak';
    feedbackColor?: string;
}

export function ActionPhase({
    exercise,
    reps,
    currentSet,
    landmarks,
    onCompleteSet,
    onExitAction,
    stage = 'neutral',
    feedbackColor = '#00ff41',
}: ActionPhaseProps): React.ReactElement {
    const [showTransition, setShowTransition] = useState(false);
    const [transitionText, setTransitionText] = useState('');
    const targetReps = exercise.targetReps;

    // Check if set is complete
    useEffect(() => {
        if (reps >= targetReps && targetReps > 0) {
            const text = `Set ${currentSet} Complete!`;
            setTransitionText(text);
            setShowTransition(true);

            // Auto-transition to rest after showing completion
            const timer = setTimeout(() => {
                onCompleteSet();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [reps, targetReps, currentSet, onCompleteSet]);

    // Handle manual exit from action phase
    const handleExit = useCallback(() => {
        onExitAction();
    }, [onExitAction]);

    // Keyboard shortcut - press Escape to exit action phase
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleExit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleExit]);

    // Memoize progress percentage
    const progressPercent = useMemo(() => {
        if (targetReps <= 0) return 0;
        return Math.round((reps / targetReps) * 100);
    }, [reps, targetReps]);

    return (
        <div className="absolute inset-0 z-30">
            {/* Phase Indicator - Subtle */}
            <div className="absolute top-24 left-0 right-0 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/50 rounded-full border border-[#00ff41]/30">
                    <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
                    <span className="text-[#00ff41] text-xs font-bold uppercase tracking-widest">
                        PHASE 2 — ACTION
                    </span>
                </div>
            </div>

            {/* Rep Counter Overlay */}
            <RepCounter
                reps={reps}
                currentSet={currentSet}
                exercise={exercise}
                status={stage === 'peak' ? 'HOLD' : ''}
                feedbackColor={feedbackColor}
            />

            {/* Progress bar for current set */}
            {targetReps > 0 && (
                <div className="absolute top-32 left-6 right-6 z-40">
                    <div className="flex justify-between text-[10px] font-mono text-white/40 mb-2">
                        <span>PROGRESS</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00ff41] transition-all duration-300"
                            style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Pose Canvas (AI skeleton visualization) - z-25 to sit between video and UI */}
            <div className="absolute inset-0 z-25">
                <PoseCanvas
                    landmarks={landmarks}
                    dotColor={stage === 'peak' ? '#00ff41' : '#00ffff'}
                    lineColor={stage === 'peak' ? '#00ff41' : '#ff6600'}
                    mirrored={true}
                />
            </div>

            {/* Transition overlay when set is complete */}
            {showTransition && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center animate-fade-in">
                    <div className="w-24 h-24 bg-[#00ff41]/20 rounded-full flex items-center justify-center mb-6 animate-scale-in">
                        <svg className="w-12 h-12 text-[#00ff41]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-[#00ff41] text-3xl font-black italic uppercase">
                        {transitionText}
                    </p>
                    <p className="text-white/40 text-sm font-mono mt-4">
                        Transitioning to rest...
                    </p>
                </div>
            )}

            {/* Exit Action button - subtle but accessible */}
            <button
                onClick={handleExit}
                className="absolute top-6 right-6 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all z-50"
            >
                <span className="text-white/60 text-xs font-bold uppercase tracking-wider">
                    Exit (ESC)
                </span>
            </button>

            {/* AI Status indicator */}
            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 bg-[#00ff41]/10 rounded-full border border-[#00ff41]/20">
                <div className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
                <span className="text-[#00ff41] text-[10px] font-bold uppercase tracking-wider">
                    AI Active
                </span>
            </div>

            {/* Minimal HUD */}
            <div className="absolute bottom-32 left-6 right-6 flex justify-between items-end">
                <div className="flex flex-col">
                    <span className="text-white/30 text-[8px] font-bold uppercase tracking-widest">
                        Current Exercise
                    </span>
                    <span className="text-white text-sm font-bold italic uppercase">
                        {exercise.name}
                    </span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-white/30 text-[8px] font-bold uppercase tracking-widest">
                        Target
                    </span>
                    <span className="text-white/60 text-sm font-mono">
                        {targetReps > 0 ? `${reps} / ${targetReps} reps` : 'Hold'}
                    </span>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
