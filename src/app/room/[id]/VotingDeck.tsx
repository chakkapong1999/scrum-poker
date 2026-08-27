'use client';

import { useState } from 'react';
import { VoteCard } from './PlayerCard';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem('votingDeckCollapsed') === '1';
  } catch {
    return false;
  }
}

export function VotingDeck({ votingSystem, myVote, onVote }: Readonly<{
  votingSystem: string[];
  myVote: string | null;
  onVote: (value: string) => void;
}>) {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('votingDeckCollapsed', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  return (
    <div className="mt-8 slide-up">
      <div className="deco-rule max-w-xs mx-auto mb-5 text-[10px]" aria-hidden>♠</div>
      <div className="flex items-center justify-center gap-2.5 mb-5">
        <h3 className="text-xs text-[var(--gold)] text-center uppercase tracking-[0.3em] font-semibold font-serif">Pick your card</h3>
        <button
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Show voting cards' : 'Hide voting cards'}
          title={collapsed ? 'Show voting cards' : 'Hide voting cards'}
          className="p-1 rounded-md glass text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--surface-hover)] transition-all"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
      {!collapsed && (
        <div className="flex flex-wrap gap-3 justify-center pb-2">
          {votingSystem.map((value, i) => (
            <div key={value} className="deal-in" style={{ animationDelay: `${i * 45}ms` }}>
              <VoteCard
                value={value}
                selected={myVote === value}
                onClick={() => onVote(value)}
                disabled={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
