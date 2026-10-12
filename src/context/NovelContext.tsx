import React, { createContext, useContext, useEffect, useState } from 'react';
import type { NovelMeta, Chapter } from '../types/novel';
import { NOVEL_META as DEFAULT_NOVEL_META, CHAPTERS as DEFAULT_CHAPTERS } from '../data/novelData';
import { toRomanNumeral } from '../utils/docxParser';

const NOVEL_META_STORAGE_KEY = 'literary_novel_meta';
const NOVEL_CHAPTERS_STORAGE_KEY = 'literary_novel_chapters';

interface NovelContextType {
  novelMeta: NovelMeta;
  setNovelMeta: React.Dispatch<React.SetStateAction<NovelMeta>>;
  updateNovelField: <K extends keyof NovelMeta>(key: K, value: NovelMeta[K]) => void;
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  reorderChapters: (fromIndex: number, toIndex: number) => void;
  addChapter: (title?: string) => Chapter;
  updateChapter: (id: number, fields: Partial<Chapter>) => void;
  deleteChapter: (id: number) => void;
  importDocxChapters: (importedChapters: Chapter[], detectedTitle?: string, detectedAuthor?: string) => void;
  resetToDefaultNovel: () => void;
  isCustomized: boolean;
}

const NovelContext = createContext<NovelContextType | undefined>(undefined);

export const NovelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize Novel Metadata
  const [novelMeta, setNovelMeta] = useState<NovelMeta>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(NOVEL_META_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved novel metadata', e);
      }
    }
    return DEFAULT_NOVEL_META;
  });

  // Initialize Chapters
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(NOVEL_CHAPTERS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved chapters', e);
      }
    }
    return DEFAULT_CHAPTERS;
  });

  const [isCustomized, setIsCustomized] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(localStorage.getItem(NOVEL_META_STORAGE_KEY) || localStorage.getItem(NOVEL_CHAPTERS_STORAGE_KEY));
    }
    return false;
  });

  // Sync Novel Metadata to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOVEL_META_STORAGE_KEY, JSON.stringify(novelMeta));
    } catch (e) {
      console.error('Failed to persist novel metadata', e);
    }
  }, [novelMeta]);

  // Sync Chapters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOVEL_CHAPTERS_STORAGE_KEY, JSON.stringify(chapters));
    } catch (e) {
      console.error('Failed to persist chapters', e);
    }
  }, [chapters]);

  // Update a single field in novel metadata
  const updateNovelField = <K extends keyof NovelMeta>(key: K, value: NovelMeta[K]) => {
    setIsCustomized(true);
    setNovelMeta((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Re-number chapters sequentially to ensure consistent Roman numerals and next/prev links
  const normalizeChapters = (chList: Chapter[]): Chapter[] => {
    return chList.map((ch, idx) => {
      const chapterIndex = idx + 1;
      const numberRoman = toRomanNumeral(chapterIndex);
      const numberDisplay = String(chapterIndex).padStart(2, '0');
      const slug = `chapter-${numberDisplay}`;
      const prevSlug = idx > 0 ? `chapter-${String(chapterIndex - 1).padStart(2, '0')}` : undefined;
      const nextSlug = idx < chList.length - 1 ? `chapter-${String(chapterIndex + 1).padStart(2, '0')}` : undefined;

      // Recalculate word count and reading time
      const wordCount = ch.paragraphs.reduce((acc, p) => acc + (p.isBreak ? 0 : p.text.split(/\s+/).filter(Boolean).length), 0);
      const readingTimeMin = Math.max(1, Math.round(wordCount / 200));

      return {
        ...ch,
        id: chapterIndex,
        numberRoman,
        numberDisplay,
        slug,
        prevSlug,
        nextSlug,
        wordCount,
        readingTimeMin
      };
    });
  };

  // Drag and drop reordering
  const reorderChapters = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= chapters.length || toIndex >= chapters.length) {
      return;
    }
    setIsCustomized(true);
    setChapters((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const normalized = normalizeChapters(next);

      // Also update total chapters in meta
      setNovelMeta((m) => ({
        ...m,
        totalChapters: normalized.length
      }));

      return normalized;
    });
  };

  // Add new blank chapter
  const addChapter = (title = 'Untitled Folio'): Chapter => {
    setIsCustomized(true);
    let newChapter: Chapter | null = null;
    setChapters((prev) => {
      const chapterIndex = prev.length + 1;
      const numberRoman = toRomanNumeral(chapterIndex);
      const numberDisplay = String(chapterIndex).padStart(2, '0');
      const slug = `chapter-${numberDisplay}`;

      newChapter = {
        id: chapterIndex,
        numberRoman,
        numberDisplay,
        title,
        slug,
        readingTimeMin: 1,
        wordCount: 0,
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
        paragraphs: [
          { text: 'Begin writing the opening lines here...' }
        ]
      };

      const next = normalizeChapters([...prev, newChapter]);
      setNovelMeta((m) => ({ ...m, totalChapters: next.length }));
      return next;
    });
    return newChapter!;
  };

  // Update existing chapter
  const updateChapter = (id: number, fields: Partial<Chapter>) => {
    setIsCustomized(true);
    setChapters((prev) => {
      const next = prev.map((ch) => (ch.id === id ? { ...ch, ...fields } : ch));
      return normalizeChapters(next);
    });
  };

  // Delete chapter
  const deleteChapter = (id: number) => {
    if (chapters.length <= 1) {
      alert('The novel must contain at least one chapter.');
      return;
    }
    setIsCustomized(true);
    setChapters((prev) => {
      const next = prev.filter((ch) => ch.id !== id);
      const normalized = normalizeChapters(next);
      setNovelMeta((m) => ({ ...m, totalChapters: normalized.length }));
      return normalized;
    });
  };

  // Batch import from DOCX parser
  const importDocxChapters = (
    importedChapters: Chapter[],
    detectedTitle?: string,
    detectedAuthor?: string
  ) => {
    setIsCustomized(true);
    const normalized = normalizeChapters(importedChapters);
    setChapters(normalized);

    setNovelMeta((prev) => {
      // Calculate total reading time
      const totalMin = normalized.reduce((acc, c) => acc + c.readingTimeMin, 0);
      const firstParagraph = normalized[0]?.paragraphs[0]?.text || prev.heroExcerpt;

      return {
        ...prev,
        title: detectedTitle || prev.title,
        author: detectedAuthor || prev.author,
        totalChapters: normalized.length,
        estimatedTotalReadingTime: `${totalMin} MIN`,
        heroExcerpt: firstParagraph.slice(0, 160) + (firstParagraph.length > 160 ? '...' : '')
      };
    });
  };

  // Reset to default novel ("The Last Light")
  const resetToDefaultNovel = () => {
    localStorage.removeItem(NOVEL_META_STORAGE_KEY);
    localStorage.removeItem(NOVEL_CHAPTERS_STORAGE_KEY);
    setNovelMeta(DEFAULT_NOVEL_META);
    setChapters(DEFAULT_CHAPTERS);
    setIsCustomized(false);
  };

  return (
    <NovelContext.Provider
      value={{
        novelMeta,
        setNovelMeta,
        updateNovelField,
        chapters,
        setChapters,
        reorderChapters,
        addChapter,
        updateChapter,
        deleteChapter,
        importDocxChapters,
        resetToDefaultNovel,
        isCustomized
      }}
    >
      {children}
    </NovelContext.Provider>
  );
};

export const useNovel = () => {
  const context = useContext(NovelContext);
  if (!context) {
    throw new Error('useNovel must be used within a NovelProvider');
  }
  return context;
};
