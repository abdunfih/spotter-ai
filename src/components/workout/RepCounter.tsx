'use client';

import { Exercise } from '@/types';

interface RepCounterProps {
    reps: number;
    currentSet: number;
    exercise: Exercise;
}

export function RepCounter({ reps, currentSet, exercise }: RepCounterProps) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-20">
            <p className="text-white/40 uppercase mb-4 tracking-widest font-black text-[10px]">
                Round {currentSet} of {exercise.targetSets}
            </p>
            <div className="massive-counter">{reps}</div>
            <div className="goal-indicator mt-4 text-white">
                Goal: {exercise.goalLabel}
            </div>
        </div>
    );
}
