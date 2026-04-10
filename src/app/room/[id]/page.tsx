'use client';

import { memo, useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getSocket } from '@/lib/socket';
import { playAllVotedSound, playRevealSound, playPopSound, playEmojiSound, speakMessage, isMuted, setMuted } from '@/lib/sounds';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { RoomState, Player } from '@/types';

const VoteStats = dynamic(() => import('./VoteStats'), { ssr: false });

const VoteCard = memo(function VoteCard({ value, selected, onClick, disabled }: Readonly<{
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`vote-card w-16 h-24 rounded-xl text-lg font-bold ${
        selected
          ? 'bg-blue-600 text-white glow-blue ring-1 ring-blue-400/50 -translate-y-2'
          : 'glass-light text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300/50 dark:hover:border-slate-500/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {value}
    </button>
  );
});

interface FloatingEmoji {
  id: number;
  emoji: string;
}

interface ChatBubble {
  id: number;
  message: string;
}

const PlayerCard = memo(function PlayerCard({ player, revealed, floatingEmojis, chatBubbles }: Readonly<{
  player: Player;
  revealed: boolean;
  floatingEmojis: FloatingEmoji[];
  chatBubbles: ChatBubble[];
}>) {
  const hasVoted = player.vote !== null;
  const showVote = revealed && !!player.vote && player.vote !== 'voted';

  // Generate a consistent color from player name
  const hue = player.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div className="flex flex-col items-center gap-2.5 float-in relative" style={{ overflow: 'visible' }}>
      {/* Chat bubbles */}
      {chatBubbles.map(cb => (
        <div
          key={cb.id}
          className="chat-bubble absolute z-60"
          style={{ top: '-44px', left: '50%' }}
        >
          <div className="glass text-slate-800 dark:text-slate-100 text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg max-w-40 truncate whitespace-nowrap">
            {cb.message}
          </div>
          <div className="w-2 h-2 bg-white/70 dark:bg-slate-800/80 rotate-45 mx-auto -mt-1" />
        </div>
      ))}
      {/* Floating emojis */}
      {floatingEmojis.map(fe => (
        <span
          key={fe.id}
          className="emoji-float absolute text-2xl z-50"
          style={{ top: '-10px', left: '50%' }}
        >
          {fe.emoji}
        </span>
      ))}
      {/* Card with 3D flip */}
      <div className="card-flip-container">
        <div className={`card-flip-inner ${showVote ? 'flipped' : ''}`}>
          {/* Back face (default — shows ✓ or ?) */}
          <div className={`card-flip-back ${hasVoted ? 'card-back-voted' : 'card-back-idle'}`}>
            {hasVoted ? '✓' : '?'}
          </div>
          {/* Front face (revealed vote value) */}
          <div className="card-flip-front card-front-revealed">
            {player.vote ?? ''}
          </div>
        </div>
      </div>
      {/* Player info */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: `hsl(${hue}, 60%, 60%)` }}
          />
          <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-20 font-medium">{player.name}</span>
          {player.isHost && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">HOST</span>
          )}
        </div>
      </div>
    </div>
  );
});

const REACTION_EMOJIS = ['👍', '👏', '🎉', '🔥', '😂', '🤔', '😱', '💀', '🚀', '❤️', '👀', '🙈', '🍻'];

const QUICK_MESSAGES = [
  'Let\'s go!', 'Hurry up! 😄', 'Take your time',
  'Need more info', 'Too complex', 'Easy one!',
  'Agree 👍', 'Not sure...', 'Let\'s discuss',
];

function removeById<T extends { id: number }>(items: T[], targetId: number): T[] {
  return items.filter(item => item.id !== targetId);
}

function handleSoundAndTitle(state: RoomState, prev: RoomState | null) {
  if (state.revealed && prev && !prev.revealed) {
    playRevealSound();
    if (document.hidden) document.title = '🎉 Votes Revealed! — Scrum Poker';
    return;
  }
  if (state.revealed || state.players.length === 0) return;
  const allVotedNow = state.players.every(p => p.vote !== null);
  const allVotedBefore = prev?.players.length ? prev.players.every(p => p.vote !== null) : false;
  if (allVotedNow && !allVotedBefore) {
    playAllVotedSound();
    if (document.hidden) document.title = '✅ All Voted! — Scrum Poker';
  }
}

function applyVoteUpdate(
  prev: RoomState | null,
  playerId: string,
  vote: string | null,
): RoomState | null {
  if (!prev || prev.revealed) return prev;
  const players = prev.players.map(p =>
    p.id === playerId ? { ...p, vote } : p
  );
  const next = { ...prev, players };

  const allVotedNow = players.every(p => p.vote !== null);
  const allVotedBefore = prev.players.every(p => p.vote !== null);
  if (allVotedNow && !allVotedBefore) {
    playAllVotedSound();
    if (document.hidden) document.title = '✅ All Voted! — Scrum Poker';
  }

  return next;
}

function syncMyVote(state: RoomState, socketId: string | undefined, setMyVote: (v: string | null) => void) {
  const me = state.players.find(p => p.id === socketId);
  if (state.revealed) {
    if (me) setMyVote(me.vote);
  } else if (me?.vote === null) {
    setMyVote(null);
  }
}

/* Circular progress indicator */
function VoteProgress({ voted, total }: { voted: number; total: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? voted / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-2.5">
      <svg width="44" height="44" className="progress-ring">
        <circle
          cx="22" cy="22" r={radius}
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700/30"
          strokeWidth="3"
        />
        <circle
          cx="22" cy="22" r={radius}
          fill="none"
          stroke={progress === 1 ? '#22c55e' : '#3b82f6'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{voted}/{total}</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">voted</span>
      </div>
    </div>
  );
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [room, setRoom] = useState<RoomState | null>(null);
  const [notJoined, setNotJoined] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<Map<string, FloatingEmoji[]>>(new Map());
  const [chatBubbles, setChatBubbles] = useState<Map<string, ChatBubble[]>>(new Map());
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [muted, setMutedState] = useState(isMuted);

  const prevRoomRef = useRef<RoomState | null>(null);

  const myId = useSyncExternalStore(
    (cb) => {
      const socket = getSocket();
      socket.on('connect', cb);
      return () => { socket.off('connect', cb); };
    },
    () => getSocket().id ?? null,
    () => null,
  );

  useEffect(() => {
    const socket = getSocket();

    const onRoomUpdate = (state: RoomState) => {
      handleSoundAndTitle(state, prevRoomRef.current);
      prevRoomRef.current = state;
      setRoom(state);
      syncMyVote(state, socket.id, setMyVote);
    };

    socket.on('room-update', onRoomUpdate);

    const onVoteUpdate = ({ playerId, vote }: { playerId: string; vote: string | null }) => {
      setRoom(prev => {
        const next = applyVoteUpdate(prev, playerId, vote);
        if (next) prevRoomRef.current = next;
        return next;
      });
    };

    socket.on('vote-update', onVoteUpdate);

    let emojiIdCounter = 0;
    const onPlayerEmoji = ({ playerId, emoji }: { playerId: string; emoji: string }) => {
      const id = emojiIdCounter++;
      setFloatingEmojis(prev => {
        const next = new Map(prev);
        const existing = next.get(playerId) || [];
        next.set(playerId, [...existing, { id, emoji }]);
        return next;
      });
      scheduleEmojiRemoval(id, playerId);
    };

    socket.on('player-emoji', onPlayerEmoji);

    let chatIdCounter = 0;
    const onPlayerChat = ({ playerId, message }: { playerId: string; message: string }) => {
      if (playerId !== socket.id) speakMessage(message);
      const id = chatIdCounter++;
      setChatBubbles(prev => {
        const next = new Map(prev);
        next.set(playerId, [{ id, message }]);
        return next;
      });
      scheduleChatRemoval(id, playerId);
    };

    socket.on('player-chat', onPlayerChat);

    const requestOrRejoin = () => {
      socket.emit('get-room-state', (res: { success: boolean; state?: RoomState }) => {
        if (res.success && res.state) {
          onRoomUpdate(res.state);
        } else {
          rejoinOrRedirect(socket);
        }
      });
    };

    const rejoinOrRedirect = (sock: typeof socket) => {
      const storedName = sessionStorage.getItem('playerName');
      if (!storedName) {
        setNotJoined(true);
        return;
      }
      sock.emit('rejoin-room', {
        roomId: roomId.toUpperCase(),
        playerName: storedName,
      }, (rejoinRes: { success: boolean; roomId?: string; error?: string }) => {
        if (!rejoinRes.success) setNotJoined(true);
      });
    };

    requestOrRejoin();

    const onReconnect = () => {
      setNotJoined(false);
      requestOrRejoin();
    };
    socket.on('connect', onReconnect);

    return () => {
      socket.off('room-update', onRoomUpdate);
      socket.off('vote-update', onVoteUpdate);
      socket.off('player-emoji', onPlayerEmoji);
      socket.off('player-chat', onPlayerChat);
      socket.off('connect', onReconnect);
    };
  }, [roomId]);

  const scheduleEmojiRemoval = (id: number, playerId: string) => {
    setTimeout(() => {
      setFloatingEmojis(prev => {
        const next = new Map(prev);
        const existing = next.get(playerId);
        if (!existing) return prev;
        const filtered = removeById(existing, id);
        if (filtered.length === 0) next.delete(playerId);
        else next.set(playerId, filtered);
        return next;
      });
    }, 2000);
  };

  const scheduleChatRemoval = (id: number, playerId: string) => {
    setTimeout(() => {
      setChatBubbles(prev => {
        const next = new Map(prev);
        const existing = next.get(playerId);
        if (!existing) return prev;
        const filtered = removeById(existing, id);
        if (filtered.length === 0) next.delete(playerId);
        else next.set(playerId, filtered);
        return next;
      });
    }, 3000);
  };

  const handleVote = useCallback((value: string) => {
    const socket = getSocket();
    const newVote = myVote === value ? null : value;
    setMyVote(newVote);
    socket.emit('vote', { vote: newVote });
  }, [myVote]);

  const sendEmoji = (emoji: string) => {
    playEmojiSound(emoji);
    getSocket().emit('send-emoji', { emoji });
    setEmojiPickerOpen(false);
  };

  const sendChat = (message: string) => {
    if (!message.trim()) return;
    playPopSound();
    speakMessage(message.trim());
    getSocket().emit('send-chat', { message: message.trim() });
    setChatInput('');
    setChatOpen(false);
  };

  const handleReveal = () => {
    getSocket().emit('reveal-votes');
  };

  const handleReset = () => {
    getSocket().emit('reset-votes');
    setMyVote(null);
  };

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  const copyInviteLink = () => {
    const link = `${globalThis.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const me = room?.players.find(p => p.id === myId);
  const isHost = me?.isHost ?? false;
  const allVoted = room?.players.every(p => p.vote !== null) ?? false;
  const votedCount = room?.players.filter(p => p.vote !== null).length ?? 0;

  useEffect(() => {
    if (notJoined) {
      router.replace(`/join/${roomId}`);
    }
  }, [notJoined, roomId, router]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden) {
        document.title = 'Scrum Poker';
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  if (!room) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-4">
            <span className="text-3xl animate-bounce">🃏</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-5xl mx-auto fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-500/10 dark:border-blue-500/20 flex items-center justify-center">
            <span className="text-lg">🃏</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{room.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <code className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                {roomId}
              </code>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyInviteLink}
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
            onClick={toggleMute}
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
            {room.players.length} player{room.players.length === 1 ? '' : 's'}
          </div>
        </div>
      </header>

      {/* Players area */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-6" style={{ overflow: 'visible' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <VoteProgress voted={votedCount} total={room.players.length} />
            {room.revealed && (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Revealed
              </span>
            )}
            {!room.revealed && allVoted && votedCount > 0 && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium pulse-soft">All voted!</span>
            )}
          </div>
          {isHost && (
            <div className="flex gap-2">
              {room.revealed ? (
                <button
                  onClick={handleReset}
                  className="btn-shine px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                  New Round
                </button>
              ) : (
                <button
                  onClick={handleReveal}
                  disabled={votedCount === 0}
                  className="btn-shine px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:cursor-not-allowed disabled:shadow-none text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                  Reveal Votes
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-6 justify-center pt-4 pb-2">
          {room.players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              revealed={room.revealed}
              floatingEmojis={floatingEmojis.get(player.id) || []}
              chatBubbles={chatBubbles.get(player.id) || []}
            />
          ))}
        </div>
      </div>

      {/* Interaction bar */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => { setEmojiPickerOpen(!emojiPickerOpen); setChatOpen(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              emojiPickerOpen
                ? 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30'
                : 'glass text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span className="text-base">😄</span>
            <span className="hidden sm:inline text-xs">Reaction</span>
          </button>
          <button
            onClick={() => { setChatOpen(!chatOpen); setEmojiPickerOpen(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              chatOpen
                ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30'
                : 'glass text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span className="text-base">💬</span>
            <span className="hidden sm:inline text-xs">Chat</span>
          </button>
        </div>
        {emojiPickerOpen && (
          <div className="glass rounded-2xl p-3 shadow-2xl shadow-black/10 dark:shadow-black/30 float-in">
            <div className="flex flex-wrap justify-center gap-1">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendEmoji(emoji)}
                  className="w-10 h-10 text-xl rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all hover:scale-125 active:scale-95 flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        {chatOpen && (
          <div className="glass rounded-2xl p-4 shadow-2xl shadow-black/10 dark:shadow-black/30 float-in w-full max-w-md">
            <div className="flex flex-wrap justify-center gap-1.5 mb-3">
              {QUICK_MESSAGES.map(msg => (
                <button
                  key={msg}
                  onClick={() => sendChat(msg)}
                  className="px-2.5 py-1.5 text-xs glass rounded-lg text-slate-500 dark:text-slate-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-500/20 dark:hover:border-indigo-500/30 transition-all active:scale-95"
                >
                  {msg}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat(chatInput)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 input-glow transition-all"
                maxLength={50}
                autoFocus
              />
              <button
                onClick={() => sendChat(chatInput)}
                disabled={!chatInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-700/50 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vote stats (when revealed) */}
      {room.revealed && <VoteStats players={room.players} />}

      {/* Voting cards */}
      {!room.revealed && (
        <div className="mt-8 slide-up">
          <h3 className="text-xs text-slate-400 dark:text-slate-500 mb-4 text-center uppercase tracking-wider font-medium">Pick your estimate</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {room.votingSystem.map(value => (
              <VoteCard
                key={value}
                value={value}
                selected={myVote === value}
                onClick={() => handleVote(value)}
                disabled={room.revealed}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
