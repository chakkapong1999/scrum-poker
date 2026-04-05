let audioCtx: AudioContext | null = null;
let _muted = typeof window !== 'undefined' && localStorage.getItem('scrumPokerMuted') === 'true';

export function isMuted(): boolean {
  return _muted;
}

export function setMuted(muted: boolean) {
  _muted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('scrumPokerMuted', String(muted));
  }
  if (muted && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** Short rising chime — played when all players have voted */
export function playAllVotedSound() {
  if (_muted) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.3);
  });
}

/** Short pop — played when sending a chat message */
export function playPopSound() {
  if (_muted) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

type OscillatorShape = OscillatorType;

interface EmojiSoundDef {
  notes: number[];
  type: OscillatorShape;
  duration: number;
  gap: number;
}

const EMOJI_SOUNDS: Record<string, EmojiSoundDef> = {
  '👍': { notes: [523, 659],           type: 'sine',     duration: 0.12, gap: 0.08 },  // upbeat double tap
  '👏': { notes: [587, 659, 587, 659], type: 'sine',     duration: 0.06, gap: 0.06 },  // clap rhythm
  '🎉': { notes: [523, 659, 784, 1047],type: 'triangle', duration: 0.1,  gap: 0.08 },  // party ascending
  '🔥': { notes: [330, 392, 494],      type: 'sawtooth', duration: 0.1,  gap: 0.06 },  // intense rise
  '😂': { notes: [784, 659, 784, 659], type: 'sine',     duration: 0.08, gap: 0.06 },  // bouncy laugh
  '🤔': { notes: [392, 370, 349],      type: 'sine',     duration: 0.2,  gap: 0.1  },  // slow descend
  '😱': { notes: [880, 440],           type: 'sawtooth', duration: 0.15, gap: 0.05 },  // dramatic drop
  '💀': { notes: [247, 220, 196],      type: 'square',   duration: 0.15, gap: 0.1  },  // deep low
  '🚀': { notes: [330, 440, 587, 784], type: 'sawtooth', duration: 0.08, gap: 0.05 },  // fast launch
  '❤️': { notes: [523, 659, 523],      type: 'sine',     duration: 0.15, gap: 0.12 },  // warm heartbeat
  '👀': { notes: [660, 880],           type: 'sine',     duration: 0.06, gap: 0.15 },  // two quick peeks
  '🙈': { notes: [784, 523],           type: 'sine',     duration: 0.1,  gap: 0.08 },  // shy drop
  '🍻': { notes: [523, 523],           type: 'triangle', duration: 0.08, gap: 0.2  },  // clink clink
};

/** Play a unique sound per emoji */
export function playEmojiSound(emoji: string) {
  if (_muted) return;
  const def = EMOJI_SOUNDS[emoji];
  if (!def) {
    playPopSound();
    return;
  }

  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const vol = 0.12;

  def.notes.forEach((freq, i) => {
    const start = now + i * (def.duration + def.gap);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = def.type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + def.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + def.duration);
  });
}

/** Speak a chat message — auto-detects Thai vs English and picks the right voice */
let allVoices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  allVoices = window.speechSynthesis.getVoices();
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

const THAI_RANGE = /[\u0E00-\u0E7F]/;

function isThai(text: string): boolean {
  return THAI_RANGE.test(text);
}

function findVoice(lang: string, preferred: string[]): SpeechSynthesisVoice | null {
  // Try preferred names first
  const byName = allVoices.find(v =>
    v.lang.startsWith(lang) && preferred.some(name => v.name.includes(name))
  );
  if (byName) return byName;
  // Fall back to any voice matching the language
  return allVoices.find(v => v.lang.startsWith(lang)) ?? null;
}

export function speakMessage(text: string) {
  if (_muted) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Re-fetch voices if the initial load got an empty array (Chrome loads async)
  if (allVoices.length === 0) loadVoices();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;

  if (isThai(text)) {
    utterance.lang = 'th-TH';
    const thVoice = findVoice('th', ['Kanya', 'Niwat', 'Sasithorn']);
    if (thVoice) utterance.voice = thVoice;
  } else {
    utterance.lang = 'en-US';
    const enVoice = findVoice('en', ['Samantha', 'Karen', 'Daniel', 'Moira', 'Tessa']);
    if (enVoice) utterance.voice = enVoice;
  }

  // Chrome requires cancel() before speak() to avoid queuing issues,
  // but Safari breaks if cancel() is called. Detect Chrome via userAgent.
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
  if (isChrome) {
    window.speechSynthesis.cancel();
    // Chrome needs a small delay after cancel() or it kills the new utterance
    setTimeout(() => window.speechSynthesis.speak(utterance), 50);
  } else {
    window.speechSynthesis.speak(utterance);
  }
}

/** Reveal fanfare — two-note ascending tone */
export function playRevealSound() {
  if (_muted) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.18, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.4);
  });
}
