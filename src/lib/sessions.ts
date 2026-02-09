import { Session, Exercise } from '@/types';

const createSession = (key: string, title: string, exercises: Omit<Exercise, 'id' | 'seq' | 'targetReps' | 'targetSets' | 'goalLabel'>[]): Session => ({
    key,
    title,
    list: exercises.map((ex, i) => {
        let targetReps = 12, targetSets = 3, goalLabel = "30 REPS";
        if (ex.phase === 'WARM') { targetReps = 30; targetSets = 1; goalLabel = "30 REPS"; }
        if (ex.phase === 'COOL') { targetReps = 0; targetSets = 1; goalLabel = "30S HOLD"; }
        return {
            ...ex,
            seq: i + 1,
            id: `${key}-${i}`,
            targetReps,
            targetSets,
            goalLabel
        };
    })
});

export const SESSIONS: Record<string, Session> = {
    lower: createSession('lower', 'Lower Body', [
        { phase: 'WARM', name: 'Jumping Jacks', logic: 'jack' },
        { phase: 'TRAIN', name: 'Normal Squats', logic: 'squat-normal' },
        { phase: 'TRAIN', name: 'Depth Lunges', logic: 'squat-normal' },
        { phase: 'COOL', name: 'Quad Recovery', logic: 'hold' }
    ]),
    upper: createSession('upper', 'Upper Body', [
        { phase: 'WARM', name: 'Jumping Jacks', logic: 'jack' },
        { phase: 'TRAIN', name: 'Push-ups', logic: 'pushup' },
        { phase: 'TRAIN', name: 'Pike Focus', logic: 'pushup' },
        { phase: 'COOL', name: 'Arm Stretch', logic: 'hold' }
    ]),
    core: createSession('core', 'Core Section', [
        { phase: 'WARM', name: 'Jumping Jacks', logic: 'jack' },
        { phase: 'TRAIN', name: 'Ab Crunches', logic: 'crunch' },
        { phase: 'TRAIN', name: 'Leg Raises', logic: 'jack' },
        { phase: 'COOL', name: 'Cobra Hold', logic: 'hold' }
    ]),
    cardio: createSession('cardio', 'Cardio Burn', [
        { phase: 'WARM', name: 'Jumping Jacks', logic: 'jack' },
        { phase: 'TRAIN', name: 'Burpees', logic: 'jack' },
        { phase: 'TRAIN', name: 'Mountain Climbers', logic: 'jack' },
        { phase: 'COOL', name: 'Deep Breaths', logic: 'hold' }
    ])
};

export const getSessionByKey = (key: string): Session | undefined => SESSIONS[key];
export const getAllSessions = (): Session[] => Object.values(SESSIONS);
