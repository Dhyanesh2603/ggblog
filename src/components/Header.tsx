import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useReading } from '../context/ReadingContext';
import type { ReadingTheme } from '../types/novel';

export const Header: React.FC = () => {
  const location = useLocation();
  const {
    theme,
    setTheme,
    isTocOpen,
    setIsTocOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useReading();

  const themes: { id: ReadingTheme; label: string }[] = [
    { id: 'light', label: 'LIGHT' },
    { id: 'paper', label: 'PAPER' },
    { id: 'dark', label: 'DARK' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--bg)] border-b border-[var(--border)] transition-colors duration-200">
      <div className="editorial-container flex items-center justify-between h-14 md:h-16">
        {/* Brand / Mark */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="font-mono-meta text-[11px] md:text-xs tracking-[0.14em] text-[var(--text)] hover:opacity-70 transition-opacity flex items-center gap-2"
          >
            <span className="opacity-50">※</span>
            <span>JULIAN THORNE</span>
            <span className="hidden sm:inline opacity-35 font-normal">/</span>
            <span className="hidden sm:inline opacity-60">THE LAST LIGHT</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-8 font-mono-meta text-[11px] tracking-[0.14em]"
          aria-label="Main Navigation"
        >
          <Link
            to="/novel"
            className={`transition-opacity ${
              location.pathname.startsWith('/novel') ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            THE NOVEL
          </Link>
          <Link
            to="/notes"
            className={`transition-opacity ${
              location.pathname.startsWith('/notes') ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            NOTES
          </Link>
          <Link
            to="/reading"
            className={`transition-opacity ${
              location.pathname.startsWith('/reading') ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            READING
          </Link>
          <Link
            to="/about"
            className={`transition-opacity ${
              location.pathname.startsWith('/about') ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            ABOUT
          </Link>
        </nav>

        {/* Right side controls: Chapters Drawer + Reading Theme switch on Desktop, MENU on Mobile */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Table of Contents trigger on Desktop */}
          <button
            type="button"
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="hidden sm:flex font-mono-meta text-[11px] tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors items-center gap-1.5 py-1 px-2 border border-transparent hover:border-[var(--border)]"
            aria-expanded={isTocOpen}
            aria-label="Open Chapter Index"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--text)] opacity-60"></span>
            <span>CHAPTERS</span>
          </button>

          {/* Desktop Reading Mode Switcher */}
          <div className="hidden sm:flex items-center border border-[var(--border)] p-0.5" role="group" aria-label="Reading Mode">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`font-mono-meta text-[9.5px] px-2 py-0.5 tracking-[0.12em] transition-colors ${
                  theme === t.id
                    ? 'bg-[var(--text)] text-[var(--bg)] font-medium'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text)] py-1.5 px-3 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors"
            aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          >
            {isMobileMenuOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>
      </div>
    </header>
  );
};
