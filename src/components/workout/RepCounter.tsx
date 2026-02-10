'use client';

import { Exercise } from '@/types';

interface RepCounterProps {
    reps: number;
    currentSet: number;
    exercise: Exercise;
    status?: string;
    feedbackColor?: string;
}

export function RepCounter({ reps, currentSet, exercise, status = '', feedbackColor = '#00ff41' }: RepCounterProps) {
    const isPulse = status === 'GOOD' || status === 'GOOD! RETURN' || feedbackColor === '#00ff41';
    const isWarn = status === 'LOWER' || status === 'LOWER HIPS' || status === 'CHEST DOWN' || feedbackColor === '#fbbf24';

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-20">
            <p className="text-white/40 uppercase mb-4 tracking-widest font-black text-[10px]">
                Round {currentSet} of {exercise.targetSets}
            </p>
            <div className={`massive-counter ${isPulse ? 'pulse' : ''} ${isWarn ? 'warn' : ''}`} style={{ color: feedbackColor }}>
                {reps}
            </div>
            <div className="status-feedback mt-4" style={{ color: feedbackColor }}>
                {status}
            </div>
            <div className="goal-pill mt-4 text-white">
                Goal: {exercise.goalLabel}
            </div>
        </div>
    );
}
