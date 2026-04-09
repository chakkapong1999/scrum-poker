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
      setError('Please enter your name');
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
        setError(res.error || 'Room not found');
      }
    });
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      {/* Theme toggle - top right */}
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-500/10 dark:border-blue-500/20 mb-5 glow-purple">
            <span className="text-4xl">🃏</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Join Session</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            You&apos;ve been invited to room{' '}
            <code className="px-2.5 py-1 glass-light rounded-lg text-blue-600 dark:text-blue-400 font-mono text-sm tracking-wider">
              {roomId.toUpperCase()}
            </code>
          </p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/5 dark:shadow-black/20">
          <div className="mb-6">
            <label htmlFor="playerName" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500/50 input-glow transition-all"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading}
            className="btn-shine w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
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

          {error && (
            <div role="alert" className="mt-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg float-in">
              <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        <p className="text-center text-slate-400 dark:text-slate-600 text-xs mt-6">No sign-up required. Sessions are ephemeral.</p>
      </div>
    </div>
  );
}
