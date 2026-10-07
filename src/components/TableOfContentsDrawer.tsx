import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useReading } from '../context/ReadingContext';
import { CHAPTERS, NOVEL_META } from '../data/novelData';

export const TableOfContentsDrawer: React.FC = () => {
  const { isTocOpen, setIsTocOpen, progressMap } = useReading();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTocOpen) {
        setIsTocOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTocOpen, setIsTocOpen]);

  if (!isTocOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Table of Contents"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity cursor-pointer"
        onClick={() => setIsTocOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-md bg-[var(--bg)] h-full overflow-y-auto border-l border-[var(--border)] p-6 sm:p-10 flex flex-col justify-between shadow-2xl transition-transform duration-300">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-8">
            <div>
              <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] block">
                {NOVEL_META.title}
              </span>
              <h2 className="font-editorial-title text-2xl tracking-tight text-[var(--text)] mt-0.5">
                Table of Contents
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsTocOpen(false)}
              className="font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text)] py-1.5 px-3 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors"
              aria-label="Close Table of Contents"
            >
              CLOSE
            </button>
          </div>

          {/* Chapter list */}
          <nav className="divide-y divide-[var(--border-faint)]" aria-label="Chapters">
            {CHAPTERS.map((chapter) => {
              const currentProgress = progressMap[chapter.slug];
              const isCurrent = location.pathname === `/novel/${chapter.slug}`;

              return (
                <Link
                  key={chapter.id}
                  to={`/novel/${chapter.slug}`}
                  onClick={() => setIsTocOpen(false)}
                  className={`group flex items-baseline justify-between py-3.5 transition-colors ${
                    isCurrent
                      ? 'text-[var(--text)] font-medium pl-2 border-l-2 border-[var(--text)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-baseline gap-3.5">
                    <span className="font-mono-meta text-[11px] text-[var(--text-faint)] group-hover:text-[var(--text)] transition-colors">
                      {chapter.numberDisplay}
                    </span>
                    <span className="font-editorial-body text-lg tracking-tight text-[var(--text)] group-hover:translate-x-1 transition-transform">
                      {chapter.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono-meta text-[10px] text-[var(--text-faint)]">
                    {currentProgress?.isComplete ? (
                      <span className="text-[var(--text)] opacity-70">READ</span>
                    ) : currentProgress && currentProgress.percentage > 0 ? (
                      <span className="text-[var(--text)] opacity-60">{currentProgress.percentage}%</span>
                    ) : (
                      <span>{String(chapter.readingTimeMin).padStart(2, '0')} MIN</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info in Drawer */}
        <div className="border-t border-[var(--border)] pt-6 mt-8">
          <div className="flex justify-between items-center text-left">
            <div>
              <p className="font-mono-meta text-[10px] text-[var(--text-muted)]">
                TOTAL: 8 CHAPTERS · {NOVEL_META.estimatedTotalReadingTime}
              </p>
              <p className="font-editorial-body text-xs italic text-[var(--text-faint)] mt-1">
                Reading progress saved automatically to this device.
              </p>
            </div>
            <Link
              to="/novel"
              onClick={() => setIsTocOpen(false)}
              className="font-mono-meta text-[10px] tracking-[0.14em] text-[var(--text)] hover:underline"
            >
              OVERVIEW →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
