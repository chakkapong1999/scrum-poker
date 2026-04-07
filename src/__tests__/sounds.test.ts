import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isMuted, setMuted } from '@/lib/sounds';

// Mock Web Audio API
const mockOscillator = {
  type: 'sine',
  frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};

const mockGain = {
  gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
};

const mockAudioContext = {
  currentTime: 0,
  destination: {},
  createOscillator: vi.fn(() => ({ ...mockOscillator })),
  createGain: vi.fn(() => ({ ...mockGain, gain: { ...mockGain.gain } })),
};

vi.stubGlobal('AudioContext', function () { return mockAudioContext; });

// Mock speechSynthesis
vi.stubGlobal('speechSynthesis', {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => []),
  addEventListener: vi.fn(),
  speaking: false,
  pending: false,
});

// Mock SpeechSynthesisUtterance
vi.stubGlobal('SpeechSynthesisUtterance', vi.fn(() => ({
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: '',
  voice: null,
})));

// Mock localStorage
const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete storage[key]; }),
});

describe('mute state', () => {
  beforeEach(() => {
    setMuted(false);
  });

  it('starts unmuted by default', () => {
    expect(isMuted()).toBe(false);
  });

  it('toggles muted state', () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
    setMuted(false);
    expect(isMuted()).toBe(false);
  });

  it('persists muted state to localStorage', () => {
    setMuted(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('scrumPokerMuted', 'true');
    setMuted(false);
    expect(localStorage.setItem).toHaveBeenCalledWith('scrumPokerMuted', 'false');
  });

  it('cancels speech when muting', () => {
    setMuted(true);
    expect(globalThis.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('does not cancel speech when unmuting', () => {
    vi.clearAllMocks();
    setMuted(false);
    expect(globalThis.speechSynthesis.cancel).not.toHaveBeenCalled();
  });
});

describe('sound functions', () => {
  beforeEach(() => {
    setMuted(false);
    vi.clearAllMocks();
  });

  it('playAllVotedSound creates oscillators when unmuted', async () => {
    const { playAllVotedSound } = await import('@/lib/sounds');
    playAllVotedSound();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it('playAllVotedSound does nothing when muted', async () => {
    setMuted(true);
    vi.clearAllMocks();
    const { playAllVotedSound } = await import('@/lib/sounds');
    playAllVotedSound();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('playPopSound creates oscillator when unmuted', async () => {
    const { playPopSound } = await import('@/lib/sounds');
    playPopSound();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('playEmojiSound plays unique sound for known emoji', async () => {
    const { playEmojiSound } = await import('@/lib/sounds');
    playEmojiSound('🎉');
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('playEmojiSound falls back to pop for unknown emoji', async () => {
    vi.clearAllMocks();
    const { playEmojiSound } = await import('@/lib/sounds');
    playEmojiSound('🦄');
    // Falls back to playPopSound which also creates an oscillator
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('playRevealSound creates oscillators when unmuted', async () => {
    const { playRevealSound } = await import('@/lib/sounds');
    playRevealSound();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });
});
