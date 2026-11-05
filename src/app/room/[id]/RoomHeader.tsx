'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import { FeedbackDialog } from '@/components/FeedbackDialog';

export function RoomHeader({ roomName, roomId, playerCount, copied, muted, onCopyInvite, onToggleMute, onLeave }: Readonly<{
  roomName: string;
  roomId: string;
  playerCount: number;
  copied: boolean;
  muted: boolean;
  onCopyInvite: () => void;
  onToggleMute: () => void;
  onLeave: () => void;
}>) {
  return (
    <header className="bar">
      <div className="bar-title">
        <span className="wordmark gold-foil">Scrum Poker</span>
        <h1 className="room-title">{roomName}</h1>
      </div>
      <div className="bar-actions">
        <button onClick={onCopyInvite} className="chip">
          <span className={copied ? 'text-[var(--emerald)]' : ''}>{copied ? 'Copied!' : 'Invite'}</span>
          <code>{roomId}</code>
        </button>
        <div className="chip">
          {playerCount} player{playerCount === 1 ? '' : 's'}
        </div>
        <button
          onClick={onToggleMute}
          className="chip chip-icon"
          title={muted ? 'Unmute sounds' : 'Mute sounds'}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {muted ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
        <FeedbackDialog icon />
        <ThemeToggle />
        <button onClick={onLeave} className="chip">Leave room</button>
      </div>
    </header>
  );
}
