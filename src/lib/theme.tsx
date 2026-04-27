'use client';

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
export type Accent = 'clay' | 'ink' | 'moss' | 'cobalt' | 'plum';
export type Density = 'compact' | 'comfortable' | 'spacious';

interface ThemeContextValue {
  theme: Theme;
  accent: Accent;
  density: Density;
  setTheme: (t: Theme) => void;
  setAccent: (a: Accent) => void;
  setDensity: (d: Density) => void;
  toggleTheme: () => void;
}

const DEFAULT: ThemeContextValue = {
  theme: 'light',
  accent: 'clay',
  density: 'comfortable',
  setTheme: () => {},
  setAccent: () => {},
  setDensity: () => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(DEFAULT);

const ACCENTS: Accent[] = ['clay', 'ink', 'moss', 'cobalt', 'plum'];
const DENSITIES: Density[] = ['compact', 'comfortable', 'spacious'];
const THEMES: Theme[] = ['light', 'dark'];

interface Settings { theme: Theme; accent: Accent; density: Density }

const SERVER_SETTINGS: Settings = { theme: 'light', accent: 'clay', density: 'comfortable' };
const listeners = new Set<() => void>();
let cached: Settings | null = null;

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const v = localStorage.getItem(key) as T | null;
  return v && allowed.includes(v) ? v : fallback;
}

function readSettings(): Settings {
  return {
    theme: readStored<Theme>('theme', THEMES, 'light'),
    accent: readStored<Accent>('accent', ACCENTS, 'clay'),
    density: readStored<Density>('density', DENSITIES, 'comfortable'),
  };
}

function getSnapshot(): Settings {
  if (typeof window === 'undefined') return SERVER_SETTINGS;
  if (!cached) cached = readSettings();
  return cached;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function update(patch: Partial<Settings>) {
  const next = { ...getSnapshot(), ...patch };
  cached = next;
  if (typeof window !== 'undefined') {
    if (patch.theme !== undefined) localStorage.setItem('theme', next.theme);
    if (patch.accent !== undefined) localStorage.setItem('accent', next.accent);
    if (patch.density !== undefined) localStorage.setItem('density', next.density);
  }
  listeners.forEach(l => l());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SETTINGS);
  const { theme, accent, density } = settings;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  const setTheme = useCallback((t: Theme) => update({ theme: t }), []);
  const setAccent = useCallback((a: Accent) => update({ accent: a }), []);
  const setDensity = useCallback((d: Density) => update({ density: d }), []);
  const toggleTheme = useCallback(() => update({ theme: getSnapshot().theme === 'dark' ? 'light' : 'dark' }), []);

  return (
    <ThemeContext.Provider value={{ theme, accent, density, setTheme, setAccent, setDensity, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export const ACCENT_OPTIONS: { value: Accent; label: string }[] = [
  { value: 'clay', label: 'Clay' },
  { value: 'ink', label: 'Ink' },
  { value: 'moss', label: 'Moss' },
  { value: 'cobalt', label: 'Cobalt' },
  { value: 'plum', label: 'Plum' },
];

export const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfy' },
  { value: 'spacious', label: 'Spacious' },
];
