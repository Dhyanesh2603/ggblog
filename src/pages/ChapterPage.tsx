import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CHAPTERS, NOVEL_META } from '../data/novelData';
import { useReading } from '../context/ReadingContext';
import { ScrollProgress } from '../components/ScrollProgress';
import { MarginalNote } from '../components/MarginalNote';

export const ChapterPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    saveProgress,
    progressMap,
    fontSize,
    setFontSize,
    setIsTocOpen
  } = useReading();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const scrollListenerRef = useRef<(() => void) | null>(null);

  // Find current chapter
  const currentChapter = CHAPTERS.find((c) => c.slug === (slug || 'chapter-01'));
  const prevChapter = currentChapter?.prevSlug
    ? CHAPTERS.find((c) => c.slug === currentChapter.prevSlug)
    : null;
  const nextChapter = currentChapter?.nextSlug
    ? CHAPTERS.find((c) => c.slug === currentChapter.nextSlug)
    : null;

  // Track scroll and persist reading progress
  useEffect(() => {
    if (!currentChapter) return;

    // Scroll to top on chapter change unless resuming
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveNoteId(null);

    // Update document title
    document.title = `${currentChapter.numberDisplay} ${currentChapter.title} — ${NOVEL_META.title}`;

    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        saveProgress(currentChapter.slug, 100, 0, true);
        return;
      }
      const scrolled = window.scrollY;
      const percentage = Math.min(100, Math.max(0, Math.round((scrolled / scrollable) * 100)));
      saveProgress(currentChapter.slug, percentage, scrolled, percentage >= 95);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    scrollListenerRef.current = handleScroll;

    // Check if there was prior progress and offer a brief option if needed
    const existing = progressMap[currentChapter.slug];
    if (existing && existing.scrollPosition > 150 && existing.percentage < 90) {
      // Restore previous scroll smoothly after a short delay
      const timer = setTimeout(() => {
        window.scrollTo({ top: existing.scrollPosition, behavior: 'smooth' });
      }, 250);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll);
      };
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentChapter?.slug]);

  if (!currentChapter) {
    return (
      <div className="editorial-container py-32 text-center space-y-6">
        <h2 className="font-editorial-title text-4xl text-[var(--text)]">Chapter Not Found</h2>
        <p className="font-editorial-body text-[var(--text-muted)]">
          The requested chapter folio could not be found in the archive.
        </p>
        <Link
          to="/novel"
          className="inline-block font-mono-meta text-xs tracking-[0.16em] border border-[var(--text)] px-4 py-2 hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors"
        >
          RETURN TO TABLE OF CONTENTS →
        </Link>
      </div>
    );
  }

  return (
    <article className="w-full relative min-h-screen pb-32">
      {/* 1. Subtle 1px Reading Progress Indicator */}
      <ScrollProgress />

      {/* 2. Focused Reading Subheader / Controls */}
      <nav
        aria-label="Reading Controls"
        className="w-full border-b border-[var(--border)] py-2.5 bg-[var(--bg)]/90 backdrop-blur-[2px] sticky top-14 md:top-16 z-30 transition-colors"
      >
        <div className="editorial-container flex items-center justify-between text-[11px] font-mono-meta tracking-[0.12em] text-[var(--text-muted)]">
          {/* Left: Quick Back to TOC */}
          <div className="flex items-center gap-3">
            <Link
              to="/novel"
              className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>INDEX</span>
            </Link>
            <span className="opacity-30">/</span>
            <span className="text-[var(--text)] hidden sm:inline">
              CHAPTER {currentChapter.numberRoman}
            </span>
          </div>

          {/* Right: Typography size controls & Mode */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Font sizing buttons */}
            <div className="flex items-center gap-1.5 border border-[var(--border)] px-1 py-0.5" aria-label="Font Size">
              <button
                type="button"
                onClick={() => setFontSize('default')}
                className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                  fontSize === 'default' ? 'bg-[var(--text)] text-[var(--bg)]' : 'hover:text-[var(--text)]'
                }`}
                title="Default reading font size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  fontSize === 'large' ? 'bg-[var(--text)] text-[var(--bg)]' : 'hover:text-[var(--text)]'
                }`}
                title="Larger reading font size"
              >
                A+
              </button>
            </div>

            {/* Quick TOC Drawer trigger */}
            <button
              type="button"
              onClick={() => setIsTocOpen(true)}
              className="hover:text-[var(--text)] transition-colors"
            >
              CONTENTS
            </button>
          </div>
        </div>
      </nav>

      {/* 3. The Digital Book Canvas */}
      <div className="editorial-container pt-16 md:pt-28">
        <div className="reading-column">
          {/* Chapter Folio Header */}
          <header className="mb-14 md:mb-20 space-y-4 text-left">
            <div className="flex items-center justify-between font-mono-meta text-[11px] md:text-xs tracking-[0.18em] text-[var(--text-faint)] pb-3 border-b border-[var(--border)]">
              <span>
                {currentChapter.numberDisplay} / {String(CHAPTERS.length).padStart(2, '0')}
              </span>
              <span>
                {String(currentChapter.readingTimeMin).padStart(2, '0')} MIN READ · {currentChapter.wordCount.toLocaleString()} WORDS
              </span>
            </div>

            <div className="pt-2">
              <span className="font-mono-meta text-xs tracking-[0.2em] text-[var(--text-muted)] block mb-2">
                CHAPTER {currentChapter.numberRoman}
              </span>
              <h1 className="font-editorial-title text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--text)] tracking-tight leading-[1.05]">
                {currentChapter.title}
              </h1>
            </div>

            {/* Epigraph */}
            {currentChapter.epigraph && (
              <div className="pt-6 pb-2 pl-4 border-l border-[var(--border)] my-6">
                <blockquote className="font-editorial-body italic text-lg sm:text-xl text-[var(--text-muted)]">
                  “{currentChapter.epigraph.quote}”
                </blockquote>
                <cite className="font-mono-meta text-[10px] text-[var(--text-faint)] block mt-2 not-italic">
                  — {currentChapter.epigraph.source}
                </cite>
              </div>
            )}
          </header>

          {/* Chapter Body Content: 55-75 chars per line, comfortable spacing, pure editorial typography */}
          <div className="font-editorial-body text-[var(--text)] space-y-8 sm:space-y-10 text-left">
            {currentChapter.paragraphs.map((p, idx) => {
              const note = p.noteId
                ? currentChapter.notes?.find((n) => n.id === p.noteId)
                : null;

              return (
                <div key={idx} className="relative">
                  <p className="leading-relaxed">
                    {p.text}
                    {note && (
                      <MarginalNote
                        note={note}
                        isOpen={activeNoteId === note.id}
                        onToggle={() =>
                          setActiveNoteId(activeNoteId === note.id ? null : note.id)
                        }
                      />
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Chapter Separator Mark */}
          <div className="py-16 md:py-24 text-center">
            <span className="font-editorial-title text-2xl text-[var(--text-faint)] select-none">
              ※   ※   ※
            </span>
          </div>

          {/* 4. Bottom Chapter Navigation */}
          <nav
            aria-label="Chapter Navigation"
            className="border-t border-b border-[var(--border)] py-8 my-8"
          >
            <div className="grid grid-cols-2 gap-6 items-center">
              {/* Prev Chapter */}
              <div>
                {prevChapter ? (
                  <Link
                    to={`/novel/${prevChapter.slug}`}
                    className="group block text-left space-y-1"
                  >
                    <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors flex items-center gap-1">
                      <span>←</span>
                      <span>PREVIOUS CHAPTER</span>
                    </span>
                    <span className="font-editorial-title text-xl sm:text-2xl text-[var(--text)] group-hover:italic transition-all block">
                      {prevChapter.title}
                    </span>
                  </Link>
                ) : (
                  <Link
                    to="/novel"
                    className="group block text-left space-y-1"
                  >
                    <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)]">
                      ← COVER & INDEX
                    </span>
                    <span className="font-editorial-title text-xl text-[var(--text)] block">
                      Table of Contents
                    </span>
                  </Link>
                )}
              </div>

              {/* Next Chapter */}
              <div className="text-right">
                {nextChapter ? (
                  <Link
                    to={`/novel/${nextChapter.slug}`}
                    className="group block text-right space-y-1"
                  >
                    <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors flex items-center justify-end gap-1">
                      <span>NEXT CHAPTER</span>
                      <span>→</span>
                    </span>
                    <span className="font-editorial-title text-xl sm:text-2xl text-[var(--text)] group-hover:italic transition-all block">
                      {nextChapter.title}
                    </span>
                  </Link>
                ) : (
                  <div className="space-y-1">
                    <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-faint)]">
                      END OF SERIAL
                    </span>
                    <span className="font-editorial-title text-xl text-[var(--text)] italic block">
                      The Last Light
                    </span>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Quick chapter status & return */}
          <div className="pt-4 flex items-center justify-between text-[11px] font-mono-meta text-[var(--text-faint)]">
            <span>
              STATUS: {progressMap[currentChapter.slug]?.isComplete ? 'COMPLETED' : 'IN PROGRESS'}
            </span>
            <button
              type="button"
              onClick={() => setIsTocOpen(true)}
              className="hover:text-[var(--text)] transition-colors"
            >
              ALL CHAPTERS (8) →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
