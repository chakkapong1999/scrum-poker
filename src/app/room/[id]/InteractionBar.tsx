'use client';

import { useState } from 'react';
import { playEmojiSound, playPopSound, speakMessage } from '@/lib/sounds';
import { getSocket } from '@/lib/socket';

const REACTION_EMOJIS = ['👍', '👏', '🎉', '🔥', '😂', '🤔', '😱', '💀', '🚀', '❤️', '👀', '🙈', '🍻'];

const QUICK_MESSAGES = [
  "let's go!", 'hurry up :)', 'take your time',
  'need more info', 'too complex', 'easy one',
  'agree', 'not sure…', "let's discuss",
];

export function InteractionBar() {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

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

  const tabBtn = (active: boolean) =>
    `h-8 px-3 inline-flex items-center gap-1.5 surface text-xs uppercase tracking-widest transition-colors ${
      active
        ? 'border-[var(--accent)] text-[var(--accent)]'
        : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--surface-border-hover)]'
    }`;

  return (
    <div className="flex flex-col items-center gap-2 mb-5">
      <div className="flex gap-1.5">
        <button
          onClick={() => { setEmojiPickerOpen(!emojiPickerOpen); setChatOpen(false); }}
          className={tabBtn(emojiPickerOpen)}
        >
          <span className="text-base leading-none">☺</span>
          <span className="hidden sm:inline">react</span>
        </button>
        <button
          onClick={() => { setChatOpen(!chatOpen); setEmojiPickerOpen(false); }}
          className={tabBtn(chatOpen)}
        >
          <span className="text-[var(--accent)]">&gt;_</span>
          <span className="hidden sm:inline">say</span>
        </button>
      </div>
      {emojiPickerOpen && (
        <div className="surface rounded p-2 float-in">
          <div className="flex flex-wrap justify-center gap-1">
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => sendEmoji(emoji)}
                className="w-9 h-9 text-lg rounded hover:bg-[var(--surface-hover)] transition-all hover:scale-125 active:scale-95 flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      {chatOpen && (
        <div className="surface rounded p-3 float-in w-full max-w-md">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">{'// quick'}</div>
          <div className="flex flex-wrap gap-1 mb-3">
            {QUICK_MESSAGES.map(msg => (
              <button
                key={msg}
                onClick={() => sendChat(msg)}
                className="px-2 py-1 text-[11px] surface-alt rounded text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 flex items-center gap-1.5 px-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded focus-within:border-[var(--accent)] transition-colors">
              <span className="text-[var(--accent)] text-xs">&gt;</span>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat(chatInput)}
                placeholder="type a message…"
                className="flex-1 py-2 bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none"
                maxLength={50}
                autoFocus
              />
            </div>
            <button
              onClick={() => sendChat(chatInput)}
              disabled={!chatInput.trim()}
              className="px-3 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--surface-hover)] disabled:text-[var(--muted)] disabled:cursor-not-allowed text-[#08090b] text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
