'use client';

import { Logo } from '@/components/Logo';
import { SettingsMenu, ThemeToggle } from '@/components/SettingsMenu';

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MuteIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <line x1="17" y1="9" x2="22" y2="14" />
        <line x1="22" y1="9" x2="17" y2="14" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

export function ProgressRing({ value, total, size = 36 }: { value: number; total: number; size?: number }) {
  const r = (size - 6) / 2;
  const cir = 2 * Math.PI * r;
  const pct = total ? value / total : 0;
  const offset = cir * (1 - pct);
  const cx = size / 2;
  const stroke = pct === 1 ? 'var(--accent)' : 'var(--ink-2)';
  return (
    <svg width={size} height={size} className="progress-ring" style={{ transform: 'rotate(-90deg)' }} aria-hidden>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--line)" strokeWidth="3" />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke={stroke} strokeWidth="3"
        strokeDasharray={cir} strokeDashoffset={offset} strokeLinecap="round"
      />
    </svg>
  );
}

export function RoomHeader({
  roomName,
  roomId,
  votingSystemKey,
  votedCount,
  total,
  copied,
  muted,
  onCopyInvite,
  onToggleMute,
  onLeave,
}: Readonly<{
  roomName: string;
  roomId: string;
  votingSystemKey: string;
  votedCount: number;
  total: number;
  copied: boolean;
  muted: boolean;
  onCopyInvite: () => void;
  onToggleMute: () => void;
  onLeave: () => void;
}>) {
  return (
    <div className="header-bar between">
      <div className="row" style={{ gap: 14, minWidth: 0 }}>
        <Logo />
        <span style={{ height: 18, width: 1, background: 'var(--line)' }} />
        <div className="col" style={{ minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>
            {roomName}
          </span>
          <span className="cap" style={{ marginTop: 2 }}>{roomId} · {votingSystemKey}</span>
        </div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <div className="row" style={{ gap: 6 }}>
          <ProgressRing value={votedCount} total={total} />
          <span className="num" style={{ fontSize: 13, color: 'var(--ink-2)', marginRight: 4 }}>
            {votedCount}/{total}
          </span>
        </div>
        <button className="btn btn-sm" onClick={onCopyInvite}>
          {copied ? (<><CheckIcon /> copied</>) : (<><CopyIcon /> invite</>)}
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onToggleMute}
          title={muted ? 'Unmute sounds' : 'Mute sounds'}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          <MuteIcon muted={muted} />
        </button>
        <SettingsMenu />
        <ThemeToggle />
        <button className="btn btn-ghost btn-sm" onClick={onLeave}>leave</button>
      </div>
    </div>
  );
}
