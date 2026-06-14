'use client';

import type { Player } from '@/types';

export default function VoteStats({ players }: Readonly<{ players: Player[] }>) {
  const votes = players
    .map(p => p.vote)
    .filter((v): v is string => v !== null && v !== 'voted' && v !== '?' && v !== '☕');

  const numericVotes = votes.map(Number).filter(n => !Number.isNaN(n));

  // Render whenever there are countable votes — t-shirt decks have no numeric
  // votes but still deserve a distribution.
  if (votes.length === 0) return null;

  const hasNumeric = numericVotes.length > 0;
  const avg = hasNumeric ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length : 0;
  const min = hasNumeric ? Math.min(...numericVotes) : 0;
  const max = hasNumeric ? Math.max(...numericVotes) : 0;
  const consensus = votes.length > 1 && votes.every(v => v === votes[0]);

  // Vote distribution
  const distribution = new Map<string, number>();
  players.forEach(p => {
    if (p.vote && p.vote !== 'voted') {
      distribution.set(p.vote, (distribution.get(p.vote) || 0) + 1);
    }
  });

  const topCount = Math.max(...Array.from(distribution.values()));

  const stats = [
    {
      label: 'Average',
      value: avg.toFixed(1),
      color: 'text-[var(--gold)]',
      bg: 'bg-[var(--gold-light)]',
      border: 'border-[var(--gold-border)]',
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
    <div className="panel rounded-2xl p-6 float-in mb-6 [--radius:1rem]">
      <h3 className="text-xs font-semibold text-[var(--gold)] mb-4 uppercase tracking-[0.3em] font-serif">Results</h3>

      {consensus && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-[var(--gold-light)] border border-[var(--gold-border)] flex items-center justify-center gap-2">
          <span aria-hidden>♠</span>
          <span className="text-sm font-serif italic font-semibold gold-foil">Perfect consensus — the table agrees</span>
          <span aria-hidden>♠</span>
        </div>
      )}

      {hasNumeric && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map(stat => (
            <div
              key={stat.label}
              className={`text-center p-4 rounded-xl ${stat.bg} border ${stat.border}`}
            >
              <div className={`text-3xl font-serif font-semibold ${stat.color} tabular-nums`}>{stat.value}</div>
              <div className="text-[10px] text-[var(--muted)] mt-1 uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {distribution.size > 0 && (
        <div className="space-y-2">
          {Array.from(distribution.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([vote, count]) => {
              const pct = Math.round((count / players.length) * 100);
              const isTop = count === topCount;
              return (
                <div key={vote} className="flex items-center gap-3">
                  <span className="w-10 text-right font-serif text-base text-[var(--foreground)] font-semibold">{vote}</span>
                  <div className="flex-1 bg-[var(--felt)] border border-[var(--surface-border)] rounded-full h-7 overflow-hidden">
                    <div
                      className={`h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500 ${
                        isTop
                          ? 'bg-gradient-to-r from-[#c89a38] to-[#a87e24]'
                          : 'bg-gradient-to-r from-[#27745a] to-[#1c5742]'
                      }`}
                      style={{ width: `${(count / players.length) * 100}%`, minWidth: '3rem' }}
                    >
                      <span className={`text-xs font-medium tabular-nums ${isTop ? 'text-[#241a06]' : 'text-white/90'}`}>
                        {count} <span className={isTop ? 'text-[#241a06]/60' : 'text-white/60'}>({pct}%)</span>
                      </span>
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
