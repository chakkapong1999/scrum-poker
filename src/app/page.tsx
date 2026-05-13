'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [votingSystem, setVotingSystem] = useState('fibonacci');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!playerName.trim()) {
      setError('name required');
      return;
    }
    setLoading(true);
    setError('');

    const socket = getSocket();
    socket.emit('create-room', {
      playerName: playerName.trim(),
      roomName: roomName.trim() || 'Scrum Poker',
      votingSystem,
    }, (res: { success: boolean; roomId?: string; error?: string }) => {
      setLoading(false);
      if (res.success && res.roomId) {
        sessionStorage.setItem('playerName', playerName.trim());
        router.push(`/room/${res.roomId}`);
      } else {
        setError(res.error || 'failed to create room');
      }
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('name required');
      return;
    }
    if (!joinCode.trim()) {
      setError('room code required');
      return;
    }
    setLoading(true);
    setError('');

    const socket = getSocket();
    socket.emit('join-room', {
      roomId: joinCode.trim().toUpperCase(),
      playerName: playerName.trim(),
    }, (res: { success: boolean; roomId?: string; error?: string }) => {
      setLoading(false);
      if (res.success && res.roomId) {
        sessionStorage.setItem('playerName', playerName.trim());
        router.push(`/room/${res.roomId}`);
      } else {
        setError(res.error || 'failed to join room');
      }
    });
  };

  const inputClass = 'w-full px-3 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none transition-colors rounded';

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md slide-up">
        {/* Logo / banner */}
        <div className="mb-6">
          <pre className="text-[10px] sm:text-xs leading-tight text-[var(--muted)] select-none whitespace-pre overflow-x-auto">
{`┌─────────────────────────────────────┐
│  scrum-poker  v1.0  ~ planning      │
└─────────────────────────────────────┘`}
          </pre>
          <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)] tracking-tight">
            <span className="text-[var(--accent)]">$</span> scrum-poker<span className="term-cursor" />
          </h1>
          <p className="mt-1 text-xs text-[var(--muted)]">{'// estimate together, in real-time'}</p>
        </div>

        {/* Card */}
        <div className="surface rounded p-5">
          {/* Tabs */}
          <div className="flex mb-5 border-b border-[var(--surface-border)]">
            <button
              onClick={() => { setActiveTab('create'); setError(''); }}
              className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                activeTab === 'create'
                  ? 'text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--muted)] border-transparent hover:text-[var(--foreground)]'
              }`}
            >
              [ create ]
            </button>
            <button
              onClick={() => { setActiveTab('join'); setError(''); }}
              className={`flex-1 py-2 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                activeTab === 'join'
                  ? 'text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--muted)] border-transparent hover:text-[var(--foreground)]'
              }`}
            >
              [ join ]
            </button>
          </div>

          {/* Name field */}
          <div className="mb-3">
            <label htmlFor="playerName" className="block text-[10px] text-[var(--muted)] mb-1 uppercase tracking-widest">
              <span className="text-[var(--accent)]">&gt;</span> name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="your_name"
              className={inputClass}
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'create' ? handleCreate() : handleJoin())}
            />
          </div>

          {activeTab === 'create' ? (
            <>
              <div className="mb-3">
                <label htmlFor="roomName" className="block text-[10px] text-[var(--muted)] mb-1 uppercase tracking-widest">
                  <span className="text-[var(--accent)]">&gt;</span> room
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="sprint_planning"
                  className={inputClass}
                  maxLength={30}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div className="mb-5">
                <label htmlFor="votingSystem" className="block text-[10px] text-[var(--muted)] mb-1 uppercase tracking-widest">
                  <span className="text-[var(--accent)]">&gt;</span> deck
                </label>
                <select
                  id="votingSystem"
                  value={votingSystem}
                  onChange={(e) => setVotingSystem(e.target.value)}
                  className={inputClass}
                >
                  <option value="fibonacci">fibonacci  ::  0 1 2 3 5 8 13 21 …</option>
                  <option value="tshirt">tshirt     ::  XS S M L XL XXL</option>
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="btn-shine w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#08090b] font-semibold text-sm uppercase tracking-widest rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '> dealing…' : '> create_room'}
              </button>
            </>
          ) : (
            <>
              <div className="mb-5">
                <label htmlFor="joinCode" className="block text-[10px] text-[var(--muted)] mb-1 uppercase tracking-widest">
                  <span className="text-[var(--accent)]">&gt;</span> room_code
                </label>
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="------"
                  className="w-full px-3 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none transition-colors text-center text-xl tracking-[0.4em] rounded"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={loading}
                className="btn-shine w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[#08090b] font-semibold text-sm uppercase tracking-widest rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '> joining…' : '> join_room'}
              </button>
            </>
          )}

          {error && (
            <div role="alert" className="mt-4 px-3 py-2 border border-[var(--danger-border)] bg-[var(--danger-light)] rounded float-in">
              <p className="text-[var(--danger)] text-xs">
                <span className="opacity-70">err:</span> {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 text-[10px] text-[var(--muted)] flex items-center justify-between font-mono">
          <span>{'// no sign-up. ephemeral sessions.'}</span>
          <span className="opacity-60">[ exit: ^C ]</span>
        </div>
      </div>
    </div>
  );
}
