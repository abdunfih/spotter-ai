import { PoseLandmark, Exercise } from '@/types';
import {
    getAngle,
    calculateShoulderWidth,
    detectJackState,
    detectSquatState,
    detectPushupState,
    isLandmarksValid,
} from './pose-utils';

export interface BiometricsResult {
    shouldIncrementRep: boolean;
    status: string;
    stage: 'neutral' | 'peak';
}

export interface AIState {
    stage: 'neutral' | 'peak';
    lastTime: number;
    cooldown: boolean;
}

export class BiometricsEngine {
    private state: AIState;
    private readonly COOLDOWN_MS = 800;

    constructor() {
        this.state = { stage: 'neutral', lastTime: 0, cooldown: false };
    }

    reset(): void {
        this.state = { stage: 'neutral', lastTime: 0, cooldown: false };
    }

    processExercise(
        landmarks: PoseLandmark[],
        exercise: Exercise
    ): BiometricsResult {
        const now = Date.now();

        // Safety check - ensure landmarks are valid
        if (!isLandmarksValid(landmarks)) {
            return { shouldIncrementRep: false, status: 'ALIGNING...', stage: this.state.stage };
        }

        if (this.state.cooldown && now - this.state.lastTime < this.COOLDOWN_MS) {
            return { shouldIncrementRep: false, status: '', stage: this.state.stage };
        }
        this.state.cooldown = false;

        switch (exercise.logic) {
            case 'jack':
                return this.processJack(landmarks, exercise, now);
            case 'squat-normal':
                return this.processSquat(landmarks, exercise, now);
            case 'pushup':
                return this.processPushup(landmarks, exercise, now);
            case 'hold':
                return this.processHold(landmarks, exercise);
            case 'crunch':
                return this.processCrunch(landmarks, exercise, now);
            default:
                return { shouldIncrementRep: false, status: 'UNKNOWN EXERCISE', stage: this.state.stage };
        }
    }

    private processJack(landmarks: PoseLandmark[], exercise: Exercise, now: number): BiometricsResult {
        const shoulderWidth = calculateShoulderWidth(landmarks);
        if (shoulderWidth < 0.05) {
            return { shouldIncrementRep: false, status: 'STEP BACK', stage: this.state.stage };
        }

        const { isNeutral, isPeak } = detectJackState(landmarks, shoulderWidth);

        if (isNeutral) {
            if (this.state.stage === 'peak') {
                this.state.lastTime = now;
                this.state.cooldown = true;
                return { shouldIncrementRep: true, status: 'GOOD! RETURN', stage: 'neutral' };
            }
            this.state.stage = 'neutral';
            return { shouldIncrementRep: false, status: 'JUMP WIDER!', stage: 'neutral' };
        } else if (isPeak) {
            this.state.stage = 'peak';
            return { shouldIncrementRep: false, status: 'RETURN', stage: 'peak' };
        } else {
            if (this.state.stage === 'neutral') {
                return { shouldIncrementRep: false, status: 'ARMS HIGHER!', stage: 'neutral' };
            }
            return { shouldIncrementRep: false, status: '', stage: this.state.stage };
        }
    }

    private processSquat(landmarks: PoseLandmark[], exercise: Exercise, now: number): BiometricsResult {
        const { isStanding, isDeep } = detectSquatState(landmarks);

        if (isStanding) {
            if (this.state.stage === 'peak') {
                this.state.lastTime = now;
                this.state.cooldown = true;
                return { shouldIncrementRep: true, status: 'GOOD!', stage: 'neutral' };
            }
            this.state.stage = 'neutral';
            return { shouldIncrementRep: false, status: 'LOWER HIPS', stage: 'neutral' };
        } else if (isDeep && this.state.stage === 'neutral') {
            this.state.stage = 'peak';
            return { shouldIncrementRep: false, status: 'UP!', stage: 'peak' };
        } else {
            return { shouldIncrementRep: false, status: '', stage: this.state.stage };
        }
    }

    private processPushup(landmarks: PoseLandmark[], exercise: Exercise, now: number): BiometricsResult {
        const { isUp, isDown } = detectPushupState(landmarks);

        if (isUp) {
            if (this.state.stage === 'peak') {
                this.state.lastTime = now;
                this.state.cooldown = true;
                return { shouldIncrementRep: true, status: 'GOOD!', stage: 'neutral' };
            }
            this.state.stage = 'neutral';
            return { shouldIncrementRep: false, status: 'CHEST DOWN', stage: 'neutral' };
        } else if (isDown && this.state.stage === 'neutral') {
            this.state.stage = 'peak';
            return { shouldIncrementRep: false, status: 'PUSH UP!', stage: 'peak' };
        } else {
            return { shouldIncrementRep: false, status: '', stage: this.state.stage };
        }
    }

    private processHold(landmarks: PoseLandmark[], exercise: Exercise): BiometricsResult {
        return { shouldIncrementRep: false, status: 'HOLD', stage: this.state.stage };
    }

    private processCrunch(landmarks: PoseLandmark[], exercise: Exercise, now: number): BiometricsResult {
        if (!landmarks || landmarks.length < 26) {
            return { shouldIncrementRep: false, status: '', stage: this.state.stage };
        }

        const hip = landmarks[23];
        const knee = landmarks[25];
        if (!hip || !knee) {
            return { shouldIncrementRep: false, status: '', stage: this.state.stage };
        }

        // Use shoulder (11) and hips for crunch detection
        const shoulder = landmarks[11];
        const angle = getAngle(shoulder, hip, knee);

        if (angle > 160) {
            if (this.state.stage === 'peak') {
                this.state.lastTime = now;
                this.state.cooldown = true;
                return { shouldIncrementRep: true, status: 'GOOD!', stage: 'neutral' };
            }
            this.state.stage = 'neutral';
            return { shouldIncrementRep: false, status: 'CRUNCH UP', stage: 'neutral' };
        } else if (angle < 100 && this.state.stage === 'neutral') {
            this.state.stage = 'peak';
            return { shouldIncrementRep: false, status: 'DOWN!', stage: 'peak' };
        } else {
            return { shouldIncrementRep: false, status: '', stage: this.state.stage };
        }
    }
}

export function drawPoseLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: PoseLandmark[],
    width: number,
    height: number,
    color: string = '#00ff41'
): void {
    if (!landmarks) return;

    landmarks.forEach(p => {
        if ((p.visibility ?? 1) > 0.5) {
            ctx.beginPath();
            ctx.arc(p.x * width, p.y * height, 5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
        }
    });
}
