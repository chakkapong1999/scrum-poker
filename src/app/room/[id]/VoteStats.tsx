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

  const distribution = new Map<string, number>();
  players.forEach(p => {
    if (p.vote && p.vote !== 'voted') {
      distribution.set(p.vote, (distribution.get(p.vote) || 0) + 1);
    }
  });

  const stats = [
    { label: 'avg', value: avg.toFixed(1) },
    { label: 'min', value: String(min) },
    { label: 'max', value: String(max) },
  ];

  return (
    <div className="surface rounded p-5 float-in mb-5">
      <h3 className="term-title mb-4">results</h3>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="px-3 py-3 surface-alt rounded flex flex-col"
          >
            <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{stat.label}</span>
            <span className="text-xl font-semibold text-[var(--foreground)] tabular-nums mt-0.5">{stat.value}</span>
          </div>
        ))}
      </div>

      {distribution.size > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">{'// distribution'}</div>
          {Array.from(distribution.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([vote, count]) => {
              const pct = Math.round((count / players.length) * 100);
              return (
                <div key={vote} className="flex items-center gap-2.5">
                  <span className="w-8 text-right text-xs text-[var(--foreground)] font-semibold tabular-nums">{vote}</span>
                  <div className="flex-1 bg-[var(--background-alt)] border border-[var(--surface-border)] rounded h-6 overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${(count / players.length) * 100}%`, minWidth: '2.25rem' }}
                    >
                      <span className="text-[10px] text-[#08090b] font-semibold tabular-nums">{count} <span className="opacity-70">({pct}%)</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
