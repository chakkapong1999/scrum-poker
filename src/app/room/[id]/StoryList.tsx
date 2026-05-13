'use client';

import { useState } from 'react';
import type { Story } from '@/types';

export function StoryList({
  stories,
  currentStoryId,
  isHost,
  collapsed = false,
  onToggleCollapse,
  onAdd,
  onUpdate,
  onDelete,
  onSelect,
}: Readonly<{
  stories: Story[];
  currentStoryId: string | null;
  isHost: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onAdd: (title: string) => void;
  onUpdate: (storyId: string, title: string) => void;
  onDelete: (storyId: string) => void;
  onSelect: (storyId: string) => void;
}>) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const handleAdd = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft('');
  };

  const startEdit = (story: Story) => {
    setEditingId(story.id);
    setEditDraft(story.title);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const value = editDraft.trim();
    if (value) onUpdate(editingId, value);
    setEditingId(null);
    setEditDraft('');
  };

  const remaining = stories.filter(s => !s.completed).length;
  const done = stories.length - remaining;

  return (
    <>
      {collapsed && (
        <div className="hidden lg:flex surface rounded p-1.5 mb-3 flex-col items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="p-1 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
            title="Expand stories"
            aria-label="Expand stories"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="text-[9px] text-[var(--muted)] tabular-nums [writing-mode:vertical-rl] rotate-180 tracking-wider">
            {done}/{stories.length}
          </div>
        </div>
      )}

      <div className={`surface rounded p-3 mb-3 ${collapsed ? 'lg:hidden' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="term-title">stories</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--muted)] tabular-nums">
              [{done}/{stories.length}]
            </span>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:inline-flex p-0.5 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {stories.length === 0 && (
          <div className="text-center py-5 px-2 mb-2 rounded border border-dashed border-[var(--surface-border)] bg-[var(--background-alt)]">
            <p className="text-[11px] text-[var(--muted)] font-mono">
              {isHost ? '// no stories yet — add one below' : '// awaiting host…'}
            </p>
          </div>
        )}

        {stories.length > 0 && (
          <ul className="space-y-1 mb-2 max-h-[60vh] overflow-y-auto pr-1">
            {stories.map((story, idx) => {
              const isCurrent = story.id === currentStoryId;
              const isEditing = editingId === story.id;
              return (
                <li
                  key={story.id}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
                    isCurrent
                      ? 'bg-[var(--accent-light)] border-[var(--accent-border)]'
                      : 'bg-[var(--background-alt)] border-[var(--surface-border)] hover:border-[var(--surface-border-hover)]'
                  }`}
                >
                  <span className="text-[10px] text-[var(--muted)] w-6 tabular-nums shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {isEditing ? (
                    <input
                      autoFocus
                      value={editDraft}
                      onChange={e => setEditDraft(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') { setEditingId(null); setEditDraft(''); }
                      }}
                      className="flex-1 bg-transparent border-b border-[var(--accent)] text-xs text-[var(--foreground)] outline-none px-1 py-0.5"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => isHost && onSelect(story.id)}
                      disabled={!isHost}
                      className={`flex-1 text-left text-xs truncate ${
                        isCurrent ? 'text-[var(--accent)] font-semibold' : 'text-[var(--foreground)]'
                      } ${isHost ? 'cursor-pointer hover:underline' : 'cursor-default'} ${
                        story.completed && !isCurrent ? 'line-through text-[var(--muted)]' : ''
                      }`}
                      title={story.title}
                    >
                      {story.title}
                    </button>
                  )}

                  {story.completed && story.finalPoint !== null && (
                    <span className="px-1.5 py-0 rounded text-[10px] font-semibold bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent-border)] tabular-nums shrink-0">
                      {story.finalPoint}
                    </span>
                  )}

                  {isHost && !isEditing && (
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => startEdit(story)}
                        className="p-0.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="Edit story"
                        title="Edit"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(story.id)}
                        className="p-0.5 text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                        aria-label="Delete story"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                        </svg>
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {isHost && (
          <div className="flex gap-1.5">
            <div className="flex-1 flex items-center gap-1 px-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded focus-within:border-[var(--accent)] transition-colors">
              <span className="text-[var(--accent)] text-xs">+</span>
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                placeholder="add a story…"
                maxLength={200}
                className="flex-1 py-1.5 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!draft.trim()}
              className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--surface-hover)] disabled:text-[var(--muted)] disabled:cursor-not-allowed text-[#08090b] text-[10px] uppercase tracking-widest font-semibold rounded transition-colors"
            >
              add
            </button>
          </div>
        )}
      </div>
    </>
  );
}
