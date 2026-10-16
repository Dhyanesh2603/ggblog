import React, { useState } from 'react';
import type { Chapter } from '../types/novel';

interface ImportReviewModalProps {
  isOpen: boolean;
  detectedTitle: string;
  detectedAuthor: string;
  chapters: Chapter[];
  rawTextPreview?: string;
  onConfirm: (finalTitle: string, finalAuthor: string, finalChapters: Chapter[]) => void;
  onCancel: () => void;
}

export const ImportReviewModal: React.FC<ImportReviewModalProps> = ({
  isOpen,
  detectedTitle,
  detectedAuthor,
  chapters: initialChapters,
  rawTextPreview,
  onConfirm,
  onCancel
}) => {
  const [title, setTitle] = useState(detectedTitle || 'Imported Manuscript');
  const [author, setAuthor] = useState(detectedAuthor || '');
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [isEditingStructure, setIsEditingStructure] = useState(false);

  if (!isOpen) return null;

  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);

  const handleToggleInclude = (index: number) => {
    // If chapters are filtered, we can keep or remove
    if (chapters.length <= 1) return;
    setChapters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateChapterTitle = (index: number, newTitle: string) => {
    setChapters((prev) =>
      prev.map((c, i) => (i === index ? { ...c, title: newTitle } : c))
    );
  };

  const handleConfirm = () => {
    onConfirm(title.trim(), author.trim(), chapters);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="DOCX Manuscript Review"
    >
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-[var(--bg)] border border-[var(--border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 animate-reveal-1">
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[var(--border)]">
          <div>
            <span className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] block uppercase">
              FONT-SIZE &amp; EDITORIAL MANUSCRIPT PARSER
            </span>
            <h2 className="font-editorial-title text-3xl sm:text-4xl text-[var(--text)] tracking-tight mt-1">
              Detected Structure
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text)] p-2 transition-colors"
          >
            ✕ CANCEL
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Metadata Extracted */}
          <div className="p-4 bg-[var(--paper-tint)]/50 border border-[var(--border)] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] block">
                  DETECTED TITLE:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 p-2 bg-[var(--bg)] border border-[var(--border)] font-editorial-title text-xl text-[var(--text)] outline-none focus:border-[var(--text)]"
                />
              </div>

              <div>
                <label className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] block">
                  DETECTED AUTHOR:
                </label>
                <input
                  type="text"
                  placeholder="Author Byline"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full mt-1 p-2 bg-[var(--bg)] border border-[var(--border)] font-editorial-body text-base text-[var(--text)] outline-none focus:border-[var(--text)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2 font-mono-meta text-[11px] text-[var(--text-muted)]">
              <span>{chapters.length} CHAPTERS DETECTED</span>
              <span>·</span>
              <span>{totalWords.toLocaleString()} TOTAL WORDS</span>
              <span>·</span>
              <span>~{Math.max(1, Math.round(totalWords / 225))} MIN ESTIMATED READ</span>
            </div>
          </div>

          {/* Chapters Found Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-faint)]">
              <span className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)]">
                CHAPTERS FOUND ({chapters.length})
              </span>
              <button
                type="button"
                onClick={() => setIsEditingStructure(!isEditingStructure)}
                className="font-mono-meta text-[10.5px] tracking-[0.12em] text-[var(--text)] hover:underline cursor-pointer"
              >
                {isEditingStructure ? '✓ DONE EDITING' : '✎ EDIT STRUCTURE'}
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-[var(--border-faint)]">
              {chapters.map((ch, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-mono text-sm text-emerald-700 select-none">✓</span>
                    <span className="font-mono-meta text-xs text-[var(--text-muted)] w-8">
                      {ch.numberRoman}
                    </span>

                    {isEditingStructure ? (
                      <input
                        type="text"
                        value={ch.title}
                        onChange={(e) => handleUpdateChapterTitle(idx, e.target.value)}
                        className="flex-1 p-1 bg-[var(--bg)] border border-[var(--border)] font-editorial-title text-base text-[var(--text)] outline-none"
                      />
                    ) : (
                      <div className="min-w-0">
                        <span className="font-editorial-title text-lg text-[var(--text)] truncate block">
                          {ch.title}
                        </span>
                        {ch.subtitle && (
                          <span className="font-editorial-body text-xs italic text-[var(--text-muted)] block truncate">
                            Sub-part: {ch.subtitle}
                          </span>
                        )}
                        {ch.epigraph && (
                          <span className="font-editorial-body text-xs italic text-[var(--text-muted)] truncate block">
                            “{ch.epigraph.quote}”
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono-meta text-[10px] text-[var(--text-faint)]">
                      {ch.wordCount.toLocaleString()} W
                    </span>
                    {isEditingStructure && (
                      <button
                        type="button"
                        onClick={() => handleToggleInclude(idx)}
                        className="text-xs text-[var(--text-muted)] hover:text-red-700 p-1"
                        title="Remove chapter"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Preview Excerpt */}
          {rawTextPreview && (
            <div className="p-3 bg-[var(--paper-tint)]/30 border border-[var(--border)]">
              <span className="font-mono-meta text-[10px] tracking-[0.14em] text-[var(--text-muted)] block mb-1">
                MANUSCRIPT OPENING TEASER
              </span>
              <p className="font-editorial-body text-xs italic text-[var(--text-muted)] line-clamp-3">
                "{rawTextPreview}..."
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[var(--border-faint)] flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              DISCARD
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditingStructure(!isEditingStructure)}
                className="font-mono-meta text-xs tracking-[0.14em] px-4 py-2.5 border border-[var(--border)] hover:border-[var(--text)] transition-colors cursor-pointer"
              >
                {isEditingStructure ? 'SAVE EDITS' : 'EDIT STRUCTURE'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="font-mono-meta text-xs tracking-[0.18em] py-2.5 px-6 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity cursor-pointer font-semibold"
              >
                CONFIRM IMPORT →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
