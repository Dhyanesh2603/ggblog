import React from 'react';
import type { AuthorNote } from '../types/novel';

interface MarginalNoteProps {
  note: AuthorNote;
  isOpen: boolean;
  onToggle: () => void;
}

export const MarginalNote: React.FC<MarginalNoteProps> = ({ note, isOpen, onToggle }) => {
  return (
    <div className="relative inline-block ml-1 align-baseline">
      {/* Marker button */}
      <button
        type="button"
        onClick={onToggle}
        className={`font-mono-meta text-[11px] px-1 py-0.5 transition-colors border ${
          isOpen
            ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
            : 'text-[var(--text-muted)] border-transparent hover:border-[var(--border)] hover:text-[var(--text)]'
        }`}
        aria-expanded={isOpen}
        aria-label={`Author's note ${note.marker}`}
        title={`Author's Note: ${note.title}`}
      >
        {note.marker}
      </button>

      {/* Note popover / inline card for desktop and mobile */}
      {isOpen && (
        <div
          role="region"
          aria-label={`Author note: ${note.title}`}
          className="my-4 md:my-6 p-4 sm:p-5 bg-[var(--paper-tint)] border-l-2 border-[var(--text)] text-left shadow-sm transition-all animate-reveal-1"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-faint)]">
            <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)]">
              AUTHOR'S NOTE {note.marker} — {note.title.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={onToggle}
              className="font-mono-meta text-[9px] tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text)] px-1"
              aria-label="Dismiss note"
            >
              DISMISS [×]
            </button>
          </div>
          <p className="font-editorial-body text-[16px] sm:text-[17px] leading-relaxed text-[var(--text)] italic">
            "{note.content}"
          </p>
        </div>
      )}
    </div>
  );
};
