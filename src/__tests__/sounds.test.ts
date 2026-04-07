import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

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
  createOscillator: vi.fn(() => ({ ...mockOscillator, frequency: { ...mockOscillator.frequency } })),
  createGain: vi.fn(() => ({ ...mockGain, gain: { ...mockGain.gain } })),
};

vi.stubGlobal('AudioContext', function () { return mockAudioContext; });

// Mock speechSynthesis
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => []),
  addEventListener: vi.fn(),
  speaking: false,
  pending: false,
};

vi.stubGlobal('speechSynthesis', mockSpeechSynthesis);

// Mock SpeechSynthesisUtterance
vi.stubGlobal('SpeechSynthesisUtterance', function (this: Record<string, unknown>, text: string) {
  this.text = text;
  this.rate = 1;
  this.pitch = 1;
  this.volume = 1;
  this.lang = '';
  this.voice = null;
});

// Mock navigator
vi.stubGlobal('navigator', { userAgent: 'Safari/605.1.15' });

// Mock localStorage
const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete storage[key]; }),
});

describe('mute state', () => {
  let sounds: typeof import('@/lib/sounds');

  beforeEach(async () => {
    vi.resetModules();
    sounds = await import('@/lib/sounds');
    sounds.setMuted(false);
  });

  it('starts unmuted by default', () => {
    expect(sounds.isMuted()).toBe(false);
  });

  it('toggles muted state', () => {
    sounds.setMuted(true);
    expect(sounds.isMuted()).toBe(true);
    sounds.setMuted(false);
    expect(sounds.isMuted()).toBe(false);
  });

  it('persists muted state to localStorage', () => {
    sounds.setMuted(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('scrumPokerMuted', 'true');
    sounds.setMuted(false);
    expect(localStorage.setItem).toHaveBeenCalledWith('scrumPokerMuted', 'false');
  });

  it('cancels speech when muting', () => {
    sounds.setMuted(true);
    expect(globalThis.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('does not cancel speech when unmuting', () => {
    vi.clearAllMocks();
    sounds.setMuted(false);
    expect(globalThis.speechSynthesis.cancel).not.toHaveBeenCalled();
  });
});

describe('sound functions', () => {
  let sounds: typeof import('@/lib/sounds');

  beforeEach(async () => {
    vi.resetModules();
    sounds = await import('@/lib/sounds');
    sounds.setMuted(false);
    vi.clearAllMocks();
  });

  it('playAllVotedSound creates oscillators when unmuted', () => {
    sounds.playAllVotedSound();
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3);
  });

  it('playAllVotedSound does nothing when muted', () => {
    sounds.setMuted(true);
    vi.clearAllMocks();
    sounds.playAllVotedSound();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('playPopSound creates oscillator when unmuted', () => {
    sounds.playPopSound();
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
  });

  it('playPopSound does nothing when muted', () => {
    sounds.setMuted(true);
    vi.clearAllMocks();
    sounds.playPopSound();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('playEmojiSound plays unique sound for known emoji', () => {
    sounds.playEmojiSound('🎉');
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4); // 4 notes for 🎉
  });

  it('playEmojiSound falls back to pop for unknown emoji', () => {
    sounds.playEmojiSound('🦄');
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1); // pop sound
  });

  it('playEmojiSound does nothing when muted', () => {
    sounds.setMuted(true);
    vi.clearAllMocks();
    sounds.playEmojiSound('🎉');
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('playRevealSound creates 4 oscillators when unmuted', () => {
    sounds.playRevealSound();
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
  });

  it('playRevealSound does nothing when muted', () => {
    sounds.setMuted(true);
    vi.clearAllMocks();
    sounds.playRevealSound();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('plays each known emoji with correct number of notes', () => {
    const expectedNotes: Record<string, number> = {
      '👍': 2, '👏': 4, '🎉': 4, '🔥': 3, '😂': 4,
      '🤔': 3, '😱': 2, '💀': 3, '🚀': 4, '❤️': 3,
      '👀': 2, '🙈': 2, '🍻': 2,
    };
    for (const [emoji, count] of Object.entries(expectedNotes)) {
      vi.clearAllMocks();
      sounds.playEmojiSound(emoji);
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(count);
    }
  });
});

describe('speakMessage', () => {
  let sounds: typeof import('@/lib/sounds');

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    mockSpeechSynthesis.getVoices.mockReturnValue([]);
    sounds = await import('@/lib/sounds');
    sounds.setMuted(false);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when muted', () => {
    sounds.setMuted(true);
    sounds.speakMessage('hello');
    expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('speaks English text on Safari (no cancel)', () => {
    vi.stubGlobal('navigator', { userAgent: 'Safari/605.1.15' });
    sounds.speakMessage('hello world');
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(mockSpeechSynthesis.cancel).not.toHaveBeenCalled();
  });

  it('speaks with cancel + delay on Chrome', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' });
    sounds.speakMessage('hello world');
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(1);
    expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('does not cancel on Edge (has Chrome in UA but also Edg)', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Chrome/120.0.0.0 Edg/120.0.0.0' });
    sounds.speakMessage('hello');
    expect(mockSpeechSynthesis.cancel).not.toHaveBeenCalled();
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('speaks Thai text with th-TH lang', () => {
    vi.stubGlobal('navigator', { userAgent: 'Safari/605.1.15' });
    sounds.speakMessage('สวัสดี');
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.lang).toBe('th-TH');
  });

  it('speaks English text with en-US lang', () => {
    vi.stubGlobal('navigator', { userAgent: 'Safari/605.1.15' });
    sounds.speakMessage('hello');
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.lang).toBe('en-US');
  });

  it('selects preferred Thai voice when available', () => {
    const thaiVoice = { name: 'Kanya', lang: 'th-TH' };
    mockSpeechSynthesis.getVoices.mockReturnValue([thaiVoice]);
    vi.stubGlobal('navigator', { userAgent: 'Safari/605.1.15' });
    sounds.speakMessage('สวัสดี');
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toEqual(thaiVoice);
  });

  it('selects preferred English voice when available', () => {
    const enVoice = { name: 'Samantha', lang: 'en-US' };
    mockSpeechSynthesis.getVoices.mockReturnValue([enVoice]);
    vi.stubGlobal('navigator', { userAgent: 'Safari/605.1.15' });
    sounds.speakMessage('hello');
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toEqual(enVoice);
  });

  it('falls back to any matching language voice if preferred not found', () => {
    const fallbackVoice = { name: 'Generic Thai', lang: 'th-TH' };
    mockSpeechSynthesis.getVoices.mockReturnValue([fallbackVoice]);
    vi.stubGlobal('navigator', { userAgent: 'Safari/605.1.15' });
    sounds.speakMessage('สวัสดี');
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toEqual(fallbackVoice);
  });

  it('uses no voice if none match the language', () => {
    const jpVoice = { name: 'Kyoko', lang: 'ja-JP' };
    mockSpeechSynthesis.getVoices.mockReturnValue([jpVoice]);
    vi.stubGlobal('navigator', { userAgent: 'Safari/605.1.15' });
    sounds.speakMessage('hello');
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBeNull();
  });
});
