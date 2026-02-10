import { Session, Exercise } from '@/types';

// GIF URLs from the HTML
export const GIFS: Record<string, string> = {
    jack: "https://media.giphy.com/media/l3vRhTG2a3aM3Y7a8/giphy.gif",
    squat: "https://media.giphy.com/media/1i8s01c8gQe0/giphy.gif",
    pushup: "https://media.giphy.com/media/3o6Zt9y2JCjs45r2Mw/giphy.gif",
    crunch: "https://media.giphy.com/media/3o7TKR1b2XyMy98f3a/giphy.gif",
    hold: "https://media.giphy.com/media/xT5LMz1W4o355S/giphy.gif"
};

// Instructions from the HTML
export const INSTRUCTIONS: Record<string, string[]> = {
    jack: ["Hands touch above head", "Jump feet wide apart", "Maintain steady rhythm"],
    squat: ["Heels flat on floor", "Hips below knee level", "Back straight"],
    pushup: ["Chest touches floor", "Elbows 45 degrees", "Full extension up"],
    crunch: ["Lift shoulders only", "Keep chin off chest", "Squeeze core at top"],
    hold: ["Breathe deeply", "Hold static position", "Relax into the stretch"]
};

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
            goalLabel,
            gif: GIFS[ex.logic] || GIFS.jack,
            tips: INSTRUCTIONS[ex.logic] || INSTRUCTIONS.jack
        };
    })
});

export const SESSIONS: Record<string, Session> = {
    lower: createSession('lower', 'Lower Body', [
        { phase: 'WARM', name: 'Jumping Jacks', logic: 'jack' },
        { phase: 'TRAIN', name: 'Strict Squats', logic: 'squat' },
        { phase: 'TRAIN', name: 'Depth Lunges', logic: 'squat' },
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
