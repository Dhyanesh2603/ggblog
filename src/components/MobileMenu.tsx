import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useReading } from '../context/ReadingContext';
import type { ReadingTheme } from '../types/novel';

export const MobileMenu: React.FC = () => {
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    theme,
    setTheme,
    getLastReadRecord
  } = useReading();
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
        <div className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)]">
          NOVEL / 2026
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text)] py-2 px-3 border border-[var(--border)]"
          aria-label="Close Navigation"
        >
          CLOSE [×]
        </button>
      </div>

      {/* Main Editorial Nav Links */}
      <nav className="flex flex-col gap-6 my-auto py-8">
        <Link
          to="/"
          onClick={handleNavClick}
          className={`font-editorial-title text-4xl sm:text-5xl tracking-tight transition-colors ${
            location.pathname === '/' ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Cover & Index
        </Link>
        <Link
          to="/novel"
          onClick={handleNavClick}
          className={`font-editorial-title text-4xl sm:text-5xl tracking-tight transition-colors ${
            location.pathname.startsWith('/novel') ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          The Novel
        </Link>
        <Link
          to="/notes"
          onClick={handleNavClick}
          className={`font-editorial-title text-4xl sm:text-5xl tracking-tight transition-colors ${
            location.pathname.startsWith('/notes') ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Notes & Journal
        </Link>
        <Link
          to="/reading"
          onClick={handleNavClick}
          className={`font-editorial-title text-4xl sm:text-5xl tracking-tight transition-colors ${
            location.pathname.startsWith('/reading') ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          Reading Archive
        </Link>
        <Link
          to="/about"
          onClick={handleNavClick}
          className={`font-editorial-title text-4xl sm:text-5xl tracking-tight transition-colors ${
            location.pathname.startsWith('/about') ? 'text-[var(--text)] italic' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          About the Author
        </Link>
      </nav>

      {/* Bottom Status & Theme switcher */}
      <div className="border-t border-[var(--border)] pt-6 space-y-5">
        {lastRead && (
          <div className="text-left">
            <span className="font-mono-meta text-[10px] text-[var(--text-muted)] block mb-1">
              CONTINUE READING
            </span>
            <Link
              to={`/novel/${lastRead.slug}`}
              onClick={handleNavClick}
              className="text-sm font-editorial-body text-[var(--text)] hover:underline flex items-center justify-between"
            >
              <span>Chapter {lastRead.chapterNumberDisplay} — {lastRead.title}</span>
              <span className="font-mono-meta text-[10px] opacity-75">{lastRead.percentage}% →</span>
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="font-mono-meta text-[10px] text-[var(--text-muted)]">
            READING MODE:
          </span>
          <div className="flex items-center border border-[var(--border)] p-0.5">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`font-mono-meta text-[10px] px-3 py-1 tracking-[0.12em] transition-colors ${
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
