'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSessionByKey } from '@/lib/sessions';
import { ExerciseListItem } from '@/components/ui/ExerciseListItem';
import { BackButton } from '@/components/ui/BackButton';
import { useWorkout } from '@/context/WorkoutContext';

export default function PlaylistPage() {
    const router = useRouter();
    const params = useParams();
    const sessionId = params.sessionId as string;
    const { session, setSession, setView } = useWorkout();

    useEffect(() => {
        const foundSession = getSessionByKey(sessionId);
        if (foundSession) {
            setSession(foundSession);
        } else {
            router.push('/');
        }
    }, [sessionId, router, setSession]);

    if (!session) {
        return (
            <div className="app-container p-6 bg-black text-white">
                <p className="text-center mt-20">Loading...</p>
            </div>
        );
    }

    const handleStart = () => {
        setView('workout');
        router.push(`/workout/${session.key}/${session.list[0].id.split('-')[1]}`);
    };

    return (
        <div className="app-container p-6 bg-black text-white">
            <div className="flex items-center gap-4 mb-8 mt-4">
                <BackButton onClick={() => router.push('/')} />
                <h2 className="text-3xl font-black uppercase italic">{session.title}</h2>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-32">
                {session.list.map((exercise) => (
                    <ExerciseListItem key={exercise.id} exercise={exercise} />
                ))}
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent flex justify-center">
                <button
                    onClick={handleStart}
                    className="w-full max-w-xl bg-[#00ff41] text-black font-black py-5 rounded-2xl shadow-2xl uppercase tracking-widest active:scale-95 transition-all"
                >
                    Start Workout
                </button>
            </div>
        </div>
    );
}
