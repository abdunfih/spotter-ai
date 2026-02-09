export type ExercisePhase = 'WARM' | 'TRAIN' | 'COOL';
export type ExerciseLogic = 'jack' | 'squat-normal' | 'pushup' | 'hold' | 'crunch';
export type ViewType = 'home' | 'playlist' | 'workout';

export interface Exercise {
    id: string;
    seq: number;
    name: string;
    phase: ExercisePhase;
    logic: ExerciseLogic;
    targetReps: number;
    targetSets: number;
    goalLabel: string;
}

export interface Session {
    key: string;
    title: string;
    list: Exercise[];
}

// MediaPipe compatible landmark type
export interface PoseLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number | undefined;
}

export interface WorkoutState {
    view: ViewType;
    session: Session | null;
    step: number;
    reps: number;
    currentSet: number;
    isResting: boolean;
    timerSec: number;
    status: string;
}

export interface WorkoutContextType extends WorkoutState {
    setSession: (session: Session) => void;
    setView: (view: ViewType) => void;
    setStep: (step: number) => void;
    setReps: (reps: number | ((prev: number) => number)) => void;
    setCurrentSet: (set: number) => void;
    setIsResting: (resting: boolean) => void;
    setTimerSec: (sec: number) => void;
    setStatus: (status: string) => void;
    incrementRep: () => void;
    cycleToNextExercise: () => void;
    exitWorkout: () => void;
    resetWorkout: () => void;
}
