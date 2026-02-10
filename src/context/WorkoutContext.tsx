'use client';

import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import { WorkoutContextType, Session, ViewType, PreFlightPhase } from '@/types';
import { speak, triggerConfetti } from '@/lib/feedback';

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
    const [view, setView] = useState<ViewType>('home');
    const [session, setSessionState] = useState<Session | null>(null);
    const [step, setStep] = useState(0);
    const [reps, setReps] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [isResting, setIsResting] = useState(false);
    const [timerSec, setTimerSec] = useState(15);
    const [status, setStatus] = useState('ALIGNING...');
    const [stage, setStage] = useState<'neutral' | 'peak'>('neutral');

    // Pre-Flight 3-Phase Loop state
    const [preFlightPhase, setPreFlightPhase] = useState<PreFlightPhase>('DEMO');
    const [isTrackingActive, setIsTrackingActive] = useState(false);

    // Use refs for callbacks that need to reference each other
    const cycleToNextExerciseRef = useRef<(() => void) | null>(null);
    const resetWorkoutRef = useRef<(() => void) | null>(null);

    const setSession = useCallback((newSession: Session) => {
        setSessionState(newSession);
        setStep(0);
        setReps(0);
        setCurrentSet(1);
        setIsResting(false);
        setStage('neutral');
        setPreFlightPhase('DEMO');
        setIsTrackingActive(false);
    }, []);

    const updateStage = useCallback((newStage: 'neutral' | 'peak') => {
        setStage(newStage);
    }, []);

    const incrementRep = useCallback(() => {
        setReps(prev => prev + 1);
    }, []);

    // Phase transition functions for the 3-Phase Loop
    const startDemoPhase = useCallback(() => {
        setPreFlightPhase('DEMO');
        setIsTrackingActive(false);
        setStatus('PREPARE...');
        setStage('neutral');
    }, []);

    const startActionPhase = useCallback(() => {
        setPreFlightPhase('ACTION');
        setIsTrackingActive(true);
        setStatus('TRACKING');
    }, []);

    const startRestPhase = useCallback(() => {
        setPreFlightPhase('REST');
        setIsTrackingActive(false);
        setStatus('REST');
        setIsResting(true);
    }, []);

    const exitWorkout = useCallback(() => {
        setView('home');
        setReps(0);
        setCurrentSet(1);
        setIsResting(false);
        setTimerSec(15);
        setStage('neutral');
        setPreFlightPhase('DEMO');
        setIsTrackingActive(false);
    }, []);

    const resetWorkout = useCallback(() => {
        setView('home');
        setSessionState(null);
        setStep(0);
        setReps(0);
        setCurrentSet(1);
        setIsResting(false);
        setTimerSec(15);
        setStatus('ALIGNING...');
        setStage('neutral');
        setPreFlightPhase('DEMO');
        setIsTrackingActive(false);
    }, []);

    // Set up refs after functions are defined
    cycleToNextExerciseRef.current = useCallback(() => {
        if (!session) return;

        const activeEx = session.list[step];
        if (currentSet < activeEx.targetSets) {
            // Next set - go back to DEMO phase
            setCurrentSet(prev => prev + 1);
            setReps(0);
            setIsResting(false);
            setPreFlightPhase('DEMO');
            setIsTrackingActive(false);
        } else {
            const nextStep = step + 1;
            if (nextStep < session.list.length) {
                // Next exercise - go back to DEMO phase
                setStep(nextStep);
                setReps(0);
                setCurrentSet(1);
                setIsResting(false);
                setPreFlightPhase('DEMO');
                setIsTrackingActive(false);
            } else {
                // Session complete - trigger confetti and voice
                triggerConfetti();
                speak("Session Complete");
                resetWorkout();
            }
        }
    }, [session, step, currentSet, resetWorkout]);

    // Update the ref for cycleToNextExercise
    const cycleToNextExercise = useCallback(() => {
        if (cycleToNextExerciseRef.current) {
            cycleToNextExerciseRef.current();
        }
    }, []);

    const value: WorkoutContextType = {
        view,
        session,
        step,
        reps,
        currentSet,
        isResting,
        timerSec,
        status,
        stage,
        preFlightPhase,
        isTrackingActive,
        setSession,
        setView,
        setStep,
        setReps,
        setCurrentSet,
        setIsResting,
        setTimerSec,
        setStatus,
        setStage: updateStage,
        setPreFlightPhase,
        setIsTrackingActive,
        incrementRep,
        cycleToNextExercise,
        startDemoPhase,
        startActionPhase,
        startRestPhase,
        exitWorkout,
        resetWorkout,
    };

    return (
        <WorkoutContext.Provider value={value}>
            {children}
        </WorkoutContext.Provider>
    );
}

export function useWorkout() {
    const context = useContext(WorkoutContext);
    if (context === undefined) {
        throw new Error('useWorkout must be used within a WorkoutProvider');
    }
    return context;
}
