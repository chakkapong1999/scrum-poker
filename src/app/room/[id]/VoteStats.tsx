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

  const stats = [
    {
      label: 'Average',
      value: avg.toFixed(1),
      color: 'text-[var(--primary)]',
      bg: 'bg-[var(--primary-light)]',
      border: 'border-[var(--primary-border)]',
    },
    {
      label: 'Min',
      value: String(min),
      color: 'text-[var(--emerald)]',
      bg: 'bg-[var(--emerald-light)]',
      border: 'border-[var(--emerald-border)]',
    },
    {
      label: 'Max',
      value: String(max),
      color: 'text-[var(--accent-red)]',
      bg: 'bg-[var(--accent-red-light)]',
      border: 'border-[var(--accent-red-border)]',
    },
  ];

  return (
    <div className="glass rounded-2xl p-6 float-in mb-6">
      <h3 className="text-xs font-medium text-[var(--muted)] mb-4 uppercase tracking-widest font-serif">Results</h3>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map(stat => (
          <div
            key={stat.label}
            className={`text-center p-4 rounded-xl ${stat.bg} border ${stat.border}`}
          >
            <div className={`text-2xl font-bold font-serif ${stat.color} tabular-nums`}>{stat.value}</div>
            <div className="text-[11px] text-[var(--muted)] mt-1 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {distribution.size > 0 && (
        <div className="space-y-2">
          {Array.from(distribution.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([vote, count]) => {
              const pct = Math.round((count / players.length) * 100);
              return (
                <div key={vote} className="flex items-center gap-3">
                  <span className="w-10 text-right font-mono text-sm text-[var(--muted)] font-semibold">{vote}</span>
                  <div className="flex-1 bg-[var(--felt)] border border-[var(--surface-border)] rounded-full h-7 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${(count / players.length) * 100}%`, minWidth: '3rem' }}
                    >
                      <span className="text-xs text-white/90 font-medium tabular-nums">{count} <span className="text-white/60">({pct}%)</span></span>
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
