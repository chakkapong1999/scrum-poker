'use client';

import { useTheme } from '@/lib/theme';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      onClick={toggleTheme}
      className={`px-2 h-8 inline-flex items-center gap-1.5 surface text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--surface-border-hover)] text-[10px] tracking-widest uppercase transition-colors ${className}`}
      title={label}
      aria-label={label}
    >
      <span className="text-[var(--accent)]">{theme === 'dark' ? '◐' : '◑'}</span>
      <span className="hidden sm:inline">{theme === 'dark' ? 'dark' : 'light'}</span>
    </button>
  );
}
