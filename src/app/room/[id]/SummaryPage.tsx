'use client';

import { useState } from 'react';
import type { Story } from '@/types';

function computeTotal(stories: Story[]): number | null {
  let sum = 0;
  let hasNumeric = false;
  for (const s of stories) {
    if (s.finalPoint === null) continue;
    const n = parseFloat(s.finalPoint);
    if (!Number.isNaN(n)) {
      sum += n;
      hasNumeric = true;
    }
  }
  return hasNumeric ? sum : null;
}

export function SummaryPage({
  stories,
  isHost,
  onAdd,
  onSelect,
}: Readonly<{
  stories: Story[];
  isHost: boolean;
  onAdd: (title: string) => void;
  onSelect: (storyId: string) => void;
}>) {
  const [draft, setDraft] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const total = computeTotal(stories);
  const estimated = stories.filter(s => s.finalPoint !== null).length;

  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft('');
    setShowAdd(false);
  };

  return (
    <div className="flex-1 flex items-start justify-center px-4 py-8">
      <div className="panel rounded-3xl p-6 sm:p-10 w-full max-w-3xl flex flex-col gap-6 fade-in [--radius:1.5rem]">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[var(--gold-light)] border border-[var(--gold-border)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold gold-foil">
              All stories estimated
            </h2>
            <div className="deco-rule max-w-50 mx-auto mt-2 mb-2 text-[9px]" aria-hidden>♦</div>
            <p className="text-sm text-[var(--muted)] font-serif italic">
              Nice work — the team finished {estimated} {estimated === 1 ? 'story' : 'stories'}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[var(--felt)] border border-[var(--surface-border)] px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">Stories</div>
            <div className="text-3xl font-serif font-semibold text-[var(--foreground)] tabular-nums">
              {stories.length}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--gold-light)] border border-[var(--gold-border)] px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]">Total points</div>
            <div className="text-3xl font-serif font-semibold gold-foil tabular-nums">
              {total !== null ? total : '—'}
            </div>
          </div>
        </div>

        <ul className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
          {stories.map((story, idx) => (
            <li
              key={story.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--felt)] border border-[var(--surface-border)]"
            >
              <span className="text-[10px] text-[var(--muted)] font-mono w-6 tabular-nums shrink-0">
                #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => onSelect(story.id)}
                disabled={!isHost}
                className={`flex-1 text-left text-sm text-[var(--foreground)] truncate ${
                  isHost ? 'cursor-pointer hover:underline' : 'cursor-default'
                }`}
                title={isHost ? 'Re-open for voting' : story.title}
              >
                {story.title}
              </button>
              {story.finalPoint !== null ? (
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[var(--emerald-light)] text-[var(--emerald)] border border-[var(--emerald-border)] tabular-nums shrink-0">
                  {story.finalPoint}
                </span>
              ) : (
                <span className="text-[10px] text-[var(--muted)] shrink-0">—</span>
              )}
            </li>
          ))}
        </ul>

        {isHost && (
          showAdd ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submit();
                  if (e.key === 'Escape') { setShowAdd(false); setDraft(''); }
                }}
                placeholder="Next story title…"
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
              <button
                onClick={() => { setShowAdd(false); setDraft(''); }}
                className="px-4 py-3 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="btn-shine btn-felt px-6 py-3 text-sm font-semibold rounded-lg tracking-wide self-center"
            >
              + Add another story
            </button>
          )
        )}
      </div>
    </div>
  );
}
