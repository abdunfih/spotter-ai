import { PoseLandmark } from '@/types';

export function getAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    const angle = Math.abs((radians * 180.0) / Math.PI);
    return angle > 180 ? 360 - angle : angle;
}

export function calculateShoulderWidth(landmarks: PoseLandmark[]): number {
    if (!landmarks || landmarks.length < 13) return 0;
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    if (!leftShoulder || !rightShoulder) return 0;
    return Math.abs(leftShoulder.x - rightShoulder.x);
}

export function calculateAnkleDistance(landmarks: PoseLandmark[]): number {
    if (!landmarks || landmarks.length < 29) return 0;
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    if (!leftAnkle || !rightAnkle) return 0;
    return Math.abs(leftAnkle.x - rightAnkle.x);
}

export function getHandsAverageY(landmarks: PoseLandmark[]): number {
    if (!landmarks || landmarks.length < 17) return 0;
    const leftHand = landmarks[15];
    const rightHand = landmarks[16];
    if (!leftHand || !rightHand) return 0;
    return (leftHand.y + rightHand.y) / 2;
}

export function getNoseY(landmarks: PoseLandmark[]): number {
    if (!landmarks || landmarks.length < 1) return 0;
    const nose = landmarks[0];
    return nose?.y ?? 0;
}

export function getShoulderY(landmarks: PoseLandmark[]): number {
    if (!landmarks || landmarks.length < 12) return 0;
    const shoulder = landmarks[11];
    return shoulder?.y ?? 0;
}

export function isVisible(landmark: PoseLandmark): boolean {
    return (landmark.visibility ?? 1) > 0.5;
}

export function isLandmarksValid(landmarks: PoseLandmark[] | null | undefined): boolean {
    return !!landmarks && landmarks.length >= 33;
}

export interface JackState {
    isNeutral: boolean;
    isPeak: boolean;
}

export function detectJackState(landmarks: PoseLandmark[], shoulderWidth: number): JackState {
    const ankleDist = calculateAnkleDistance(landmarks);
    const handsY = getHandsAverageY(landmarks);
    const noseY = getNoseY(landmarks);
    const shoulderY = getShoulderY(landmarks);

    // Architecture v37: Feet must be wider than 1.4x Shoulder Width for peak
    // Arms: Wrists (Y) higher than Nose (Y) for peak
    const isNeutral = ankleDist < shoulderWidth * 1.4 && handsY > shoulderY;
    const isPeak = ankleDist > shoulderWidth * 1.4 && handsY < noseY;

    return { isNeutral, isPeak };
}

export interface SquatState {
    isStanding: boolean;
    isDeep: boolean;
    angle: number;
}

// Squat thresholds: Down Trigger: Angle < 135°, Up Trigger: Angle > 165°
const SQUAT_DEEP_THRESHOLD = 135;
const SQUAT_STANDING_THRESHOLD = 165;

export function detectSquatState(landmarks: PoseLandmark[]): SquatState {
    if (!landmarks || landmarks.length < 29) {
        return { isStanding: false, isDeep: false, angle: 0 };
    }
    const hip = landmarks[24];
    const knee = landmarks[26];
    const ankle = landmarks[28];
    if (!hip || !knee || !ankle) {
        return { isStanding: false, isDeep: false, angle: 0 };
    }
    const angle = getAngle(hip, knee, ankle);

    return {
        isStanding: angle > SQUAT_STANDING_THRESHOLD,
        isDeep: angle < SQUAT_DEEP_THRESHOLD,
        angle
    };
}

// Export thresholds for external use
export const SQUAT_THRESHOLDS = {
    deep: SQUAT_DEEP_THRESHOLD,
    standing: SQUAT_STANDING_THRESHOLD
};

export interface PushupState {
    isUp: boolean;
    isDown: boolean;
    angle: number;
}

export function detectPushupState(landmarks: PoseLandmark[]): PushupState {
    if (!landmarks || landmarks.length < 16) {
        return { isUp: false, isDown: false, angle: 0 };
    }
    const shoulder = landmarks[11];
    const elbow = landmarks[13];
    const wrist = landmarks[15];
    if (!shoulder || !elbow || !wrist) {
        return { isUp: false, isDown: false, angle: 0 };
    }
    const angle = getAngle(shoulder, elbow, wrist);
    // Architecture v37: Down Trigger: Angle < 100°, Up Trigger: Angle > 150°
    return {
        isUp: angle > 150,
        isDown: angle < 100,
        angle
    };
}
