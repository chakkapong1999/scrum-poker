import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import type { Room, Player, RoomState } from './src/types';
import { FIBONACCI, T_SHIRT } from './src/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const rooms = new Map<string, Room>();
const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes idle timeout
const ROOM_EMPTY_GRACE_MS = 60 * 1000; // keep empty rooms for 60s (allows refresh)
const CLEANUP_INTERVAL_MS = 30 * 1000; // check every 30 seconds

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRoomState(room: Room): RoomState {
  return {
    id: room.id,
    name: room.name,
    players: Array.from(room.players.values()).map(p => ({
      ...p,
      vote: room.revealed ? p.vote : (p.vote ? 'voted' : null),
    })),
    revealed: room.revealed,
    votingSystem: room.votingSystem,
  };
}

function getVotingSystem(system: string): string[] {
  switch (system) {
    case 'tshirt': return T_SHIRT;
    default: return FIBONACCI;
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    socket.on('create-room', ({ playerName, roomName, votingSystem }: { playerName: string; roomName: string; votingSystem: string }, callback) => {
      const roomId = generateRoomId();
      const playerId = socket.id;

      const room: Room = {
        id: roomId,
        name: roomName || 'Scrum Poker',
        players: new Map(),
        revealed: false,
        votingSystem: getVotingSystem(votingSystem),
        lastActivity: Date.now(),
      };

      const player: Player = {
        id: playerId,
        name: playerName,
        vote: null,
        isHost: true,
      };

      room.players.set(playerId, player);
      rooms.set(roomId, room);

      socket.join(roomId);
      currentRoomId = roomId;
      currentPlayerId = playerId;

      callback({ success: true, roomId, playerId });
      io.to(roomId).emit('room-update', getRoomState(room));
    });

    socket.on('join-room', ({ roomId, playerName }: { roomId: string; playerName: string }, callback) => {
      const room = rooms.get(roomId.toUpperCase());
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const playerId = socket.id;
      const player: Player = {
        id: playerId,
        name: playerName,
        vote: null,
        isHost: false,
      };

      room.players.set(playerId, player);
      room.lastActivity = Date.now();
      socket.join(room.id);
      currentRoomId = room.id;
      currentPlayerId = playerId;

      callback({ success: true, roomId: room.id, playerId });
      io.to(room.id).emit('room-update', getRoomState(room));
    });

    socket.on('rejoin-room', ({ roomId, playerName }: { roomId: string; playerName: string }, callback) => {
      const room = rooms.get(roomId.toUpperCase());
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const playerId = socket.id;
      const player: Player = {
        id: playerId,
        name: playerName,
        vote: null,
        isHost: false,
      };

      // If no host remains, this player becomes host
      const hasHost = Array.from(room.players.values()).some(p => p.isHost);
      if (!hasHost) player.isHost = true;

      room.players.set(playerId, player);
      room.lastActivity = Date.now();
      socket.join(room.id);
      currentRoomId = room.id;
      currentPlayerId = playerId;

      callback({ success: true, roomId: room.id, playerId });
      io.to(room.id).emit('room-update', getRoomState(room));
    });

    socket.on('get-room-state', (callback) => {
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

    socket.on('send-emoji', ({ emoji }: { emoji: string }) => {
      if (!currentRoomId || !currentPlayerId) return;
      io.to(currentRoomId).emit('player-emoji', {
        playerId: currentPlayerId,
        emoji,
      });
    });

    socket.on('send-chat', ({ message }: { message: string }) => {
      if (!currentRoomId || !currentPlayerId) return;
      const trimmed = message.slice(0, 50);
      if (!trimmed) return;
      io.to(currentRoomId).emit('player-chat', {
        playerId: currentPlayerId,
        message: trimmed,
      });
    });

    socket.on('vote', ({ vote }: { vote: string | null }) => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.revealed) return;

      // Validate vote value against room's voting system
      if (vote !== null && !room.votingSystem.includes(vote)) return;

      const player = room.players.get(currentPlayerId);
      if (player) {
        player.vote = vote;
        room.lastActivity = Date.now();
        io.to(currentRoomId).emit('room-update', getRoomState(room));
      }
    });

    socket.on('reveal-votes', () => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const player = room.players.get(currentPlayerId);
      if (!player?.isHost) return;

      room.revealed = true;
      room.lastActivity = Date.now();
      io.to(currentRoomId).emit('room-update', getRoomState(room));
    });

    socket.on('reset-votes', () => {
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

    socket.on('disconnect', () => {
      if (!currentRoomId || !currentPlayerId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      room.players.delete(currentPlayerId);
      room.lastActivity = Date.now();

      if (room.players.size === 0) {
        // Don't delete immediately — keep for grace period so refreshing users can rejoin
        // The cleanup interval will remove it after ROOM_EMPTY_GRACE_MS
      } else {
        // Transfer host if needed
        const hasHost = Array.from(room.players.values()).some(p => p.isHost);
        if (!hasHost) {
          const firstPlayer = room.players.values().next().value;
          if (firstPlayer) firstPlayer.isHost = true;
        }
        io.to(currentRoomId).emit('room-update', getRoomState(room));
      }
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
