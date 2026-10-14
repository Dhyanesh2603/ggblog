export type ReadingTheme = 'light' | 'dark' | 'paper';

export type WorkType = 'novel' | 'short-story' | 'article' | 'poetry' | 'essay' | 'research';
export type WorkStatus = 'draft' | 'published';
export type TypesetStyle = 'classic' | 'minimal' | 'academic' | 'magazine';

export interface Scene {
  id: string;
  title: string;
  content: string; // Rich HTML or Markdown
  wordCount: number;
}

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
  category?: string;
  epigraph?: string;
  epigraphAttribution?: string;
}

export interface AuthorNote {
  id: string;
  marker: string; // e.g. "[1]"
  title: string;
  content: string;
  targetExcerpt: string;
}

export interface ChapterParagraph {
  id?: number;
  text: string;
  noteId?: string; // links to an author note if applicable
  isDialogue?: boolean;
  isBreak?: boolean;
  isAsterism?: boolean;
}

export interface ChapterSnapshot {
  id: string;
  chapterId: number;
  title: string;
  contentHtml: string;
  wordCount: number;
  createdAt: number;
  note?: string;
}

export interface ScratchpadNote {
  id: string;
  workId?: string;
  chapterId?: number;
  title: string;
  content: string;
  tag: 'character' | 'plot' | 'research' | 'dialogue' | 'scratch';
  updatedAt: number;
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
  targetWordCount?: number;
  characterCount?: number;
  date: string;
  epigraph?: {
    quote: string;
    source: string;
  };
  epigraphAttribution?: string;
  estimatedReadingTime?: string;
  paragraphs: ChapterParagraph[];
  scenes?: Scene[];
  contentHtml?: string;
  notes?: AuthorNote[];
  snapshots?: ChapterSnapshot[];
  scratchpad?: string;
  nextSlug?: string;
  prevSlug?: string;
}

export interface Work {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  author: string;
  primaryAuthorId?: string;
  type: WorkType;
  status: WorkStatus;
  year: string;
  description: string;
  synopsis?: string;
  wordCount?: number;
  targetTotalWords?: number;
  heroExcerpt?: string;
  coverImage?: string;
  category: string;
  chapters: Chapter[];
  createdAt: number;
  updatedAt: number;
  estimatedTotalReadingTime: string;
  readCount?: number;
  likesCount?: number;
}

export interface AccessKey {
  code: string;
  role: 'developer' | 'master' | 'writer';
  label: string;
  createdAt: number;
  revoked: boolean;
}

export interface WriterProfile {
  name: string;
  handle: string;
  bio: string;
  location: string;
  avatarUrl?: string;
  philosophy: string;
  manifesto?: string;
  penName?: string;
  website?: string;
  followerCount: number;
  followersCount?: number;
  isFollowing?: boolean;
  categories: string[];
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
  reflection?: string;
  workId?: string;
  totalChapters?: number;
  completedChapters?: number;
  progressPercentage?: number;
  lastReadDate?: string;
  status?: 'reading' | 'completed' | 'want_to_read';
}

export interface WriterApplication {
  id: string;
  name: string;
  penName?: string;
  email: string;
  portfolioUrl?: string;
  workType: WorkType;
  proposedTitle: string;
  pitch: string;
  sampleExcerpt: string;
  statement: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  assignedKey?: string;
  reviewNotes?: string;
}
