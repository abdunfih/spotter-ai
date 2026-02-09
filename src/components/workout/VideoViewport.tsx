'use client';

import React, { useEffect, useRef } from 'react';

interface VideoViewportProps {
    videoRef: React.RefObject<HTMLVideoElement>;
}

export function VideoViewport({ videoRef }: VideoViewportProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && videoRef) {
            videoRef.current = localVideoRef.current;
        }
    }, [videoRef]);

    return (
        <div className="viewport-container">
            <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1]"
            />
        </div>
    );
}
