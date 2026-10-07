import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReadingTheme, ReadingProgressRecord } from '../types/novel';
import { CHAPTERS } from '../data/novelData';

interface ReadingContextType {
  theme: ReadingTheme;
  setTheme: (theme: ReadingTheme) => void;
  fontSize: 'default' | 'large' | 'larger';
  setFontSize: (size: 'default' | 'large' | 'larger') => void;
  isTocOpen: boolean;
  setIsTocOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  progressMap: Record<string, ReadingProgressRecord>;
  saveProgress: (slug: string, percentage: number, scrollPosition: number, isComplete?: boolean) => void;
  getLastReadRecord: () => ReadingProgressRecord | null;
  markChapterComplete: (slug: string) => void;
  resetProgress: () => void;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'literary_reading_theme';
const PROGRESS_STORAGE_KEY = 'literary_reading_progress';
const FONT_STORAGE_KEY = 'literary_font_size';

export const ReadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<ReadingTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ReadingTheme;
      if (saved && ['light', 'dark', 'paper'].includes(saved)) {
        return saved;
      }
    }
    return 'light';
  });

  // Font size state
  const [fontSize, setFontSizeState] = useState<'default' | 'large' | 'larger'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FONT_STORAGE_KEY) as 'default' | 'large' | 'larger';
      if (saved && ['default', 'large', 'larger'].includes(saved)) {
        return saved;
      }
    }
    return 'default';
  });

  // TOC drawer & mobile menu & marginalia notes
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Reading progress storage
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgressRecord>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to parse reading progress', e);
      }
    }
    return {};
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Apply font size class
  useEffect(() => {
    localStorage.setItem(FONT_STORAGE_KEY, fontSize);
    const root = document.documentElement;
    if (fontSize === 'large') {
      root.style.setProperty('--font-size-base', '22px');
      root.style.setProperty('--line-height-base', '1.82');
    } else if (fontSize === 'larger') {
      root.style.setProperty('--font-size-base', '24px');
      root.style.setProperty('--line-height-base', '1.86');
    } else {
      root.style.setProperty('--font-size-base', '20px');
      root.style.setProperty('--line-height-base', '1.78');
    }
  }, [fontSize]);

  const setTheme = (newTheme: ReadingTheme) => {
    setThemeState(newTheme);
  };

  const setFontSize = (size: 'default' | 'large' | 'larger') => {
    setFontSizeState(size);
  };

  const saveProgress = (slug: string, percentage: number, scrollPosition: number, isComplete?: boolean) => {
    const chapter = CHAPTERS.find((c) => c.slug === slug);
    if (!chapter) return;

    const roundedPercentage = Math.min(100, Math.max(0, Math.round(percentage)));
    const record: ReadingProgressRecord = {
      slug,
      title: chapter.title,
      chapterNumberDisplay: chapter.numberDisplay,
      percentage: roundedPercentage,
      scrollPosition,
      updatedAt: Date.now(),
      isComplete: isComplete || roundedPercentage >= 95
    };

    setProgressMap((prev) => {
      const next = { ...prev, [slug]: record };
      try {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Could not save progress to localStorage', e);
      }
      return next;
    });
  };

  const markChapterComplete = (slug: string) => {
    saveProgress(slug, 100, 0, true);
  };

  const resetProgress = () => {
    setProgressMap({});
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
  };

  const getLastReadRecord = (): ReadingProgressRecord | null => {
    const records = Object.values(progressMap);
    if (records.length === 0) return null;
    // Sort by updatedAt descending
    records.sort((a, b) => b.updatedAt - a.updatedAt);
    return records[0];
  };

  return (
    <ReadingContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        isTocOpen,
        setIsTocOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        activeNoteId,
        setActiveNoteId,
        progressMap,
        saveProgress,
        getLastReadRecord,
        markChapterComplete,
        resetProgress
      }}
    >
      {children}
    </ReadingContext.Provider>
  );
};

export const useReading = () => {
  const context = useContext(ReadingContext);
  if (!context) {
    throw new Error('useReading must be used within a ReadingProvider');
  }
  return context;
};
