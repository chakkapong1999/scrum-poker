'use client';

import { VoteCard } from './PlayerCard';

export function VotingDeck({ votingSystem, myVote, onVote }: Readonly<{
  votingSystem: string[];
  myVote: string | null;
  onVote: (value: string) => void;
}>) {
  return (
    <div className="mt-8 slide-up">
      <h3 className="text-xs text-[var(--muted)] mb-4 text-center uppercase tracking-widest font-medium font-serif">Pick your estimate</h3>
      <div className="flex flex-wrap gap-3 justify-center">
        {votingSystem.map(value => (
          <VoteCard
            key={value}
            value={value}
            selected={myVote === value}
            onClick={() => onVote(value)}
            disabled={false}
          />
        ))}
      </div>
    </div>
  );
}
