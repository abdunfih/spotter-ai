'use client';

import { Exercise } from '@/types';

interface StepPillProps {
    exercise: Exercise;
    isActive: boolean;
}

export function StepPill({ exercise, isActive }: StepPillProps) {
    return (
        <div className={`min-w-[140px] h-16 rounded-2xl flex flex-col justify-center px-5 transition-all border border-white/5 ${isActive ? 'active-pill' : 'bg-white/5 opacity-30'
            }`}>
            <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">
                Step {exercise.seq}
            </span>
            <span className="text-[10px] font-black uppercase truncate">
                {exercise.name}
            </span>
        </div>
    );
}
