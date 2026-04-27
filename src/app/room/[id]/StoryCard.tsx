'use client';

import { useEffect, useRef, useState } from 'react';
import type { Story } from '@/types';

interface DraftState { title: string; ref: string; tags: string }

function toDraft(story: Story | null): DraftState {
  return {
    title: story?.title ?? '',
    ref: story?.ref ?? '',
    tags: (story?.tags ?? []).join(', '),
  };
}

export function StoryCard({ story, isHost, onSet }: Readonly<{
  story: Story | null;
  isHost: boolean;
  onSet: (story: Story | null) => void;
}>) {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editing = draft !== null;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const enterEdit = () => setDraft(toDraft(story));
  const cancel = () => setDraft(null);

  const save = () => {
    if (!draft) return;
    const t = draft.title.trim();
    if (!t) {
      onSet(null);
    } else {
      onSet({
        title: t,
        ref: draft.ref.trim() || undefined,
        tags: draft.tags.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6),
      });
    }
    setDraft(null);
  };

  const clear = () => {
    onSet(null);
    setDraft(null);
  };

  if (draft) {
    return (
      <div className="story-card fade-up">
        <div className="between">
          <span className="cap">edit story</span>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save}>save</button>
          </div>
        </div>
        <textarea
          ref={inputRef}
          className="story-input"
          rows={2}
          placeholder='"As a user, I want to…"'
          value={draft.title}
          onChange={e => setDraft({ ...draft, title: e.target.value })}
          maxLength={200}
        />
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          <input
            className="input mono"
            placeholder="ref (e.g. JIRA-2418)"
            value={draft.ref}
            maxLength={30}
            onChange={e => setDraft({ ...draft, ref: e.target.value })}
            style={{ flex: 1, fontSize: 13, padding: '8px 10px' }}
          />
          <input
            className="input"
            placeholder="tags, comma, separated"
            value={draft.tags}
            onChange={e => setDraft({ ...draft, tags: e.target.value })}
            style={{ flex: 2, fontSize: 13, padding: '8px 10px' }}
          />
        </div>
        {story && (
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={clear}>remove story</button>
          </div>
        )}
      </div>
    );
  }

  if (!story) {
    if (!isHost) return null;
    return (
      <div
        className="story-card fade-up"
        onClick={enterEdit}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && enterEdit()}
        style={{ cursor: 'pointer', borderStyle: 'dashed' }}
      >
        <span className="cap">add a story</span>
        <div className="serif" style={{ fontSize: 18, lineHeight: 1.3, marginTop: 6, color: 'var(--ink-4)' }}>
          What are we estimating?
        </div>
      </div>
    );
  }

  return (
    <div className="story-card fade-up">
      <div className="between">
        <span className="cap">current story</span>
        <div className="row" style={{ gap: 8 }}>
          {story.ref && <span className="muted mono" style={{ fontSize: 11 }}>{story.ref}</span>}
          {isHost && (
            <button className="btn btn-ghost btn-sm" onClick={enterEdit}>edit</button>
          )}
        </div>
      </div>
      <div className="serif" style={{ fontSize: 22, lineHeight: 1.3, marginTop: 6 }}>
        {story.title}
      </div>
      {story.tags && story.tags.length > 0 && (
        <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {story.tags.map(t => (
            <span key={t} className="chip chip-soft">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
