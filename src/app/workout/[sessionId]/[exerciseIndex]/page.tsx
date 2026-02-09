'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSessionByKey } from '@/lib/sessions';
import { useWorkout } from '@/context/WorkoutContext';
import { PoseLandmark } from '@/types';
import { detectSquatState } from '@/lib/pose-utils';
import { RepCounter } from '@/components/workout/RepCounter';
import { RestOverlay } from '@/components/workout/RestOverlay';
import { WorkoutControls } from '@/components/workout/WorkoutControls';
import { ExitButton } from '@/components/ui/ExitButton';

interface MediaPipePose {
    setOptions: (options: Record<string, unknown>) => void;
    onResults: (callback: (results: { poseLandmarks?: PoseLandmark[] }) => void) => void;
    send: (data: { image: HTMLVideoElement }) => Promise<void>;
    close: () => void;
}

export default function WorkoutPage() {
    const router = useRouter();
    const params = useParams();
    const sessionId = params.sessionId as string;
    const exerciseIndex = parseInt(params.exerciseIndex as string);

    const {
        session,
        setSession,
        step,
        setStep,
        currentSet,
        setCurrentSet,
        isResting,
        setIsResting,
        cycleToNextExercise,
        exitWorkout,
    } = useWorkout();

    // Local state
    const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
    const [localStatus, setLocalStatus] = useState('ALIGNING...');
    const [localReps, setLocalReps] = useState(0);
    const [localTimer, setLocalTimer] = useState(30);
    const [poseLoaded, setPoseLoaded] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detectedCount, setDetectedCount] = useState(0);

    // Rep counting state
    const [prevSquatState, setPrevSquatState] = useState<'standing' | 'deep' | 'neutral'>('standing');
    const repCountedRef = useRef(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number | null>(null);
    const poseRef = useRef<MediaPipePose | null>(null);

    // Initialize session
    useEffect(() => {
        const foundSession = getSessionByKey(sessionId);
        if (foundSession) {
            setSession(foundSession);
            setStep(exerciseIndex);
        } else {
            router.push('/');
        }
    }, [sessionId, exerciseIndex, router, setSession, setStep]);

    // Reset rep counting state when exercise changes
    useEffect(() => {
        setLocalReps(0);
        setPrevSquatState('standing');
        repCountedRef.current = false;
    }, [step, session]);

    // Load MediaPipe
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if ((window as unknown as { Pose?: MediaPipePose }).Pose) {
            setPoseLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
        script.async = true;
        script.onload = () => setPoseLoaded(true);
        script.onerror = () => setError('Failed to load MediaPipe');
        document.body.appendChild(script);
    }, []);

    // Start camera
    useEffect(() => {
        if (!poseLoaded) return;

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720, facingMode: 'user' },
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setCameraReady(true);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Camera error');
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [poseLoaded]);

    // Setup MediaPipe pose detection
    useEffect(() => {
        if (!poseLoaded || !cameraReady || typeof window === 'undefined') return;

        const PoseClass = (window as unknown as { Pose: new (options: { locateFile: (file: string) => string }) => MediaPipePose }).Pose;
        if (!PoseClass) return;

        const pose = new PoseClass({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        pose.onResults((results: { poseLandmarks?: PoseLandmark[] }) => {
            const normalizedLandmarks = results.poseLandmarks || [];
            setLandmarks(normalizedLandmarks);
            setDetectedCount(normalizedLandmarks.length);

            if (!session?.list[step]) return;

            const exercise = session.list[step];

            if (exercise.phase === 'COOL' || isResting) {
                setLocalStatus(exercise.phase === 'COOL' ? 'RECOVERY' : 'REST');
                return;
            }

            if (normalizedLandmarks.length > 0) {
                setLocalStatus('TRACKING');

                // Rep counting logic for squats
                if (exercise.logic === 'squat-normal') {
                    const squatState = detectSquatState(normalizedLandmarks);

                    // Determine current state
                    const currentState = squatState.isDeep ? 'deep' : squatState.isStanding ? 'standing' : 'neutral';

                    // Rep counting: standing -> deep -> standing = 1 rep
                    if (!repCountedRef.current && prevSquatState === 'standing' && currentState === 'deep') {
                        repCountedRef.current = true;
                    }

                    if (repCountedRef.current && prevSquatState === 'deep' && currentState === 'standing') {
                        setLocalReps(prev => prev + 1);
                        repCountedRef.current = false;
                    }

                    setPrevSquatState(currentState);
                }
            }
        });

        poseRef.current = pose;

        // Process frames
        const processFrame = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
                animationRef.current = requestAnimationFrame(processFrame);
                return;
            }

            await pose.send({ image: videoRef.current });
            animationRef.current = requestAnimationFrame(processFrame);
        };

        animationRef.current = requestAnimationFrame(processFrame);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            pose.close();
        };
    }, [poseLoaded, cameraReady, session, step, isResting]);

    // Draw landmarks on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !landmarks || landmarks.length === 0) return;

        // Get actual dimensions
        const parent = canvas.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const isCooling = session?.list[step]?.phase === 'COOL';
        const color = isCooling ? '#00d1ff' : '#00ff41';

        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        landmarks.forEach((p) => {
            if ((p.visibility ?? 0) > 0.5) {
                const x = p.x * canvas.width;
                const y = p.y * canvas.height;

                ctx.beginPath();
                ctx.arc(x, y, 8, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }, [landmarks, session, step, isResting]);

    // Rest timer
    useEffect(() => {
        if (isResting || (session?.list[step]?.phase === 'COOL')) {
            setLocalTimer(30);
            const timer = setInterval(() => {
                setLocalTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        cycleToNextExercise();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isResting, step, session, cycleToNextExercise]);

    const handleSkip = useCallback(() => {
        cycleToNextExercise();
    }, [cycleToNextExercise]);

    const handleExit = useCallback(() => {
        // Stop animation loop immediately for responsive exit
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        // Stop camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Navigate immediately - useEffect cleanup will close pose
        router.push('/');
    }, [router]);

    if (!session) {
        return (
            <div className="app-container bg-black text-white">
                <p className="text-center mt-20">Loading...</p>
            </div>
        );
    }

    const activeEx = session.list[step];
    const isCooling = activeEx.phase === 'COOL';
    const displayTimer = isResting || isCooling ? localTimer : 30;

    return (
        <div className="app-container bg-black font-mono">
            {/* Error display */}
            {error && (
                <div className="absolute top-20 left-0 right-0 z-50 bg-red-500/80 text-white p-4 text-center">
                    {error}
                </div>
            )}

            {/* Top bar */}
            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-50 bg-gradient-to-b from-black/90 to-transparent">
                <ExitButton onClick={handleExit} />
                <div className="text-right">
                    <p className="text-[#00ff41] text-[10px] font-bold uppercase tracking-widest">
                        Ex {step + 1} / {session.list.length}
                    </p>
                    <h2 className="text-white text-3xl font-black uppercase italic leading-none">
                        {activeEx.name}
                    </h2>
                </div>
            </div>

            {/* Video viewport - z-index 5, canvas z-index 10 */}
            <div className="viewport-container relative">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1] z-5"
                />

                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none transform scale-x-[-1]"
                    style={{ width: '100%', height: '100%' }}
                />

                {(isResting || isCooling) ? (
                    <RestOverlay timerSec={displayTimer} isCooling={isCooling} />
                ) : (
                    <RepCounter reps={localReps} currentSet={currentSet} exercise={activeEx} />
                )}

                <div className="absolute inset-0 pointer-events-none opacity-5 cyber-grid z-1" />
            </div>

            {/* Bottom controls */}
            <WorkoutControls
                session={session}
                currentStep={step}
                status={localStatus}
                onSkip={handleSkip}
            />
        </div>
    );
}
