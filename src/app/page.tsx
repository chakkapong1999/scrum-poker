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
      setError('Please enter your name');
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
        setError(res.error || 'Failed to create room');
      }
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!joinCode.trim()) {
      setError('Please enter a room code');
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
        setError(res.error || 'Failed to join room');
      }
    });
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Decorative suit symbols */}
      <div className="fixed top-[12%] left-[8%] text-[120px] opacity-[0.02] dark:opacity-[0.03] pointer-events-none select-none font-serif" aria-hidden>
        ♠
      </div>
      <div className="fixed bottom-[15%] right-[10%] text-[100px] opacity-[0.02] dark:opacity-[0.03] pointer-events-none select-none font-serif" aria-hidden>
        ♦
      </div>

      <div className="w-full max-w-md slide-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-light)] mb-5 glow-gold">
            <span className="text-4xl">🃏</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-gradient tracking-tight">
            Scrum Poker
          </h1>
          <p className="text-[var(--muted)] mt-2.5 text-sm tracking-wide">Estimate together, in real-time</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/5 dark:shadow-black/20">
          {/* Tabs */}
          <div className="flex mb-6 bg-[var(--felt)] rounded-xl p-1 gap-1 border border-[var(--surface-border)]">
            <button
              onClick={() => { setActiveTab('create'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'create'
                  ? 'bg-[var(--surface-hover)] text-[var(--foreground)] shadow-sm border border-[var(--surface-border)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => { setActiveTab('join'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'join'
                  ? 'bg-[var(--surface-hover)] text-[var(--foreground)] shadow-sm border border-[var(--surface-border)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent'
              }`}
            >
              Join Room
            </button>
          </div>

          {/* Name field */}
          <div className="mb-4">
            <label htmlFor="playerName" className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:border-[var(--primary)] input-glow transition-all"
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'create' ? handleCreate() : handleJoin())}
            />
          </div>

          {activeTab === 'create' ? (
            <>
              <div className="mb-4">
                <label htmlFor="roomName" className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">Room Name</label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Sprint Planning"
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:border-[var(--primary)] input-glow transition-all"
                  maxLength={30}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="votingSystem" className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">Voting System</label>
                <select
                  id="votingSystem"
                  value={votingSystem}
                  onChange={(e) => setVotingSystem(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] input-glow transition-all"
                >
                  <option value="fibonacci">Fibonacci (0, 1, 2, 3, 5, 8, 13, 21...)</option>
                  <option value="tshirt">T-Shirt (XS, S, M, L, XL, XXL)</option>
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="btn-shine w-full py-3.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:brightness-110 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Dealing...
                  </span>
                ) : 'Create Room'}
              </button>
            </>
          ) : (
            <>
              <div className="mb-6">
                <label htmlFor="joinCode" className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">Room Code</label>
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="------"
                  className="w-full px-4 py-3.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:border-[var(--primary)] input-glow transition-all text-center text-2xl tracking-[0.4em] font-mono"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={loading}
                className="btn-shine w-full py-3.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:brightness-110 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Joining...
                  </span>
                ) : 'Join Room'}
              </button>
            </>
          )}

          {error && (
            <div role="alert" className="mt-4 px-3 py-2 bg-[var(--accent-red-light)] border border-[var(--accent-red-border)] rounded-lg float-in">
              <p className="text-[var(--accent-red)] text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-[var(--muted-light)] text-xs">No sign-up required. Sessions are ephemeral.</p>
          <p className="text-[var(--muted-light)] text-[11px] opacity-60 font-serif italic tracking-wide">
            ♠ ♥ ♣ ♦
          </p>
        </div>
      </div>
    </div>
  );
}
