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
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            emojiPickerOpen
              ? 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30'
              : 'glass text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <span className="text-base">😄</span>
          <span className="hidden sm:inline text-xs">Reaction</span>
        </button>
        <button
          onClick={() => { setChatOpen(!chatOpen); setEmojiPickerOpen(false); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            chatOpen
              ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30'
              : 'glass text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <span className="text-base">💬</span>
          <span className="hidden sm:inline text-xs">Chat</span>
        </button>
      </div>
      {emojiPickerOpen && (
        <div className="glass rounded-2xl p-3 shadow-2xl shadow-black/10 dark:shadow-black/30 float-in">
          <div className="flex flex-wrap justify-center gap-1">
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => sendEmoji(emoji)}
                className="w-10 h-10 text-xl rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all hover:scale-125 active:scale-95 flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      {chatOpen && (
        <div className="glass rounded-2xl p-4 shadow-2xl shadow-black/10 dark:shadow-black/30 float-in w-full max-w-md">
          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
            {QUICK_MESSAGES.map(msg => (
              <button
                key={msg}
                onClick={() => sendChat(msg)}
                className="px-2.5 py-1.5 text-xs glass rounded-lg text-slate-500 dark:text-slate-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-500/20 dark:hover:border-indigo-500/30 transition-all active:scale-95"
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
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 input-glow transition-all"
              maxLength={50}
              autoFocus
            />
            <button
              onClick={() => sendChat(chatInput)}
              disabled={!chatInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-700/50 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
