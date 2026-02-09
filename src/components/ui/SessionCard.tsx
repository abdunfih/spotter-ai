'use client';

import { Session } from '@/types';
import { useRouter } from 'next/navigation';

interface SessionCardProps {
    session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/playlist/${session.key}`);
    };

    return (
        <button
            onClick={handleClick}
            className="w-full glass p-8 rounded-[2.5rem] flex justify-between items-center cursor-pointer hover:border-[#00ff41] active:scale-95 transition-all group text-left"
        >
            <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">
                {session.title}
            </h3>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#00ff41] group-hover:text-black transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </div>
        </button>
    );
}
