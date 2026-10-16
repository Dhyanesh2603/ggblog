import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNovel } from '../context/NovelContext';
import { useReading, directWriteProgress } from '../context/ReadingContext';
import { generateEpubBlob, downloadBlob } from '../utils/epubGenerator';
import { ScrollProgress } from '../components/ScrollProgress';
import { MarginalNote } from '../components/MarginalNote';

export const ChapterPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { novelMeta, chapters } = useNovel();
  const {
    saveProgress,
    markChapterComplete,
    progressMap,
    fontSize,
    setFontSize,
    setIsTocOpen,
    isZenMode,
    setIsZenMode
  } = useReading();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [resumedInfo, setResumedInfo] = useState<{ percentage: number } | null>(null);
  const [isExportingEpub, setIsExportingEpub] = useState(false);

  // Zen Mode controls overlay state
  const [showZenControls, setShowZenControls] = useState(false);

  // Flags to prevent initial mounting from triggering spurious 0% writes
  const isReadyToTrackRef = useRef(false);
  const lastSavedScrollRef = useRef(0);

  // Find current chapter from active novel
  const currentChapter = chapters.find((c) => c.slug === (slug || 'chapter-01'));
  const prevChapter = currentChapter?.prevSlug
    ? chapters.find((c) => c.slug === currentChapter.prevSlug)
    : null;
  const nextChapter = currentChapter?.nextSlug
    ? chapters.find((c) => c.slug === currentChapter.nextSlug)
    : null;

  const currentProgress = currentChapter ? progressMap[currentChapter.slug] : undefined;

  // Keyboard Shortcuts (F = Zen Mode, Esc = Exit Zen, J/K = Scroll)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (e.key === 'Escape' && isZenMode) {
        e.preventDefault();
        setIsZenMode(false);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode]);

  const handleExportEpub = async () => {
    try {
      setIsExportingEpub(true);
      const blob = await generateEpubBlob(novelMeta, chapters);
      downloadBlob(blob, `${novelMeta.title.replace(/\s+/g, '_')}.epub`);
    } catch (e) {
      console.error('Failed to export EPUB', e);
    } finally {
      setIsExportingEpub(false);
    }
  };

  // Zen mode mouse movement detection to reveal exit pill
  useEffect(() => {
    if (!isZenMode) return;
    let timerId: ReturnType<typeof setTimeout>;

    const handleMouseMove = () => {
      setShowZenControls(true);
      clearTimeout(timerId);
      timerId = setTimeout(() => setShowZenControls(false), 2500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timerId);
    };
  }, [isZenMode]);

  // 1. Initial Position Setup & Restoration (guaranteed before tracking starts)
  useEffect(() => {
    if (!currentChapter) return;

    isReadyToTrackRef.current = false;
    setActiveNoteId(null);
    document.title = `${currentChapter.numberDisplay} ${currentChapter.title} — ${novelMeta.title}`;

    // Read direct from localStorage for instant, synchronous accuracy
    let savedScroll = 0;
    let savedPct = 0;
    try {
      const raw = localStorage.getItem('literary_reading_progress');
      if (raw) {
        const parsed = JSON.parse(raw);
        const record = parsed[currentChapter.slug];
        if (record && record.scrollPosition > 120 && record.percentage < 95) {
          savedScroll = record.scrollPosition;
          savedPct = record.percentage;
        }
      }
    } catch {}

    if (savedScroll > 120) {
      setResumedInfo({ percentage: savedPct });
      lastSavedScrollRef.current = savedScroll;
      window.scrollTo({ top: savedScroll, behavior: 'instant' });

      const timer = setTimeout(() => {
        isReadyToTrackRef.current = true;
      }, 120);
      return () => clearTimeout(timer);
    } else {
      setResumedInfo(null);
      window.scrollTo({ top: 0, behavior: 'instant' });
      lastSavedScrollRef.current = 0;

      const timer = setTimeout(() => {
        isReadyToTrackRef.current = true;
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [currentChapter?.slug, novelMeta.title]);

  // 2. Active Scroll Tracking with RAF Throttling and Synchronous Unload Flushing
  useEffect(() => {
    if (!currentChapter) return;

    let ticking = false;

    const handleScroll = () => {
      if (!isReadyToTrackRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          if (scrollable <= 0) {
            ticking = false;
            return;
          }

          const currentY = window.scrollY;
          const pct = Math.min(100, Math.max(0, Math.round((currentY / scrollable) * 100)));

          // Save only when scrolled noticeably (30px) or reached bottom
          if (Math.abs(currentY - lastSavedScrollRef.current) >= 30 || pct >= 92) {
            lastSavedScrollRef.current = currentY;
            saveProgress(currentChapter.slug, pct, currentY, pct >= 92);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Synchronously flush reading progress to localStorage if user abruptly closes tab
    const flushOnExit = () => {
      if (!isReadyToTrackRef.current) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const currentY = window.scrollY;
      const pct = Math.min(100, Math.max(0, Math.round((currentY / scrollable) * 100)));
      directWriteProgress(currentChapter.slug, pct, currentY, pct >= 92);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('visibilitychange', flushOnExit);
    window.addEventListener('pagehide', flushOnExit);
    window.addEventListener('beforeunload', flushOnExit);

    return () => {
      flushOnExit();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('visibilitychange', flushOnExit);
      window.removeEventListener('pagehide', flushOnExit);
      window.removeEventListener('beforeunload', flushOnExit);
    };
  }, [currentChapter?.slug, saveProgress]);

  const handleRestartFromTop = () => {
    setResumedInfo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lastSavedScrollRef.current = 0;
  };

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
    <article className={`w-full relative min-h-screen pb-32 transition-all duration-300 ${isZenMode ? 'pt-4' : ''}`}>
      {/* 1. Subtle 1px Reading Progress Indicator */}
      <ScrollProgress />

      {/* 2. Focused Reading Subheader / Controls (Hidden in Zen Mode) */}
      {!isZenMode && (
        <nav
          aria-label="Reading Controls"
          className="w-full border-b border-[var(--border)] py-2.5 bg-[var(--bg)]/90 backdrop-blur-[2px] sticky top-14 md:top-16 z-30 transition-all no-print"
        >
          <div className="editorial-container flex items-center justify-between text-[11px] font-mono-meta tracking-[0.12em] text-[var(--text-muted)]">
            {/* Left: Quick Back to TOC & Chapter Progress */}
            <div className="flex items-center gap-3">
              <Link
                to="/novel"
                viewTransition
                className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
              >
                <span>←</span>
                <span>INDEX</span>
              </Link>
              <span className="opacity-30">/</span>
              <span className="text-[var(--text)] hidden sm:inline">
                CHAPTER {currentChapter.numberRoman}
              </span>
              <span className="opacity-30 hidden sm:inline">/</span>
              <span className="text-[var(--text-muted)] hidden sm:inline">
                {currentProgress?.isComplete ? 'COMPLETED' : `${currentProgress?.percentage || 0}% READ`}
              </span>
            </div>

            {/* Right: Typography size controls & Mode */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* EPUB Export Button */}
              <button
                type="button"
                onClick={handleExportEpub}
                disabled={isExportingEpub}
                className="hover:text-[var(--text)] transition-colors cursor-pointer hidden md:inline text-[10.5px] disabled:opacity-50"
                title="Download complete EPUB3 book"
              >
                {isExportingEpub ? 'EXPORTING...' : 'EPUB ↓'}
              </button>

              {/* Print / PDF Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="hover:text-[var(--text)] transition-colors cursor-pointer hidden sm:inline text-[10.5px]"
                title="Print or Save as Book PDF (Ctrl+P)"
              >
                PRINT ⎙
              </button>

              {/* Zen Mode Button */}
              <button
                type="button"
                onClick={() => setIsZenMode(true)}
                className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                title="Distraction-Free Zen Mode (Press F)"
              >
                <span>ZEN<span className="hidden sm:inline"> (F)</span></span>
              </button>

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
                className="hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                CONTENTS
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* 2b. Discreet Resumed Notification Pill if continuing a reading session */}
      {resumedInfo && !isZenMode && (
        <aside
          aria-label="Reading position notice"
          className="w-full border-b border-[var(--border)] bg-[var(--paper-tint)]/60 py-2 transition-all no-print"
        >
          <div className="editorial-container flex items-center justify-between font-mono-meta text-[10px] tracking-[0.14em] text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--text)]" />
              <span>RESUMED FROM SAVED POSITION ({resumedInfo.percentage}%)</span>
            </span>
            <button
              type="button"
              onClick={handleRestartFromTop}
              className="text-[var(--text)] hover:underline cursor-pointer"
            >
              START FROM TOP ↑
            </button>
          </div>
        </aside>
      )}

      {/* Floating Zen Mode Exit Banner */}
      {isZenMode && (
        <aside
          aria-label="Zen mode status"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300 no-print ${
            showZenControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-[var(--bg)] border border-[var(--border)] px-4 py-2 shadow-xl flex items-center gap-4 font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] rounded-[2px]">
            <span>ZEN READING MODE ACTIVE</span>
            <span className="opacity-40">|</span>
            <button
              type="button"
              onClick={() => setIsZenMode(false)}
              className="text-[var(--text)] hover:underline cursor-pointer font-semibold"
            >
              EXIT (ESC / F)
            </button>
          </div>
        </aside>
      )}

      {/* 3. The Digital Book Canvas */}
      <div className={`editorial-container ${isZenMode ? 'pt-6 md:pt-16' : 'pt-10 sm:pt-16 md:pt-28'}`}>
        <div className="reading-column">
          {/* Chapter Folio Header */}
          <header className="mb-14 md:mb-20 space-y-4 text-left">
            <div className="flex items-center justify-between font-mono-meta text-[11px] md:text-xs tracking-[0.18em] text-[var(--text-faint)] pb-3 border-b border-[var(--border)]">
              <span>
                {currentChapter.numberDisplay} / {String(chapters.length).padStart(2, '0')}
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
              {currentChapter.subtitle && (
                <p className="font-editorial-body italic text-lg sm:text-xl text-[var(--text-muted)] mt-2">
                  {currentChapter.subtitle}
                </p>
              )}
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

          {/* Chapter Prose Body */}
          <div className="font-editorial-body text-[var(--text)] space-y-8 sm:space-y-10 text-left">
            {currentChapter.paragraphs.map((p, index) => {
              const note = p.noteId && currentChapter.notes
                ? currentChapter.notes.find((n) => n.id === p.noteId)
                : null;

              if (p.isBreak) {
                return (
                  <div key={index} className="py-8 text-center">
                    <span className="font-editorial-title text-2xl text-[var(--text-faint)] select-none">
                      ※   ※   ※
                    </span>
                  </div>
                );
              }

              if (p.isSubheading) {
                return (
                  <div key={index} className="pt-8 pb-2">
                    <h3 className="font-editorial-title text-2xl sm:text-3xl text-[var(--text)] tracking-wide">
                      {p.text}
                    </h3>
                  </div>
                );
              }

              return (
                <div key={index} className="relative">
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

          {/* Literary Asterism / Section Ornament */}
          <div className="py-16 md:py-24 text-center">
            <span className="font-editorial-title text-2xl text-[var(--text-faint)] select-none">
              ※   ※   ※
            </span>
          </div>

          {/* Chapter Navigation Footer (Hidden in Zen Mode) */}
          {!isZenMode && (
            <nav
              aria-label="Chapter Navigation"
              className="border-t border-b border-[var(--border)] py-8 my-8 no-print"
            >
              <div className="grid grid-cols-2 gap-6 items-center">
                {/* Prev Chapter */}
                <div>
                  {prevChapter ? (
                    <Link
                      to={`/novel/${prevChapter.slug}`}
                      viewTransition
                      className="group block text-left space-y-1"
                    >
                      <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors flex items-center gap-1">
                        <span>←</span>
                        <span>PREVIOUS</span>
                      </span>
                      <span className="font-editorial-title text-base sm:text-2xl text-[var(--text)] group-hover:italic transition-all block line-clamp-2">
                        {prevChapter.title}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      to="/novel"
                      viewTransition
                      className="group block text-left space-y-1"
                    >
                      <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)]">
                        ← INDEX
                      </span>
                      <span className="font-editorial-title text-base sm:text-xl text-[var(--text)] block line-clamp-2">
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
                      viewTransition
                      onClick={() => markChapterComplete(currentChapter.slug)}
                      className="group block text-right space-y-1"
                    >
                      <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors flex items-center justify-end gap-1">
                        <span>NEXT</span>
                        <span>→</span>
                      </span>
                      <span className="font-editorial-title text-base sm:text-2xl text-[var(--text)] group-hover:italic transition-all block line-clamp-2">
                        {nextChapter.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="space-y-1">
                      <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-faint)]">
                        END OF SERIAL
                      </span>
                      <span className="font-editorial-title text-xl text-[var(--text)] italic block">
                        {novelMeta.title}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </nav>
          )}

          {/* Quick chapter status & return (Hidden in Zen Mode) */}
          {!isZenMode && (
            <div className="pt-4 flex items-center justify-between text-[11px] font-mono-meta text-[var(--text-muted)] no-print">
              <div className="flex items-center gap-3">
                <span>
                  STATUS: {currentProgress?.isComplete ? 'COMPLETED' : `${currentProgress?.percentage || 0}% READ`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (currentProgress?.isComplete) {
                      saveProgress(currentChapter.slug, 0, 0, false);
                    } else {
                      markChapterComplete(currentChapter.slug);
                    }
                  }}
                  className="underline hover:text-[var(--text)] cursor-pointer"
                >
                  {currentProgress?.isComplete ? 'RESET TO UNREAD' : 'MARK AS READ ✓'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsTocOpen(true)}
                className="hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                ALL CHAPTERS ({chapters.length}) →
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
