'use client';

import { useEffect, useRef, useState } from 'react';
import { ACCENT_OPTIONS, DENSITY_OPTIONS, useTheme } from '@/lib/theme';

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-icon"
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export function SettingsMenu() {
  const { accent, density, setAccent, setDensity } = useTheme();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={wrap} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn btn-ghost btn-icon"
        title="Display settings"
        aria-label="Display settings"
        aria-expanded={open}
      >
        <CogIcon />
      </button>
      {open && (
        <div
          className="popover fade-up"
          style={{ right: 0, bottom: 'auto', top: 'calc(100% + 8px)', width: 240 }}
          role="menu"
        >
          <div className="cap" style={{ marginBottom: 8 }}>Accent</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {ACCENT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setAccent(opt.value)}
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={accent === opt.value}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  border: accent === opt.value ? '2px solid var(--ink)' : '1px solid var(--line-strong)',
                  cursor: 'pointer',
                  background:
                    opt.value === 'clay' ? 'oklch(0.62 0.18 35)' :
                    opt.value === 'ink' ? 'oklch(0.32 0 0)' :
                    opt.value === 'moss' ? 'oklch(0.55 0.12 145)' :
                    opt.value === 'cobalt' ? 'oklch(0.55 0.18 255)' :
                    'oklch(0.50 0.18 330)',
                }}
              />
            ))}
          </div>
          <div className="cap" style={{ marginBottom: 8 }}>Density</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {DENSITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDensity(opt.value)}
                aria-pressed={density === opt.value}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: density === opt.value ? 'var(--ink)' : 'var(--surface)',
                  color: density === opt.value ? 'var(--bg)' : 'var(--ink-2)',
                  borderColor: density === opt.value ? 'var(--ink)' : 'var(--line-strong)',
                  justifyContent: 'center',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
