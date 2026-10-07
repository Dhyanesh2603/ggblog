import React from 'react';
import { READING_SHELF } from '../data/readingData';

export const ReadingPage: React.FC = () => {
  const currentlyReading = READING_SHELF.find((b) => b.isCurrentlyReading);
  const archiveBooks = READING_SHELF.filter((b) => !b.isCurrentlyReading);

  return (
    <div className="w-full">
      <section className="editorial-container pt-16 md:pt-24 pb-24 md:pb-32">
        {/* Page Folio */}
        <header className="max-w-2xl space-y-4 pb-12 border-b border-[var(--border)]">
          <span className="font-mono-meta text-[11px] md:text-xs tracking-[0.18em] text-[var(--text-muted)] block">
            AUTHOR'S LIBRARY & SHELF
          </span>
          <h1 className="font-editorial-title text-6xl sm:text-7xl tracking-tight text-[var(--text)]">
            Reading
          </h1>
          <p className="font-editorial-body text-xl text-[var(--text-muted)] italic">
            An informal index of books kept on the desk. No ratings, no algorithms, only personal marginalia.
          </p>
        </header>

        {/* 1. Currently Reading Highlight */}
        {currentlyReading && (
          <div className="py-12 border-b border-[var(--border)]">
            <span className="font-mono-meta text-[11px] tracking-[0.18em] text-[var(--text-muted)] block mb-4">
              CURRENTLY ON THE DESK
            </span>

            <div className="max-w-3xl space-y-3">
              <h2 className="font-editorial-title text-4xl sm:text-5xl text-[var(--text)]">
                {currentlyReading.title}
              </h2>
              <p className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)]">
                {currentlyReading.author.toUpperCase()} {currentlyReading.year && `(${currentlyReading.year})`}
              </p>
              <div className="pt-4 pl-4 border-l-2 border-[var(--text)]">
                <p className="font-editorial-body text-xl sm:text-2xl italic leading-relaxed text-[var(--text)]">
                  “{currentlyReading.reflection}”
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Permanent Shelf Archive */}
        <div className="pt-12">
          <span className="font-mono-meta text-[11px] tracking-[0.18em] text-[var(--text-muted)] block mb-8">
            REFERENCE SHELF & ARCHIVAL VOLUMES
          </span>

          <div className="divide-y divide-[var(--border)]">
            {archiveBooks.map((book) => (
              <div key={book.id} className="py-8 sm:py-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
                  {/* Book Metadata */}
                  <div className="md:col-span-4 space-y-1">
                    <h3 className="font-editorial-title text-2xl sm:text-3xl text-[var(--text)]">
                      {book.title}
                    </h3>
                    <p className="font-mono-meta text-[11px] text-[var(--text-muted)]">
                      {book.author} {book.year && `· ${book.year}`}
                    </p>
                  </div>

                  {/* Reflection */}
                  <div className="md:col-span-8">
                    <p className="font-editorial-body text-lg text-[var(--text)] leading-relaxed">
                      {book.reflection}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
