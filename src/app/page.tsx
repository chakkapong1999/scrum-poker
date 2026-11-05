'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FloatingButton } from '@/components/FloatingButton';
import { FeedbackDialog } from '@/components/FeedbackDialog';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [votingSystem, setVotingSystem] = useState('fibonacci');
  const [asSpectator, setAsSpectator] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const kicked = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(globalThis.location.search).has('kicked'),
    () => false,
  );

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
      roomName: roomName.trim() || 'Sprint Planning',
      votingSystem,
      asSpectator,
    }, (res: { success: boolean; roomId?: string; error?: string }) => {
      setLoading(false);
      if (res.success && res.roomId) {
        sessionStorage.setItem('playerName', playerName.trim());
        sessionStorage.setItem('isSpectator', asSpectator ? '1' : '0');
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
      asSpectator,
    }, (res: { success: boolean; roomId?: string; error?: string }) => {
      setLoading(false);
      if (res.success && res.roomId) {
        sessionStorage.setItem('playerName', playerName.trim());
        sessionStorage.setItem('isSpectator', asSpectator ? '1' : '0');
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

      {/* <FloatingButton
        label="Support me (yes, again)"
        image="/pp-qr.JPG"
        description="Still free. Still no ads. Scan the QR and buy me a coffee — or don't, and I'll just sit here in the corner, following you around the page, asking again tomorrow. And the day after."
      >
        ♠
      </FloatingButton> */}

      <div className="w-full max-w-md slide-up">
        {/* Marque */}
        <div className="text-center mb-5">
          <div className="card-fan mb-4" aria-hidden>
            <span className="mini-card">♠</span>
            <span className="mini-card"><span className="red">♥</span></span>
            <span className="mini-card">♣</span>
          </div>
          <h1 className="text-5xl font-serif font-black gold-foil leading-[60px]">
            Scrum Poker
          </h1>
          <div className="deco-rule max-w-50 mx-auto mb-2 text-[8px]" aria-hidden>♦</div>
          <p className="text-[var(--muted)] text-sm font-serif italic">Estimate together, in real-time</p>
        </div>

        {/* Panel */}
        <div className="panel rounded-2xl p-4 [--radius:1rem]">
          {/* Tabs */}
          <div className="relative flex mb-4 rounded-lg p-1 gap-1 border border-[var(--surface-border)] bg-[var(--felt)]">
            <button
              onClick={() => { setActiveTab('create'); setError(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold tracking-wide transition-all duration-200 ${
                activeTab === 'create'
                  ? 'bg-[var(--surface-hover)] text-[var(--gold)] shadow-sm border border-[var(--gold-border)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => { setActiveTab('join'); setError(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold tracking-wide transition-all duration-200 ${
                activeTab === 'join'
                  ? 'bg-[var(--surface-hover)] text-[var(--gold)] shadow-sm border border-[var(--gold-border)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent'
              }`}
            >
              Join Room
            </button>
          </div>

          {/* Name field */}
          <div className="mb-3">
            <label htmlFor="playerName" className="label">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="input"
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'create' ? handleCreate() : handleJoin())}
            />
          </div>

          {activeTab === 'create' ? (
            <>
              <div className="mb-3">
                <label htmlFor="roomName" className="label">Room Name</label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Sprint Planning"
                  className="input"
                  maxLength={30}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="votingSystem" className="label">Voting System</label>
                <select
                  id="votingSystem"
                  value={votingSystem}
                  onChange={(e) => setVotingSystem(e.target.value)}
                  className="input"
                >
                  <option value="fibonacci">Fibonacci (1, 2, 3, 5, 8, 13, 21...)</option>
                  <option value="tshirt">T-Shirt (XS, S, M, L, XL, XXL)</option>
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="btn-shine btn-felt w-full h-[50px] font-semibold rounded-lg tracking-wide"
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
              <div className="mb-4">
                <label htmlFor="joinCode" className="label">Room Code</label>
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="K7M2QX"
                  autoComplete="off"
                  spellCheck={false}
                  className="input"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={loading}
                className="btn-shine btn-felt w-full h-[50px] font-semibold rounded-lg tracking-wide"
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

          {/* Spectator toggle */}
          <label className="spectate">
            <input
              type="checkbox"
              checked={asSpectator}
              onChange={(e) => setAsSpectator(e.target.checked)}
            />
            <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Join as spectator</span>
            <small>watch, don&apos;t vote</small>
          </label>

          {kicked && !error && (
            <div role="alert" className="mt-3 px-3 py-2 bg-[var(--accent-red-light)] border border-[var(--accent-red-border)] rounded-lg float-in">
              <p className="text-[var(--accent-red)] text-sm text-center">You were removed from the room by the host.</p>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-3 px-3 py-2 bg-[var(--accent-red-light)] border border-[var(--accent-red-border)] rounded-lg float-in">
              <p className="text-[var(--accent-red)] text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 space-y-1">
          <p className="text-[var(--muted)] text-xs">No sign-up required. Sessions are ephemeral.</p>
          <FeedbackDialog />
          <p className="text-[var(--gold)] text-[11px] opacity-70 font-serif tracking-[0.5em] pl-2">
            ♠ ♥ ♣ ♦
          </p>
          <p className="text-[var(--muted)] text-[10px] opacity-60">v{process.env.APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}
