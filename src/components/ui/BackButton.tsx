'use client';

interface BackButtonProps {
    onClick: () => void;
}

export function BackButton({ onClick }: BackButtonProps) {
    return (
        <button
            onClick={onClick}
            className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Go back"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="m15 18-6-6 6-6" />
            </svg>
        </button>
    );
}
