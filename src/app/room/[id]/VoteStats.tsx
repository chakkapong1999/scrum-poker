'use client';

import type { CSSProperties } from 'react';
import type { Player } from '@/types';

export default function VoteStats({ players }: Readonly<{ players: Player[] }>) {
  const votes = players
    .map(p => p.vote)
    .filter((v): v is string => v !== null && v !== 'voted' && v !== '?' && v !== '☕' && v !== '🧠');

  const numericVotes = votes.map(Number).filter(n => !Number.isNaN(n));

  // Render whenever there are countable votes — t-shirt decks have no numeric
  // votes but still deserve a distribution.
  if (votes.length === 0) return null;

  const hasNumeric = numericVotes.length > 0;
  const avg = hasNumeric ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length : 0;
  const consensus = votes.length > 1 && votes.every(v => v === votes[0]);

  // Vote distribution, most picked first
  const distribution = new Map<string, number>();
  players.forEach(p => {
    if (p.vote && p.vote !== 'voted') {
      distribution.set(p.vote, (distribution.get(p.vote) || 0) + 1);
    }
  });
  const tallies = Array.from(distribution.entries()).sort((a, b) => b[1] - a[1]);
  const topCount = tallies[0][1];

  let headline = votes[0];
  if (!consensus) headline = hasNumeric ? avg.toFixed(1) : tallies.filter(([, n]) => n === topCount).map(([v]) => v).join(' or ');

  return (
    <div className="results">
      <h3 className="sr-only">Results</h3>
      <p className="headline">{headline}</p>
      <p className="sub">
        {consensus && 'Everyone agrees'}
        {!consensus && !hasNumeric && 'Most picked'}
        {!consensus && hasNumeric && (
          <>
            <span>Average</span> · <span>Min</span> {Math.min(...numericVotes)} · <span>Max</span> {Math.max(...numericVotes)}
          </>
        )}
      </p>
      <div className="bars">
        {tallies.map(([vote, count]) => (
          <div key={vote} className="tally" title={`${count} ${count === 1 ? 'vote' : 'votes'} for ${vote}`}>
            <span>{count}</span>
            <i style={{ '--h': count / topCount } as CSSProperties} />
            <span>{vote}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
