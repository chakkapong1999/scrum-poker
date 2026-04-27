'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { rememberRoom } from '@/lib/recent-rooms';
import { Logo } from '@/components/Logo';
import { SettingsMenu, ThemeToggle } from '@/components/SettingsMenu';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params.id as string).toUpperCase();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    setLoading(true); setError('');
    const socket = getSocket();
    socket.emit('join-room', {
      roomId,
      playerName: name.trim(),
    }, (res: { success: boolean; roomId?: string; error?: string }) => {
      setLoading(false);
      if (res.success && res.roomId) {
        sessionStorage.setItem('playerName', name.trim());
        rememberRoom(res.roomId, 'Scrum Poker');
        router.push(`/room/${res.roomId}`);
      } else {
        setError(res.error || 'Room not found');
      }
    });
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative' }}>
      <div className="row" style={{ position: 'fixed', top: 16, right: 16, gap: 4, zIndex: 10 }}>
        <SettingsMenu />
        <ThemeToggle />
      </div>

      <div className="fade-up" style={{ width: '100%', maxWidth: 440 }}>
        <div className="between" style={{ marginBottom: 48 }}>
          <Logo />
          <span className="cap">invite</span>
        </div>

        <h1 className="serif" style={{ fontSize: 44, lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em' }}>
          Join the room.<br />
          <span style={{ color: 'var(--ink-3)' }}>What&apos;s your name?</span>
        </h1>
        <p style={{ marginTop: 16, color: 'var(--ink-3)', fontSize: 15 }}>
          You&apos;ve been invited to room{' '}
          <code className="mono" style={{
            padding: '2px 8px', background: 'var(--surface-2)',
            border: '1px solid var(--line)', borderRadius: 6,
            color: 'var(--ink-2)', fontSize: 13, letterSpacing: '0.18em',
          }}>{roomId}</code>
        </p>

        <div style={{ marginTop: 24 }}>
          <input
            className="input"
            style={{ fontSize: 18, padding: '14px 18px' }}
            placeholder="Type your name…"
            value={name}
            maxLength={20}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
            aria-label="Your name"
          />
        </div>

        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
          disabled={!name.trim() || loading}
          onClick={handleJoin}
        >
          {loading ? 'Joining…' : 'take a seat →'}
        </button>

        {error && (
          <div role="alert" className="fade-up" style={{
            marginTop: 14, padding: '8px 12px', borderRadius: 'var(--r-md)',
            background: 'var(--accent-soft)', color: 'var(--accent)',
            border: '1px solid var(--accent-line)', fontSize: 13, textAlign: 'center',
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
