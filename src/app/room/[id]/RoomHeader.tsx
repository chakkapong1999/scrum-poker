'use client';

import { ThemeToggle } from '@/components/ThemeToggle';

export function RoomHeader({ roomName, roomId, playerCount, copied, muted, onCopyInvite, onToggleMute }: Readonly<{
  roomName: string;
  roomId: string;
  playerCount: number;
  copied: boolean;
  muted: boolean;
  onCopyInvite: () => void;
  onToggleMute: () => void;
}>) {
  const btnBase = 'h-8 px-2.5 inline-flex items-center gap-1.5 surface text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--surface-border-hover)] text-[10px] tracking-widest uppercase transition-colors';

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[var(--surface-border)]">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[var(--accent)] text-sm shrink-0">$</span>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-[var(--foreground)] tracking-tight truncate">
            {roomName}
            <span className="text-[var(--muted)] font-normal ml-2">
              ~ <code className="text-[var(--accent)] tracking-wider">{roomId}</code>
            </span>
          </h1>
          <div className="text-[10px] text-[var(--muted)] mt-0.5 tracking-wider uppercase">
            {'// session_id: '}{roomId.toLowerCase()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onCopyInvite}
          className={`${btnBase} ${copied ? 'text-[var(--accent)] border-[var(--accent-border)]' : ''}`}
          title="Copy invite link"
        >
          <span>{copied ? '[ok]' : '[+]'}</span>
          <span className="hidden sm:inline">{copied ? 'copied' : 'invite'}</span>
        </button>
        <button
          onClick={onToggleMute}
          className={btnBase}
          title={muted ? 'Unmute sounds' : 'Mute sounds'}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          <span className="text-[var(--accent)]">{muted ? '×' : '♪'}</span>
          <span className="hidden sm:inline">{muted ? 'mute' : 'sound'}</span>
        </button>
        <ThemeToggle />
        <div className="h-8 px-2.5 surface inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-[var(--muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] pulse-soft" />
          <span className="tabular-nums">{playerCount}</span>
          <span>online</span>
        </div>
      </div>
    </header>
  );
}
