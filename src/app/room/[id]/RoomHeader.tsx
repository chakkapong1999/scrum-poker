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
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-500/10 dark:border-blue-500/20 flex items-center justify-center">
          <span className="text-lg">🃏</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{roomName}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <code className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wider">
              {roomId}
            </code>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCopyInvite}
          className={`px-3.5 py-2 glass rounded-xl text-sm transition-all flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 ${
            copied ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="hidden sm:inline text-xs">Invite</span>
            </>
          )}
        </button>
        <button
          onClick={onToggleMute}
          className="p-2 glass rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
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
        <ThemeToggle />
        <div className="px-3 py-2 glass rounded-xl text-xs text-slate-500 dark:text-slate-500 font-medium">
          {playerCount} player{playerCount === 1 ? '' : 's'}
        </div>
      </div>
    </header>
  );
}
