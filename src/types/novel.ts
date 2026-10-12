export type ReadingTheme = 'light' | 'dark' | 'paper';

export interface NovelMeta {
  title: string;
  subtitle: string;
  author: string;
  year: string;
  totalChapters: number;
  estimatedTotalReadingTime: string;
  heroExcerpt: string;
  coverQuote: string;
  synopsis: string;
  coverImage?: string;
}

export interface AuthorNote {
  id: string;
  marker: string; // e.g. "[1]"
  title: string;
  content: string;
  targetExcerpt: string;
}

export interface ChapterParagraph {
  text: string;
  noteId?: string; // links to an author note if applicable
  isDialogue?: boolean;
  isBreak?: boolean;
}

export interface Chapter {
  id: number;
  numberRoman: string; // "I", "II", "III", etc.
  numberDisplay: string; // "01", "02", etc.
  title: string;
  subtitle?: string;
  slug: string;
  readingTimeMin: number;
  wordCount: number;
  characterCount?: number;
  date: string;
  epigraph?: {
    quote: string;
    source: string;
  };
  paragraphs: ChapterParagraph[];
  notes?: AuthorNote[];
  nextSlug?: string;
  prevSlug?: string;
}

export interface ReadingProgressRecord {
  slug: string;
  title: string;
  chapterNumberDisplay: string;
  percentage: number; // 0 to 100
  scrollPosition: number;
  updatedAt: number;
  isComplete: boolean;
}

export interface JournalNote {
  id: string;
  slug: string;
  date: string;
  title: string;
  readTime: string;
  summary: string;
  content: string[];
}

export interface ReadingShelfItem {
  id: string;
  title: string;
  author: string;
  year?: string;
  isCurrentlyReading?: boolean;
  reflection: string;
}
