'use client';

import type { Player } from '@/types';

export default function VoteStats({ players }: Readonly<{ players: Player[] }>) {
  const numericVotes = players
    .map(p => p.vote)
    .filter((v): v is string => v !== null && v !== 'voted')
    .filter(v => !Number.isNaN(Number(v)))
    .map(Number);

  const counts = new Map<string, number>();
  players.forEach(p => {
    if (p.vote && p.vote !== 'voted') {
      counts.set(p.vote, (counts.get(p.vote) || 0) + 1);
    }
  });

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const consensus = sorted[0];
  const votedTotal = players.filter(p => p.vote && p.vote !== 'voted').length;

  if (votedTotal === 0) return null;

  const hasNumeric = numericVotes.length > 0;
  const avg = hasNumeric ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length : 0;
  const min = hasNumeric ? Math.min(...numericVotes) : 0;
  const max = hasNumeric ? Math.max(...numericVotes) : 0;

  return (
    <div className="fade-up" style={{ width: '100%', maxWidth: 720, marginTop: 8 }}>
      <div className="between" style={{ marginBottom: 14 }}>
        <span className="cap">results</span>
        <span className="muted" style={{ fontSize: 13 }}>
          {votedTotal} of {players.length} voted
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="stat-tile">
          <div className="cap" style={{ marginBottom: 8 }}>average</div>
          <div className="stat-num accent num">{hasNumeric ? avg.toFixed(1) : '—'}</div>
        </div>
        <div className="stat-tile">
          <div className="cap" style={{ marginBottom: 8 }}>consensus</div>
          <div className="stat-num num">{consensus ? consensus[0] : '—'}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {consensus ? `${consensus[1]} vote${consensus[1] === 1 ? '' : 's'}` : ''}
          </div>
        </div>
        <div className="stat-tile">
          <div className="cap" style={{ marginBottom: 8 }}>spread</div>
          <div className="stat-num num">{hasNumeric ? (min === max ? min : `${min}–${max}`) : '—'}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {hasNumeric ? (min === max ? 'unanimous' : `${max - min}pt range`) : ''}
          </div>
        </div>
      </div>

      {sorted.length > 0 && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(([vote, count]) => {
            const pct = Math.round((count / players.length) * 100);
            return (
              <div key={vote} className="row" style={{ gap: 12 }}>
                <span className="mono num" style={{ width: 32, textAlign: 'right', fontSize: 13, color: 'var(--ink-2)' }}>{vote}</span>
                <div style={{
                  flex: 1,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 100,
                  height: 22,
                  overflow: 'hidden',
                }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(count / players.length) * 100}%`,
                      minWidth: '2.5rem',
                      background: 'var(--accent)',
                      borderRadius: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 8,
                      color: 'var(--accent-fg)',
                      fontSize: 11,
                      fontWeight: 500,
                      transition: 'width 500ms cubic-bezier(.2, .8, .2, 1)',
                    }}
                  >
                    {count} <span style={{ opacity: 0.7, marginLeft: 4 }}>({pct}%)</span>
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
