'use client';

import { VoteCard } from './PlayerCard';

export function VotingDeck({ votingSystem, myVote, onVote }: Readonly<{
  votingSystem: string[];
  myVote: string | null;
  onVote: (value: string) => void;
}>) {
  return (
    <div className="mt-6 slide-up">
      <h3 className="term-title mb-3 text-center">pick estimate</h3>
      <div className="flex flex-wrap gap-2.5 justify-center">
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
