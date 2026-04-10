'use client';

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
          className="stroke-slate-200 dark:stroke-slate-700/30"
          strokeWidth="3"
        />
        <circle
          cx="22" cy="22" r={radius}
          fill="none"
          stroke={progress === 1 ? '#22c55e' : '#3b82f6'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{voted}/{total}</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">voted</span>
      </div>
    </div>
  );
}

export function PlayerArea({ players, revealed, isHost, votedCount, allVoted, floatingEmojis, chatBubbles, onReveal, onReset }: Readonly<{
  players: Player[];
  revealed: boolean;
  isHost: boolean;
  votedCount: number;
  allVoted: boolean;
  floatingEmojis: Map<string, FloatingEmoji[]>;
  chatBubbles: Map<string, ChatBubble[]>;
  onReveal: () => void;
  onReset: () => void;
}>) {
  return (
    <div className="glass rounded-2xl p-6 sm:p-8 mb-6" style={{ overflow: 'visible' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <VoteProgress voted={votedCount} total={players.length} />
          {revealed && (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Revealed
            </span>
          )}
          {!revealed && allVoted && votedCount > 0 && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium pulse-soft">All voted!</span>
          )}
        </div>
        {isHost && (
          <div className="flex gap-2">
            {revealed ? (
              <button
                onClick={onReset}
                className="btn-shine px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                New Round
              </button>
            ) : (
              <button
                onClick={onReveal}
                disabled={votedCount === 0}
                className="btn-shine px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:cursor-not-allowed disabled:shadow-none text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-600/20"
              >
                Reveal Votes
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-6 justify-center pt-4 pb-2">
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
