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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('name required');
      return;
    }
    setLoading(true);
    setError('');

    const socket = getSocket();
    socket.emit('join-room', {
      roomId: roomId.toUpperCase(),
      playerName: playerName.trim(),
    }, (res: { success: boolean; roomId?: string; error?: string }) => {
      setLoading(false);
      if (res.success && res.roomId) {
        sessionStorage.setItem('playerName', playerName.trim());
        router.push(`/room/${res.roomId}`);
      } else {
        setError(res.error || 'room not found');
      }
    });
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md slide-up">
        <div className="mb-6">
          <pre className="text-[10px] sm:text-xs leading-tight text-[var(--muted)] select-none whitespace-pre overflow-x-auto">
{`┌─────────────────────────────────────┐
│  scrum-poker  ~ join-session        │
└─────────────────────────────────────┘`}
          </pre>
          <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)] tracking-tight">
            <span className="text-[var(--accent)]">$</span> join --room
          </h1>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {'// invited to '}
            <code className="px-1.5 py-0.5 surface-alt rounded text-[var(--accent)] tracking-widest">
              {roomId.toUpperCase()}
            </code>
          </p>
        </div>

        <div className="surface rounded p-5">
          <div className="mb-5">
            <label htmlFor="playerName" className="block text-[10px] text-[var(--muted)] mb-1 uppercase tracking-widest">
              <span className="text-[var(--accent)]">&gt;</span> name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="your_name"
              className="w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none transition-colors rounded"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading}
            className="btn-shine w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#08090b] font-semibold text-sm uppercase tracking-widest rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '> connecting…' : '> take_seat'}
          </button>

          {error && (
            <div role="alert" className="mt-4 px-3 py-2 border border-[var(--danger-border)] bg-[var(--danger-light)] rounded float-in">
              <p className="text-[var(--danger)] text-xs">
                <span className="opacity-70">err:</span> {error}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 text-[10px] text-[var(--muted)] flex items-center justify-between font-mono">
          <span>{'// no sign-up. ephemeral sessions.'}</span>
          <span className="opacity-60">[ exit: ^C ]</span>
        </div>
      </div>
    </div>
  );
}
