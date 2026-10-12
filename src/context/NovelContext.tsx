import React, { createContext, useContext, useEffect, useState } from 'react';
import type { NovelMeta, Chapter, Work, WriterProfile, Scene } from '../types/novel';
import { DEFAULT_WORKS, DEFAULT_WRITER_PROFILE } from '../data/defaultWorks';
import { toRomanNumeral } from '../utils/docxParser';

const WORKS_STORAGE_KEY = 'literary_studio_works';
const ACTIVE_WORK_STORAGE_KEY = 'literary_studio_active_work_id';
const PROFILE_STORAGE_KEY = 'literary_studio_profile';
const USER_ROLE_STORAGE_KEY = 'literary_user_role';

interface NovelContextType {
  // Multi-Work Library
  works: Work[];
  activeWorkId: string;
  currentWork: Work;
  setActiveWorkId: (id: string) => void;
  createWork: (newWorkData: Partial<Work>) => Work;
  updateWork: (id: string, updates: Partial<Work>) => void;
  deleteWork: (id: string) => void;
  duplicateWork: (id: string) => Work;
  togglePublishWork: (id: string) => void;

  // Chapter & Scene Operations on active work
  chapters: Chapter[];
  addChapter: (title?: string) => Chapter;
  updateChapter: (id: number, fields: Partial<Chapter>) => void;
  deleteChapter: (id: number) => void;
  duplicateChapter: (id: number) => Chapter;
  reorderChapters: (fromIndex: number, toIndex: number) => void;

  // Scene Operations (Scrivener nested structure)
  addSceneToChapter: (chapterId: number, sceneTitle?: string) => Scene;
  updateScene: (chapterId: number, sceneId: string, updates: Partial<Scene>) => void;
  deleteScene: (chapterId: number, sceneId: string) => void;
  reorderScenes: (chapterId: number, fromIndex: number, toIndex: number) => void;

  // Backward-compatible NovelMeta accessors
  novelMeta: NovelMeta;
  setNovelMeta: React.Dispatch<React.SetStateAction<NovelMeta>>;
  updateNovelField: <K extends keyof NovelMeta>(key: K, value: NovelMeta[K]) => void;
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  importDocxChapters: (importedChapters: Chapter[], detectedTitle?: string, detectedAuthor?: string) => void;
  resetToDefaultNovel: () => void;
  isCustomized: boolean;

  // Writer Profile & Social
  profile: WriterProfile;
  updateProfile: (updates: Partial<WriterProfile>) => void;
  toggleFollowProfile: () => void;

  // User Role Switcher ('writer' | 'reader')
  userRole: 'writer' | 'reader';
  setUserRole: (role: 'writer' | 'reader') => void;
}

const NovelContext = createContext<NovelContextType | undefined>(undefined);

export const NovelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize Works Library from localStorage or defaults
  const [works, setWorks] = useState<Work[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(WORKS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error('Failed to parse works from storage', e);
      }
    }
    return DEFAULT_WORKS;
  });

  // 2. Active Work ID
  const [activeWorkId, setActiveWorkIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(ACTIVE_WORK_STORAGE_KEY);
      if (savedId) return savedId;
    }
    return DEFAULT_WORKS[0]?.id || 'work-last-light';
  });

  // 3. Writer Profile
  const [profile, setProfile] = useState<WriterProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_WRITER_PROFILE;
  });

  // 4. User Role (Writer vs Reader)
  const [userRole, setUserRoleState] = useState<'writer' | 'reader'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      if (saved === 'writer' || saved === 'reader') return saved;
    }
    return 'writer';
  });

  const [isCustomized, setIsCustomized] = useState(false);

  // Sync Works to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WORKS_STORAGE_KEY, JSON.stringify(works));
      // Also sync current chapters and meta to legacy keys for compatibility
      const active = works.find((w) => w.id === activeWorkId) || works[0];
      if (active) {
        localStorage.setItem('literary_novel_meta', JSON.stringify({
          title: active.title,
          subtitle: active.subtitle || '',
          author: active.author,
          year: active.year,
          totalChapters: active.chapters.length,
          estimatedTotalReadingTime: active.estimatedTotalReadingTime,
          heroExcerpt: active.heroExcerpt || '',
          coverQuote: active.heroExcerpt || '',
          synopsis: active.description,
          coverImage: active.coverImage || '',
          category: active.category
        }));
        localStorage.setItem('literary_novel_chapters', JSON.stringify(active.chapters));
      }
    } catch (e) {
      console.error('Failed to persist works', e);
    }
  }, [works, activeWorkId]);

  // Sync Active Work ID
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_WORK_STORAGE_KEY, activeWorkId);
    } catch {}
  }, [activeWorkId]);

  // Sync Profile
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  // Sync User Role
  useEffect(() => {
    try {
      localStorage.setItem(USER_ROLE_STORAGE_KEY, userRole);
    } catch {}
  }, [userRole]);

  const currentWork = works.find((w) => w.id === activeWorkId) || works[0] || DEFAULT_WORKS[0];

  const setActiveWorkId = (id: string) => {
    setActiveWorkIdState(id);
  };

  const setUserRole = (role: 'writer' | 'reader') => {
    setUserRoleState(role);
  };

  // Re-number chapters sequentially
  const normalizeChapterSequence = (chList: Chapter[]): Chapter[] => {
    return chList.map((ch, idx) => {
      const chapterIndex = idx + 1;
      const numberRoman = toRomanNumeral(chapterIndex);
      const numberDisplay = String(chapterIndex).padStart(2, '0');
      const slug = `chapter-${numberDisplay}`;
      const prevSlug = idx > 0 ? `chapter-${String(chapterIndex - 1).padStart(2, '0')}` : undefined;
      const nextSlug = idx < chList.length - 1 ? `chapter-${String(chapterIndex + 1).padStart(2, '0')}` : undefined;

      // Recalculate word count (from paragraphs or scenes)
      const paragraphWords = ch.paragraphs?.reduce((acc, p) => acc + (p.isBreak ? 0 : p.text.split(/\s+/).filter(Boolean).length), 0) || 0;
      const sceneWords = ch.scenes?.reduce((acc, s) => acc + (s.wordCount || 0), 0) || 0;
      const wordCount = Math.max(paragraphWords, sceneWords);
      const readingTimeMin = Math.max(1, Math.round(wordCount / 225));

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

  // Update active work helper
  const updateActiveWorkChapters = (newChapters: Chapter[]) => {
    const normalized = normalizeChapterSequence(newChapters);
    const totalWords = normalized.reduce((acc, c) => acc + c.wordCount, 0);
    const totalMinutes = Math.max(1, Math.round(totalWords / 225));

    setWorks((prev) =>
      prev.map((w) => {
        if (w.id === currentWork.id) {
          return {
            ...w,
            chapters: normalized,
            updatedAt: Date.now(),
            estimatedTotalReadingTime: `${totalMinutes} MIN`
          };
        }
        return w;
      })
    );
    setIsCustomized(true);
  };

  // Create New Work
  const createWork = (newWorkData: Partial<Work>): Work => {
    const id = `work-${Date.now()}`;
    const slug = (newWorkData.title || 'untitled-work')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    const defaultInitialChapter: Chapter = {
      id: 1,
      numberRoman: 'I',
      numberDisplay: '01',
      title: 'Chapter One',
      slug: 'chapter-01',
      readingTimeMin: 1,
      wordCount: 0,
      characterCount: 0,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
      paragraphs: [{ text: 'Begin typing your scene here...' }],
      scenes: [
        {
          id: `scene-${Date.now()}-1`,
          title: 'Opening Scene',
          content: '<p>Begin typing your scene here...</p>',
          wordCount: 6
        }
      ]
    };

    const newWork: Work = {
      id,
      slug,
      title: newWorkData.title || 'Untitled Work',
      subtitle: newWorkData.subtitle || '',
      author: newWorkData.author || profile.name,
      type: newWorkData.type || 'novel',
      status: 'draft',
      year: newWorkData.year || new Date().getFullYear().toString(),
      description: newWorkData.description || '',
      heroExcerpt: newWorkData.heroExcerpt || '',
      category: newWorkData.category || 'Literary Fiction',
      coverImage: newWorkData.coverImage || '',
      chapters: newWorkData.chapters && newWorkData.chapters.length > 0 ? newWorkData.chapters : [defaultInitialChapter],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedTotalReadingTime: '1 MIN',
      readCount: 0,
      likesCount: 0
    };

    setWorks((prev) => [newWork, ...prev]);
    setActiveWorkIdState(newWork.id);
    setIsCustomized(true);
    return newWork;
  };

  // Update Work Metadata
  const updateWork = (id: string, updates: Partial<Work>) => {
    setWorks((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            ...updates,
            updatedAt: Date.now()
          };
        }
        return w;
      })
    );
    setIsCustomized(true);
  };

  // Delete Work
  const deleteWork = (id: string) => {
    setWorks((prev) => {
      const remaining = prev.filter((w) => w.id !== id);
      if (remaining.length === 0) return DEFAULT_WORKS;
      return remaining;
    });
    if (activeWorkId === id) {
      const fallback = works.find((w) => w.id !== id) || DEFAULT_WORKS[0];
      setActiveWorkIdState(fallback.id);
    }
  };

  // Duplicate Work
  const duplicateWork = (id: string): Work => {
    const source = works.find((w) => w.id === id) || currentWork;
    const duplicated: Work = {
      ...source,
      id: `work-${Date.now()}`,
      slug: `${source.slug}-copy`,
      title: `${source.title} (Copy)`,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      readCount: 0,
      likesCount: 0
    };
    setWorks((prev) => [duplicated, ...prev]);
    setActiveWorkIdState(duplicated.id);
    return duplicated;
  };

  // Toggle Publish Work
  const togglePublishWork = (id: string) => {
    setWorks((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const newStatus = w.status === 'published' ? 'draft' : 'published';
          return { ...w, status: newStatus, updatedAt: Date.now() };
        }
        return w;
      })
    );
  };

  // Add Chapter to active work
  const addChapter = (title = 'Untitled Chapter'): Chapter => {
    const nextIndex = currentWork.chapters.length + 1;
    const newChapter: Chapter = {
      id: nextIndex,
      numberRoman: toRomanNumeral(nextIndex),
      numberDisplay: String(nextIndex).padStart(2, '0'),
      title,
      slug: `chapter-${String(nextIndex).padStart(2, '0')}`,
      readingTimeMin: 1,
      wordCount: 0,
      characterCount: 0,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
      paragraphs: [{ text: '' }],
      scenes: [
        {
          id: `scene-${Date.now()}-1`,
          title: 'Scene 1',
          content: '<p></p>',
          wordCount: 0
        }
      ]
    };
    const updated = [...currentWork.chapters, newChapter];
    updateActiveWorkChapters(updated);
    return newChapter;
  };

  // Update Chapter in active work
  const updateChapter = (id: number, fields: Partial<Chapter>) => {
    const updated = currentWork.chapters.map((ch) => {
      if (ch.id === id) {
        return { ...ch, ...fields };
      }
      return ch;
    });
    updateActiveWorkChapters(updated);
  };

  // Delete Chapter
  const deleteChapter = (id: number) => {
    if (currentWork.chapters.length <= 1) return;
    const remaining = currentWork.chapters.filter((ch) => ch.id !== id);
    updateActiveWorkChapters(remaining);
  };

  // Duplicate Chapter
  const duplicateChapter = (id: number): Chapter => {
    const target = currentWork.chapters.find((ch) => ch.id === id);
    if (!target) return addChapter();
    const duplicated: Chapter = {
      ...target,
      id: currentWork.chapters.length + 1,
      title: `${target.title} (Copy)`,
      scenes: target.scenes?.map((s) => ({ ...s, id: `scene-${Date.now()}-${Math.random()}` }))
    };
    const updated = [...currentWork.chapters, duplicated];
    updateActiveWorkChapters(updated);
    return duplicated;
  };

  // Reorder Chapters
  const reorderChapters = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= currentWork.chapters.length || toIndex >= currentWork.chapters.length) {
      return;
    }
    const cloned = [...currentWork.chapters];
    const [moved] = cloned.splice(fromIndex, 1);
    cloned.splice(toIndex, 0, moved);
    updateActiveWorkChapters(cloned);
  };

  // Add Scene to Chapter
  const addSceneToChapter = (chapterId: number, sceneTitle = 'New Scene'): Scene => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: sceneTitle,
      content: '<p></p>',
      wordCount: 0
    };

    const updated = currentWork.chapters.map((ch) => {
      if (ch.id === chapterId) {
        const scenes = ch.scenes ? [...ch.scenes, newScene] : [newScene];
        return { ...ch, scenes };
      }
      return ch;
    });
    updateActiveWorkChapters(updated);
    return newScene;
  };

  // Update Scene
  const updateScene = (chapterId: number, sceneId: string, updates: Partial<Scene>) => {
    const updated = currentWork.chapters.map((ch) => {
      if (ch.id === chapterId && ch.scenes) {
        const scenes = ch.scenes.map((s) => {
          if (s.id === sceneId) {
            const updatedScene = { ...s, ...updates };
            // Compute word count if content changed
            if (updates.content) {
              const textOnly = updates.content.replace(/<[^>]*>/g, ' ').trim();
              updatedScene.wordCount = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;
            }
            return updatedScene;
          }
          return s;
        });
        return { ...ch, scenes };
      }
      return ch;
    });
    updateActiveWorkChapters(updated);
  };

  // Delete Scene
  const deleteScene = (chapterId: number, sceneId: string) => {
    const updated = currentWork.chapters.map((ch) => {
      if (ch.id === chapterId && ch.scenes) {
        const scenes = ch.scenes.filter((s) => s.id !== sceneId);
        return { ...ch, scenes };
      }
      return ch;
    });
    updateActiveWorkChapters(updated);
  };

  // Reorder Scenes
  const reorderScenes = (chapterId: number, fromIndex: number, toIndex: number) => {
    const updated = currentWork.chapters.map((ch) => {
      if (ch.id === chapterId && ch.scenes) {
        const scenes = [...ch.scenes];
        const [moved] = scenes.splice(fromIndex, 1);
        scenes.splice(toIndex, 0, moved);
        return { ...ch, scenes };
      }
      return ch;
    });
    updateActiveWorkChapters(updated);
  };

  // Import DOCX into active work
  const importDocxChapters = (importedChapters: Chapter[], detectedTitle?: string, detectedAuthor?: string) => {
    if (importedChapters.length === 0) return;
    const normalized = normalizeChapterSequence(importedChapters);
    const totalWords = normalized.reduce((acc, c) => acc + c.wordCount, 0);
    const totalMinutes = Math.max(1, Math.round(totalWords / 225));

    setWorks((prev) =>
      prev.map((w) => {
        if (w.id === currentWork.id) {
          return {
            ...w,
            title: detectedTitle || w.title,
            author: detectedAuthor || w.author,
            chapters: normalized,
            updatedAt: Date.now(),
            estimatedTotalReadingTime: `${totalMinutes} MIN`
          };
        }
        return w;
      })
    );
    setIsCustomized(true);
  };

  // Reset to Default Demo Novel
  const resetToDefaultNovel = () => {
    setWorks(DEFAULT_WORKS);
    setActiveWorkIdState(DEFAULT_WORKS[0].id);
    setProfile(DEFAULT_WRITER_PROFILE);
    setUserRoleState('writer');
    setIsCustomized(false);
    try {
      localStorage.removeItem(WORKS_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_WORK_STORAGE_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {}
  };

  // Writer Profile Operations
  const updateProfile = (updates: Partial<WriterProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const toggleFollowProfile = () => {
    setProfile((prev) => ({
      ...prev,
      isFollowing: !prev.isFollowing,
      followerCount: prev.isFollowing ? prev.followerCount - 1 : prev.followerCount + 1
    }));
  };

  // Backward-compatible NovelMeta bridge
  const novelMeta: NovelMeta = {
    title: currentWork.title,
    subtitle: currentWork.subtitle || '',
    author: currentWork.author,
    year: currentWork.year,
    totalChapters: currentWork.chapters.length,
    estimatedTotalReadingTime: currentWork.estimatedTotalReadingTime,
    heroExcerpt: currentWork.heroExcerpt || '',
    coverQuote: currentWork.heroExcerpt || '',
    synopsis: currentWork.description,
    coverImage: currentWork.coverImage || '',
    category: currentWork.category
  };

  const setNovelMeta: React.Dispatch<React.SetStateAction<NovelMeta>> = (action) => {
    const updated = typeof action === 'function' ? action(novelMeta) : action;
    updateWork(currentWork.id, {
      title: updated.title,
      subtitle: updated.subtitle,
      author: updated.author,
      year: updated.year,
      description: updated.synopsis,
      heroExcerpt: updated.heroExcerpt,
      coverImage: updated.coverImage,
      category: updated.category || currentWork.category
    });
  };

  const updateNovelField = <K extends keyof NovelMeta>(key: K, value: NovelMeta[K]) => {
    const mapping: Record<string, string> = {
      synopsis: 'description'
    };
    const targetKey = mapping[key as string] || (key as string);
    updateWork(currentWork.id, { [targetKey]: value });
  };

  const setChapters: React.Dispatch<React.SetStateAction<Chapter[]>> = (action) => {
    const newChList = typeof action === 'function' ? action(currentWork.chapters) : action;
    updateActiveWorkChapters(newChList);
  };

  return (
    <NovelContext.Provider
      value={{
        works,
        activeWorkId,
        currentWork,
        setActiveWorkId,
        createWork,
        updateWork,
        deleteWork,
        duplicateWork,
        togglePublishWork,
        chapters: currentWork.chapters,
        addChapter,
        updateChapter,
        deleteChapter,
        duplicateChapter,
        reorderChapters,
        addSceneToChapter,
        updateScene,
        deleteScene,
        reorderScenes,
        novelMeta,
        setNovelMeta,
        updateNovelField,
        setChapters,
        importDocxChapters,
        resetToDefaultNovel,
        isCustomized,
        profile,
        updateProfile,
        toggleFollowProfile,
        userRole,
        setUserRole
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
