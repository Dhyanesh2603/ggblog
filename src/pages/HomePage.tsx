import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NOVEL_META, CHAPTERS } from '../data/novelData';
import { AUTHOR_DATA } from '../data/authorData';
import { JOURNAL_NOTES } from '../data/notesData';
import { useReading } from '../context/ReadingContext';
import { AmbientCanvas } from '../components/AmbientCanvas';
import { BookCoverArt } from '../components/BookCoverArt';
import { AmbientSound } from '../components/AmbientSound';

const FEATURED_EXCERPTS = [
  {
    quote: 'It had been raining since four in the afternoon, and by midnight the city had forgotten how to be quiet.',
    source: 'FROM CHAPTER I — THE BEGINNING',
    chapterSlug: 'chapter-01'
  },
  {
    quote: 'We never notice when the water turns to salt, only that thirst has arrived.',
    source: 'MARGINALIA — FOLIO NOTE 01',
    chapterSlug: 'chapter-01'
  },
  {
    quote: 'The key was long, made of pitted iron, with a notched bit that scraped against the brass tumbler before giving way with a dull, heavy clunk.',
    source: 'FROM CHAPTER II — THE HOUSE',
    chapterSlug: 'chapter-02'
  },
  {
    quote: 'A surveyor does not invent reality. He merely prevents other people from lying about where their land ends.',
    source: 'FROM CHAPTER III — WHAT HE REMEMBERED',
    chapterSlug: 'chapter-03'
  }
];

const NOVEL_SETTINGS = [
  {
    number: '01',
    place: 'The Stone Jetty House',
    desc: 'At high tide the grey brine rises to lick the bottom step of the terrace, leaving behind small crescents of black kelp and the brittle shells of shore crabs.'
  },
  {
    number: '02',
    place: 'Port Saint-Pierre Vault',
    desc: 'Thirty-four boxes of unbound surveyor leaves deposited under an expired lease, smelling of tea, damp linoleum, and thirty years of tidal measurements.'
  },
  {
    number: '03',
    place: 'The Point Noir Beacon',
    desc: 'A boathouse where no boat rests, an optical drawing table mounted on cast-iron pedestal, and a solitary yellow light cutting through the gale.'
  }
];

export const HomePage: React.FC = () => {
  const { getLastReadRecord, progressMap } = useReading();
  const lastRead = getLastReadRecord();

  // Active quote in carousel
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);

  // Active hovered chapter in TOC explorer
  const [hoveredChapter, setHoveredChapter] = useState(CHAPTERS[0]);

  // Auto advance quote every 9s unless manually interacted
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveQuoteIdx((prev) => (prev + 1) % FEATURED_EXCERPTS.length);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  const currentQuote = FEATURED_EXCERPTS[activeQuoteIdx];

  return (
    <div className="w-full relative">
      {/* Background ambient coastal mist */}
      <AmbientCanvas />

      {/* 1. HERO / COVER COMPOSITION */}
      <section className="relative z-10 editorial-container pt-12 md:pt-24 pb-20 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Metadata, Title, Living Excerpt, Primary Actions */}
          <div className="lg:col-span-7 min-w-0 space-y-8">
            {/* Top metadata bar with ambient audio toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 animate-reveal-1">
              <span className="font-mono-meta text-[11px] md:text-xs tracking-[0.18em] text-[var(--text-muted)] flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--text)] animate-pulse" />
                <span>NOVEL / {NOVEL_META.year} · UNBOUND EDITION</span>
              </span>

              {/* Rain Sound Synthesizer */}
              <AmbientSound />
            </div>

            {/* Novel Title with magnetic presence */}
            <div className="space-y-3">
              <h1 className="animate-reveal-2 font-editorial-title text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-[var(--text)] leading-[0.92] max-w-full break-words">
                {NOVEL_META.title}
              </h1>

              <div className="animate-reveal-3">
                <p className="font-editorial-body text-xl sm:text-2xl italic text-[var(--text-muted)]">
                  A novel by {NOVEL_META.author}
                </p>
              </div>
            </div>

            {/* Dynamic Interactive Excerpt Switcher */}
            <div className="animate-reveal-4 pt-4 sm:pt-6">
              <div className="relative min-h-[140px] sm:min-h-[120px] flex flex-col justify-between p-5 sm:p-6 bg-[var(--paper-tint)]/60 border-l-2 border-[var(--text)] transition-all duration-300">
                <blockquote className="font-editorial-body text-xl sm:text-2xl leading-relaxed text-[var(--text)] font-light">
                  “{currentQuote.quote}”
                </blockquote>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--border-faint)]">
                  <span className="font-mono-meta text-[10px] text-[var(--text-faint)] tracking-[0.14em]">
                    {currentQuote.source}
                  </span>

                  {/* Quote switcher pagination dots */}
                  <div className="flex items-center gap-1.5" role="tablist" aria-label="Selected excerpts">
                    {FEATURED_EXCERPTS.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveQuoteIdx(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === activeQuoteIdx
                            ? 'bg-[var(--text)] scale-125'
                            : 'bg-[var(--text)] opacity-25 hover:opacity-60'
                        }`}
                        aria-label={`Show quote ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Actions: Begin Reading & Continue Progress */}
            <div className="animate-reveal-5 pt-4 flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:gap-6">
              <Link
                to="/novel/chapter-01"
                viewTransition
                className="group inline-flex items-center gap-3 font-mono-meta text-xs md:text-sm tracking-[0.18em] text-[var(--text)] py-3.5 px-6 border border-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-all duration-200 shadow-sm cursor-pointer"
              >
                <span>BEGIN READING</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1.5">
                  →
                </span>
              </Link>

              <a
                href="#opening-scene"
                className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text)] underline decoration-dotted underline-offset-4"
              >
                SAMPLE PROLOGUE BELOW ↓
              </a>

              <span className="font-mono-meta text-[11px] tracking-[0.12em] text-[var(--text-faint)] sm:ml-auto">
                8 CHAPTERS · ~{NOVEL_META.estimatedTotalReadingTime}
              </span>
            </div>

            {/* Dynamic Continue Reading Card if reader has prior local progress */}
            {lastRead && (
              <div className="p-4 sm:p-5 bg-[var(--paper-tint)] border border-[var(--border)] flex items-center justify-between gap-4 animate-reveal-6">
                <div>
                  <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] block">
                    SAVED READING POSITION
                  </span>
                  <p className="font-editorial-body text-base font-medium text-[var(--text)]">
                    Chapter {lastRead.chapterNumberDisplay} — {lastRead.title}
                  </p>
                  <span className="font-mono-meta text-[10px] text-[var(--text-faint)]">
                    {lastRead.percentage}% COMPLETED
                  </span>
                </div>
                <Link
                  to={`/novel/${lastRead.slug}`}
                  viewTransition
                  className="font-mono-meta text-xs tracking-[0.14em] px-4 py-2 border border-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
                >
                  RESUME →
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Interactive 3D Book Cover Folio */}
          <div className="lg:col-span-5 min-w-0 animate-reveal-3 flex justify-center">
            <BookCoverArt />
          </div>
        </div>
      </section>

      {/* 2. LIVE INTERACTIVE CHAPTER INDEX WITH SNEAK HOVER PREVIEWS */}
      <section className="relative z-10 border-t border-[var(--border)] pt-16 md:pt-24 pb-20 md:pb-28">
        <div className="editorial-container">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-12 pb-4 border-b border-[var(--border)]">
            <div>
              <span className="font-mono-meta text-[11px] tracking-[0.18em] text-[var(--text-muted)] block">
                THE TABLE OF CONTENTS
              </span>
              <h2 className="font-editorial-title text-4xl sm:text-5xl tracking-tight text-[var(--text)] mt-1">
                Chapters & Folios
              </h2>
            </div>
            <div className="font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text-muted)] mt-2 md:mt-0">
              HOVER OR TAP A CHAPTER FOR SNEAK PREVIEW
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Interactive Chapter Rows */}
            <div className="lg:col-span-7 divide-y divide-[var(--border)]">
              {CHAPTERS.map((ch) => {
                const progress = progressMap[ch.slug];
                const isSelected = hoveredChapter.id === ch.id;

                return (
                  <div
                    key={ch.id}
                    onMouseEnter={() => setHoveredChapter(ch)}
                    onClick={() => setHoveredChapter(ch)}
                    className={`group py-5 sm:py-6 transition-all duration-200 cursor-pointer ${
                      isSelected ? 'pl-3 border-l-2 border-[var(--text)] bg-[var(--paper-tint)]/40' : 'hover:pl-2'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-4 sm:gap-6">
                        <span className="font-mono-meta text-xs sm:text-sm text-[var(--text-faint)] group-hover:text-[var(--text)] transition-colors">
                          {ch.numberDisplay}
                        </span>
                        <h3 className="font-editorial-title text-2xl sm:text-3xl text-[var(--text)] tracking-tight group-hover:italic transition-all">
                          {ch.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 pl-8 sm:pl-0">
                        <span className="font-mono-meta text-[11px] text-[var(--text-muted)]">
                          {String(ch.readingTimeMin).padStart(2, '0')} MIN
                        </span>

                        {progress?.isComplete ? (
                          <span className="font-mono-meta text-[10px] text-[var(--text)] px-1.5 py-0.5 border border-[var(--border)]">
                            READ
                          </span>
                        ) : progress && progress.percentage > 0 ? (
                          <span className="font-mono-meta text-[10px] text-[var(--text-muted)]">
                            {progress.percentage}%
                          </span>
                        ) : (
                          <Link
                            to={`/novel/${ch.slug}`}
                            className="font-mono-meta text-[11px] opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text)] hover:underline hidden sm:inline"
                          >
                            READ →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Live Chapter Preview Vignette (attracts reader inside!) */}
            <div className="lg:col-span-5 sticky top-24 p-6 sm:p-8 bg-[var(--paper-tint)] border border-[var(--border)] space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border-faint)] pb-3">
                <span className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
                  FOLIO PREVIEW · CHAPTER {hoveredChapter.numberRoman}
                </span>
                <span className="font-mono-meta text-[10px] text-[var(--text-faint)]">
                  {hoveredChapter.wordCount.toLocaleString()} WORDS
                </span>
              </div>

              <div>
                <span className="font-mono-meta text-xs text-[var(--text-faint)] block mb-1">
                  {hoveredChapter.numberDisplay} / 08
                </span>
                <h4 className="font-editorial-title text-3xl sm:text-4xl text-[var(--text)]">
                  {hoveredChapter.title}
                </h4>
              </div>

              {hoveredChapter.epigraph && (
                <div className="pl-3 border-l border-[var(--border)] italic font-editorial-body text-base text-[var(--text-muted)]">
                  “{hoveredChapter.epigraph.quote}”
                </div>
              )}

              {/* Opening excerpt from this chapter */}
              <p className="font-editorial-body text-base text-[var(--text)] leading-relaxed italic line-clamp-4">
                "{hoveredChapter.paragraphs[0]?.text}"
              </p>

              <div className="pt-2">
                <Link
                  to={`/novel/${hoveredChapter.slug}`}
                  viewTransition
                  className="w-full inline-flex items-center justify-center gap-2 font-mono-meta text-xs tracking-[0.18em] py-3 px-4 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <span>READ THIS CHAPTER</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "INSIDE THE BOOK" — DIRECT SAMPLE SCENE ON THE COVER */}
      <section id="opening-scene" className="relative z-10 border-t border-[var(--border)] pt-16 md:pt-24 pb-20 md:pb-28 bg-[var(--bg)]">
        <div className="editorial-container">
          <div className="reading-column">
            <div className="text-center mb-10 space-y-2">
              <span className="font-mono-meta text-[11px] tracking-[0.2em] text-[var(--text-muted)] block">
                PROLOGUE SAMPLER
              </span>
              <h2 className="font-editorial-title text-4xl sm:text-5xl text-[var(--text)]">
                The Opening Scene
              </h2>
              <p className="font-editorial-body text-base italic text-[var(--text-muted)]">
                Begin reading Chapter I immediately right on this page.
              </p>
            </div>

            {/* Typeset sample reading block */}
            <div className="p-6 sm:p-10 bg-[var(--paper-tint)]/60 border border-[var(--border)] space-y-6 text-left font-editorial-body text-[19px] sm:text-[21px] leading-[1.8] text-[var(--text)] shadow-sm">
              <p>
                <span className="font-editorial-title text-5xl float-left mr-3 mt-1 leading-none text-[var(--text)]">
                  I
                </span>
                t had been raining since four in the afternoon, and by midnight the city had forgotten how to be quiet. The water did not fall in drops but drifted across the glass like grease, catching the halogen amber of the streetlamps and bending it into smeared horizontal ribbons.
              </p>
              <p>
                Thomas stood by the tall sash window on the third floor of the St. Jude building, holding a half-folded telegram he had not opened for three days. The paper was dry, brittle at the creases, smelling faintly of tea and cold linoleum. In the street below, an electric tram hummed along its steel track with a lonely clatter, throwing blue sparks against the dripping telephone wires before vanishing into the fog near the canal.
              </p>
              <p className="text-[var(--text-muted)] italic text-lg">
                He had not expected anything from his uncle after eleven years of silence. Families, Thomas had often told himself, were like maps drawn in pencil...
              </p>

              <div className="pt-6 border-t border-[var(--border-faint)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text-faint)]">
                  END OF PREVIEW · 1,840 WORDS REMAINING
                </span>
                <Link
                  to="/novel/chapter-01"
                  className="inline-flex items-center gap-2 font-mono-meta text-xs tracking-[0.16em] text-[var(--text)] hover:underline font-semibold"
                >
                  <span>CONTINUE READING CHAPTER I IN FULL SCREEN</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE WORLD OF THE NOVEL / FIELD NOTES */}
      <section className="relative z-10 border-t border-[var(--border)] pt-16 md:pt-24 pb-20 md:pb-28 bg-[var(--paper-tint)]/30">
        <div className="editorial-container">
          <div className="mb-12 pb-4 border-b border-[var(--border)]">
            <span className="font-mono-meta text-[11px] tracking-[0.18em] text-[var(--text-muted)] block">
              SETTING & TOPOGRAPHY
            </span>
            <h2 className="font-editorial-title text-4xl sm:text-5xl tracking-tight text-[var(--text)] mt-1">
              Field Notes from the Estuary
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {NOVEL_SETTINGS.map((item) => (
              <div key={item.number} className="p-6 bg-[var(--bg)] border border-[var(--border)] space-y-4 hover:border-[var(--text)] transition-colors">
                <span className="font-mono-meta text-xs text-[var(--text-faint)] block">
                  LOCUS / {item.number}
                </span>
                <h3 className="font-editorial-title text-2xl text-[var(--text)]">
                  {item.place}
                </h3>
                <p className="font-editorial-body text-base text-[var(--text-muted)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SELECTED ESSAYS / NOTES PREVIEW */}
      <section className="relative z-10 border-t border-[var(--border)] pt-16 md:pt-24 pb-20 md:pb-28">
        <div className="editorial-container">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-10 pb-4 border-b border-[var(--border)]">
            <div>
              <span className="font-mono-meta text-[11px] tracking-[0.18em] text-[var(--text-muted)] block">
                FROM THE AUTHOR'S DESK
              </span>
              <h2 className="font-editorial-title text-4xl sm:text-5xl tracking-tight text-[var(--text)] mt-1">
                Selected Notes
              </h2>
            </div>
            <Link
              to="/notes"
              className="font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text)] hover:underline mt-2 md:mt-0"
            >
              VIEW ALL JOURNAL ENTRIES →
            </Link>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {JOURNAL_NOTES.slice(0, 3).map((note) => (
              <div key={note.id} className="py-6 sm:py-7">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                  <div className="md:col-span-3">
                    <span className="font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text-faint)]">
                      {note.date}
                    </span>
                  </div>
                  <div className="md:col-span-6">
                    <Link
                      to="/notes"
                      className="font-editorial-body text-xl sm:text-2xl font-medium text-[var(--text)] hover:underline block"
                    >
                      {note.title}
                    </Link>
                    <p className="font-editorial-body text-sm sm:text-base text-[var(--text-muted)] mt-1.5 line-clamp-2">
                      {note.summary}
                    </p>
                  </div>
                  <div className="md:col-span-3 md:text-right">
                    <span className="font-mono-meta text-[10px] text-[var(--text-faint)]">
                      {note.readTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ABOUT THE AUTHOR COMPOSITION */}
      <section className="relative z-10 border-t border-[var(--border)] pt-16 md:pt-24 pb-16 bg-[var(--paper-tint)]/20">
        <div className="editorial-container">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 space-y-2">
              <span className="font-mono-meta text-[11px] tracking-[0.18em] text-[var(--text-muted)] block">
                ABOUT THE AUTHOR
              </span>
              <h2 className="font-editorial-title text-3xl sm:text-4xl text-[var(--text)]">
                {AUTHOR_DATA.name}
              </h2>
              <span className="font-mono-meta text-[10px] text-[var(--text-faint)] block">
                {AUTHOR_DATA.location.toUpperCase()}
              </span>
            </div>

            <div className="md:col-span-8 space-y-6">
              <blockquote className="font-editorial-body text-xl sm:text-2xl text-[var(--text)] leading-relaxed italic border-l-2 border-[var(--text)] pl-4">
                “{AUTHOR_DATA.philosophy}”
              </blockquote>
              <p className="font-editorial-body text-base text-[var(--text-muted)] leading-relaxed max-w-2xl">
                {AUTHOR_DATA.biography[0]}
              </p>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text)] hover:underline font-semibold"
                >
                  <span>MORE ABOUT THE AUTHOR & COLOPHON</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
