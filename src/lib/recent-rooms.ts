'use client';

const KEY = 'scrum-poker:recent-rooms';
const MAX = 5;
const EVENT = 'scrum-poker:recent-rooms-changed';

export interface RecentRoom {
  code: string;
  name: string;
  ts: number;
}

function read(): RecentRoom[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r): r is RecentRoom =>
      typeof r === 'object' && r != null &&
      typeof r.code === 'string' && typeof r.name === 'string' && typeof r.ts === 'number'
    );
  } catch {
    return [];
  }
}

function write(list: RecentRoom[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    cachedSnapshot = null;
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

let cachedSnapshot: RecentRoom[] | null = null;

export function getRecentRooms(): RecentRoom[] {
  if (cachedSnapshot) return cachedSnapshot;
  cachedSnapshot = read().sort((a, b) => b.ts - a.ts).slice(0, MAX);
  return cachedSnapshot;
}

export function subscribeRecentRooms(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function getRecentRoomsServerSnapshot(): RecentRoom[] {
  return EMPTY;
}

const EMPTY: RecentRoom[] = [];

export function rememberRoom(code: string, name: string) {
  const list = read().filter(r => r.code !== code);
  list.unshift({ code, name, ts: Date.now() });
  write(list.slice(0, MAX));
}

export function forgetRoom(code: string) {
  write(read().filter(r => r.code !== code));
}

export function formatRelative(ts: number): string {
  const delta = Date.now() - ts;
  const min = Math.floor(delta / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  return `${d}d ago`;
}
