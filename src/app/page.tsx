'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { getRecentRooms, getRecentRoomsServerSnapshot, rememberRoom, subscribeRecentRooms, formatRelative } from '@/lib/recent-rooms';
import { Logo } from '@/components/Logo';
import { SettingsMenu, ThemeToggle } from '@/components/SettingsMenu';

type Mode = null | 'create' | 'join';

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>(null);
  const [code, setCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [votingSystem, setVotingSystem] = useState('fibonacci');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const recents = useSyncExternalStore(subscribeRecentRooms, getRecentRooms, getRecentRoomsServerSnapshot);

  const handleCreate = () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    setLoading(true); setError('');
    const socket = getSocket();
    socket.emit('create-room', {
      playerName: name.trim(),
      roomName: roomName.trim() || 'Scrum Poker',
      votingSystem,
    }, (res: { success: boolean; roomId?: string; error?: string }) => {
      setLoading(false);
      if (res.success && res.roomId) {
        sessionStorage.setItem('playerName', name.trim());
        rememberRoom(res.roomId, roomName.trim() || 'Scrum Poker');
        router.push(`/room/${res.roomId}`);
      } else {
        setError(res.error || 'Failed to create room');
      }
    });
  };

  const handleJoin = (joinCode?: string, joinRoomName?: string) => {
    const codeToUse = (joinCode ?? code).trim().toUpperCase();
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!codeToUse) { setError('Please enter a room code'); return; }
    setLoading(true); setError('');
    const socket = getSocket();
    socket.emit('join-room', {
      roomId: codeToUse,
      playerName: name.trim(),
    }, (res: { success: boolean; roomId?: string; error?: string }) => {
      setLoading(false);
      if (res.success && res.roomId) {
        sessionStorage.setItem('playerName', name.trim());
        rememberRoom(res.roomId, joinRoomName || 'Scrum Poker');
        router.push(`/room/${res.roomId}`);
      } else {
        setError(res.error || 'Room not found');
      }
    });
  };

  const submit = () => {
    if (mode === 'join') handleJoin();
    else handleCreate();
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* top-right utilities */}
      <div className="row" style={{ position: 'fixed', top: 16, right: 16, gap: 4, zIndex: 10 }}>
        <SettingsMenu />
        <ThemeToggle />
      </div>

      {/* decorative cards */}
      <div className="home-cards" aria-hidden>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="vc" data-v="3" style={{ transform: 'rotate(-9deg) translateY(20px)' }}>3</div>
          <div className="vc" data-v="5" style={{ transform: 'rotate(-3deg) translateY(8px)' }}>5</div>
          <div className="vc sel" data-v="8" style={{ transform: 'rotate(2deg) translateY(0)' }}>8</div>
          <div className="vc" data-v="13" style={{ transform: 'rotate(8deg) translateY(12px)' }}>13</div>
        </div>
      </div>

      <div className="fade-up" style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <div className="between" style={{ marginBottom: 56 }}>
          <Logo />
          <span className="cap">v2 · realtime</span>
        </div>

        <h1 className="serif" style={{ fontSize: 52, lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>
          Hi there.<br />
          <span style={{ color: 'var(--ink-3)' }}>What&apos;s your name?</span>
        </h1>
        <p style={{ marginTop: 20, color: 'var(--ink-3)', fontSize: 15, maxWidth: 380 }}>
          We&apos;ll keep it for this session only. No sign-up, no database, no trace once you close the tab.
        </p>

        <div style={{ marginTop: 28 }}>
          <input
            className="input"
            style={{ fontSize: 18, padding: '14px 18px' }}
            placeholder="Type your name…"
            value={name}
            maxLength={20}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
            aria-label="Your name"
          />
        </div>

        {mode === 'create' && (
          <div className="fade-up" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              className="input"
              placeholder="Room name (optional)"
              value={roomName}
              maxLength={30}
              onChange={e => setRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ flex: 2 }}
              aria-label="Room name"
            />
            <select
              value={votingSystem}
              onChange={e => setVotingSystem(e.target.value)}
              className="input"
              style={{ flex: 1, fontSize: 13 }}
              aria-label="Voting system"
            >
              <option value="fibonacci">Fibonacci</option>
              <option value="tshirt">T-Shirt</option>
            </select>
          </div>
        )}

        {mode === 'join' && (
          <div className="fade-up" style={{ marginTop: 12 }}>
            <input
              className="input mono"
              style={{ fontSize: 17, letterSpacing: '0.3em', textAlign: 'center', textTransform: 'uppercase' }}
              placeholder="ROOM CODE"
              value={code}
              maxLength={6}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && submit()}
              aria-label="Room code"
            />
          </div>
        )}

        <div className="row" style={{ gap: 10, marginTop: 18 }}>
          <button
            className={`btn btn-lg ${mode !== 'join' ? 'btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={!name.trim() || loading}
            onClick={() => mode === 'create' ? handleCreate() : setMode('create')}
          >
            {loading && mode !== 'join' ? 'Dealing…' : '+ new room'}
          </button>
          <button
            className={`btn btn-lg ${mode === 'join' ? 'btn-accent' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={!name.trim() || loading || (mode === 'join' && code.length < 4)}
            onClick={() => mode === 'join' ? handleJoin() : setMode('join')}
          >
            {mode === 'join' ? (loading ? 'Joining…' : 'join →') : 'join with code'}
          </button>
        </div>

        {error && (
          <div role="alert" className="fade-up" style={{
            marginTop: 14, padding: '8px 12px', borderRadius: 'var(--r-md)',
            background: 'var(--accent-soft)', color: 'var(--accent)',
            border: '1px solid var(--accent-line)', fontSize: 13, textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {mode !== 'join' && recents.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div className="cap" style={{ marginBottom: 8, paddingLeft: 12 }}>recent rooms</div>
            <div className="col" style={{ gap: 2 }}>
              {recents.map(r => (
                <div
                  key={r.code}
                  className="recent-row"
                  onClick={() => name.trim() && handleJoin(r.code, r.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && handleJoin(r.code, r.name)}
                >
                  <div className="row" style={{ gap: 10 }}>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>{r.code}</span>
                    <span style={{ fontSize: 13 }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{formatRelative(r.ts)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
