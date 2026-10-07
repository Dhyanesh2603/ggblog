import React, { useState } from 'react';
import { JOURNAL_NOTES } from '../data/notesData';

export const NotesPage: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(JOURNAL_NOTES[0].id);

  return (
    <div className="w-full">
      <section className="editorial-container pt-16 md:pt-24 pb-24 md:pb-32">
        {/* Page Folio */}
        <header className="max-w-2xl space-y-4 pb-12 border-b border-[var(--border)]">
          <span className="font-mono-meta text-[11px] md:text-xs tracking-[0.18em] text-[var(--text-muted)] block">
            JOURNAL & MARGINALIA
          </span>
          <h1 className="font-editorial-title text-6xl sm:text-7xl tracking-tight text-[var(--text)]">
            Notes
          </h1>
          <p className="font-editorial-body text-xl text-[var(--text-muted)] italic">
            Reflections on craft, archival research, sentence structure, and revisions.
          </p>
        </header>

        {/* Editorial list */}
        <div className="divide-y divide-[var(--border)] pt-8">
          {JOURNAL_NOTES.map((note) => {
            const isExpanded = expandedId === note.id;

            return (
              <article key={note.id} className="py-8 sm:py-10 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                  {/* Date Column */}
                  <div className="md:col-span-3">
                    <time className="font-mono-meta text-xs tracking-[0.16em] text-[var(--text-faint)]">
                      {note.date}
                    </time>
                    <span className="font-mono-meta text-[10px] text-[var(--text-muted)] block mt-1">
                      {note.readTime} READ
                    </span>
                  </div>

                  {/* Title & Preview / Full Content */}
                  <div className="md:col-span-9 space-y-4">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : note.id)}
                      className="text-left group block w-full focus:outline-none"
                    >
                      <h2 className="font-editorial-title text-3xl sm:text-4xl text-[var(--text)] tracking-tight group-hover:italic transition-all">
                        {note.title}
                      </h2>
                    </button>

                    <p className="font-editorial-body text-lg text-[var(--text-muted)] leading-relaxed">
                      {note.summary}
                    </p>

                    {/* Expandable full essay */}
                    {isExpanded && (
                      <div className="pt-6 mt-6 border-t border-[var(--border-faint)] space-y-6 font-editorial-body text-[19px] leading-relaxed text-[var(--text)] max-w-2xl animate-reveal-1">
                        {note.content.map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={() => setExpandedId(null)}
                            className="font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text)] underline"
                          >
                            COLLAPSE ENTRY ↑
                          </button>
                        </div>
                      </div>
                    )}

                    {!isExpanded && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedId(note.id)}
                          className="font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text)] hover:underline inline-flex items-center gap-1.5"
                        >
                          <span>READ NOTE</span>
                          <span>↓</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
