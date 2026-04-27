'use client';

import { useEffect, useRef, useState } from 'react';
import { VoteCard } from './PlayerCard';

const REACTIONS = ['👍', '👏', '🎉', '🔥', '😂', '🤔', '😱', '💀', '🚀', '❤️', '👀', '🙈', '🍻'];
const QUICK_MSGS = ["Let's go!", 'Hurry up! 😄', 'Take your time', 'Need more info', 'Too complex', 'Easy one!', 'Agree 👍', 'Not sure…'];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function DeckBar({
  votingSystem,
  myVote,
  revealed,
  votedCount,
  total,
  isHost,
  onVote,
  onReveal,
  onReset,
  onEmoji,
  onChat,
}: Readonly<{
  votingSystem: string[];
  myVote: string | null;
  revealed: boolean;
  votedCount: number;
  total: number;
  isHost: boolean;
  onVote: (v: string) => void;
  onReveal: () => void;
  onReset: () => void;
  onEmoji: (e: string) => void;
  onChat: (m: string) => void;
}>) {
  const [pickerOpen, setPickerOpen] = useState<null | 'emoji' | 'chat'>(null);
  const [chatInput, setChatInput] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPickerOpen(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [pickerOpen]);

  const sendChat = (msg: string) => {
    const t = msg.trim();
    if (!t) return;
    onChat(t);
    setChatInput('');
    setPickerOpen(null);
  };

  return (
    <div className="deck-bar" ref={wrapRef}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="row" style={{ gap: 10 }}>
            <span className="cap">your vote</span>
            {myVote && !revealed && (
              <span className="chip chip-accent">
                <CheckIcon /> locked in: <strong style={{ fontWeight: 600 }}>{myVote}</strong>
              </span>
            )}
            {revealed && <span className="chip chip-soft">votes revealed</span>}
          </div>
          <div className="row" style={{ gap: 6, position: 'relative' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPickerOpen(pickerOpen === 'emoji' ? null : 'emoji')}>
              <SmileIcon /> react
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPickerOpen(pickerOpen === 'chat' ? null : 'chat')}>
              <ChatIcon /> chat
            </button>
            {isHost && !revealed && (
              <button className="btn btn-accent btn-sm" disabled={votedCount === 0} onClick={onReveal}>
                reveal {votedCount > 0 && <span style={{ opacity: 0.7 }}>({votedCount}/{total})</span>}
              </button>
            )}
            {isHost && revealed && (
              <button className="btn btn-primary btn-sm" onClick={onReset}>+ new round</button>
            )}

            {pickerOpen === 'emoji' && (
              <div className="popover fade-up" style={{ right: 0, width: 300 }}>
                <div className="emoji-grid">
                  {REACTIONS.map(e => (
                    <button key={e} className="emoji-btn" onClick={() => { onEmoji(e); setPickerOpen(null); }}>{e}</button>
                  ))}
                </div>
              </div>
            )}
            {pickerOpen === 'chat' && (
              <div className="popover fade-up" style={{ right: 0, width: 360 }}>
                <div className="quick-msgs">
                  {QUICK_MSGS.map(m => (
                    <button key={m} className="quick-msg" onClick={() => sendChat(m)}>{m}</button>
                  ))}
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <input
                    className="input"
                    style={{ padding: '8px 12px', fontSize: 14 }}
                    placeholder="type a message…"
                    value={chatInput}
                    maxLength={50}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat(chatInput)}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => sendChat(chatInput)} disabled={!chatInput.trim()}>
                    <SendIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="row" style={{ gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {votingSystem.map(v => (
            <VoteCard
              key={v}
              value={v}
              selected={myVote === v}
              onClick={() => onVote(v)}
              disabled={revealed}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
