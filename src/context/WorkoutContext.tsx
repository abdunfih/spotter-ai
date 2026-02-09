'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { WorkoutContextType, Session, ViewType, Exercise } from '@/types';

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
    const [view, setView] = useState<ViewType>('home');
    const [session, setSessionState] = useState<Session | null>(null);
    const [step, setStep] = useState(0);
    const [reps, setReps] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [isResting, setIsResting] = useState(false);
    const [timerSec, setTimerSec] = useState(30);
    const [status, setStatus] = useState('ALIGNING...');

    const setSession = useCallback((newSession: Session) => {
        setSessionState(newSession);
        setStep(0);
        setReps(0);
        setCurrentSet(1);
        setIsResting(false);
    }, []);

    const incrementRep = useCallback(() => {
        setReps(prev => prev + 1);
    }, []);

    const cycleToNextExercise = useCallback(() => {
        if (!session) return;

        const activeEx = session.list[step];
        if (currentSet < activeEx.targetSets) {
            setCurrentSet(prev => prev + 1);
            setReps(0);
            setIsResting(false);
        } else {
            const nextStep = step + 1;
            if (nextStep < session.list.length) {
                setStep(nextStep);
                setReps(0);
                setCurrentSet(1);
                setIsResting(false);
            } else {
                resetWorkout();
            }
        }
    }, [session, step, currentSet]);

    const exitWorkout = useCallback(() => {
        setView('home');
        setReps(0);
        setCurrentSet(1);
        setIsResting(false);
        setTimerSec(30);
    }, []);

    const resetWorkout = useCallback(() => {
        setView('home');
        setSessionState(null);
        setStep(0);
        setReps(0);
        setCurrentSet(1);
        setIsResting(false);
        setTimerSec(30);
        setStatus('ALIGNING...');
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
        setSession,
        setView,
        setStep,
        setReps,
        setCurrentSet,
        setIsResting,
        setTimerSec,
        setStatus,
        incrementRep,
        cycleToNextExercise,
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
