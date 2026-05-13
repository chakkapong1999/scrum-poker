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
      className={`vote-card w-[4rem] h-[5.75rem] rounded text-base font-semibold relative border ${
        selected
          ? 'bg-[var(--accent)] text-[#08090b] border-[var(--accent)] -translate-y-2'
          : 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--surface-border)] hover:bg-[var(--surface-hover)]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-pressed={selected}
    >
      <span className="absolute top-1 left-1.5 text-[8px] opacity-60 pointer-events-none">{selected ? '>' : '['}</span>
      <span className="absolute bottom-1 right-1.5 text-[8px] opacity-60 pointer-events-none">{selected ? '_' : ']'}</span>
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
    <div className="flex flex-col items-center gap-2 deal-in relative" style={{ overflow: 'visible' }}>
      {chatBubbles.map(cb => (
        <div
          key={cb.id}
          className="chat-bubble absolute z-60"
          style={{ top: '-44px', left: '50%' }}
        >
          <div className="surface text-[var(--foreground)] text-xs px-2.5 py-1.5 rounded max-w-40 truncate whitespace-nowrap shadow-sm">
            <span className="text-[var(--accent)] mr-1">&gt;</span>{cb.message}
          </div>
          <div className="w-2 h-2 rotate-45 mx-auto -mt-1 border-r border-b border-[var(--surface-border)]" style={{ background: 'var(--surface)' }} />
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
            {hasVoted ? '✓' : '·'}
          </div>
          <div className="card-flip-front card-front-revealed">
            {player.vote ?? ''}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5 max-w-[7rem]">
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: `hsl(${hue}, 55%, 55%)` }}
          />
          <span className="text-[11px] text-[var(--foreground)] truncate font-medium">{player.name}</span>
          {player.isHost && (
            <span className="text-[9px] px-1 py-px rounded-sm bg-[var(--warn-light)] text-[var(--warn)] border border-[var(--warn-border)] uppercase tracking-wider">host</span>
          )}
        </div>
      </div>
    </div>
  );
});
