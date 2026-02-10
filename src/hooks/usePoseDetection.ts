'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { Pose, Results } from '@mediapipe/pose';

// Module is already configured in layout.tsx

export function usePoseDetection(onResults: (results: Results) => void) {
    const poseRef = useRef<Pose | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let pose: Pose | null = null;

        const initPose = async () => {
            try {
                console.log('[DEBUG-Pose] Initializing Pose...');

                pose = new Pose({
                    locateFile: (file) => {
                        console.log('[DEBUG-Pose-locateFile]', file);
                        return `/${file}`;
                    },
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
                console.log('[DEBUG-Pose] Pose ready');
            } catch (err) {
                console.error('[DEBUG-Pose] Init error:', err);
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
