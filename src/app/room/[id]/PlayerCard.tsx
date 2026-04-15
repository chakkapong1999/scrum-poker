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

export const VoteCard = memo(function VoteCard({ value, selected, onClick, disabled }: Readonly<{
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`vote-card w-[4.5rem] h-[6.5rem] rounded-xl text-lg font-bold font-serif relative ${
        selected
          ? 'bg-[var(--primary)] text-white glow-emerald ring-1 ring-[var(--primary-border)] -translate-y-3'
          : 'glass-light text-[var(--foreground)] hover:border-[var(--surface-border-hover)] hover:bg-[var(--surface-hover)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Corner suit marks */}
      <span className="absolute top-1 left-1.5 text-[8px] opacity-30 pointer-events-none">♠</span>
      <span className="absolute bottom-1 right-1.5 text-[8px] opacity-30 pointer-events-none rotate-180">♠</span>
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
  const showVote = revealed && !!player.vote && player.vote !== 'voted';

  const hue = player.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div className="flex flex-col items-center gap-2.5 deal-in relative" style={{ overflow: 'visible' }}>
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
      <div className="card-flip-container">
        <div className={`card-flip-inner ${showVote ? 'flipped' : ''}`}>
          <div className={`card-flip-back ${hasVoted ? 'card-back-voted' : 'card-back-idle'}`}>
            {hasVoted ? '✓' : '?'}
          </div>
          <div className="card-flip-front card-front-revealed">
            {player.vote ?? ''}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full ring-1 ring-white/20"
            style={{ backgroundColor: `hsl(${hue}, 50%, 55%)` }}
          />
          <span className="text-xs text-[var(--muted)] truncate max-w-20 font-medium">{player.name}</span>
          {player.isHost && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--gold-light)] text-[var(--gold)] border border-[var(--gold-border)] font-semibold tracking-wide">HOST</span>
          )}
        </div>
      </div>
    </div>
  );
});
