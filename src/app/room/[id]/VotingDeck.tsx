'use client';

import { useState, type CSSProperties } from 'react';
import { VoteCard } from './PlayerCard';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem('votingDeckCollapsed') === '1';
  } catch {
    return false;
  }
}

export function VotingDeck({ votingSystem, myVote, onVote, disabled = false }: Readonly<{
  votingSystem: string[];
  myVote: string | null;
  onVote: (value: string) => void;
  disabled?: boolean;
}>) {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('votingDeckCollapsed', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  const last = votingSystem.length - 1;

  return (
    <section className="hand-wrap" aria-label="Your cards">
      <div className="hand-head">
        <h3>{disabled ? 'Your card' : 'Pick your card'}</h3>
        <button
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Show voting cards' : 'Hide voting cards'}
          title={collapsed ? 'Show voting cards' : 'Hide voting cards'}
          className="hand-toggle"
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
        <div className="hand" style={{ '--n': votingSystem.length } as CSSProperties}>
          {votingSystem.map((value, i) => (
            <VoteCard
              key={value}
              value={value}
              selected={myVote === value}
              onClick={() => onVote(value)}
              disabled={disabled}
              style={{ '--i': i, '--t': last > 0 ? (2 * i) / last - 1 : 0 } as CSSProperties}
            />
          ))}
        </div>
      )}
    </section>
  );
}
