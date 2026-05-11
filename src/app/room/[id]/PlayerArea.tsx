'use client';

import { useEffect, useRef, useState } from 'react';
import type { Player } from '@/types';
import { PlayerCard } from './PlayerCard';
import type { FloatingEmoji, ChatBubble } from './PlayerCard';

function VoteProgress({ voted, total }: { voted: number; total: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? voted / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-2.5">
      <svg width="44" height="44" className="progress-ring">
        <circle
          cx="22" cy="22" r={radius}
          fill="none"
          stroke="var(--surface-border)"
          strokeWidth="3"
        />
        <circle
          cx="22" cy="22" r={radius}
          fill="none"
          stroke={progress === 1 ? 'var(--emerald)' : 'var(--primary)'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums">{voted}/{total}</span>
        <span className="text-[11px] text-[var(--muted)]">voted</span>
      </div>
    </div>
  );
}

export function PlayerArea({ players, revealed, isHost, votedCount, allVoted, floatingEmojis, chatBubbles, onReveal, onReset, canCompleteStory, onCompleteStory }: Readonly<{
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

  const submitPoint = () => {
    const value = pointDraft.trim();
    if (!value) return;
    onCompleteStory(value);
    setShowSaveInput(false);
    setPointDraft('');
  };

  return (
    <div className="glass felt-area rounded-2xl p-6 sm:p-8 mb-6" style={{ overflow: 'visible' }}>
      <div className="flex items-center justify-between mb-6 relative z-10 gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <VoteProgress voted={votedCount} total={players.length} />
          {revealed && (
            <span className="text-sm font-medium text-[var(--emerald)] flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Revealed
            </span>
          )}
          {!revealed && allVoted && votedCount > 0 && (
            <span className="text-sm text-[var(--gold)] font-semibold pulse-soft">All in!</span>
          )}
        </div>
        {isHost && (
          <div className="flex gap-2 items-center">
            {revealed ? (
              <>
                {canCompleteStory && (
                  showSaveInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        value={pointDraft}
                        onChange={e => setPointDraft(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') submitPoint();
                          if (e.key === 'Escape') { setShowSaveInput(false); setPointDraft(''); }
                        }}
                        placeholder="Point"
                        maxLength={10}
                        className="w-20 px-3 py-2 rounded-xl bg-[var(--felt)] border border-[var(--primary-border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] tabular-nums"
                      />
                      <button
                        onClick={submitPoint}
                        disabled={!pointDraft.trim()}
                        className="btn-shine px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 disabled:from-[var(--muted-light)] disabled:to-[var(--muted-light)] disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
                      >
                        Save & Next
                      </button>
                      <button
                        onClick={() => { setShowSaveInput(false); setPointDraft(''); }}
                        className="px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSaveInput(true)}
                      className="btn-shine px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                    >
                      Save & Next Story
                    </button>
                  )
                )}
                {!showSaveInput && (
                  <button
                    onClick={onReset}
                    className="btn-shine px-5 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:brightness-110 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20"
                  >
                    New Round
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onReveal}
                disabled={votedCount === 0}
                className="btn-shine px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 disabled:from-[var(--muted-light)] disabled:to-[var(--muted-light)] disabled:cursor-not-allowed disabled:shadow-none text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
              >
                Reveal Votes
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-6 justify-center pt-4 pb-2 relative z-10">
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
