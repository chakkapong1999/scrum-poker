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
    { label: 'Average', value: avg.toFixed(1), color: 'text-blue-600 dark:text-blue-400', bg: 'from-blue-500/5 to-blue-500/[0.02] dark:from-blue-500/10 dark:to-blue-500/5', border: 'border-blue-500/10 dark:border-blue-500/20' },
    { label: 'Min', value: String(min), color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-500/5 to-emerald-500/[0.02] dark:from-emerald-500/10 dark:to-emerald-500/5', border: 'border-emerald-500/10 dark:border-emerald-500/20' },
    { label: 'Max', value: String(max), color: 'text-rose-600 dark:text-rose-400', bg: 'from-rose-500/5 to-rose-500/[0.02] dark:from-rose-500/10 dark:to-rose-500/5', border: 'border-rose-500/10 dark:border-rose-500/20' },
  ];

  return (
    <div className="glass rounded-2xl p-6 float-in mb-6">
      <h3 className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-wider">Results</h3>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map(stat => (
          <div
            key={stat.label}
            className={`text-center p-4 rounded-xl bg-gradient-to-b ${stat.bg} border ${stat.border}`}
          >
            <div className={`text-2xl font-bold ${stat.color} tabular-nums`}>{stat.value}</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</div>
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
                  <span className="w-10 text-right font-mono text-sm text-slate-500 dark:text-slate-400 font-medium">{vote}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800/50 rounded-full h-7 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600/80 to-blue-500/60 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${(count / players.length) * 100}%`, minWidth: '3rem' }}
                    >
                      <span className="text-xs text-white/90 font-medium tabular-nums">{count} <span className="text-white/50">({pct}%)</span></span>
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
