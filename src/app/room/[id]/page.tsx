'use client';

import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getSocket } from '@/lib/socket';
import { playAllVotedSound, playRevealSound, speakMessage, isMuted, setMuted } from '@/lib/sounds';
import { RoomHeader } from './RoomHeader';
import { PlayerArea } from './PlayerArea';
import { InteractionBar } from './InteractionBar';
import { VotingDeck } from './VotingDeck';
import type { FloatingEmoji, ChatBubble } from './PlayerCard';
import type { RoomState } from '@/types';

const VoteStats = dynamic(() => import('./VoteStats'), { ssr: false });

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
          <p className="text-[var(--muted)] text-sm">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-5xl mx-auto fade-in">
      <RoomHeader
        roomName={room.name}
        roomId={roomId}
        playerCount={room.players.length}
        copied={copied}
        muted={muted}
        onCopyInvite={copyInviteLink}
        onToggleMute={toggleMute}
      />

      <PlayerArea
        players={room.players}
        revealed={room.revealed}
        isHost={isHost}
        votedCount={votedCount}
        allVoted={allVoted}
        floatingEmojis={floatingEmojis}
        chatBubbles={chatBubbles}
        onReveal={handleReveal}
        onReset={handleReset}
      />

      <InteractionBar />

      {room.revealed && <VoteStats players={room.players} />}

      {!room.revealed && (
        <VotingDeck
          votingSystem={room.votingSystem}
          myVote={myVote}
          onVote={handleVote}
        />
      )}
    </div>
  );
}
