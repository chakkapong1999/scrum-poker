'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Player } from '@/types';
import { PlayerCard } from './PlayerCard';
import type { FloatingEmoji, ChatBubble } from './PlayerCard';

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

export function PlayerArea({ players, revealed, isHost, myId, votedCount, allVoted, floatingEmojis, chatBubbles, onReveal, onReset, canCompleteStory, onCompleteStory, onMakeHost, onKick, votingSystem, storyTitle, children }: Readonly<{
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
  onKick: (targetPlayerId: string) => void;
  votingSystem: string[];
  storyTitle?: string;
  children?: ReactNode;
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

  const voters = players.filter(p => !p.isSpectator);
  const spectators = players.filter(p => p.isSpectator);
  // You always sit nearest your hand, at the bottom of the table
  const mine = voters.findIndex(p => p.id === myId);
  const seated = mine < 0 ? voters : [...voters.slice(mine), ...voters.slice(0, mine)];

  const renderPlayer = (player: Player) => (
    <PlayerCard
      player={player}
      revealed={revealed}
      isMe={player.id === myId}
      floatingEmojis={floatingEmojis.get(player.id) || []}
      chatBubbles={chatBubbles.get(player.id) || []}
      onMakeHost={isHost && player.id !== myId ? () => onMakeHost(player.id) : undefined}
      onKick={isHost && player.id !== myId ? () => onKick(player.id) : undefined}
    />
  );

  return (
    <div>
      <div className={`poker-table ${revealed ? 'revealed' : ''}`} style={{ '--n': seated.length } as CSSProperties}>
        <div className="felt">
          <div className="pot">
            <p className={`story-title line-clamp-2 ${storyTitle ? '' : 'empty'}`} title={storyTitle}>
              {storyTitle ?? 'What are we estimating?'}
            </p>

            {children}

            {revealed ? (
              <p className="sr-only" role="status">Revealed</p>
            ) : (
              <p className="status" role="status">
                <span>{votedCount}/{voters.length}</span> <span>voted</span>
                {allVoted && votedCount > 0 && <> · <b className="pulse-soft">All in!</b></>}
              </p>
            )}

            {isHost && (
              <div className="pot-actions">
                {revealed ? (
                  <>
                    {canCompleteStory && (
                      showSaveInput ? (
                        <>
                          <input
                            ref={inputRef}
                            value={pointDraft}
                            onChange={e => setPointDraft(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') submitPoint();
                              if (e.key === 'Escape') { setShowSaveInput(false); setPointDraft(''); }
                            }}
                            placeholder="Point"
                            aria-label="Final point"
                            maxLength={10}
                            className="point-input input-glow tabular-nums"
                          />
                          <button onClick={submitPoint} disabled={!pointDraft.trim()} className="btn-shine btn-gold pot-btn">
                            Save & Next
                          </button>
                          <button onClick={() => { setShowSaveInput(false); setPointDraft(''); }} className="felt-ghost pot-btn">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button onClick={openSaveInput} className="btn-shine btn-gold pot-btn">
                          Save & Next Story
                        </button>
                      )
                    )}
                    {!showSaveInput && (
                      <button onClick={onReset} className="felt-ghost pot-btn">
                        New Round
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={onReveal}
                    disabled={votedCount === 0}
                    className={`btn-shine btn-gold reveal pot-btn ${allVoted && votedCount > 0 ? 'ready' : ''}`}
                  >
                    Reveal Votes
                  </button>
                )}
              </div>
            )}
          </div>

          {seated.map((player, i) => {
            const angle = Math.PI / 2 + (2 * Math.PI * i) / seated.length;
            return (
              <div
                key={player.id}
                className="seat"
                style={{ '--c': Math.cos(angle).toFixed(3), '--s': Math.sin(angle).toFixed(3), '--i': i } as CSSProperties}
              >
                {renderPlayer(player)}
              </div>
            );
          })}
        </div>
      </div>

      {spectators.length > 0 && (
        <div className="watchers">
          {spectators.map(player => <div key={player.id}>{renderPlayer(player)}</div>)}
        </div>
      )}
    </div>
  );
}
