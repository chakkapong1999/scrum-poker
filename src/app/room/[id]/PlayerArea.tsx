'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
          stroke={progress === 1 ? 'var(--emerald)' : 'var(--gold)'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-[var(--foreground)] tabular-nums font-serif">{voted}/{total}</span>
        <span className="text-[11px] text-[var(--muted)]">voted</span>
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

export function PlayerArea({ players, revealed, isHost, myId, votedCount, allVoted, floatingEmojis, chatBubbles, onReveal, onReset, canCompleteStory, onCompleteStory, onMakeHost, votingSystem }: Readonly<{
  players: Player[];
  revealed: boolean;
  isHost: boolean;
  myId: string | null;
  votedCount: number;
  allVoted: boolean;
  floatingEmojis: Map<string, FloatingEmoji[]>;
  chatBubbles: Map<string, ChatBubble[]>;
  onReveal: () => void;
  onReset: () => void;
  canCompleteStory: boolean;
  onCompleteStory: (finalPoint: string) => void;
  onMakeHost: (targetPlayerId: string) => void;
  votingSystem: string[];
}>) {
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [pointDraft, setPointDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the save form when the round stops being completable (adjust-during-render
  // pattern — avoids a cascading setState-in-effect)
  const canSave = revealed && canCompleteStory;
  const [prevCanSave, setPrevCanSave] = useState(canSave);
  if (prevCanSave !== canSave) {
    setPrevCanSave(canSave);
    if (!canSave) {
      setShowSaveInput(false);
      setPointDraft('');
    }
  }

  useEffect(() => {
    if (showSaveInput) inputRef.current?.focus();
  }, [showSaveInput]);

  const suggested = useMemo(() => suggestedPoint(players, votingSystem), [players, votingSystem]);

  const openSaveInput = () => {
    setPointDraft(suggested);
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
    <div className="felt-area rounded-[1.75rem] p-6 sm:p-8 mb-6" style={{ overflow: 'visible' }}>
      <div className="flex items-center justify-between mb-6 relative z-10 gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <VoteProgress voted={votedCount} total={players.filter(p => !p.isSpectator).length} />
          {revealed && (
            <span className="text-sm font-medium text-[var(--emerald)] flex items-center gap-1.5 font-serif italic">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Revealed
            </span>
          )}
          {!revealed && allVoted && votedCount > 0 && (
            <span className="text-sm text-[var(--gold)] font-semibold font-serif italic pulse-soft">All in!</span>
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
                        className="w-20 px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--gold-border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none input-glow tabular-nums font-mono"
                      />
                      <button
                        onClick={submitPoint}
                        disabled={!pointDraft.trim()}
                        className="btn-shine btn-felt px-4 py-2 text-sm font-semibold rounded-lg"
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
                      onClick={openSaveInput}
                      className="btn-shine btn-felt px-5 py-2.5 text-sm font-semibold rounded-lg tracking-wide"
                    >
                      Save & Next Story
                    </button>
                  )
                )}
                {!showSaveInput && (
                  <button
                    onClick={onReset}
                    className="btn-shine btn-ghost glass px-5 py-2.5 text-sm font-semibold rounded-lg tracking-wide"
                  >
                    New Round
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onReveal}
                disabled={votedCount === 0}
                className="btn-shine btn-gold px-6 py-2.5 text-sm font-bold rounded-lg tracking-wide"
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
            onMakeHost={isHost && player.id !== myId ? () => onMakeHost(player.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
