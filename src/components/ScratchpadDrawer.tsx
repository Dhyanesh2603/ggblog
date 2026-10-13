import React, { useState } from 'react';
import { useNovel } from '../context/NovelContext';
import type { ScratchpadNote } from '../types/novel';

interface ScratchpadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchpadDrawer: React.FC<ScratchpadDrawerProps> = ({ isOpen, onClose }) => {
  const { scratchpadNotes, addScratchpadNote, deleteScratchpadNote } = useNovel();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState<ScratchpadNote['tag']>('scratch');

  if (!isOpen) return null;

  const filteredNotes = scratchpadNotes.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.tag === activeFilter;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    addScratchpadNote({
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      tag
    });
    setTitle('');
    setContent('');
    setIsAdding(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/35 backdrop-blur-[1px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Editorial Scratchpad"
    >
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <aside className="relative w-full max-w-md h-full bg-[var(--bg)] border-l border-[var(--border)] p-6 sm:p-8 shadow-lg flex flex-col justify-between z-10 space-y-5 overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
            <div>
              <div className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                ※ Marginalia & Dossier
              </div>
              <h2 className="font-editorial-title text-2xl text-[var(--text)]">
                Writer Scratchpad
              </h2>
              <p className="font-editorial-body text-xs italic text-[var(--text-muted)] mt-0.5">
                Character arcs, research fragments, and plot reminders.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="font-mono-meta text-xs tracking-wider px-2 py-1 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Tag Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 font-mono-meta text-[9.5px]">
            {['all', 'character', 'plot', 'research', 'dialogue', 'scratch'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveFilter(t)}
                className={`px-2 py-0.5 uppercase tracking-wider border transition-colors cursor-pointer ${
                  activeFilter === t
                    ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Quick Add Button or Form */}
          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full font-mono-meta text-[10px] tracking-wider py-2 border border-dashed border-[var(--border)] hover:border-[var(--text)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer block text-center"
            >
              + ADD NEW SCRATCHPAD ENTRY
            </button>
          ) : (
            <form onSubmit={handleAdd} className="p-3.5 border border-[var(--border)] bg-[var(--paper-tint)]/40 space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note Title or Subject..."
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 text-xs font-editorial-body text-[var(--text)] font-semibold"
              />
              <textarea
                value={content}
                rows={4}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type fragment, research reference, quote..."
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 text-xs font-editorial-body text-[var(--text)] resize-none"
              />
              <div className="flex items-center justify-between">
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as any)}
                  className="bg-[var(--bg)] border border-[var(--border)] text-[10px] font-mono-meta px-2 py-1 text-[var(--text)]"
                >
                  <option value="scratch">Scratchpad</option>
                  <option value="character">Character</option>
                  <option value="plot">Plot</option>
                  <option value="research">Research</option>
                  <option value="dialogue">Dialogue</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    type="submit"
                    className="font-mono-meta text-[10px] px-3 py-1 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 cursor-pointer"
                  >
                    SAVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="font-mono-meta text-[10px] px-2 py-1 border border-[var(--border)] cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Notes List */}
          <div className="space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-xs font-editorial-body italic text-[var(--text-muted)] border border-dashed border-[var(--border)]">
                No entries match this filter. Use the scratchpad to store character notes and ideas while writing.
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className="p-3.5 border border-[var(--border)] bg-[var(--bg)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-editorial-body text-sm font-semibold text-[var(--text)]">
                      {note.title}
                    </span>
                    <span className="font-mono-meta text-[8.5px] uppercase tracking-wider px-1.5 py-0.2 border border-[var(--border)] text-[var(--text-muted)]">
                      {note.tag}
                    </span>
                  </div>
                  <p className="font-editorial-body text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-[var(--border)]/50">
                    <span className="font-mono-meta text-[8px] text-[var(--text-faint)]">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteScratchpadNote(note.id)}
                      className="font-mono-meta text-[9px] text-[var(--text-faint)] hover:text-red-700 cursor-pointer"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
