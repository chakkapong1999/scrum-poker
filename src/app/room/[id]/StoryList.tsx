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
  const [extracted, setExtracted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const urlMatch = text.match(/https?:\/\/[^/\s]+\/browse\/([A-Z][A-Z0-9]+-\d+)/i);
    if (urlMatch) {
      e.preventDefault();
      setDraft(urlMatch[1].toUpperCase());
      setExtracted(true);
      setTimeout(() => setExtracted(false), 2000);
    }
  };

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

  return (
    <>
      {collapsed && (
        <div className="hidden lg:flex glass rounded-lg p-2 mb-4 flex-col items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--surface-hover)] transition-all"
            title="Expand stories"
            aria-label="Expand stories"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="text-[10px] text-[var(--muted)] tabular-nums [writing-mode:vertical-rl] rotate-180 tracking-wider font-mono">
            {stories.length - remaining}/{stories.length}
          </div>
        </div>
      )}

    <div className={`glass rounded-xl p-3 mb-4 ${collapsed ? 'lg:hidden' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-semibold text-[var(--gold)] uppercase tracking-[0.25em] font-serif">
          Stories
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--muted)] tabular-nums font-mono">
            {stories.length - remaining}/{stories.length} done
          </span>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:inline-flex p-1 rounded-md text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--surface-hover)] transition-all"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {stories.length === 0 && (
        <div className="flex flex-col items-center text-center gap-2 py-6 mb-3 rounded-lg border border-dashed border-[var(--gold-border)] bg-[var(--felt)]">
          <span className="text-xl text-[var(--gold)] opacity-50 font-serif" aria-hidden>♦</span>
          <p className="text-xs text-[var(--muted)] px-3">
            {isHost ? 'No stories yet. Add one below to start estimating.' : 'Waiting for host to add stories…'}
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
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border-l-2 border transition-all ${
                  isCurrent
                    ? 'bg-[var(--gold-light)] border-[var(--gold-border)] border-l-[var(--gold)]'
                    : 'bg-[var(--felt)] border-[var(--surface-border)] border-l-transparent'
                }`}
              >
                <span className={`text-[10px] font-mono w-5 tabular-nums shrink-0 ${isCurrent ? 'text-[var(--gold)]' : 'text-[var(--muted)]'}`}>
                  #{idx + 1}
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
                    className="flex-1 bg-transparent border-b border-[var(--gold)] text-xs text-[var(--foreground)] outline-none px-1 py-0.5"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(story.id)}
                    disabled={!isHost}
                    className={`flex-1 text-left text-xs truncate ${
                      isCurrent ? 'text-[var(--foreground)] font-semibold' : 'text-[var(--foreground)]'
                    } ${isHost ? 'cursor-pointer hover:underline' : 'cursor-default'} ${
                      story.completed && !isCurrent ? 'line-through text-[var(--muted)]' : ''
                    }`}
                    title={story.title}
                  >
                    {story.title}
                  </button>
                )}

                {story.completed && story.finalPoint !== null && (
                  <span className="px-1.5 py-0 rounded text-[10px] font-mono font-semibold bg-[var(--emerald-light)] text-[var(--emerald)] border border-[var(--emerald-border)] tabular-nums shrink-0">
                    {story.finalPoint}
                  </span>
                )}

                {isHost && !isEditing && (
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => startEdit(story)}
                      className="p-0.5 text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                      aria-label="Edit story"
                      title="Edit"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(story.id)}
                      className="p-0.5 text-[var(--muted)] hover:text-[var(--accent-red)] transition-colors"
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
          <div className="relative flex-1">
            <input
              value={draft}
              onChange={e => { setDraft(e.target.value); setExtracted(false); }}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              onPaste={handlePaste}
              placeholder="Add a story"
              maxLength={200}
              className={`w-full px-2.5 py-1.5 rounded-lg bg-[var(--input-bg)] border text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none transition-colors ${
                extracted ? 'border-[var(--emerald)] text-[var(--emerald)]' : 'border-[var(--input-border)] focus:border-[var(--gold-border)]'
              }`}
            />
            {extracted && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--emerald)] font-medium pointer-events-none">
                ✓ extracted
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!draft.trim()}
            className="btn-felt px-3 py-1.5 text-xs font-semibold rounded-lg"
          >
            Add
          </button>
        </div>
      )}
    </div>
    </>
  );
}
