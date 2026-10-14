import React from 'react';
import { Link } from 'react-router-dom';
import { AUTHOR_DATA } from '../data/authorData';
import { useNovel } from '../context/NovelContext';

export const Footer: React.FC = () => {
  const { novelMeta } = useNovel();

  return (
    <footer className="w-full border-t border-[var(--border)] mt-24 py-12 text-[var(--text-muted)] transition-colors duration-200">
      <div className="editorial-container flex flex-col md:flex-row items-baseline justify-between gap-6">
        <div className="space-y-1">
          <div className="font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text)]">
            {(novelMeta.author || AUTHOR_DATA.name).toUpperCase()} © {novelMeta.year}
          </div>
          <p className="font-editorial-body text-xs italic opacity-70">
            A digital literary publication. Typeset in Instrument Serif & Newsreader.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-6 sm:gap-8 font-mono-meta text-[10.5px] tracking-[0.14em]">
          <Link to="/novel" className="hover:text-[var(--text)] transition-colors">
            THE NOVEL
          </Link>
          <Link to="/reading" className="hover:text-[var(--text)] transition-colors">
            READING
          </Link>
          <Link to="/submissions" className="hover:text-[var(--text)] transition-colors">
            SUBMISSIONS
          </Link>
          <Link to="/about" className="hover:text-[var(--text)] transition-colors">
            ABOUT
          </Link>
          <Link
            to="/studio"
            className="hover:text-[var(--text)] opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1"
            title="Private Author Atelier"
          >
            <span>※</span>
            <span>ATELIER</span>
          </Link>
        </nav>
      </div>
    </footer>
  );
};
