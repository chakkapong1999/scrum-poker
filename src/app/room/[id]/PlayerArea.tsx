'use client';

import { useEffect, useRef, useState } from 'react';
import type { Player } from '@/types';
import { PlayerCard } from './PlayerCard';
import type { FloatingEmoji, ChatBubble } from './PlayerCard';

function VoteProgress({ voted, total }: { voted: number; total: number }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? voted / total : 0;
  const offset = circumference * (1 - progress);
  const complete = progress === 1 && total > 0;

  return (
    <div className="flex items-center gap-2.5">
      <svg width="40" height="40" className="progress-ring">
        <circle
          cx="20" cy="20" r={radius}
          fill="none"
          stroke="var(--surface-border)"
          strokeWidth="2"
        />
        <circle
          cx="20" cy="20" r={radius}
          fill="none"
          stroke={complete ? 'var(--accent)' : 'var(--foreground)'}
          strokeWidth="2"
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums">
          {voted}<span className="text-[var(--muted)]">/</span>{total}
        </span>
        <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">voted</span>
      </div>
    </div>
  );
}

function suggestedPoint(players: Player[], votingSystem: string[]): string {
  const numericVotes = players
    .map(p => p.vote)
    .filter((v): v is string => v !== null && v !== 'voted')
    .map(Number)
    .filter(n => !Number.isNaN(n));
  if (numericVotes.length === 0) return '';
  const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
  const target = Math.ceil(avg);
  const numericDeck = votingSystem
    .map(v => ({ raw: v, n: Number(v) }))
    .filter(x => !Number.isNaN(x.n))
    .sort((a, b) => a.n - b.n);
  if (numericDeck.length === 0) return String(target);
  const snap = numericDeck.find(x => x.n >= target) ?? numericDeck[numericDeck.length - 1];
  return snap.raw;
}

const primaryBtn = 'btn-shine px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--surface-hover)] disabled:text-[var(--muted)] disabled:cursor-not-allowed text-[#08090b] text-xs font-semibold uppercase tracking-widest rounded transition-colors';
const secondaryBtn = 'px-4 py-2 border border-[var(--surface-border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--foreground)] text-xs font-semibold uppercase tracking-widest rounded transition-colors';

export function PlayerArea({ players, revealed, isHost, votedCount, allVoted, floatingEmojis, chatBubbles, onReveal, onReset, canCompleteStory, onCompleteStory, votingSystem }: Readonly<{
  players: Player[];
  revealed: boolean;
  isHost: boolean;
  votedCount: number;
  allVoted: boolean;
  floatingEmojis: Map<string, FloatingEmoji[]>;
  chatBubbles: Map<string, ChatBubble[]>;
  onReveal: () => void;
  onReset: () => void;
  canCompleteStory: boolean;
  onCompleteStory: (finalPoint: string) => void;
  votingSystem: string[];
}>) {
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [pointDraft, setPointDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!revealed || !canCompleteStory) {
      setShowSaveInput(false);
      setPointDraft('');
    }
  }, [revealed, canCompleteStory]);

  useEffect(() => {
    if (showSaveInput) inputRef.current?.focus();
  }, [showSaveInput]);

  const openSaveInput = () => {
    setPointDraft(suggestedPoint(players, votingSystem));
    setShowSaveInput(true);
  };

  const submitPoint = () => {
    const value = pointDraft.trim();
    if (!value) return;
    onCompleteStory(value);
    setShowSaveInput(false);
    setPointDraft('');
  };

  return (
    <div className="surface rounded p-5 sm:p-6 mb-5" style={{ overflow: 'visible' }}>
      <div className="flex items-center justify-between mb-5 relative z-10 gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <VoteProgress voted={votedCount} total={players.length} />
          {revealed && (
            <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold border border-[var(--accent-border)] bg-[var(--accent-light)] px-2 py-1 rounded">
              [ revealed ]
            </span>
          )}
          {!revealed && allVoted && votedCount > 0 && (
            <span className="text-[10px] uppercase tracking-widest text-[var(--warn)] font-semibold pulse-soft border border-[var(--warn-border)] bg-[var(--warn-light)] px-2 py-1 rounded">
              [ all in ]
            </span>
          )}
        </div>
        {isHost && (
          <div className="flex gap-1.5 items-center">
            {revealed ? (
              <>
                {canCompleteStory && (
                  showSaveInput ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={inputRef}
                        value={pointDraft}
                        onChange={e => setPointDraft(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') submitPoint();
                          if (e.key === 'Escape') { setShowSaveInput(false); setPointDraft(''); }
                        }}
                        placeholder="pt"
                        maxLength={10}
                        className="w-16 px-2 py-2 rounded bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none tabular-nums text-center"
                      />
                      <button onClick={submitPoint} disabled={!pointDraft.trim()} className={primaryBtn}>
                        save&amp;next
                      </button>
                      <button
                        onClick={() => { setShowSaveInput(false); setPointDraft(''); }}
                        className="px-2 py-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] uppercase tracking-widest"
                      >
                        esc
                      </button>
                    </div>
                  ) : (
                    <button onClick={openSaveInput} className={primaryBtn}>
                      save &amp; next
                    </button>
                  )
                )}
                {!showSaveInput && (
                  <button onClick={onReset} className={secondaryBtn}>
                    new round
                  </button>
                )}
              </>
            ) : (
              <button onClick={onReveal} disabled={votedCount === 0} className={primaryBtn}>
                reveal
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-5 justify-center pt-3 pb-1 relative z-10">
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            revealed={revealed}
            floatingEmojis={floatingEmojis.get(player.id) || []}
            chatBubbles={chatBubbles.get(player.id) || []}
          />
        ))}
      </div>
    </div>
  );
}
