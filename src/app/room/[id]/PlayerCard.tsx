'use client';

import { memo, useState, useEffect } from 'react';
import type { Player } from '@/types';

export interface FloatingEmoji {
  id: number;
  emoji: string;
}

export interface ChatBubble {
  id: number;
  message: string;
}

/* Each deck value gets a suit, dealt round-robin like a real pack */
const SUITS = ['♠', '♥', '♣', '♦'];

export function suitFor(value: string): { glyph: string; red: boolean } {
  const idx = value.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % SUITS.length;
  const glyph = SUITS[idx];
  return { glyph, red: glyph === '♥' || glyph === '♦' };
}

export const VoteCard = memo(function VoteCard({ value, selected, onClick, disabled }: Readonly<{
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}>) {
  const suit = suitFor(value);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`vote-card playing-card w-[4.5rem] h-[6.5rem] text-[1.45rem] font-semibold ${
        selected ? 'playing-card-selected -translate-y-3' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`card-suit-corner card-suit-corner-tl ${suit.red ? 'card-suit-red' : ''}`} aria-hidden>{suit.glyph}</span>
      <span className={`card-suit-corner card-suit-corner-br ${suit.red ? 'card-suit-red' : ''}`} aria-hidden>{suit.glyph}</span>
      {value}
    </button>
  );
});

export const PlayerCard = memo(function PlayerCard({ player, revealed, floatingEmojis, chatBubbles, onMakeHost }: Readonly<{
  player: Player;
  revealed: boolean;
  floatingEmojis: FloatingEmoji[];
  chatBubbles: ChatBubble[];
  onMakeHost?: () => void;
}>) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  const hasVoted = player.vote !== null;
  const showVote = revealed && !!player.vote && player.vote !== 'voted';
  const suit = showVote && player.vote ? suitFor(player.vote) : null;

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
      {player.isSpectator ? (
        <div className="spectator-seat" title={`${player.name} is spectating`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-[9px] uppercase tracking-[0.2em]">watching</span>
        </div>
      ) : (
        <div className="card-flip-container">
          <div className={`card-flip-inner ${showVote ? 'flipped' : ''}`}>
            <div className={`card-flip-back ${hasVoted ? 'card-back-voted' : 'card-back-idle'}`}>
              {hasVoted ? <span className="card-back-seal">✓</span> : '?'}
            </div>
            <div className="card-flip-front card-front-revealed">
              {suit && (
                <>
                  <span className={`card-suit-corner card-suit-corner-tl ${suit.red ? 'card-suit-red' : ''}`} aria-hidden>{suit.glyph}</span>
                  <span className={`card-suit-corner card-suit-corner-br ${suit.red ? 'card-suit-red' : ''}`} aria-hidden>{suit.glyph}</span>
                </>
              )}
              {player.vote ?? ''}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full ring-1 ring-[var(--gold-border)]"
            style={{ backgroundColor: `hsl(${hue}, 45%, 52%)` }}
          />
          <span className="text-xs text-[var(--muted)] truncate max-w-20 font-medium">{player.name}</span>
          {player.isHost && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--gold-light)] text-[var(--gold)] border border-[var(--gold-border)] font-semibold tracking-[0.12em]">HOST</span>
          )}
        </div>
        {onMakeHost && (
          <button
            onClick={() => {
              if (confirming) {
                onMakeHost();
                setConfirming(false);
              } else {
                setConfirming(true);
              }
            }}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all font-medium ${
              confirming
                ? 'bg-[var(--gold-light)] text-[var(--gold)] border-[var(--gold-border)]'
                : 'glass text-[var(--muted)] hover:text-[var(--gold)] hover:border-[var(--gold-border)]'
            }`}
          >
            {confirming ? 'Confirm?' : '👑 Make Host'}
          </button>
        )}
      </div>
    </div>
  );
});
