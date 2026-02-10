'use client';

import { getAllSessions } from '@/lib/sessions';
import { SessionCard } from '@/components/ui/SessionCard';

export default function Home() {
  const sessions = getAllSessions();

  return (
    <div className="app-container cyber-grid p-8 overflow-y-auto bg-[#0a0a0a]">
      <header className="text-center mt-12 mb-10">
        <h1 className="text-6xl font-black italic tracking-tighter text-white">
          SPOTTER.AI
        </h1>
        <p className="text-[#00ff41] font-mono text-[10px] uppercase tracking-[0.5em] mt-2 font-black">
          Core Engine v43
        </p>
      </header>
      <div className="w-full max-w-xl mx-auto space-y-4 mb-20">
        {sessions.map((session) => (
          <SessionCard key={session.key} session={session} />
        ))}
      </div>
    </div>
  );
}
