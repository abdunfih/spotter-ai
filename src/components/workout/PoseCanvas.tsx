'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PoseLandmark } from '@/types';

interface PoseCanvasProps {
    landmarks: PoseLandmark[] | null;
    color?: string;
}

export function PoseCanvas({ landmarks, color = '#00ff41' }: PoseCanvasProps) {
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

    // Set canvas size and draw landmarks
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = dimensions.width || 640;
        canvas.height = dimensions.height || 480;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!landmarks || landmarks.length === 0) return;

        landmarks.forEach(p => {
            if ((p.visibility ?? 1) > 0.5) {
                ctx.beginPath();
                ctx.arc(p.x * canvas.width, p.y * canvas.height, 8, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
            }
        });
    }, [landmarks, dimensions, color]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
