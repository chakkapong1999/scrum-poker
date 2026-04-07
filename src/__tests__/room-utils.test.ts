import { describe, it, expect } from 'vitest';
import { generateRoomId, getRoomState, getVotingSystem } from '@/lib/room-utils';
import { FIBONACCI, T_SHIRT } from '@/types';
import type { Room } from '@/types';

describe('generateRoomId', () => {
  it('returns a 6-character string', () => {
    const id = generateRoomId();
    expect(id).toHaveLength(6);
  });

  it('only contains uppercase letters and digits (no ambiguous chars)', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateRoomId();
      expect(id).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it('does not contain ambiguous characters (0, O, 1, I)', () => {
    for (let i = 0; i < 100; i++) {
      const id = generateRoomId();
      expect(id).not.toMatch(/[0OI1]/);
    }
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRoomId()));
    expect(ids.size).toBeGreaterThan(90);
  });
});

describe('getVotingSystem', () => {
  it('returns Fibonacci for "fibonacci"', () => {
    expect(getVotingSystem('fibonacci')).toEqual(FIBONACCI);
  });

  it('returns T-Shirt for "tshirt"', () => {
    expect(getVotingSystem('tshirt')).toEqual(T_SHIRT);
  });

  it('defaults to Fibonacci for unknown systems', () => {
    expect(getVotingSystem('unknown')).toEqual(FIBONACCI);
    expect(getVotingSystem('')).toEqual(FIBONACCI);
  });
});

describe('getRoomState', () => {
  function createRoom(overrides: Partial<Room> = {}): Room {
    return {
      id: 'ABC123',
      name: 'Test Room',
      players: new Map(),
      revealed: false,
      votingSystem: FIBONACCI,
      lastActivity: Date.now(),
      ...overrides,
    };
  }

  it('returns basic room info', () => {
    const room = createRoom();
    const state = getRoomState(room);
    expect(state.id).toBe('ABC123');
    expect(state.name).toBe('Test Room');
    expect(state.revealed).toBe(false);
    expect(state.votingSystem).toEqual(FIBONACCI);
    expect(state.players).toEqual([]);
  });

  it('masks votes when not revealed', () => {
    const room = createRoom({ revealed: false });
    room.players.set('p1', { id: 'p1', name: 'Alice', vote: '5', isHost: true });
    room.players.set('p2', { id: 'p2', name: 'Bob', vote: null, isHost: false });

    const state = getRoomState(room);
    expect(state.players[0].vote).toBe('voted');
    expect(state.players[1].vote).toBeNull();
  });

  it('shows actual votes when revealed', () => {
    const room = createRoom({ revealed: true });
    room.players.set('p1', { id: 'p1', name: 'Alice', vote: '5', isHost: true });
    room.players.set('p2', { id: 'p2', name: 'Bob', vote: '8', isHost: false });

    const state = getRoomState(room);
    expect(state.players[0].vote).toBe('5');
    expect(state.players[1].vote).toBe('8');
  });

  it('preserves player properties', () => {
    const room = createRoom();
    room.players.set('p1', { id: 'p1', name: 'Alice', vote: null, isHost: true });

    const state = getRoomState(room);
    expect(state.players[0]).toEqual({
      id: 'p1',
      name: 'Alice',
      vote: null,
      isHost: true,
    });
  });

  it('does not include lastActivity in state', () => {
    const room = createRoom();
    const state = getRoomState(room);
    expect(state).not.toHaveProperty('lastActivity');
  });
});
