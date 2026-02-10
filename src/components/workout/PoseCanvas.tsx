'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PoseLandmark } from '@/types';

interface PoseCanvasProps {
    landmarks: PoseLandmark[] | null;
    dotColor?: string;
    lineColor?: string;
    mirrored?: boolean; // Set to true for selfie camera (default)
}

// Skeleton connections for drawing body lines
const BODY_CONNECTIONS = [
    // Torso and shoulders
    [11, 12], // Shoulders
    [11, 23], [12, 24], // Shoulders to hips
    [23, 24], // Hips
    // Left arm
    [11, 13], [13, 15], // Shoulder to elbow, elbow to wrist
    // Right arm
    [12, 14], [14, 16], // Shoulder to elbow, elbow to wrist
    // Left leg
    [23, 25], [25, 27], // Hip to knee, knee to ankle
    // Right leg
    [24, 26], [26, 28], // Hip to knee, knee to ankle
];

/**
 * PoseCanvas - Draws MediaPipe pose landmarks with skeleton lines
 * 
 * Key fix for v38: Coordinate Synchronization (The "Weld")
 * When using a mirrored selfie camera:
 * - MediaPipe landmark x=0 is LEFT (from camera's perspective)
 * - On screen, user's LEFT appears on the RIGHT due to mirroring
 * - We must transform: x = (1 - landmark.x) to flip coordinates
 */
export function PoseCanvas({ landmarks, dotColor = '#00ff41', lineColor = '#ff6600', mirrored = true }: PoseCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Get dimensions from parent container
    useEffect(() => {
        const updateDimensions = () => {
            const container = canvasRef.current?.parentElement;
            if (container) {
                setDimensions({
                    width: container.clientWidth,
                    height: container.clientHeight
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Helper to convert landmark x coordinate
    const getX = (landmark: PoseLandmark, width: number): number => {
        if (mirrored) {
            // For selfie view: flip x coordinate so landmarks align with mirrored video
            return (1 - landmark.x) * width;
        }
        return landmark.x * width;
    };

    // Set canvas size and draw landmarks
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.log('[PoseCanvas] No canvas ref');
            return;
        }

        const canvasWidth = dimensions.width || 640;
        const canvasHeight = dimensions.height || 480;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.log('[PoseCanvas] No 2D context');
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!landmarks || landmarks.length === 0) {
            console.log('[PoseCanvas] No landmarks:', landmarks?.length);
            return;
        }

        console.log('[PoseCanvas] Drawing landmarks:', landmarks.length, 'canvasSize:', canvasWidth, 'x', canvasHeight);

        const drawWidth = canvas.width;
        const drawHeight = canvas.height;

        // Draw skeleton lines first (below dots)
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 3;

        BODY_CONNECTIONS.forEach(([start, end]) => {
            const startLandmark = landmarks[start];
            const endLandmark = landmarks[end];

            if (startLandmark && endLandmark &&
                (startLandmark.visibility ?? 1) > 0.1 &&
                (endLandmark.visibility ?? 1) > 0.1) {
                ctx.beginPath();
                ctx.moveTo(getX(startLandmark, drawWidth), startLandmark.y * drawHeight);
                ctx.lineTo(getX(endLandmark, drawWidth), endLandmark.y * drawHeight);
                ctx.stroke();
            }
        });

        // Draw landmarks as dots
        landmarks.forEach((p, index) => {
            // Always draw dots regardless of visibility (for debugging)
            if (true || (p.visibility ?? 1) > 0.5) {
                const x = getX(p, drawWidth);
                const y = p.y * drawHeight;
                const size = index < 11 ? 6 : 8; // Larger dots for key body parts

                ctx.beginPath();
                ctx.arc(x, y, size, 0, 2 * Math.PI);
                ctx.fillStyle = dotColor;
                ctx.fill();

                // Add white outline for better visibility
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }, [landmarks, dimensions, dotColor, lineColor, mirrored]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full z-1 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
