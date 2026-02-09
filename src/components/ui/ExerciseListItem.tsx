'use client';

import { Exercise } from '@/types';

interface ExerciseListItemProps {
    exercise: Exercise;
}

export function ExerciseListItem({ exercise }: ExerciseListItemProps) {
    return (
        <div className="glass p-6 rounded-3xl flex items-center gap-6">
            <div className="text-2xl font-black italic text-white/10 w-8">
                {exercise.seq}
            </div>
            <div className="flex-1">
                <p className={`text-[9px] font-black uppercase mb-1 tracking-widest ${exercise.phase === 'TRAIN' ? 'text-[#00ff41]' : 'text-white/40'
                    }`}>
                    {exercise.phase}
                </p>
                <h4 className="text-xl font-black uppercase italic text-white">
                    {exercise.name}
                </h4>
                <p className="text-[10px] text-white/30 font-mono italic">
                    {exercise.goalLabel}
                </p>
            </div>
        </div>
    );
}
