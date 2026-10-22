import { createServer } from 'http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { randomUUID } from 'crypto';
import type { Room, Player, Story } from './src/types';
import { generateRoomId, getRoomState, getVotingSystem } from './src/lib/room-utils';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const rooms = new Map<string, Room>();
// Secret per-tab token → current player (socket) id. Never in RoomState: player ids are broadcast,
// tokens prove a seat is yours. WeakMap so it goes away with the room.
const seatTokens = new WeakMap<Room, Map<string, string>>();
const removalTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Server-side guard — clients enforce maxLength, but raw socket clients may not */
function sanitizeName(value: unknown): string {
  return String(value ?? '').trim().slice(0, 20);
}
const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes idle timeout
const ROOM_EMPTY_GRACE_MS = 60 * 1000; // keep empty rooms for 60s (allows refresh)
const PLAYER_GRACE_MS = 20 * 1000; // keep a disconnected player's seat this long (refresh, slow dev compile)
const CLEANUP_INTERVAL_MS = 30 * 1000; // check every 30 seconds

app.prepare().then(() => {
  const startedAt = Date.now();
  let healthPlayerCache = { count: 0, updatedAt: 0 };

  const httpServer = createServer((req, res) => {
    // Lightweight liveness probe (uptime monitoring)
    if (req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }

    // Application metrics endpoint — player count cached for 5 s to avoid O(n) per probe
    if (req.url === '/health') {
      const now = Date.now();
      if (now - healthPlayerCache.updatedAt > 5000) {
        let total = 0;
        for (const room of rooms.values()) total += room.players.size;
        healthPlayerCache = { count: total, updatedAt: now };
      }
      const mem = process.memoryUsage();
      const payload = {
        status: 'ok',
        uptime: Math.floor((now - startedAt) / 1000),
        rooms: rooms.size,
        players: healthPlayerCache.count,
        connections: io?.engine?.clientsCount ?? 0,
        memory: {
          rss: Math.round(mem.rss / 1024 / 1024),
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        },
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    }

    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
    pingInterval: 25000,
    pingTimeout: 300000,
    maxHttpBufferSize: 1e5,
  });

  io.on('connection', (socket) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;
    const token = String(socket.handshake.auth?.token ?? '').slice(0, 64);

    // A throw inside a listener is an uncaughtException that takes every room down, so one bad
    // payload (`emit('vote')` with no args, a missing ack callback) must only fail that event.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const on = (event: string, handler: (...args: any[]) => void) => {
      socket.on(event, (...args) => {
        try {
          handler(...args);
        } catch (err) {
          console.error(`[socket] ${event} failed:`, err);
        }
      });
    };

    // Seat this socket in the room. If the tab's token already owns a seat (refresh, or a reconnect
    // while the old socket is still a zombie), move that seat to this socket so host + vote survive.
    // ponytail: a duplicated tab copies sessionStorage and takes the seat over from the original tab
    const takeSeat = (room: Room, name: string, asSpectator: boolean): Player => {
      let tokens = seatTokens.get(room);
      if (!tokens) seatTokens.set(room, tokens = new Map());
      const oldId = token ? tokens.get(token) : undefined;
      const old = oldId ? room.players.get(oldId) : undefined;

      const player: Player = {
        id: socket.id,
        name,
        vote: old && !asSpectator ? old.vote : null,
        isHost: old ? old.isHost : !Array.from(room.players.values()).some(p => p.isHost),
        isSpectator: asSpectator,
      };

      if (old) {
        clearTimeout(removalTimers.get(old.id));
        removalTimers.delete(old.id);
        if (old.id !== socket.id) io.in(old.id).socketsLeave(room.id);
        // Re-key in place so the seat keeps its position (card order, host fallback order)
        room.players = new Map(Array.from(room.players, ([id, p]) => id === old.id ? [player.id, player] : [id, p]));
      } else {
        room.players.set(player.id, player);
      }
      if (token) tokens.set(token, player.id);

      room.lastActivity = Date.now();
      socket.join(room.id);
      currentRoomId = room.id;
      currentPlayerId = player.id;
      return player;
    };

    on('create-room', ({ playerName, roomName, votingSystem, asSpectator }: { playerName: string; roomName: string; votingSystem: string; asSpectator?: boolean }, callback) => {
      const name = sanitizeName(playerName);
      if (!name) {
        callback({ success: false, error: 'Name is required' });
        return;
      }

      // Guard against the (unlikely) ID collision overwriting a live room
      let roomId = generateRoomId();
      while (rooms.has(roomId)) roomId = generateRoomId();

      const room: Room = {
        id: roomId,
        name: String(roomName ?? '').trim().slice(0, 30) || 'Scrum Poker',
        players: new Map(),
        revealed: false,
        votingSystem: getVotingSystem(votingSystem),
        lastActivity: Date.now(),
        stories: [],
        currentStoryId: null,
      };

      rooms.set(roomId, room);
      const player = takeSeat(room, name, !!asSpectator);

      callback({ success: true, roomId, playerId: player.id });
      io.to(roomId).emit('room-update', getRoomState(room));
    });

    // join (invite link) and rejoin (refresh/reconnect) are the same now — the token decides
    // whether this is a new seat or an existing one coming back
    const joinRoom = ({ roomId, playerName, asSpectator }: { roomId: string; playerName: string; asSpectator?: boolean }, callback: (res: object) => void) => {
      const room = rooms.get(String(roomId ?? '').toUpperCase());
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const name = sanitizeName(playerName);
      if (!name) {
        callback({ success: false, error: 'Name is required' });
        return;
      }

      const player = takeSeat(room, name, !!asSpectator);
      // Own vote unmasked so the deck can show the selection again after a refresh
      callback({ success: true, roomId: room.id, playerId: player.id, vote: player.vote });
      io.to(room.id).emit('room-update', getRoomState(room));
    };
    on('join-room', joinRoom);
    on('rejoin-room', joinRoom);

    on('get-room-state', (callback) => {
      if (!currentRoomId) {
        callback({ success: false });
        return;
      }
      const room = rooms.get(currentRoomId);
      if (!room) {
        callback({ success: false });
        return;
      }
      callback({ success: true, state: getRoomState(room) });
    });

    // Membership check: kicked sockets keep currentRoomId
    on('send-emoji', ({ emoji }: { emoji: string }) => {
      if (!currentRoomId || !currentPlayerId || !rooms.get(currentRoomId)?.players.has(currentPlayerId)) return;
      const safeEmoji = String(emoji ?? '').slice(0, 16);
      if (!safeEmoji.trim()) return;
      io.to(currentRoomId).emit('player-emoji', {
        playerId: currentPlayerId,
        emoji: safeEmoji,
      });
    });

    on('send-chat', ({ message }: { message: string }) => {
      if (!currentRoomId || !currentPlayerId || !rooms.get(currentRoomId)?.players.has(currentPlayerId)) return;
      const trimmed = String(message ?? '').trim().slice(0, 50);
      if (!trimmed) return;
      io.to(currentRoomId).emit('player-chat', {
        playerId: currentPlayerId,
        message: trimmed,
      });
    });

    on('vote', ({ vote }: { vote: string | null }) => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.revealed) return;
      if (!room.currentStoryId) return;

      if (vote !== null && !room.votingSystem.includes(vote)) return;

      const player = room.players.get(currentPlayerId);
      if (player && !player.isSpectator) {
        player.vote = vote;
        room.lastActivity = Date.now();
        io.to(currentRoomId).emit('vote-update', {
          playerId: currentPlayerId,
          vote: vote ? 'voted' : null,
        });
      }
    });

    on('reveal-votes', () => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const player = room.players.get(currentPlayerId);
      if (!player?.isHost) return;

      room.revealed = true;
      room.lastActivity = Date.now();
      io.to(currentRoomId).emit('room-update', getRoomState(room));
    });

    on('reset-votes', () => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const player = room.players.get(currentPlayerId);
      if (!player?.isHost) return;

      room.revealed = false;
      room.lastActivity = Date.now();
      room.players.forEach(p => { p.vote = null; });
      io.to(currentRoomId).emit('room-update', getRoomState(room));
    });

    const requireHost = (): Room | null => {
      if (!currentRoomId || !currentPlayerId) return null;
      const room = rooms.get(currentRoomId);
      if (!room) return null;
      const player = room.players.get(currentPlayerId);
      if (!player?.isHost) return null;
      return room;
    };

    const resetVotingState = (room: Room) => {
      room.revealed = false;
      room.players.forEach(p => { p.vote = null; });
    };

    on('add-story', ({ title }: { title: string }) => {
      const room = requireHost();
      if (!room) return;
      const trimmed = title.trim().slice(0, 200);
      if (!trimmed) return;
      const story: Story = {
        id: randomUUID(),
        title: trimmed,
        finalPoint: null,
        completed: false,
      };
      room.stories.push(story);
      if (!room.currentStoryId) {
        room.currentStoryId = story.id;
        resetVotingState(room);
      }
      room.lastActivity = Date.now();
      io.to(room.id).emit('room-update', getRoomState(room));
    });

    on('update-story', ({ storyId, title }: { storyId: string; title: string }) => {
      const room = requireHost();
      if (!room) return;
      const story = room.stories.find(s => s.id === storyId);
      if (!story) return;
      const trimmed = title.trim().slice(0, 200);
      if (!trimmed) return;
      story.title = trimmed;
      room.lastActivity = Date.now();
      io.to(room.id).emit('room-update', getRoomState(room));
    });

    on('delete-story', ({ storyId }: { storyId: string }) => {
      const room = requireHost();
      if (!room) return;
      const idx = room.stories.findIndex(s => s.id === storyId);
      if (idx < 0) return;
      room.stories.splice(idx, 1);
      if (room.currentStoryId === storyId) {
        const next = room.stories.find(s => !s.completed) ?? null;
        room.currentStoryId = next ? next.id : null;
        resetVotingState(room);
      }
      room.lastActivity = Date.now();
      io.to(room.id).emit('room-update', getRoomState(room));
    });

    on('select-story', ({ storyId }: { storyId: string }) => {
      const room = requireHost();
      if (!room) return;
      if (room.currentStoryId === storyId) return;
      const story = room.stories.find(s => s.id === storyId);
      if (!story) return;
      room.currentStoryId = storyId;
      resetVotingState(room);
      room.lastActivity = Date.now();
      io.to(room.id).emit('room-update', getRoomState(room));
    });

    on('complete-story', ({ finalPoint }: { finalPoint: unknown }) => {
      const room = requireHost();
      if (!room || !room.currentStoryId) return;
      const story = room.stories.find(s => s.id === room.currentStoryId);
      if (!story) return;
      const trimmed = typeof finalPoint === 'string' ? finalPoint.trim().slice(0, 10) : '';
      if (!trimmed) return;
      story.finalPoint = trimmed;
      story.completed = true;
      const next = room.stories.find(s => !s.completed);
      room.currentStoryId = next ? next.id : null;
      resetVotingState(room);
      room.lastActivity = Date.now();
      io.to(room.id).emit('room-update', getRoomState(room));
    });

    on('transfer-host', ({ targetPlayerId }: { targetPlayerId: string }) => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const currentPlayer = room.players.get(currentPlayerId);
      if (!currentPlayer?.isHost) return;

      const targetPlayer = room.players.get(targetPlayerId);
      if (!targetPlayer || targetPlayer.id === currentPlayerId) return;

      currentPlayer.isHost = false;
      targetPlayer.isHost = true;
      room.lastActivity = Date.now();
      io.to(currentRoomId).emit('room-update', getRoomState(room));
    });

    // ponytail: no ban list — a kicked player can rejoin via the invite link; add one if trolls become a problem
    on('kick-player', ({ targetPlayerId }: { targetPlayerId: string }) => {
      const room = requireHost();
      if (!room || targetPlayerId === currentPlayerId || !room.players.has(targetPlayerId)) return;

      room.players.delete(targetPlayerId);
      // Drop the seat's token and any pending removal so a kicked seat can't be restored
      clearTimeout(removalTimers.get(targetPlayerId));
      removalTimers.delete(targetPlayerId);
      const tokens = seatTokens.get(room);
      tokens?.forEach((id, t) => { if (id === targetPlayerId) tokens.delete(t); });
      room.lastActivity = Date.now();
      io.to(targetPlayerId).emit('kicked');
      io.in(targetPlayerId).socketsLeave(room.id);
      io.to(room.id).emit('room-update', getRoomState(room));
    });

    on('disconnect', () => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = rooms.get(currentRoomId);
      // Seat already moved to a newer socket (zombie from a dropped connection) or kicked
      if (!room?.players.has(currentPlayerId)) return;
      const playerId = currentPlayerId;

      // Hold the seat (host + vote) briefly — a refresh disconnects before it rejoins
      removalTimers.set(playerId, setTimeout(() => {
        removalTimers.delete(playerId);
        if (!room.players.delete(playerId)) return;
        room.lastActivity = Date.now();

        if (room.players.size === 0) {
          // Don't delete immediately — the cleanup interval removes it after ROOM_EMPTY_GRACE_MS
        } else {
          // Transfer host if needed
          const hasHost = Array.from(room.players.values()).some(p => p.isHost);
          if (!hasHost) {
            const firstPlayer = room.players.values().next().value;
            if (firstPlayer) firstPlayer.isHost = true;
          }
          io.to(room.id).emit('room-update', getRoomState(room));
        }
      }, PLAYER_GRACE_MS));
    });
  });

  // Periodically clean up idle or empty rooms
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of rooms) {
      const idle = now - room.lastActivity;
      if (room.players.size === 0 && idle > ROOM_EMPTY_GRACE_MS) {
        rooms.delete(roomId);
      } else if (idle > ROOM_TTL_MS) {
        rooms.delete(roomId);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  httpServer.listen(port, () => {
    console.log(`> Scrum Poker running on http://${hostname}:${port}`);
  });
});
