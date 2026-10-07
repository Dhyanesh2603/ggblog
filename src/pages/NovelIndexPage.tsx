import React from 'react';
import { Link } from 'react-router-dom';
import { NOVEL_META, CHAPTERS } from '../data/novelData';
import { useReading } from '../context/ReadingContext';

export const NovelIndexPage: React.FC = () => {
  const { progressMap, getLastReadRecord, resetProgress } = useReading();
  const lastRead = getLastReadRecord();

  return (
    <div className="w-full">
      <section className="editorial-container pt-16 md:pt-24 pb-20 md:pb-32">
        {/* Title Folio */}
        <div className="max-w-3xl space-y-6 pb-12 border-b border-[var(--border)]">
          <span className="font-mono-meta text-[11px] md:text-xs tracking-[0.18em] text-[var(--text-muted)] block">
            ARCHIVE / NOVEL FOLIO · {NOVEL_META.year}
          </span>
          <h1 className="font-editorial-title text-6xl sm:text-7xl md:text-8xl tracking-tight text-[var(--text)]">
            {NOVEL_META.title}
          </h1>
          <p className="font-editorial-body text-xl sm:text-2xl italic text-[var(--text-muted)]">
            A novel in eight folios by {NOVEL_META.author}
          </p>
          <p className="font-editorial-body text-lg text-[var(--text)] leading-relaxed pt-2">
            {NOVEL_META.synopsis}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4 font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)]">
            <span>8 CHAPTERS</span>
            <span>·</span>
            <span>TOTAL ~{NOVEL_META.estimatedTotalReadingTime}</span>
            <span>·</span>
            <span>UNABRIDGED</span>
          </div>
        </div>

        {/* Continue Reading Card if exists */}
        {lastRead && (
          <div className="my-10 p-6 bg-[var(--paper-tint)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] block mb-1">
                LAST ACCESSED CHAPTER
              </span>
              <h3 className="font-editorial-body text-2xl text-[var(--text)]">
                Chapter {lastRead.chapterNumberDisplay} — {lastRead.title}
              </h3>
              <span className="font-mono-meta text-[11px] text-[var(--text-muted)]">
                {lastRead.percentage}% of chapter read
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to={`/novel/${lastRead.slug}`}
                className="font-mono-meta text-xs tracking-[0.16em] px-5 py-2.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity"
              >
                RESUME READING →
              </Link>
            </div>
          </div>
        )}

        {/* Chapters Table */}
        <div className="pt-12">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] font-mono-meta text-xs tracking-[0.16em] text-[var(--text-muted)]">
            <span>FOLIO / TITLE</span>
            <span>LENGTH / PROGRESS</span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {CHAPTERS.map((ch) => {
              const progress = progressMap[ch.slug];
              const isDone = progress?.isComplete;
              const hasProgress = progress && progress.percentage > 0;

              return (
                <Link
                  key={ch.id}
                  to={`/novel/${ch.slug}`}
                  className="group py-6 sm:py-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 hover:pl-2 transition-all duration-200"
                >
                  <div className="flex items-baseline gap-6 sm:gap-10">
                    <span className="font-mono-meta text-sm text-[var(--text-faint)] group-hover:text-[var(--text)] transition-colors">
                      {ch.numberDisplay}
                    </span>
                    <div>
                      <h2 className="font-editorial-title text-3xl sm:text-4xl text-[var(--text)] group-hover:italic transition-all">
                        {ch.title}
                      </h2>
                      {ch.epigraph && (
                        <p className="font-editorial-body text-sm text-[var(--text-muted)] italic mt-1 max-w-lg line-clamp-1">
                          “{ch.epigraph.quote}”
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 font-mono-meta text-xs text-[var(--text-muted)] pl-12 sm:pl-0">
                    <span>{String(ch.readingTimeMin).padStart(2, '0')} MIN</span>
                    <span>{ch.wordCount.toLocaleString()} W</span>
                    {isDone ? (
                      <span className="text-[var(--text)] font-medium">COMPLETED</span>
                    ) : hasProgress ? (
                      <span className="text-[var(--text)]">{progress.percentage}%</span>
                    ) : (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        START →
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Reset reading progress option */}
        {Object.keys(progressMap).length > 0 && (
          <div className="pt-12 text-right">
            <button
              type="button"
              onClick={resetProgress}
              className="font-mono-meta text-[10px] tracking-[0.14em] text-[var(--text-faint)] hover:text-[var(--text)] transition-colors underline"
            >
              Reset local reading progress on this browser
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
