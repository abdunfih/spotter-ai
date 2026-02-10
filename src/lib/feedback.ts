// Voice feedback utility using SpeechSynthesis
export function speak(text: string, rate: number = 1.2): void {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        window.speechSynthesis.speak(utterance);
    }
}

// Count reps with voice
export function speakRepCount(reps: number): void {
    if (reps % 5 === 0) {
        speak(`${reps}`);
    }
}

// Speak exercise cue
export function speakCue(cue: string): void {
    speak(cue);
}

// Confetti celebration
export function triggerConfetti(): void {
    if (typeof window !== 'undefined' && (window as any).confetti) {
        (window as any).confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00ff41', '#ffffff', '#3b82f6'],
        });
    }
}

// Stop all voice feedback
export function stopSpeaking(): void {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}
