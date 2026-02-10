'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSessionByKey } from '@/lib/sessions';
import { useWorkout } from '@/context/WorkoutContext';
import { PoseLandmark } from '@/types';
import { detectSquatState, detectJackState, detectPushupState, getAngle, calculateShoulderWidth } from '@/lib/pose-utils';
import { speak, speakRepCount, speakCue, triggerConfetti, stopSpeaking } from '@/lib/feedback';
import { ExitButton } from '@/components/ui/ExitButton';
import { PreFlightGuide } from '@/components/workout/PreFlightGuide';
import { ActionPhase } from '@/components/workout/ActionPhase';
import { RestPhase } from '@/components/workout/RestPhase';
import { WorkoutControls } from '@/components/workout/WorkoutControls';

interface MediaPipePose {
    setOptions: (options: Record<string, unknown>) => void;
    onResults: (callback: (results: { poseLandmarks?: PoseLandmark[] }) => void) => void;
    send: (data: { image: HTMLVideoElement }) => Promise<void>;
    close: () => void;
}

declare global {
    interface Window {
        Pose?: new (options: { locateFile: (file: string) => string }) => MediaPipePose;
        Camera?: any;
    }
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
        preFlightPhase,
        startActionPhase,
        startRestPhase,
        cycleToNextExercise,
    } = useWorkout();

    const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
    const [localReps, setLocalReps] = useState(0);
    const [poseLoaded, setPoseLoaded] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState('READY');

    const prevSquatStateRef = useRef<'standing' | 'deep' | 'neutral'>('neutral');
    const repCountedRef = useRef(false);
    const aiState = useRef<{ stage: 'neutral' | 'peak'; lastTime: number; cooldown: boolean }>({ stage: 'neutral', lastTime: 0, cooldown: false });

    const videoRef = useRef<HTMLVideoElement>(null);
    const poseRef = useRef<MediaPipePose | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const landmarksRef = useRef<PoseLandmark[] | null>(null);
    const poseInitializedRef = useRef(false);
    const scriptsLoadedRef = useRef(false);

    useEffect(() => {
        const foundSession = getSessionByKey(sessionId);
        if (foundSession) {
            setSession(foundSession);
            setStep(exerciseIndex);
        } else {
            router.push('/');
        }
    }, [sessionId, exerciseIndex, router, setSession, setStep]);

    // Initialize MediaPipe Pose detection - check if already loaded in head
    useEffect(() => {
        console.log('[MediaPipe] Checking for window.Pose...');
        
        const checkPose = setInterval(() => {
            if (window.Pose) {
                console.log('[MediaPipe] window.Pose found!');
                clearInterval(checkPose);
                setPoseLoaded(true);
            }
        }, 100);

        return () => {
            clearInterval(checkPose);
        };
    }, []);

    const initPose = useCallback(() => {
        if (poseInitializedRef.current || !window.Pose) {
            console.log('[MediaPipe] Skipping init - already initialized or no Pose:', poseInitializedRef.current, !!window.Pose);
            return;
        }
        poseInitializedRef.current = true;

        console.log('[MediaPipe] Initializing Pose with CDN...');
        poseRef.current = new window.Pose({
            locateFile: (file) => {
                console.log('[MediaPipe] Loading asset:', file);
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            },
        });

        poseRef.current.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        poseRef.current.onResults((results) => {
            console.log('[MediaPipe] Got results, landmarks:', results.poseLandmarks?.length);
            const normalizedLandmarks = results.poseLandmarks || [];
            landmarksRef.current = normalizedLandmarks;
            setLandmarks(normalizedLandmarks);

            if (preFlightPhase !== 'ACTION') return;
            if (!session?.list[step]) return;

            const exercise = session.list[step];
            const now = Date.now();

            // Skip COOL phase exercises (holds)
            if (exercise.phase === 'COOL') return;

            // AI state with cooldown
            if (aiState.current.cooldown && now - aiState.current.lastTime < 1000) return;
            aiState.current.cooldown = false;

            if (exercise.logic === 'squat') {
                const squatState = detectSquatState(normalizedLandmarks);
                const currentState = squatState.isDeep ? 'deep' : squatState.isStanding ? 'standing' : 'neutral';

                if (!repCountedRef.current && prevSquatStateRef.current === 'standing' && currentState === 'deep') {
                    repCountedRef.current = true;
                    setFeedback('HOLD');
                    aiState.current.stage = 'peak';
                }

                if (repCountedRef.current && prevSquatStateRef.current === 'deep' && currentState === 'standing') {
                    const newReps = localReps + 1;
                    setLocalReps(newReps);
                    repCountedRef.current = false;
                    prevSquatStateRef.current = 'standing';
                    setFeedback('GOOD');
                    aiState.current.stage = 'neutral';
                    aiState.current.lastTime = now;
                    aiState.current.cooldown = true;
                    speakRepCount(newReps);

                    if (activeEx && newReps >= activeEx.targetReps) {
                        speak("Set finished");
                    }
                }

                if (currentState === 'neutral' && !repCountedRef.current) {
                    setFeedback('SQUAT');
                }
            } else if (exercise.logic === 'jack') {
                const shoulderWidth = calculateShoulderWidth(normalizedLandmarks);
                const jackState = detectJackState(normalizedLandmarks, shoulderWidth);

                const handsUp = normalizedLandmarks[15]?.y < normalizedLandmarks[0]?.y;

                if (!jackState.isPeak && !jackState.isNeutral) {
                    if (aiState.current.stage === 'peak') {
                        const newReps = localReps + 1;
                        setLocalReps(newReps);
                        aiState.current.lastTime = now;
                        aiState.current.cooldown = true;
                        speakRepCount(newReps);

                        if (activeEx && newReps >= activeEx.targetReps) {
                            speak("Set finished");
                        }
                    }
                    aiState.current.stage = 'neutral';
                    setFeedback('JUMP UP!');
                } else if (jackState.isPeak && aiState.current.stage === 'neutral') {
                    aiState.current.stage = 'peak';
                    setFeedback('RETURN');
                }
            } else if (exercise.logic === 'pushup') {
                const pushupState = detectPushupState(normalizedLandmarks);

                if (pushupState.isDown) {
                    aiState.current.stage = 'peak';
                    setFeedback('PUSH');
                }
                if (pushupState.isUp && aiState.current.stage === 'peak') {
                    const newReps = localReps + 1;
                    setLocalReps(newReps);
                    aiState.current.stage = 'neutral';
                    setFeedback('DOWN');
                    aiState.current.lastTime = now;
                    aiState.current.cooldown = true;
                    speakRepCount(newReps);

                    if (activeEx && newReps >= activeEx.targetReps) {
                        speak("Set finished");
                    }
                }
            } else if (exercise.logic === 'crunch') {
                // Crunch detection based on shoulder movement
                const shoulderY = normalizedLandmarks[11]?.y ?? 0;
                const hipY = normalizedLandmarks[23]?.y ?? 0;
                const isUp = shoulderY < hipY - 0.15;
                const isDown = shoulderY >= hipY - 0.1;

                if (isUp) {
                    aiState.current.stage = 'peak';
                    setFeedback('HOLD');
                }
                if (isDown && aiState.current.stage === 'peak') {
                    const newReps = localReps + 1;
                    setLocalReps(newReps);
                    aiState.current.stage = 'neutral';
                    setFeedback('UP');
                    aiState.current.lastTime = now;
                    aiState.current.cooldown = true;
                    speakRepCount(newReps);

                    if (activeEx && newReps >= activeEx.targetReps) {
                        speak("Set finished");
                    }
                }
            }
        });

        console.log('[MediaPipe] Pose initialized successfully');
    }, [session, step, preFlightPhase]);

    const startCamera = useCallback(async () => {
        console.log('[Camera] Attempting to start camera...');

        // Check prerequisites
        if (!window.Pose) {
            console.error('[Camera] window.Pose not available');
            setError('MediaPipe not loaded. Please refresh.');
            return;
        }

        // Try to get video element - it might not be rendered yet
        if (!videoRef.current) {
            console.log('[Camera] videoRef not ready, retrying in 100ms...');
            setTimeout(() => startCamera(), 100);
            return;
        }

        try {
            console.log('[Camera] Requesting camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });

            console.log('[Camera] Stream obtained, attaching to video...');
            streamRef.current = stream;
            videoRef.current.srcObject = stream;

            videoRef.current.onloadedmetadata = () => {
                console.log('[Camera] Metadata loaded, starting video...');
                videoRef.current?.play().then(() => {
                    console.log('[Camera] Video playing, initializing pose...');
                    initPose();
                    setCameraReady(true);
                }).catch(err => {
                    console.error('[Camera] Play error:', err);
                });
            };

            // Also handle play errors
            videoRef.current.onerror = (err) => {
                console.error('[Camera] Video element error:', err);
            };

        } catch (err) {
            console.error('[Camera] Failed to get camera:', err);
            setError('Camera access denied or not available');
        }
    }, [initPose]);

    const startFrameProcessing = useCallback(() => {
        console.log('[FrameProcessing] Starting frame processing...');
        const processFrame = async () => {
            if (videoRef.current && videoRef.current.readyState >= 2 && poseRef.current) {
                try {
                    await poseRef.current.send({ image: videoRef.current });
                } catch (err) {
                    console.error('[Frame] Error:', err);
                }
            }
            if (videoRef.current && videoRef.current.srcObject) {
                animationFrameRef.current = requestAnimationFrame(processFrame);
            }
        };
        processFrame();
    }, []);

    useEffect(() => {
        console.log('[Effect] preFlightPhase:', preFlightPhase, 'poseLoaded:', poseLoaded, 'cameraReady:', cameraReady);

        if (preFlightPhase === 'ACTION' && poseLoaded && !cameraReady) {
            console.log('[Effect] Calling startCamera()...');
            startCamera();
        }
        if (preFlightPhase === 'ACTION' && cameraReady) {
            console.log('[Effect] Camera ready, initializing pose and starting frame processing...');
            initPose();
            startFrameProcessing();
        }
    }, [preFlightPhase, poseLoaded, cameraReady, startCamera, initPose, startFrameProcessing]);

    useEffect(() => {
        if (preFlightPhase === 'DEMO') {
            setLocalReps(0);
            prevSquatStateRef.current = 'neutral';
            repCountedRef.current = false;
            aiState.current = { stage: 'neutral', lastTime: 0, cooldown: false };
            setFeedback('READY');
        }
    }, [step, preFlightPhase]);

    const handleDemoReady = useCallback(() => startActionPhase(), [startActionPhase]);
    const handleActionComplete = useCallback(() => startRestPhase(), [startRestPhase]);
    const handleExitAction = useCallback(() => { setLocalReps(0); repCountedRef.current = false; }, []);
    const handleRestComplete = useCallback(() => cycleToNextExercise(), [cycleToNextExercise]);
    const handleSkipRest = useCallback(() => cycleToNextExercise(), [cycleToNextExercise]);
    const handleReadyForNext = useCallback(() => cycleToNextExercise(), [cycleToNextExercise]);
    const handleSkip = useCallback(() => {
        if (preFlightPhase === 'DEMO') startActionPhase();
        else if (preFlightPhase === 'ACTION') { handleExitAction(); startRestPhase(); }
        else cycleToNextExercise();
    }, [preFlightPhase, startActionPhase, handleExitAction, startRestPhase, cycleToNextExercise]);

    const handleExit = useCallback(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        streamRef.current?.getTracks().forEach(track => track.stop());
        poseRef.current?.close();
        router.push('/');
    }, [router]);

    const activeEx = useMemo(() => session?.list[step], [session, step]);
    const isCooling = activeEx?.phase === 'COOL';

    const renderPhase = useCallback(() => {
        if (!activeEx) return null;

        // Determine feedback color based on stage and feedback status
        let feedbackColor = '#00ff41';
        if (aiState.current.stage === 'peak') {
            feedbackColor = '#00ff41';
        } else if (feedback.includes('LOWER') || feedback.includes('CHEST DOWN')) {
            feedbackColor = '#fbbf24';
        }

        switch (preFlightPhase) {
            case 'DEMO': return <PreFlightGuide exercise={activeEx} onReady={handleDemoReady} />;
            case 'ACTION': return <ActionPhase
                exercise={activeEx}
                reps={localReps}
                currentSet={currentSet}
                landmarks={landmarks}
                onCompleteSet={handleActionComplete}
                onExitAction={handleExitAction}
                stage={aiState.current.stage}
                feedbackColor={feedbackColor}
            />;
            case 'REST': return <RestPhase exercise={activeEx} currentSet={currentSet} totalSets={activeEx.targetSets} timerSec={15} onTimerComplete={handleRestComplete} onSkipRest={handleSkipRest} onReadyForNext={handleReadyForNext} isCooling={isCooling} />;
            default: return null;
        }
    }, [activeEx, preFlightPhase, localReps, currentSet, landmarks, feedback, handleDemoReady, handleActionComplete, handleExitAction, handleRestComplete, handleSkipRest, handleReadyForNext, isCooling]);

    if (!session || !activeEx) {
        return <div className="h-screen bg-black text-white flex items-center justify-center"><p>Loading...</p></div>;
    }

    return (
        <div className="h-screen w-full bg-black font-mono">
            {error && <div className="absolute top-20 left-0 right-0 bg-red-500/80 text-white p-4 text-center z-50">{error}</div>}

            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-50 bg-gradient-to-b from-black/90 to-transparent">
                <ExitButton onClick={handleExit} />
                <div className="text-right">
                    <p className="text-[#00ff41] text-[10px] font-bold uppercase tracking-widest">Ex {step + 1}/{session.list.length}</p>
                    <h2 className="text-white text-3xl font-black uppercase italic leading-none">{activeEx.name}</h2>
                </div>
            </div>

            {preFlightPhase !== 'DEMO' && (
                <div className="viewport-container relative w-full h-screen">
                    <video ref={videoRef} autoPlay playsInline muted className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1]" />
                    <div className="absolute top-20 left-4 bg-black/70 text-green-400 text-xs font-mono p-2 z-50">
                        <div>Camera: {cameraReady ? 'ready' : 'starting'}</div>
                        <div>Pose: {poseLoaded ? 'loaded' : 'loading'}</div>
                        <div>Landmarks: {landmarks?.length || 0}</div>
                    </div>
                </div>
            )}

            {preFlightPhase === 'DEMO' && <div className="viewport-container relative bg-black" />}

            {renderPhase()}

            {preFlightPhase === 'ACTION' && (
                <WorkoutControls session={session} currentStep={step} status={preFlightPhase} onSkip={handleSkip} />
            )}
        </div>
    );
}
