import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useReading } from '../context/ReadingContext';
import { useNovel } from '../context/NovelContext';
import type { ReadingTheme } from '../types/novel';

export const MobileMenu: React.FC = () => {
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    theme,
    setTheme,
    getLastReadRecord
  } = useReading();
  const { userRole, setUserRole } = useNovel();
  const location = useLocation();

  if (!isMobileMenuOpen) return null;

  const lastRead = getLastReadRecord();

  const themes: { id: ReadingTheme; label: string }[] = [
    { id: 'light', label: 'LIGHT' },
    { id: 'paper', label: 'PAPER' },
    { id: 'dark', label: 'DARK' }
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col justify-between p-6 sm:p-10 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Index"
    >
      {/* Top Bar inside Menu */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          {/* Role switcher for mobile */}
          <div className="flex items-center border border-[var(--border)] p-0.5 bg-[var(--paper-tint)]/40">
            <button
              type="button"
              onClick={() => setUserRole('writer')}
              className={`font-mono-meta text-[9px] px-2 py-0.5 tracking-[0.14em] ${
                userRole === 'writer'
                  ? 'bg-[var(--text)] text-[var(--bg)] font-medium'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              WRITER
            </button>
            <button
              type="button"
              onClick={() => setUserRole('reader')}
              className={`font-mono-meta text-[9px] px-2 py-0.5 tracking-[0.14em] ${
                userRole === 'reader'
                  ? 'bg-[var(--text)] text-[var(--bg)] font-medium'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              READER
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text)] py-1.5 px-3 border border-[var(--border)]"
          aria-label="Close Navigation"
        >
          CLOSE [×]
        </button>
      </div>

      {/* Main Editorial Nav Links */}
      <nav className="flex flex-col gap-5 my-auto py-6">
        <Link
          to="/"
          onClick={handleNavClick}
          className={`font-editorial-title text-3xl sm:text-4xl tracking-tight transition-colors ${
            location.pathname === '/' ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Cover & Index
        </Link>

        {userRole === 'writer' ? (
          <>
            <Link
              to="/dashboard"
              onClick={handleNavClick}
              className={`font-editorial-title text-3xl sm:text-4xl tracking-tight transition-colors ${
                location.pathname === '/dashboard' ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Writer Dashboard
            </Link>
            <Link
              to="/studio"
              onClick={handleNavClick}
              className={`font-editorial-title text-3xl sm:text-4xl tracking-tight transition-colors ${
                location.pathname.startsWith('/studio') ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Writer Studio
            </Link>
          </>
        ) : (
          <Link
            to="/novel"
            onClick={handleNavClick}
            className={`font-editorial-title text-3xl sm:text-4xl tracking-tight transition-colors ${
              location.pathname.startsWith('/novel') ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            The Novel
          </Link>
        )}

        <Link
          to="/explore"
          onClick={handleNavClick}
          className={`font-editorial-title text-3xl sm:text-4xl tracking-tight transition-colors ${
            location.pathname === '/explore' ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Explore Catalog
        </Link>

        <Link
          to="/profile"
          onClick={handleNavClick}
          className={`font-editorial-title text-3xl sm:text-4xl tracking-tight transition-colors ${
            location.pathname === '/profile' ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Writer Portfolio
        </Link>

        <Link
          to="/reading"
          onClick={handleNavClick}
          className={`font-editorial-title text-3xl sm:text-4xl tracking-tight transition-colors ${
            location.pathname.startsWith('/reading') ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Reading Archive
        </Link>
      </nav>

      {/* Bottom Status & Theme switcher */}
      <div className="border-t border-[var(--border)] pt-4 space-y-4">
        {lastRead && (
          <div className="text-left">
            <span className="font-mono-meta text-[9px] text-[var(--text-muted)] block mb-0.5">
              CONTINUE READING
            </span>
            <Link
              to={`/novel/${lastRead.slug}`}
              onClick={handleNavClick}
              className="text-xs font-editorial-body text-[var(--text)] hover:underline flex items-center justify-between"
            >
              <span>Chapter {lastRead.chapterNumberDisplay} — {lastRead.title}</span>
              <span className="font-mono-meta text-[9px] opacity-75">{lastRead.percentage}% →</span>
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="font-mono-meta text-[9.5px] text-[var(--text-muted)]">
            READING MODE:
          </span>
          <div className="flex items-center border border-[var(--border)] p-0.5">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`font-mono-meta text-[9px] px-2.5 py-1 tracking-[0.12em] transition-colors ${
                  theme === t.id
                    ? 'bg-[var(--text)] text-[var(--bg)] font-medium'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
