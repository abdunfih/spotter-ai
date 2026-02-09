'use client';

interface RestOverlayProps {
    timerSec: number;
    isCooling: boolean;
}

export function RestOverlay({ timerSec, isCooling }: RestOverlayProps) {
    return (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center p-12">
            <p className={`text-[10px] uppercase tracking-[0.4em] font-black mb-10 ${isCooling ? 'text-[#00d1ff]' : 'text-[#00ff41]'
                }`}>
                {isCooling ? 'RECOVERY' : 'REST'}
            </p>
            <div className="massive-counter !text-white">{timerSec}</div>
        </div>
    );
}
