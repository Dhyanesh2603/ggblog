import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useReading } from '../context/ReadingContext';
import { useNovel } from '../context/NovelContext';
import type { ReadingTheme } from '../types/novel';

export const Header: React.FC = () => {
  const location = useLocation();
  const { currentWork, userRole, setUserRole } = useNovel();
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
            <span>{currentWork.author.toUpperCase()}</span>
            <span className="hidden sm:inline opacity-35 font-normal">/</span>
            <span className="hidden sm:inline opacity-60 truncate max-w-[150px] sm:max-w-[200px]">
              {currentWork.title.toUpperCase()}
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-6 lg:gap-8 font-mono-meta text-[11px] tracking-[0.14em]"
          aria-label="Main Navigation"
        >
          {userRole === 'writer' ? (
            <>
              <Link
                to="/dashboard"
                className={`transition-opacity ${
                  location.pathname === '/dashboard' ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                DASHBOARD
              </Link>
              <Link
                to="/studio"
                className={`transition-opacity flex items-center gap-1.5 ${
                  location.pathname.startsWith('/studio') ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>STUDIO</span>
                <span className="text-[9px] px-1 py-0.2 border border-[var(--border)] text-[var(--text)]">WORKSPACE</span>
              </Link>
              <Link
                to="/explore"
                className={`transition-opacity ${
                  location.pathname === '/explore' ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                EXPLORE
              </Link>
              <Link
                to="/profile"
                className={`transition-opacity ${
                  location.pathname === '/profile' ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                PROFILE
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/novel"
                className={`transition-opacity ${
                  location.pathname.startsWith('/novel') ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                THE NOVEL
              </Link>
              <Link
                to="/explore"
                className={`transition-opacity ${
                  location.pathname === '/explore' ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                EXPLORE
              </Link>
              <Link
                to="/reading"
                className={`transition-opacity ${
                  location.pathname === '/reading' ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                READING
              </Link>
              <Link
                to="/profile"
                className={`transition-opacity ${
                  location.pathname === '/profile' ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                AUTHOR
              </Link>
            </>
          )}
        </nav>

        {/* Right side controls: Role Switcher + Chapters Drawer + Theme Switcher */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Role Switcher Pill */}
          <div className="hidden sm:flex items-center border border-[var(--border)] p-0.5 bg-[var(--paper-tint)]/40" title="Switch User Role">
            <button
              type="button"
              onClick={() => setUserRole('writer')}
              className={`font-mono-meta text-[9.5px] px-2 py-0.5 tracking-[0.14em] transition-colors cursor-pointer ${
                userRole === 'writer'
                  ? 'bg-[var(--text)] text-[var(--bg)] font-medium shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              WRITER
            </button>
            <button
              type="button"
              onClick={() => setUserRole('reader')}
              className={`font-mono-meta text-[9.5px] px-2 py-0.5 tracking-[0.14em] transition-colors cursor-pointer ${
                userRole === 'reader'
                  ? 'bg-[var(--text)] text-[var(--bg)] font-medium shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              READER
            </button>
          </div>

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
                className={`font-mono-meta text-[9.5px] px-2 py-0.5 tracking-[0.12em] transition-colors cursor-pointer ${
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
