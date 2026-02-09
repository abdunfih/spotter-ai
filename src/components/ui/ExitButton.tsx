'use client';

interface ExitButtonProps {
    onClick: () => void;
}

export function ExitButton({ onClick }: ExitButtonProps) {
    return (
        <button
            onClick={onClick}
            className="exit-pill text-white"
            aria-label="Exit workout"
        >
            exit
        </button>
    );
}
