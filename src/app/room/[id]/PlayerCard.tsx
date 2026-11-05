'use client';

import { memo, useState, useEffect, type CSSProperties } from 'react';
import type { Player } from '@/types';

export interface FloatingEmoji {
  id: number;
  emoji: string;
}

export interface ChatBubble {
  id: number;
  message: string;
}

const CARD_LABELS: Record<string, string> = { '?': 'Not sure', '☕': 'Need a break', '🧠': 'Need to think' };

export const VoteCard = memo(function VoteCard({ value, selected, onClick, disabled, style }: Readonly<{
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
  style?: CSSProperties;
}>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={CARD_LABELS[value] ?? `Vote ${value}`}
      data-value={value}
      className="card"
      style={style}
    >
      {value}
    </button>
  );
});

export const PlayerCard = memo(function PlayerCard({ player, revealed, isMe, floatingEmojis, chatBubbles, onMakeHost, onKick }: Readonly<{
  player: Player;
  revealed: boolean;
  isMe?: boolean;
  floatingEmojis: FloatingEmoji[];
  chatBubbles: ChatBubble[];
  onMakeHost?: () => void;
  onKick?: () => void;
}>) {
  const [confirming, setConfirming] = useState<'host' | 'kick' | null>(null);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(null), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  const confirmThen = (action: 'host' | 'kick', run: () => void) => {
    if (confirming === action) {
      run();
      setConfirming(null);
    } else {
      setConfirming(action);
    }
  };

  const hasVoted = player.vote !== null;
  const showVote = revealed && !!player.vote && player.vote !== 'voted';
  const slotState = [hasVoted && 'voted', showVote && 'shown', revealed && !hasVoted && 'missed'].filter(Boolean).join(' ');

  return (
    <div className="player deal-in" tabIndex={onKick ? -1 : undefined}>
      {chatBubbles.map(cb => (
        <div
          key={cb.id}
          className="chat-bubble absolute z-60"
          style={{ top: '-44px', left: '50%' }}
        >
          <div className="glass text-[var(--foreground)] text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg max-w-40 truncate whitespace-nowrap">
            {cb.message}
          </div>
          <div className="w-2 h-2 rotate-45 mx-auto -mt-1" style={{ background: 'var(--surface)' }} />
        </div>
      ))}
      {floatingEmojis.map(fe => (
        <span
          key={fe.id}
          className="emoji-float absolute text-2xl z-50"
          style={{ top: '-10px', left: '50%' }}
        >
          {fe.emoji}
        </span>
      ))}
      {player.isHost && <span className="host-badge">HOST</span>}
      {player.isSpectator ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>watching</span>
        </>
      ) : (
        <div className={`slot ${slotState}`}>
          <div className="flip">
            <div className="face back" />
            <div className="face front">{showVote ? player.vote : ''}</div>
          </div>
        </div>
      )}
      <span className="who" title={player.name}>
        <span className="who-name">{player.name}</span>{isMe && <span> (you)</span>}
      </span>
      {(onMakeHost || onKick) && (
        <div className={`seat-actions ${confirming ? 'on' : ''}`}>
          {onMakeHost && (
            <button
              onClick={() => confirmThen('host', onMakeHost)}
              aria-label={confirming === 'host' ? `Confirm make ${player.name} host` : `Make ${player.name} host`}
              title={`Make ${player.name} host`}
              className={`seat-btn ${confirming === 'host' ? 'warn' : ''}`}
            >
              {confirming === 'host' ? 'Host?' : '👑'}
            </button>
          )}
          {onKick && (
            <button
              onClick={() => confirmThen('kick', onKick)}
              aria-label={confirming === 'kick' ? `Confirm kick ${player.name}` : `Kick ${player.name}`}
              title={`Kick ${player.name}`}
              className={`seat-btn ${confirming === 'kick' ? 'warn' : ''}`}
            >
              {confirming === 'kick' ? 'Kick?' : '✕'}
            </button>
          )}
        </div>
      )}
    </div>
  );
});
