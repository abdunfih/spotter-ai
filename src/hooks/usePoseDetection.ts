'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { Pose, Results } from '@mediapipe/pose';

export function usePoseDetection(onResults: (results: Results) => void) {
    const poseRef = useRef<Pose | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let pose: Pose | null = null;

        const initPose = async () => {
            try {
                pose = new Pose({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
                });

                pose.setOptions({
                    modelComplexity: 0,
                    smoothLandmarks: true,
                    minDetectionConfidence: 0.6,
                    minTrackingConfidence: 0.6,
                });

                pose.onResults(onResults);
                poseRef.current = pose;
                setIsReady(true);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to initialize pose detection');
            }
        };

        initPose();

        return () => {
            if (pose) {
                pose.close();
            }
        };
    }, [onResults]);

    return { poseRef, isReady, error };
}

export function useCamera(videoRef: React.RefObject<HTMLVideoElement>, onFrame: () => Promise<void>) {
    const streamRef = useRef<MediaStream | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setHasPermission(true);
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setHasPermission(false);
                    setError('Camera permission denied');
                } else {
                    setError(err.message);
                }
            }
        }
    }, [videoRef]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    return { startCamera, stopCamera, hasPermission, error };
}
