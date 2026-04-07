import type { Room, RoomState } from '@/types';
import { FIBONACCI, T_SHIRT } from '@/types';

const ROOM_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_ID_LENGTH = 6;

export function generateRoomId(): string {
  let result = '';
  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    result += ROOM_ID_CHARS.charAt(Math.floor(Math.random() * ROOM_ID_CHARS.length));
  }
  return result;
}

function maskedVote(vote: string | null): string | null {
  return vote ? 'voted' : null;
}

export function getRoomState(room: Room): RoomState {
  return {
    id: room.id,
    name: room.name,
    players: Array.from(room.players.values()).map(p => ({
      ...p,
      vote: room.revealed ? p.vote : maskedVote(p.vote),
    })),
    revealed: room.revealed,
    votingSystem: room.votingSystem,
  };
}

export function getVotingSystem(system: string): string[] {
  if (system === 'tshirt') return T_SHIRT;
  return FIBONACCI;
}
