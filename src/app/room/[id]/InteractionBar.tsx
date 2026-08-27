'use client';

import { useState } from 'react';
import { playEmojiSound, playPopSound, speakMessage } from '@/lib/sounds';
import { getSocket } from '@/lib/socket';

const REACTION_EMOJIS = ['👍', '👏', '🎉', '🔥', '😂', '🤔', '😱', '💀', '🚀', '❤️', '👀', '🙈', '🍻'];

const QUICK_MESSAGES = [
  'Let\'s go!', 'Hurry up! 😄', 'Take your time',
  'Need more info', 'Too complex', 'Easy one!',
  'Agree 👍', 'Not sure...', 'Let\'s discuss',
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

  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      <div className="flex gap-2">
        <button
          onClick={() => { setEmojiPickerOpen(!emojiPickerOpen); setChatOpen(false); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
            emojiPickerOpen
              ? 'bg-[var(--gold-light)] text-[var(--gold)] border border-[var(--gold-border)]'
              : 'glass text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <span className="text-base">😄</span>
          <span className="hidden sm:inline text-xs tracking-wide">Reaction</span>
        </button>
        <button
          onClick={() => { setChatOpen(!chatOpen); setEmojiPickerOpen(false); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
            chatOpen
              ? 'bg-[var(--gold-light)] text-[var(--gold)] border border-[var(--gold-border)]'
              : 'glass text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <span className="text-base">💬</span>
          <span className="hidden sm:inline text-xs tracking-wide">Chat</span>
        </button>
      </div>
      {emojiPickerOpen && (
        <div className="panel rounded-2xl p-3 float-in [--radius:1rem]">
          <div className="flex flex-wrap justify-center gap-1">
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => sendEmoji(emoji)}
                className="w-10 h-10 text-xl rounded-xl hover:bg-[var(--gold-light)] transition-all hover:scale-125 active:scale-95 flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      {chatOpen && (
        <div className="panel rounded-2xl p-4 float-in w-full max-w-md [--radius:1rem]">
          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
            {QUICK_MESSAGES.map(msg => (
              <button
                key={msg}
                onClick={() => sendChat(msg)}
                className="px-2.5 py-1.5 text-xs glass rounded-full text-[var(--muted)] hover:bg-[var(--gold-light)] hover:text-[var(--gold)] hover:border-[var(--gold-border)] transition-all active:scale-95"
              >
                {msg}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat(chatInput)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none input-glow transition-all"
              maxLength={50}
              autoFocus
            />
            <button
              onClick={() => sendChat(chatInput)}
              disabled={!chatInput.trim()}
              className="btn-felt px-4 py-2 text-sm font-medium rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
