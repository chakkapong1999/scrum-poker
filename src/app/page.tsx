'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🃏</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Scrum Poker
          </h1>
          <p className="text-slate-400 mt-2">Estimate together, in real-time</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex mb-6 bg-slate-900/50 rounded-xl p-1">
            <button
              onClick={() => { setActiveTab('create'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => { setActiveTab('join'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'join'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Join Room
            </button>
          </div>

          {/* Name field */}
          <div className="mb-4">
            <label className="block text-sm text-slate-300 mb-1.5">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'create' ? handleCreate() : handleJoin())}
            />
          </div>

          {activeTab === 'create' ? (
            <>
              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-1.5">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Sprint Planning"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  maxLength={30}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm text-slate-300 mb-1.5">Voting System</label>
                <select
                  value={votingSystem}
                  onChange={(e) => setVotingSystem(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="fibonacci">Fibonacci (0, 1, 2, 3, 5, 8, 13, 21...)</option>
                  <option value="tshirt">T-Shirt (XS, S, M, L, XL, XXL)</option>
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm text-slate-300 mb-1.5">Room Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCDEF"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center text-2xl tracking-[0.3em] font-mono"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
            </>
          )}

          {error && (
            <p className="mt-4 text-red-400 text-sm text-center float-in">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
