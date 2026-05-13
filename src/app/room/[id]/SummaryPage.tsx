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
      <div className="surface rounded p-5 sm:p-8 w-full max-w-3xl flex flex-col gap-5 fade-in">
        <div>
          <pre className="text-[10px] sm:text-xs leading-tight text-[var(--accent)] select-none whitespace-pre overflow-x-auto">
{`┌────────────────────────────────────┐
│  estimation ~ complete  [ ✓ ]      │
└────────────────────────────────────┘`}
          </pre>
          <h2 className="mt-3 text-base font-semibold text-[var(--foreground)]">
            <span className="text-[var(--accent)]">$</span> session_summary
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            {'// finished '}{estimated}{' '}{estimated === 1 ? 'story' : 'stories'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded surface-alt px-3 py-3">
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">stories</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] tabular-nums">
              {stories.length}
            </div>
          </div>
          <div className="rounded surface-alt px-3 py-3">
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">total points</div>
            <div className="text-2xl font-semibold text-[var(--accent)] tabular-nums">
              {total !== null ? total : '—'}
            </div>
          </div>
        </div>

        <div>
          <div className="term-title mb-2">log</div>
          <ul className="space-y-1 max-h-[40vh] overflow-y-auto pr-1">
            {stories.map((story, idx) => (
              <li
                key={story.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded surface-alt"
              >
                <span className="text-[10px] text-[var(--muted)] w-7 tabular-nums shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => isHost && onSelect(story.id)}
                  disabled={!isHost}
                  className={`flex-1 text-left text-xs text-[var(--foreground)] truncate ${
                    isHost ? 'cursor-pointer hover:underline hover:text-[var(--accent)]' : 'cursor-default'
                  }`}
                  title={isHost ? 'Re-open for voting' : story.title}
                >
                  {story.title}
                </button>
                {story.finalPoint !== null ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent-border)] tabular-nums shrink-0">
                    {story.finalPoint}
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--muted)] shrink-0">—</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isHost && (
          showAdd ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="flex-1 flex items-center gap-1.5 px-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded focus-within:border-[var(--accent)] transition-colors">
                <span className="text-[var(--accent)] text-xs">&gt;</span>
                <input
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submit();
                    if (e.key === 'Escape') { setShowAdd(false); setDraft(''); }
                  }}
                  placeholder="next_story_title…"
                  maxLength={200}
                  className="flex-1 py-2.5 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
                />
              </div>
              <button
                onClick={submit}
                disabled={!draft.trim()}
                className="btn-shine px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--surface-hover)] disabled:text-[var(--muted)] disabled:cursor-not-allowed text-[#08090b] text-xs font-semibold uppercase tracking-widest rounded transition-colors"
              >
                add
              </button>
              <button
                onClick={() => { setShowAdd(false); setDraft(''); }}
                className="px-3 py-2.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] uppercase tracking-widest"
              >
                esc
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="btn-shine px-5 py-2.5 self-center border border-[var(--surface-border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--foreground)] text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              + add another story
            </button>
          )
        )}
      </div>
    </div>
  );
}
