import React from 'react';
import { Link } from 'react-router-dom';
import { AUTHOR_DATA } from '../data/authorData';
import { NOVEL_META } from '../data/novelData';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[var(--border)] mt-24 py-12 text-[var(--text-muted)] transition-colors duration-200">
      <div className="editorial-container flex flex-col md:flex-row items-baseline justify-between gap-6">
        <div className="space-y-1">
          <div className="font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text)]">
            {AUTHOR_DATA.name.toUpperCase()} © {NOVEL_META.year}
          </div>
          <p className="font-editorial-body text-xs italic opacity-70">
            A digital literary publication. Typeset in Instrument Serif & Newsreader.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-6 sm:gap-8 font-mono-meta text-[10.5px] tracking-[0.14em]">
          <Link to="/novel" className="hover:text-[var(--text)] transition-colors">
            THE NOVEL
          </Link>
          <Link to="/notes" className="hover:text-[var(--text)] transition-colors">
            NOTES
          </Link>
          <Link to="/reading" className="hover:text-[var(--text)] transition-colors">
            READING
          </Link>
          <Link to="/about" className="hover:text-[var(--text)] transition-colors">
            ABOUT
          </Link>
        </nav>
      </div>
    </footer>
  );
};
