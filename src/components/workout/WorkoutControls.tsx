'use client';

import { Session, Exercise } from '@/types';
import { StepPill } from '@/components/ui/StepPill';

interface WorkoutControlsProps {
    session: Session;
    currentStep: number;
    status: string;
    onSkip: () => void;
}

export function WorkoutControls({ session, currentStep, status, onSkip }: WorkoutControlsProps) {
    const activeEx = session.list[currentStep];
    const isCooling = activeEx.phase === 'COOL';

    return (
        <div className="bg-[#050505] p-6 border-t border-white/10 z-50">
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 mb-2">
                {session.list.map((item, i) => (
                    <StepPill
                        key={item.id}
                        exercise={item}
                        isActive={i === currentStep}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">
                        AI Status
                    </span>
                    <span className="text-xs font-bold italic text-white uppercase tracking-tighter">
                        {status}
                    </span>
                </div>
                <button
                    onClick={onSkip}
                    className="bg-white text-black px-12 py-4 rounded-full font-black italic text-[11px] shadow-2xl active:scale-95 transition-transform uppercase tracking-widest"
                >
                    Skip
                </button>
            </div>
        </div>
    );
}
