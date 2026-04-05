'use client';

import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { playAllVotedSound, playRevealSound, playPopSound, playEmojiSound, speakMessage, isMuted, setMuted } from '@/lib/sounds';
import type { RoomState, Player } from '@/types';

function VoteCard({ value, selected, onClick, disabled }: {
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-16 h-24 rounded-xl text-lg font-bold transition-all transform hover:scale-110 active:scale-95 ${
        selected
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 -translate-y-2 ring-2 ring-blue-400'
          : 'bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 border border-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'cursor-pointer'}`}
    >
      {value}
    </button>
  );
}

interface FloatingEmoji {
  id: number;
  emoji: string;
}

interface ChatBubble {
  id: number;
  message: string;
}

function PlayerCard({ player, revealed, floatingEmojis, chatBubbles }: {
  player: Player;
  revealed: boolean;
  floatingEmojis: FloatingEmoji[];
  chatBubbles: ChatBubble[];
}) {
  const hasVoted = player.vote !== null;
  const showVote = revealed && player.vote && player.vote !== 'voted';

  return (
    <div className="flex flex-col items-center gap-2 float-in relative" style={{ overflow: 'visible' }}>
      {/* Chat bubbles - centered above the card */}
      {chatBubbles.map(cb => (
        <div
          key={cb.id}
          className="chat-bubble absolute z-60"
          style={{ top: '-44px', left: '50%' }}
        >
          <div className="bg-white text-slate-900 text-xs font-medium px-3 py-1.5 rounded-xl shadow-lg max-w-[160px] truncate whitespace-nowrap">
            {cb.message}
          </div>
          <div className="w-2.5 h-2.5 bg-white rotate-45 mx-auto -mt-1.5" />
        </div>
      ))}
      {/* Floating emojis - centered above the card */}
      {floatingEmojis.map(fe => (
        <span
          key={fe.id}
          className="emoji-float absolute text-2xl z-50"
          style={{ top: '-10px', left: '50%' }}
        >
          {fe.emoji}
        </span>
      ))}
      <div
        className={`w-16 h-24 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${
          showVote
            ? 'bg-blue-600 text-white card-flip'
            : hasVoted
              ? 'bg-green-600/20 border-2 border-green-500 text-green-400'
              : 'bg-slate-700/30 border-2 border-slate-600 text-slate-500'
        }`}
      >
        {showVote ? player.vote : hasVoted ? '✓' : '?'}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-300 truncate max-w-[80px]">{player.name}</span>
        {player.isHost && <span className="text-xs text-yellow-400">★</span>}
      </div>
    </div>
  );
}

function VoteStats({ players }: { players: Player[] }) {
  const votes = players
    .map(p => p.vote)
    .filter((v): v is string => v !== null && v !== 'voted' && v !== '?' && v !== '☕');

  const numericVotes = votes.map(Number).filter(n => !isNaN(n));

  if (numericVotes.length === 0) return null;

  const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
  const min = Math.min(...numericVotes);
  const max = Math.max(...numericVotes);

  // Vote distribution
  const distribution = new Map<string, number>();
  players.forEach(p => {
    if (p.vote && p.vote !== 'voted') {
      distribution.set(p.vote, (distribution.get(p.vote) || 0) + 1);
    }
  });

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 float-in">
      <h3 className="text-lg font-semibold text-white mb-4">Results</h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{avg.toFixed(1)}</div>
          <div className="text-xs text-slate-400">Average</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{min}</div>
          <div className="text-xs text-slate-400">Min</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{max}</div>
          <div className="text-xs text-slate-400">Max</div>
        </div>
      </div>
      {distribution.size > 0 && (
        <div className="space-y-2">
          {Array.from(distribution.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([vote, count]) => (
              <div key={vote} className="flex items-center gap-3">
                <span className="w-8 text-right font-mono text-sm text-slate-300">{vote}</span>
                <div className="flex-1 bg-slate-700/50 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                    style={{ width: `${(count / players.length) * 100}%`, minWidth: '2rem' }}
                  >
                    <span className="text-xs text-white font-medium">{count}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
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

  const REACTION_EMOJIS = ['👍', '👏', '🎉', '🔥', '😂', '🤔', '😱', '💀', '🚀', '❤️', '👀', '🙈', '🍻'];

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
      const prev = prevRoomRef.current;

      // Play reveal sound when votes are revealed
      if (state.revealed && prev && !prev.revealed) {
        playRevealSound();
        if (document.hidden) document.title = '🎉 Votes Revealed! — Scrum Poker';
      }
      // Play all-voted sound when everyone has voted (and not yet revealed)
      else if (!state.revealed && state.players.length > 0) {
        const allVotedNow = state.players.every(p => p.vote !== null);
        const allVotedBefore = prev && prev.players.length > 0 && prev.players.every(p => p.vote !== null);
        if (allVotedNow && !allVotedBefore) {
          playAllVotedSound();
          if (document.hidden) document.title = '✅ All Voted! — Scrum Poker';
        }
      }

      prevRoomRef.current = state;
      setRoom(state);
      const socketId = socket.id;
      if (state.revealed) {
        const me = state.players.find(p => p.id === socketId);
        if (me) setMyVote(me.vote);
      } else {
        const me = state.players.find(p => p.id === socketId);
        if (me && me.vote === null) setMyVote(null);
      }
    };

    socket.on('room-update', onRoomUpdate);

    let emojiIdCounter = 0;
    const onPlayerEmoji = ({ playerId, emoji }: { playerId: string; emoji: string }) => {
      const id = emojiIdCounter++;
      setFloatingEmojis(prev => {
        const next = new Map(prev);
        const existing = next.get(playerId) || [];
        next.set(playerId, [...existing, { id, emoji }]);
        return next;
      });
      // Remove after animation completes
      setTimeout(() => {
        setFloatingEmojis(prev => {
          const next = new Map(prev);
          const existing = next.get(playerId);
          if (existing) {
            const filtered = existing.filter(e => e.id !== id);
            if (filtered.length === 0) next.delete(playerId);
            else next.set(playerId, filtered);
          }
          return next;
        });
      }, 2000);
    };

    socket.on('player-emoji', onPlayerEmoji);

    let chatIdCounter = 0;
    const onPlayerChat = ({ playerId, message }: { playerId: string; message: string }) => {
      if (playerId !== socket.id) speakMessage(message);
      const id = chatIdCounter++;
      setChatBubbles(prev => {
        const next = new Map(prev);
        // Only show the latest bubble per player
        next.set(playerId, [{ id, message }]);
        return next;
      });
      setTimeout(() => {
        setChatBubbles(prev => {
          const next = new Map(prev);
          const existing = next.get(playerId);
          if (existing) {
            const filtered = existing.filter(b => b.id !== id);
            if (filtered.length === 0) next.delete(playerId);
            else next.set(playerId, filtered);
          }
          return next;
        });
      }, 3000);
    };

    socket.on('player-chat', onPlayerChat);

    // Request current state, or rejoin if we were disconnected
    const requestOrRejoin = () => {
      socket.emit('get-room-state', (res: { success: boolean; state?: RoomState }) => {
        if (res.success && res.state) {
          onRoomUpdate(res.state);
        } else {
          // Not in a room on the server — try to rejoin using stored name
          const storedName = sessionStorage.getItem('playerName');
          if (storedName) {
            socket.emit('rejoin-room', {
              roomId: roomId.toUpperCase(),
              playerName: storedName,
            }, (rejoinRes: { success: boolean; roomId?: string; error?: string }) => {
              if (!rejoinRes.success) {
                setNotJoined(true);
              }
            });
          } else {
            setNotJoined(true);
          }
        }
      });
    };

    requestOrRejoin();

    // Handle reconnection — rejoin the room after socket reconnects
    const onReconnect = () => {
      setNotJoined(false);
      requestOrRejoin();
    };
    socket.on('connect', onReconnect);

    return () => {
      socket.off('room-update', onRoomUpdate);
      socket.off('player-emoji', onPlayerEmoji);
      socket.off('player-chat', onPlayerChat);
      socket.off('connect', onReconnect);
    };
  }, [roomId]);

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

  const QUICK_MESSAGES = [
    'Let\'s go!', 'Hurry up! 😄', 'Take your time',
    'Need more info', 'Too complex', 'Easy one!',
    'Agree 👍', 'Not sure...', 'Let\'s discuss',
  ];

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
    const link = `${window.location.origin}/join/${roomId}`;
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

  // Restore tab title when user returns to the tab
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🃏</div>
          <p className="text-slate-400">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{room.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-400">Room:</span>
            <code className="px-2 py-0.5 bg-slate-800 rounded text-blue-400 font-mono text-sm tracking-wider">
              {roomId}
            </code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyInviteLink}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-xl text-sm text-white transition-all flex items-center gap-2"
          >
            {copied ? (
              <>
                <span className="text-green-400">✓</span> Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copy Invite Link
              </>
            )}
          </button>
          <button
            onClick={toggleMute}
            className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-xl text-sm text-white transition-all"
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {muted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          <div className="px-3 py-2 bg-slate-800/50 rounded-xl text-sm text-slate-300">
            {room.players.length} player{room.players.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Players grid */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 mb-8" style={{ overflow: 'visible' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {room.revealed
              ? 'Votes Revealed!'
              : `Voting... (${votedCount}/${room.players.length})`}
          </h2>
          {isHost && (
            <div className="flex gap-2">
              {!room.revealed ? (
                <button
                  onClick={handleReveal}
                  disabled={votedCount === 0}
                  className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all"
                >
                  Reveal Votes {allVoted && '✨'}
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all"
                >
                  New Round
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-6 justify-center pt-8">
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

      {/* Emoji reactions & Quick chat */}
      <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => { setEmojiPickerOpen(!emojiPickerOpen); setChatOpen(false); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                emojiPickerOpen
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <span className="text-lg">😄</span> Reaction
            </button>
            <button
              onClick={() => { setChatOpen(!chatOpen); setEmojiPickerOpen(false); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                chatOpen
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <span className="text-lg">💬</span> Quick Chat
            </button>
          </div>
          {emojiPickerOpen && (
            <div className="bg-slate-800 border border-slate-600 rounded-2xl p-3 shadow-2xl float-in">
              <div className="flex flex-wrap justify-center gap-1">
                {REACTION_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => sendEmoji(emoji)}
                    className="w-10 h-10 text-xl rounded-lg hover:bg-slate-700 transition-all hover:scale-125 active:scale-95 flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chatOpen && (
            <div className="bg-slate-800 border border-slate-600 rounded-2xl p-4 shadow-2xl float-in w-full max-w-md">
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {QUICK_MESSAGES.map(msg => (
                  <button
                    key={msg}
                    onClick={() => sendChat(msg)}
                    className="px-3 py-1.5 text-xs bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all active:scale-95"
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
                  className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  maxLength={50}
                  autoFocus
                />
                <button
                  onClick={() => sendChat(chatInput)}
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all"
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
        <div className="mt-8">
          <h3 className="text-sm text-slate-400 mb-4 text-center">Pick your estimate</h3>
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
