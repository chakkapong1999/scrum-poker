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
      className={`vote-card w-16 h-24 rounded-xl text-lg font-bold ${
        selected
          ? 'bg-blue-600 text-white glow-blue ring-1 ring-blue-400/50 -translate-y-2'
          : 'glass-light text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300/50 dark:hover:border-slate-500/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
  const showVote = revealed && !!player.vote && player.vote !== 'voted';

  const hue = player.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div className="flex flex-col items-center gap-2.5 float-in relative" style={{ overflow: 'visible' }}>
      {chatBubbles.map(cb => (
        <div
          key={cb.id}
          className="chat-bubble absolute z-60"
          style={{ top: '-44px', left: '50%' }}
        >
          <div className="glass text-slate-800 dark:text-slate-100 text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg max-w-40 truncate whitespace-nowrap">
            {cb.message}
          </div>
          <div className="w-2 h-2 bg-white/70 dark:bg-slate-800/80 rotate-45 mx-auto -mt-1" />
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
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: `hsl(${hue}, 60%, 60%)` }}
          />
          <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-20 font-medium">{player.name}</span>
          {player.isHost && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">HOST</span>
          )}
        </div>
      </div>
    </div>
  );
});
