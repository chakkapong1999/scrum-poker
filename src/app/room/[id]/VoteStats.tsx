'use client';

import type { Player } from '@/types';

export default function VoteStats({ players }: Readonly<{ players: Player[] }>) {
  const votes = players
    .map(p => p.vote)
    .filter((v): v is string => v !== null && v !== 'voted' && v !== '?' && v !== '☕');

  const numericVotes = votes.map(Number).filter(n => !Number.isNaN(n));

  if (numericVotes.length === 0) return null;

  const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
  const min = Math.min(...numericVotes);
  const max = Math.max(...numericVotes);

  // Vote distribution
  const distribution = new Map<string, number>();
  players.forEach(p => {
    if (p.vote && p.vote !== 'voted') {
      distribution.set(p.vote, (distribution.get(p.vote) || 0) + 1);
    }
  });

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 float-in">
      <h3 className="text-lg font-semibold text-white mb-4">Results</h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{avg.toFixed(1)}</div>
          <div className="text-xs text-slate-400">Average</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{min}</div>
          <div className="text-xs text-slate-400">Min</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{max}</div>
          <div className="text-xs text-slate-400">Max</div>
        </div>
      </div>
      {distribution.size > 0 && (
        <div className="space-y-2">
          {Array.from(distribution.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([vote, count]) => (
              <div key={vote} className="flex items-center gap-3">
                <span className="w-8 text-right font-mono text-sm text-slate-300">{vote}</span>
                <div className="flex-1 bg-slate-700/50 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                    style={{ width: `${(count / players.length) * 100}%`, minWidth: '2rem' }}
                  >
                    <span className="text-xs text-white font-medium">{count}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
