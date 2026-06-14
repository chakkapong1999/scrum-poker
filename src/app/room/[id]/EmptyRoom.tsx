'use client';

import { useState } from 'react';

export function EmptyRoom({ isHost, onAdd }: Readonly<{
  isHost: boolean;
  onAdd: (title: string) => void;
}>) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft('');
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="panel rounded-3xl p-8 sm:p-14 w-full max-w-xl flex flex-col items-center text-center gap-5 fade-in [--radius:1.5rem]">
        <div className="card-fan" aria-hidden>
          <span className="mini-card">♠</span>
          <span className="mini-card"><span className="red">♥</span></span>
          <span className="mini-card">♣</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold gold-foil">
            No stories yet
          </h2>
          <div className="deco-rule max-w-40 mx-auto text-[9px]" aria-hidden>♦</div>
          <p className="text-sm text-[var(--muted)] max-w-sm font-serif italic">
            {isHost
              ? 'Add your first story to get the team voting.'
              : 'Waiting for the host to add a story…'}
          </p>
        </div>

        {isHost && (
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md mt-2">
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder="e.g. Login page redesign"
              maxLength={200}
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none input-glow transition-all"
            />
            <button
              onClick={submit}
              disabled={!draft.trim()}
              className="btn-shine btn-felt px-6 py-3 text-sm font-semibold rounded-lg tracking-wide"
            >
              Add story
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
