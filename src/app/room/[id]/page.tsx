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
import { StoryList } from './StoryList';
import { EmptyRoom } from './EmptyRoom';
import { SummaryPage } from './SummaryPage';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('storySidebarCollapsed') === '1') setSidebarCollapsed(true);
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('storySidebarCollapsed', next ? '1' : '0'); } catch {}
      return next;
    });
  };

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

  const handleAddStory = (title: string) => {
    getSocket().emit('add-story', { title });
  };

  const handleUpdateStory = (storyId: string, title: string) => {
    getSocket().emit('update-story', { storyId, title });
  };

  const handleDeleteStory = (storyId: string) => {
    getSocket().emit('delete-story', { storyId });
  };

  const handleSelectStory = (storyId: string) => {
    getSocket().emit('select-story', { storyId });
    setMyVote(null);
  };

  const handleCompleteStory = (finalPoint: string) => {
    const trimmed = finalPoint.trim();
    if (!trimmed) return;
    getSocket().emit('complete-story', { finalPoint: trimmed });
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
  const stories = room?.stories ?? [];
  const currentStory = stories.find(s => s.id === room?.currentStoryId) ?? null;
  const canCompleteStory = !!(room?.revealed && currentStory && votedCount > 0);

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
          <pre className="text-[10px] sm:text-xs leading-tight text-[var(--muted)] select-none whitespace-pre">
{`┌──────────────────────────┐
│  connecting to room…     │
└──────────────────────────┘`}
          </pre>
          <p className="text-xs text-[var(--accent)] mt-3 font-mono">
            <span className="term-prompt">socket.connect()</span><span className="term-cursor" />
          </p>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="min-h-dvh p-4 sm:p-6 max-w-7xl mx-auto fade-in flex flex-col">
        <RoomHeader
          roomName={room.name}
          roomId={roomId}
          playerCount={room.players.length}
          copied={copied}
          muted={muted}
          onCopyInvite={copyInviteLink}
          onToggleMute={toggleMute}
        />
        <EmptyRoom isHost={isHost} onAdd={handleAddStory} />
      </div>
    );
  }

  const allEstimated = stories.length > 0 && stories.every(s => s.completed);
  if (allEstimated && !currentStory) {
    return (
      <div className="min-h-dvh p-4 sm:p-6 max-w-7xl mx-auto fade-in flex flex-col">
        <RoomHeader
          roomName={room.name}
          roomId={roomId}
          playerCount={room.players.length}
          copied={copied}
          muted={muted}
          onCopyInvite={copyInviteLink}
          onToggleMute={toggleMute}
        />
        <SummaryPage
          stories={stories}
          isHost={isHost}
          onAdd={handleAddStory}
          onSelect={handleSelectStory}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-7xl mx-auto fade-in">
      <RoomHeader
        roomName={room.name}
        roomId={roomId}
        playerCount={room.players.length}
        copied={copied}
        muted={muted}
        onCopyInvite={copyInviteLink}
        onToggleMute={toggleMute}
      />

      <div
        className={`lg:grid lg:gap-6 lg:items-start ${
          sidebarCollapsed ? 'lg:grid-cols-[44px_1fr]' : 'lg:grid-cols-[260px_1fr]'
        }`}
      >
        <aside className="lg:sticky lg:top-4">
          <StoryList
            stories={stories}
            currentStoryId={room.currentStoryId ?? null}
            isHost={isHost}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onAdd={handleAddStory}
            onUpdate={handleUpdateStory}
            onDelete={handleDeleteStory}
            onSelect={handleSelectStory}
          />
        </aside>

        <main className="min-w-0">
          {currentStory && (
            <div className="mb-3 px-3 py-2 rounded bg-[var(--accent-light)] border border-[var(--accent-border)] flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold shrink-0">
                [ now ]
              </span>
              <span className="text-sm font-semibold text-[var(--foreground)] truncate">
                {currentStory.title}
              </span>
            </div>
          )}

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
            canCompleteStory={canCompleteStory}
            onCompleteStory={handleCompleteStory}
            votingSystem={room.votingSystem}
          />

          <InteractionBar />

          {room.revealed && <VoteStats players={room.players} />}

          {!room.revealed && currentStory && (
            <VotingDeck
              votingSystem={room.votingSystem}
              myVote={myVote}
              onVote={handleVote}
            />
          )}

        </main>
      </div>
    </div>
  );
}
