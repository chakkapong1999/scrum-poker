'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [playerName, setPlayerName] = useState('');
  const [asSpectator, setAsSpectator] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError('');

    const socket = getSocket();
    socket.emit('join-room', {
      roomId: roomId.toUpperCase(),
      playerName: playerName.trim(),
      asSpectator,
    }, (res: { success: boolean; roomId?: string; error?: string }) => {
      setLoading(false);
      if (res.success && res.roomId) {
        sessionStorage.setItem('playerName', playerName.trim());
        sessionStorage.setItem('isSpectator', asSpectator ? '1' : '0');
        router.push(`/room/${res.roomId}`);
      } else {
        setError(res.error || 'Room not found');
      }
    });
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Suit watermarks */}
      <div className="fixed top-[12%] right-[8%] text-[140px] leading-none opacity-[0.03] dark:opacity-[0.04] pointer-events-none select-none font-serif text-[var(--gold)]" aria-hidden>
        ♣
      </div>
      <div className="fixed bottom-[12%] left-[6%] text-[120px] leading-none opacity-[0.03] dark:opacity-[0.04] pointer-events-none select-none font-serif text-[var(--accent-red)]" aria-hidden>
        ♦
      </div>

      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-9">
          <div className="card-fan mb-4" aria-hidden>
            <span className="mini-card">♠</span>
            <span className="mini-card"><span className="red">♥</span></span>
            <span className="mini-card">♣</span>
          </div>
          <h1 className="text-4xl font-serif font-black gold-foil tracking-tight">Join Session</h1>
          <div className="deco-rule max-w-50 mx-auto mt-3 mb-3 text-[10px]" aria-hidden>♦</div>
          <p className="text-[var(--muted)] text-sm font-serif italic">
            You&apos;ve been invited to room{' '}
            <code className="not-italic px-2.5 py-1 rounded-md bg-[var(--gold-light)] border border-[var(--gold-border)] text-[var(--gold)] font-mono text-sm tracking-[0.2em] font-semibold">
              {roomId.toUpperCase()}
            </code>
          </p>
        </div>

        <div className="panel rounded-2xl p-6 [--radius:1rem]">
          <div className="mb-6">
            <label htmlFor="playerName" className="block text-[11px] font-semibold text-[var(--gold)] mb-1.5 uppercase tracking-[0.18em]">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none input-glow transition-all"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          {/* Spectator toggle */}
          <label className="mb-6 flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--felt)] cursor-pointer select-none hover:border-[var(--gold-border)] transition-colors">
            <input
              type="checkbox"
              checked={asSpectator}
              onChange={(e) => setAsSpectator(e.target.checked)}
              className="accent-[var(--gold)] w-3.5 h-3.5"
            />
            <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm text-[var(--foreground)] font-medium">Join as spectator</span>
            <span className="text-xs text-[var(--muted)] ml-auto">watch, don&apos;t vote</span>
          </label>

          <button
            onClick={handleJoin}
            disabled={loading}
            className="btn-shine btn-felt w-full py-3.5 font-semibold rounded-lg tracking-wide"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Joining...
              </span>
            ) : 'Take a Seat'}
          </button>

          {error && (
            <div role="alert" className="mt-4 px-3 py-2 bg-[var(--accent-red-light)] border border-[var(--accent-red-border)] rounded-lg float-in">
              <p className="text-[var(--accent-red)] text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        <div className="text-center mt-7 space-y-1.5">
          <p className="text-[var(--muted)] text-xs">No sign-up required. Sessions are ephemeral.</p>
          <p className="text-[var(--gold)] text-[11px] opacity-70 font-serif tracking-[0.5em] pl-2">
            ♠ ♥ ♣ ♦
          </p>
        </div>
      </div>
    </div>
  );
}
