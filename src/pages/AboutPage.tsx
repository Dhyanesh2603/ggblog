import React from 'react';
import { AUTHOR_DATA } from '../data/authorData';
import { NOVEL_META } from '../data/novelData';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full">
      <section className="editorial-container pt-16 md:pt-24 pb-24 md:pb-32">
        {/* Title Folio */}
        <header className="max-w-3xl space-y-4 pb-12 border-b border-[var(--border)]">
          <span className="font-mono-meta text-[11px] md:text-xs tracking-[0.18em] text-[var(--text-muted)] block">
            BIOGRAPHY & COLOPHON
          </span>
          <h1 className="font-editorial-title text-6xl sm:text-7xl md:text-8xl tracking-tight text-[var(--text)]">
            About
          </h1>
          <p className="font-editorial-body text-2xl text-[var(--text-muted)] italic">
            {AUTHOR_DATA.name} — {AUTHOR_DATA.role}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12 items-start">
          {/* Main Biography Column */}
          <div className="lg:col-span-8 space-y-12">
            {/* Writing Philosophy */}
            <div className="space-y-4">
              <span className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] block">
                ON WRITING & METHOD
              </span>
              <blockquote className="font-editorial-body text-2xl sm:text-3xl italic text-[var(--text)] leading-relaxed pl-5 border-l-2 border-[var(--text)]">
                “{AUTHOR_DATA.philosophy}”
              </blockquote>
            </div>

            {/* Prose Bio */}
            <div className="space-y-6 font-editorial-body text-lg sm:text-xl text-[var(--text)] leading-relaxed">
              {AUTHOR_DATA.biography.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Publication Colophon */}
            <div className="pt-8 border-t border-[var(--border)] space-y-6">
              <span className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] block">
                DIGITAL PUBLICATION COLOPHON
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-editorial-body">
                <div className="space-y-2">
                  <div className="font-mono-meta text-[10px] text-[var(--text-muted)]">
                    TYPE DESIGN
                  </div>
                  <p className="text-[var(--text)]">
                    Display set in <em>{AUTHOR_DATA.colophon.typefaceDisplay}</em>.
                    Body reading text set in <em>{AUTHOR_DATA.colophon.typefaceBody}</em>.
                    Navigation & metadata set in <em>{AUTHOR_DATA.colophon.typefaceUI}</em>.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="font-mono-meta text-[10px] text-[var(--text-muted)]">
                    ETHICAL ARCHITECTURE
                  </div>
                  <ul className="text-[var(--text)] space-y-1 list-none p-0">
                    {AUTHOR_DATA.colophon.principles.map((pr, pIdx) => (
                      <li key={pIdx} className="flex items-center gap-2">
                        <span className="opacity-40">·</span>
                        <span>{pr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Correspondence & Details */}
          <div className="lg:col-span-4 lg:pl-8 lg:border-l lg:border-[var(--border)] space-y-10">
            {/* Author Details */}
            <div className="space-y-3">
              <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] block">
                RESIDENCE
              </span>
              <p className="font-editorial-body text-lg text-[var(--text)]">
                {AUTHOR_DATA.location}
              </p>
            </div>

            {/* Work */}
            <div className="space-y-3">
              <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] block">
                CURRENT WORK
              </span>
              <p className="font-editorial-body text-base text-[var(--text)]">
                <em>{NOVEL_META.title}</em> (Serialized Digital Novel)
              </p>
              <p className="font-editorial-body text-xs text-[var(--text-muted)]">
                Total 8 chapters. Serial release completed {NOVEL_META.year}.
              </p>
            </div>

            {/* Correspondence */}
            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] block">
                CORRESPONDENCE
              </span>
              <p className="font-editorial-body text-sm text-[var(--text-muted)] leading-relaxed">
                {AUTHOR_DATA.correspondence.note}
              </p>
              <div className="pt-2">
                <a
                  href={`mailto:${AUTHOR_DATA.correspondence.email}`}
                  className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text)] hover:underline inline-block border-b border-[var(--text)] pb-0.5"
                >
                  {AUTHOR_DATA.correspondence.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
