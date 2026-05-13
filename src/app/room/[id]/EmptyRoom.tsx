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
      <div className="surface rounded p-6 sm:p-10 w-full max-w-xl flex flex-col gap-5 fade-in">
        <pre className="text-[10px] sm:text-xs leading-tight text-[var(--muted)] select-none whitespace-pre overflow-x-auto">
{`┌────────────────────────────────────┐
│  backlog ~ empty                   │
│                                    │
│  no stories detected.              │
└────────────────────────────────────┘`}
        </pre>

        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            <span className="text-[var(--accent)]">$</span> add_first_story
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            {'// '}{isHost ? 'add a story to start estimating' : 'waiting for host to add a story…'}
          </p>
        </div>

        {isHost && (
          <div className="flex flex-col sm:flex-row gap-2 w-full mt-1">
            <div className="flex-1 flex items-center gap-1.5 px-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded focus-within:border-[var(--accent)] transition-colors">
              <span className="text-[var(--accent)] text-xs">&gt;</span>
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder="login_page_redesign"
                maxLength={200}
                className="flex-1 py-2.5 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
              />
            </div>
            <button
              onClick={submit}
              disabled={!draft.trim()}
              className="btn-shine px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--surface-hover)] disabled:text-[var(--muted)] disabled:cursor-not-allowed text-[#08090b] text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              add story
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
