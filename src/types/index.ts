export type ExercisePhase = 'WARM' | 'TRAIN' | 'COOL';
export type PreFlightPhase = 'DEMO' | 'ACTION' | 'REST';
export type ExerciseLogic = 'jack' | 'squat' | 'pushup' | 'hold' | 'crunch';
export type ViewType = 'home' | 'playlist' | 'workout';

// Form tip for exercise demo
export interface FormTip {
    icon: string;
    text: string;
}

// Exercise demo content
export interface ExerciseDemo {
    videoUrl?: string;
    gifUrl?: string;
    thumbnailUrl?: string;
    formTips: FormTip[];
    preparationSeconds?: number;
}

export interface Exercise {
    id: string;
    seq: number;
    name: string;
    phase: ExercisePhase;
    logic: ExerciseLogic;
    targetReps: number;
    targetSets: number;
    goalLabel: string;
    gif?: string;
    tips?: string[];
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
    stage: 'neutral' | 'peak';
    preFlightPhase: PreFlightPhase;
    isTrackingActive: boolean;
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
    setStage: (stage: 'neutral' | 'peak') => void;
    setPreFlightPhase: (phase: PreFlightPhase) => void;
    setIsTrackingActive: (active: boolean) => void;
    incrementRep: () => void;
    cycleToNextExercise: () => void;
    startDemoPhase: () => void;
    startActionPhase: () => void;
    startRestPhase: () => void;
    exitWorkout: () => void;
    resetWorkout: () => void;
}
