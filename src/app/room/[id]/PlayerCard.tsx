'use client';

import { memo } from 'react';
import type { Player } from '@/types';

export interface FloatingEmoji {
  id: number;
  emoji: string;
}

export interface ChatBubble {
  id: number;
  message: string;
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const VoteCard = memo(function VoteCard({ value, selected, onClick, disabled }: Readonly<{
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}>) {
  return (
    <button
      type="button"
      data-v={value}
      className={`vc ${selected ? 'sel' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      {value}
    </button>
  );
});

export const PlayerCard = memo(function PlayerCard({ player, revealed, floatingEmojis, chatBubbles }: Readonly<{
  player: Player;
  revealed: boolean;
  floatingEmojis: FloatingEmoji[];
  chatBubbles: ChatBubble[];
}>) {
  const hasVoted = player.vote !== null;
  const showFront = revealed && hasVoted;
  const hue = player.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const avatarBg = `oklch(0.92 0.04 ${hue})`;

  return (
    <div className="player-cell">
      <div className="float-layer">
        {chatBubbles.map(cb => (
          <div
            key={cb.id}
            className="chat-bubble chat-pop"
            style={{ position: 'absolute', left: 0, top: 0, transform: 'translateX(-50%)' }}
          >
            {cb.message}
          </div>
        ))}
        {floatingEmojis.map(fe => (
          <span
            key={fe.id}
            className="emoji-float"
            style={{ position: 'absolute', left: 0, top: 0, fontSize: 28 }}
          >
            {fe.emoji}
          </span>
        ))}
      </div>

      <div className="pc-flip">
        <div className={`pc-inner ${showFront ? 'flipped' : ''}`}>
          <div className={`pc-face pc-back ${hasVoted ? 'voted' : ''}`}>
            <div className="dot-pattern" />
            {hasVoted ? (
              <CheckIcon />
            ) : (
              <span className="serif" style={{ fontSize: '0.9em', color: 'var(--ink-4)' }}>?</span>
            )}
          </div>
          <div className="pc-face pc-front">
            {player.vote && player.vote !== 'voted' ? player.vote : ''}
          </div>
        </div>
      </div>

      <div className="player-name-row">
        <span className="av" style={{ background: avatarBg }}>{initialsOf(player.name)}</span>
        <span className="player-name" title={player.name}>{player.name}</span>
        {player.isHost && <span className="host-badge">HOST</span>}
      </div>
    </div>
  );
});
