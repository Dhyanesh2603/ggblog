import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReadingTheme, ReadingProgressRecord } from '../types/novel';
import { CHAPTERS } from '../data/novelData';

export const THEME_STORAGE_KEY = 'literary_reading_theme';
export const PROGRESS_STORAGE_KEY = 'literary_reading_progress';
export const FONT_STORAGE_KEY = 'literary_font_size';

// Direct synchronous write to localStorage for guaranteed persistence during tab closing/unload
export const directWriteProgress = (
  slug: string,
  percentage: number,
  scrollPosition: number,
  isComplete?: boolean
) => {
  if (typeof window === 'undefined') return;
  try {
    const chapter = CHAPTERS.find((c) => c.slug === slug);
    if (!chapter) return;

    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    const map: Record<string, ReadingProgressRecord> = raw ? JSON.parse(raw) : {};
    const existing = map[slug];

    const roundedPercentage = Math.min(100, Math.max(0, Math.round(percentage)));

    // High-water mark rule: do NOT downgrade reading progress if the reader scrolls up
    const effectivePercentage = existing
      ? Math.max(existing.percentage, roundedPercentage)
      : roundedPercentage;

    const completed = Boolean(
      isComplete ||
      (existing && existing.isComplete) ||
      effectivePercentage >= 92
    );

    const effectiveScroll = scrollPosition > 0 ? scrollPosition : (existing?.scrollPosition || 0);

    map[slug] = {
      slug,
      title: chapter.title,
      chapterNumberDisplay: chapter.numberDisplay,
      percentage: effectivePercentage,
      scrollPosition: effectiveScroll,
      updatedAt: Date.now(),
      isComplete: completed
    };

    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed direct localStorage write', e);
  }
};

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

  // Reading progress storage - parsed safely from localStorage
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

  // Cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PROGRESS_STORAGE_KEY && e.newValue) {
        try {
          setProgressMap(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

    setProgressMap((prev) => {
      const existing = prev[slug];

      // High-water mark rule: do NOT lower completion percentage if user scrolls up
      const effectivePercentage = existing
        ? Math.max(existing.percentage, roundedPercentage)
        : roundedPercentage;

      const completed = Boolean(
        isComplete ||
        (existing && existing.isComplete) ||
        effectivePercentage >= 92
      );

      // Preserve last positive scroll position
      const effectiveScroll = scrollPosition > 0 ? scrollPosition : (existing?.scrollPosition || 0);

      const record: ReadingProgressRecord = {
        slug,
        title: chapter.title,
        chapterNumberDisplay: chapter.numberDisplay,
        percentage: effectivePercentage,
        scrollPosition: effectiveScroll,
        updatedAt: Date.now(),
        isComplete: completed
      };

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
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    } catch {}
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
