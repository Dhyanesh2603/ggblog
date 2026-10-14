import React from 'react';
import { Link } from 'react-router-dom';
import { AUTHOR_DATA } from '../data/authorData';
import { useNovel } from '../context/NovelContext';

export const Footer: React.FC = () => {
  const { novelMeta } = useNovel();

  return (
    <footer className="w-full border-t border-[var(--border)] mt-16 sm:mt-24 py-8 sm:py-12 text-[var(--text-muted)] transition-colors duration-200">
      <div className="editorial-container flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-6">
        <div className="space-y-1">
          <div className="font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text)]">
            {(novelMeta.author || AUTHOR_DATA.name).toUpperCase()} © {novelMeta.year}
          </div>
          <p className="font-editorial-body text-xs italic opacity-70">
            A digital literary publication. Typeset in Instrument Serif & Newsreader.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-4 sm:gap-8 font-mono-meta text-[10.5px] tracking-[0.14em]">
          <Link to="/novel" className="hover:text-[var(--text)] py-1 transition-colors">
            THE NOVEL
          </Link>
          <Link to="/reading" className="hover:text-[var(--text)] py-1 transition-colors">
            READING
          </Link>
          <Link to="/submissions" className="hover:text-[var(--text)] py-1 transition-colors">
            SUBMISSIONS
          </Link>
          <Link to="/about" className="hover:text-[var(--text)] py-1 transition-colors">
            ABOUT
          </Link>
        </nav>
      </div>
    </footer>
  );
};
