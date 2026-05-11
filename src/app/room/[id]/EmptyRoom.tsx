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
      <div className="glass rounded-3xl p-8 sm:p-14 w-full max-w-xl flex flex-col items-center text-center gap-5 fade-in">
        <div className="w-20 h-20 rounded-3xl bg-[var(--primary-light)] border border-[var(--primary-border)] flex items-center justify-center">
          <svg className="w-10 h-10 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4" />
          </svg>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-serif font-bold text-[var(--foreground)]">
            No stories yet
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-sm">
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
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--felt)] border border-[var(--surface-border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
            />
            <button
              onClick={submit}
              disabled={!draft.trim()}
              className="btn-shine px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:brightness-110 disabled:from-[var(--muted-light)] disabled:to-[var(--muted-light)] disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[var(--primary)]/20"
            >
              Add story
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
