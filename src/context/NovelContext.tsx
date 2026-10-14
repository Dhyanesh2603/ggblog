import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
  NovelMeta,
  Chapter,
  Work,
  WriterProfile,
  Scene,
  AccessKey,
  ChapterSnapshot,
  ScratchpadNote,
  WriterApplication
} from '../types/novel';
import { DEFAULT_WORKS, DEFAULT_WRITER_PROFILE } from '../data/defaultWorks';
import { toRomanNumeral } from '../utils/docxParser';
import {
  DEFAULT_DEVELOPER_KEY,
  INITIAL_ACCESS_KEYS,
  INITIAL_SCRATCHPAD,
  INITIAL_APPLICATIONS,
  exportDatabaseToJson,
  exportChaptersToCsv,
  generateRandomWriterKey,
  type DatabaseExportPayload
} from '../services/db';

const WORKS_STORAGE_KEY = 'literary_studio_works';
const ACTIVE_WORK_STORAGE_KEY = 'literary_studio_active_work_id';
const PROFILE_STORAGE_KEY = 'literary_studio_profile';
const USER_ROLE_STORAGE_KEY = 'literary_user_role';
const ACCESS_KEYS_STORAGE_KEY = 'literary_access_keys';
const AUTH_KEY_STORAGE_KEY = 'literary_auth_key';
const AUTH_REQUIRED_STORAGE_KEY = 'literary_auth_required';
const SCRATCHPAD_STORAGE_KEY = 'literary_scratchpad_notes';
const TYPEWRITER_MODE_STORAGE_KEY = 'literary_typewriter_mode';
const TYPEWRITER_SOUND_STORAGE_KEY = 'literary_typewriter_sound';
const APPLICATIONS_STORAGE_KEY = 'literary_writer_applications';

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

  // Master Key & Writer Access System
  accessKeys: AccessKey[];
  authKey: string | null;
  authRole: 'developer' | 'master' | 'writer' | 'guest';
  isAuthRequired: boolean;
  setAuthRequired: (required: boolean) => void;
  authenticateStudio: (enteredKey: string) => { success: boolean; role?: 'developer' | 'master' | 'writer'; message: string };
  logoutStudio: () => void;
  developerBypass: () => void;
  generateWriterKey: (label?: string) => AccessKey;
  revokeAccessKey: (code: string) => void;
  updateMasterKey: (newKey: string) => boolean;

  // Chapter Snapshots (Version History)
  saveChapterSnapshot: (chapterId: number, note?: string) => ChapterSnapshot;
  restoreChapterSnapshot: (chapterId: number, snapshotId: string) => boolean;
  deleteChapterSnapshot: (chapterId: number, snapshotId: string) => void;

  // Chapter Scratchpad & Notes Drawer
  scratchpadNotes: ScratchpadNote[];
  addScratchpadNote: (note: Partial<ScratchpadNote>) => ScratchpadNote;
  updateScratchpadNote: (id: string, updates: Partial<ScratchpadNote>) => void;
  deleteScratchpadNote: (id: string) => void;

  // Writer Studio Preferences
  typewriterMode: boolean;
  setTypewriterMode: (enabled: boolean) => void;
  typewriterSound: boolean;
  setTypewriterSound: (enabled: boolean) => void;
  setChapterWordTarget: (chapterId: number, targetWords?: number) => void;

  // Writer Submissions & Applications System
  writerApplications: WriterApplication[];
  submitWriterApplication: (data: Omit<WriterApplication, 'id' | 'submittedAt' | 'status'>) => WriterApplication;
  approveWriterApplication: (appId: string, customNote?: string) => { application: WriterApplication; key: AccessKey } | null;
  rejectWriterApplication: (appId: string, note?: string) => void;
  deleteWriterApplication: (appId: string) => void;

  // Easily Understandable Database Operations
  exportDatabase: () => void;
  exportCurrentWorkCsv: () => void;
  importDatabase: (jsonContent: string) => boolean;
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

  // 3. Writer Profile (Primary Author / Friend)
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

  // 5. Access Keys (Master Key & Writer Passes)
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(ACCESS_KEYS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return INITIAL_ACCESS_KEYS;
  });

  // 6. Currently Authenticated Key & Role
  const [authKey, setAuthKey] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_KEY_STORAGE_KEY);
    }
    return null;
  });

  // 7. Is Authentication Required for Studio (Protected by default)
  const [isAuthRequired, setIsAuthRequiredState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(AUTH_REQUIRED_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    }
    // Protected by default: Only the Master Author (friend) and Developer have access
    return true;
  });

  // 8. Scratchpad Notes
  const [scratchpadNotes, setScratchpadNotes] = useState<ScratchpadNote[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SCRATCHPAD_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_SCRATCHPAD;
  });

  // 9. Typewriter Scrolling Mode Preference
  const [typewriterMode, setTypewriterModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TYPEWRITER_MODE_STORAGE_KEY) === 'true';
    }
    return false;
  });

  // 10. Typewriter Mechanical Sound Toggle
  const [typewriterSound, setTypewriterSoundState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TYPEWRITER_SOUND_STORAGE_KEY) === 'true';
    }
    return false;
  });

  // 11. Writer Submissions & Applications
  const [writerApplications, setWriterApplications] = useState<WriterApplication[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_APPLICATIONS;
  });

  // Auto-login from URL search params (e.g. /studio?key=ATELIER-MASTER-2026 or ?key=DEV-ROOT-ACCESS-2026)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlKey = params.get('key') || params.get('pass') || params.get('token') || params.get('access_key');
      if (urlKey) {
        const found = accessKeys.find((k) => k.code.toLowerCase() === urlKey.trim().toLowerCase() && !k.revoked);
        if (found) {
          setAuthKey(found.code);
        }
      }
    }
  }, [accessKeys]);

  const [isCustomized, setIsCustomized] = useState(false);

  // Derive authRole from authKey
  const authRole: 'developer' | 'master' | 'writer' | 'guest' = React.useMemo(() => {
    if (!isAuthRequired) return 'developer'; // If auth is disabled, user has full developer privileges
    if (!authKey) return 'guest';
    const found = accessKeys.find((k) => k.code === authKey && !k.revoked);
    if (!found) return 'guest';
    return found.role;
  }, [authKey, accessKeys, isAuthRequired]);

  // Sync Works
  useEffect(() => {
    try {
      localStorage.setItem(WORKS_STORAGE_KEY, JSON.stringify(works));
      const active = works.find((w) => w.id === activeWorkId) || works[0];
      if (active) {
        localStorage.setItem(
          'literary_novel_meta',
          JSON.stringify({
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
          })
        );
        localStorage.setItem('literary_novel_chapters', JSON.stringify(active.chapters));
      }
    } catch (e) {
      console.error('Failed to persist works', e);
    }
  }, [works, activeWorkId]);

  // Sync other storage items
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_WORK_STORAGE_KEY, activeWorkId);
    } catch {}
  }, [activeWorkId]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(USER_ROLE_STORAGE_KEY, userRole);
    } catch {}
  }, [userRole]);

  useEffect(() => {
    try {
      localStorage.setItem(ACCESS_KEYS_STORAGE_KEY, JSON.stringify(accessKeys));
    } catch {}
  }, [accessKeys]);

  useEffect(() => {
    try {
      if (authKey) localStorage.setItem(AUTH_KEY_STORAGE_KEY, authKey);
      else localStorage.removeItem(AUTH_KEY_STORAGE_KEY);
    } catch {}
  }, [authKey]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_REQUIRED_STORAGE_KEY, String(isAuthRequired));
    } catch {}
  }, [isAuthRequired]);

  useEffect(() => {
    try {
      localStorage.setItem(SCRATCHPAD_STORAGE_KEY, JSON.stringify(scratchpadNotes));
    } catch {}
  }, [scratchpadNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(TYPEWRITER_MODE_STORAGE_KEY, String(typewriterMode));
    } catch {}
  }, [typewriterMode]);

  useEffect(() => {
    try {
      localStorage.setItem(TYPEWRITER_SOUND_STORAGE_KEY, String(typewriterSound));
    } catch {}
  }, [typewriterSound]);

  useEffect(() => {
    try {
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(writerApplications));
    } catch {}
  }, [writerApplications]);

  // Master Key & Writer Access Handlers
  const authenticateStudio = (enteredKey: string) => {
    const trimmed = enteredKey.trim();
    const found = accessKeys.find((k) => k.code.toLowerCase() === trimmed.toLowerCase());
    if (!found) {
      return { success: false, message: 'Invalid Studio Access Key. Please check with the Master Author.' };
    }
    if (found.revoked) {
      return { success: false, message: 'This Writer Access Key has been revoked.' };
    }
    setAuthKey(found.code);
    return { success: true, role: found.role, message: `Welcome to the Studio (${found.role.toUpperCase()})` };
  };

  const logoutStudio = () => {
    setAuthKey(null);
  };

  const developerBypass = () => {
    setAuthKey(DEFAULT_DEVELOPER_KEY);
  };

  const generateWriterKey = (label = 'Invited Writer') => {
    const newCode = generateRandomWriterKey('WRITER');
    const newKeyObj: AccessKey = {
      code: newCode,
      role: 'writer',
      label,
      createdAt: Date.now(),
      revoked: false
    };
    setAccessKeys((prev) => [newKeyObj, ...prev]);
    return newKeyObj;
  };

  const revokeAccessKey = (code: string) => {
    setAccessKeys((prev) =>
      prev.map((k) => (k.code === code ? { ...k, revoked: true } : k))
    );
  };

  const updateMasterKey = (newKey: string): boolean => {
    const trimmed = newKey.trim();
    if (!trimmed || trimmed.length < 4) return false;
    setAccessKeys((prev) =>
      prev.map((k) => (k.role === 'master' ? { ...k, code: trimmed } : k))
    );
    setAuthKey(trimmed);
    return true;
  };

  const setAuthRequired = (req: boolean) => {
    setIsAuthRequiredState(req);
  };

  const setTypewriterMode = (enabled: boolean) => {
    setTypewriterModeState(enabled);
  };

  const setTypewriterSound = (enabled: boolean) => {
    setTypewriterSoundState(enabled);
  };

  // Writer Submissions & Applications Handlers
  const submitWriterApplication = (data: Omit<WriterApplication, 'id' | 'submittedAt' | 'status'>): WriterApplication => {
    const newApp: WriterApplication = {
      ...data,
      id: `app-${Date.now()}`,
      status: 'pending',
      submittedAt: Date.now()
    };
    setWriterApplications((prev) => [newApp, ...prev]);
    return newApp;
  };

  const approveWriterApplication = (appId: string, customNote?: string): { application: WriterApplication; key: AccessKey } | null => {
    const target = writerApplications.find((a) => a.id === appId);
    if (!target) return null;

    const newKey = generateWriterKey(`${target.name} (${target.proposedTitle || 'Fellow'})`);
    const updatedApp: WriterApplication = {
      ...target,
      status: 'approved',
      assignedKey: newKey.code,
      reviewedAt: Date.now(),
      reviewNotes: customNote || 'Application approved by editorial desk.'
    };

    setWriterApplications((prev) => prev.map((a) => (a.id === appId ? updatedApp : a)));
    return { application: updatedApp, key: newKey };
  };

  const rejectWriterApplication = (appId: string, note?: string) => {
    setWriterApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              status: 'rejected',
              reviewedAt: Date.now(),
              reviewNotes: note || 'Declined for current folio.'
            }
          : a
      )
    );
  };

  const deleteWriterApplication = (appId: string) => {
    setWriterApplications((prev) => prev.filter((a) => a.id !== appId));
  };

  // Current active work accessor
  const currentWork = works.find((w) => w.id === activeWorkId) || works[0] || DEFAULT_WORKS[0];

  const setActiveWorkId = (id: string) => {
    if (works.some((w) => w.id === id)) {
      setActiveWorkIdState(id);
    }
  };

  const createWork = (newWorkData: Partial<Work>): Work => {
    const id = `work-${Date.now()}`;
    const slug = (newWorkData.title || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newWork: Work = {
      id,
      slug: slug || `manuscript-${Date.now()}`,
      title: newWorkData.title || 'Untitled Manuscript',
      subtitle: newWorkData.subtitle || '',
      author: newWorkData.author || profile.name,
      primaryAuthorId: profile.handle,
      type: newWorkData.type || 'novel',
      status: newWorkData.status || 'draft',
      year: newWorkData.year || new Date().getFullYear().toString(),
      description: newWorkData.description || newWorkData.synopsis || '',
      synopsis: newWorkData.synopsis || newWorkData.description || '',
      wordCount: newWorkData.wordCount || 0,
      heroExcerpt: newWorkData.heroExcerpt || '',
      coverImage: newWorkData.coverImage || '',
      category: newWorkData.category || 'General',
      chapters: newWorkData.chapters && newWorkData.chapters.length > 0
        ? newWorkData.chapters
        : [
            {
              id: 1,
              numberRoman: 'I',
              numberDisplay: '01',
              title: 'Chapter One',
              slug: 'chapter-one',
              readingTimeMin: 1,
              wordCount: 0,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              paragraphs: [{ id: 1, text: 'Begin typing your literary prose here...' }]
            }
          ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedTotalReadingTime: '1 min'
    };

    setWorks((prev) => [newWork, ...prev]);
    setActiveWorkIdState(id);
    setIsCustomized(true);
    return newWork;
  };

  const updateWork = (id: string, updates: Partial<Work>) => {
    setWorks((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated = { ...w, ...updates, updatedAt: Date.now() };
          if (updates.chapters) {
            const words = updates.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
            updated.wordCount = words;
            updated.estimatedTotalReadingTime = `${Math.ceil(words / 225)} min`;
          }
          return updated;
        }
        return w;
      })
    );
    setIsCustomized(true);
  };

  const deleteWork = (id: string) => {
    if (works.length <= 1) {
      alert('Cannot delete the only manuscript in your library.');
      return;
    }
    const remaining = works.filter((w) => w.id !== id);
    setWorks(remaining);
    if (activeWorkId === id) {
      setActiveWorkIdState(remaining[0].id);
    }
  };

  const duplicateWork = (id: string): Work => {
    const source = works.find((w) => w.id === id) || currentWork;
    const duplicated: Work = {
      ...source,
      id: `work-${Date.now()}`,
      title: `${source.title} (Copy)`,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setWorks((prev) => [duplicated, ...prev]);
    setActiveWorkIdState(duplicated.id);
    return duplicated;
  };

  const togglePublishWork = (id: string) => {
    setWorks((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            status: w.status === 'published' ? 'draft' : 'published',
            updatedAt: Date.now()
          };
        }
        return w;
      })
    );
  };

  // Chapter Operations
  const updateActiveWorkChapters = (newChapters: Chapter[]) => {
    updateWork(currentWork.id, { chapters: newChapters });
  };

  const addChapter = (title = 'New Chapter'): Chapter => {
    const nextIdx = currentWork.chapters.length + 1;
    const newCh: Chapter = {
      id: Date.now(),
      numberRoman: toRomanNumeral(nextIdx),
      numberDisplay: String(nextIdx).padStart(2, '0'),
      title,
      slug: `chapter-${nextIdx}`,
      readingTimeMin: 1,
      wordCount: 0,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      paragraphs: [{ id: 1, text: 'Begin drafting your prose here...' }],
      scenes: []
    };
    updateActiveWorkChapters([...currentWork.chapters, newCh]);
    return newCh;
  };

  const updateChapter = (id: number, fields: Partial<Chapter>) => {
    const updated = currentWork.chapters.map((ch) => {
      if (ch.id === id) {
        return { ...ch, ...fields };
      }
      return ch;
    });
    updateActiveWorkChapters(updated);
  };

  const deleteChapter = (id: number) => {
    if (currentWork.chapters.length <= 1) return;
    const filtered = currentWork.chapters.filter((c) => c.id !== id);
    const reindexed = filtered.map((ch, idx) => ({
      ...ch,
      numberRoman: toRomanNumeral(idx + 1),
      numberDisplay: String(idx + 1).padStart(2, '0')
    }));
    updateActiveWorkChapters(reindexed);
  };

  const duplicateChapter = (id: number): Chapter => {
    const src = currentWork.chapters.find((c) => c.id === id);
    if (!src) return addChapter();
    const dup: Chapter = {
      ...src,
      id: Date.now(),
      title: `${src.title} (Draft Copy)`
    };
    const idx = currentWork.chapters.findIndex((c) => c.id === id);
    const copy = [...currentWork.chapters];
    copy.splice(idx + 1, 0, dup);
    const reindexed = copy.map((ch, i) => ({
      ...ch,
      numberRoman: toRomanNumeral(i + 1),
      numberDisplay: String(i + 1).padStart(2, '0')
    }));
    updateActiveWorkChapters(reindexed);
    return dup;
  };

  const reorderChapters = (fromIdx: number, toIdx: number) => {
    const copy = [...currentWork.chapters];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    const reindexed = copy.map((ch, i) => ({
      ...ch,
      numberRoman: toRomanNumeral(i + 1),
      numberDisplay: String(i + 1).padStart(2, '0')
    }));
    updateActiveWorkChapters(reindexed);
  };

  const setChapterWordTarget = (chapterId: number, targetWords?: number) => {
    updateChapter(chapterId, { targetWordCount: targetWords });
  };

  // Chapter Snapshots (Version History)
  const saveChapterSnapshot = (chapterId: number, note?: string): ChapterSnapshot => {
    const ch = currentWork.chapters.find((c) => c.id === chapterId);
    const snapshot: ChapterSnapshot = {
      id: `snap-${Date.now()}`,
      chapterId,
      title: ch?.title || 'Chapter Snapshot',
      contentHtml: ch?.contentHtml || ch?.paragraphs.map((p) => `<p>${p.text}</p>`).join('') || '',
      wordCount: ch?.wordCount || 0,
      createdAt: Date.now(),
      note: note || 'Draft snapshot'
    };

    const existingSnapshots = ch?.snapshots || [];
    updateChapter(chapterId, { snapshots: [snapshot, ...existingSnapshots] });
    return snapshot;
  };

  const restoreChapterSnapshot = (chapterId: number, snapshotId: string): boolean => {
    const ch = currentWork.chapters.find((c) => c.id === chapterId);
    if (!ch || !ch.snapshots) return false;
    const target = ch.snapshots.find((s) => s.id === snapshotId);
    if (!target) return false;

    // Convert HTML back into paragraphs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = target.contentHtml;
    const pElements = Array.from(tempDiv.querySelectorAll('p, div.editorial-asterism, blockquote, h1, h2, h3'));
    const restoredParagraphs = pElements.map((el, i) => ({
      id: i + 1,
      text: el.textContent || '',
      isAsterism: el.textContent?.trim() === '※' || el.classList.contains('editorial-asterism')
    }));

    updateChapter(chapterId, {
      contentHtml: target.contentHtml,
      paragraphs: restoredParagraphs.length > 0 ? restoredParagraphs : [{ id: 1, text: tempDiv.innerText || '' }],
      wordCount: target.wordCount,
      estimatedReadingTime: `${Math.ceil(target.wordCount / 225)} min`
    });
    return true;
  };

  const deleteChapterSnapshot = (chapterId: number, snapshotId: string) => {
    const ch = currentWork.chapters.find((c) => c.id === chapterId);
    if (!ch || !ch.snapshots) return;
    const remaining = ch.snapshots.filter((s) => s.id !== snapshotId);
    updateChapter(chapterId, { snapshots: remaining });
  };

  // Scratchpad Notes Drawer
  const addScratchpadNote = (noteData: Partial<ScratchpadNote>): ScratchpadNote => {
    const newNote: ScratchpadNote = {
      id: `note-${Date.now()}`,
      workId: currentWork.id,
      title: noteData.title || 'Untitled Scratchpad Note',
      content: noteData.content || '',
      tag: noteData.tag || 'scratch',
      updatedAt: Date.now()
    };
    setScratchpadNotes((prev) => [newNote, ...prev]);
    return newNote;
  };

  const updateScratchpadNote = (id: string, updates: Partial<ScratchpadNote>) => {
    setScratchpadNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n))
    );
  };

  const deleteScratchpadNote = (id: string) => {
    setScratchpadNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Scene Operations (Scrivener)
  const addSceneToChapter = (chapterId: number, sceneTitle = 'New Scene'): Scene => {
    const newSc: Scene = {
      id: `scene-${Date.now()}`,
      title: sceneTitle,
      content: '<p>Scene text...</p>',
      wordCount: 0
    };
    const updated = currentWork.chapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          scenes: [...(ch.scenes || []), newSc]
        };
      }
      return ch;
    });
    updateActiveWorkChapters(updated);
    return newSc;
  };

  const updateScene = (chapterId: number, sceneId: string, updates: Partial<Scene>) => {
    const updated = currentWork.chapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          scenes: (ch.scenes || []).map((s) => (s.id === sceneId ? { ...s, ...updates } : s))
        };
      }
      return ch;
    });
    updateActiveWorkChapters(updated);
  };

  const deleteScene = (chapterId: number, sceneId: string) => {
    const updated = currentWork.chapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          scenes: (ch.scenes || []).filter((s) => s.id !== sceneId)
        };
      }
      return ch;
    });
    updateActiveWorkChapters(updated);
  };

  const reorderScenes = (chapterId: number, fromIdx: number, toIdx: number) => {
    const updated = currentWork.chapters.map((ch) => {
      if (ch.id === chapterId && ch.scenes) {
        const copy = [...ch.scenes];
        const [moved] = copy.splice(fromIdx, 1);
        copy.splice(toIdx, 0, moved);
        return { ...ch, scenes: copy };
      }
      return ch;
    });
    updateActiveWorkChapters(updated);
  };

  // DOCX Import
  const importDocxChapters = (imported: Chapter[], detectedTitle?: string, detectedAuthor?: string) => {
    if (!imported || imported.length === 0) return;
    const reindexed = imported.map((ch, idx) => ({
      ...ch,
      numberRoman: toRomanNumeral(idx + 1),
      numberDisplay: String(idx + 1).padStart(2, '0')
    }));

    updateWork(currentWork.id, {
      title: detectedTitle || currentWork.title,
      author: detectedAuthor || currentWork.author,
      chapters: reindexed
    });
  };

  // Easily Understandable Database Operations (JSON & CSV Export/Import)
  const exportDatabase = () => {
    const payload: DatabaseExportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      accessKeys,
      works,
      scratchpadNotes,
      writerApplications
    };
    exportDatabaseToJson(payload, `atelier_database_${new Date().toISOString().slice(0, 10)}.json`);
  };

  const exportCurrentWorkCsv = () => {
    exportChaptersToCsv(currentWork);
  };

  const importDatabase = (jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      if (!data || !Array.isArray(data.works)) {
        alert('Invalid database format. File must contain a works array.');
        return false;
      }
      if (data.works.length > 0) setWorks(data.works);
      if (data.profile) setProfile(data.profile);
      if (Array.isArray(data.accessKeys)) setAccessKeys(data.accessKeys);
      if (Array.isArray(data.scratchpadNotes)) setScratchpadNotes(data.scratchpadNotes);
      if (Array.isArray(data.writerApplications)) setWriterApplications(data.writerApplications);
      alert('Database restored successfully!');
      return true;
    } catch (e) {
      console.error(e);
      alert('Failed to parse database JSON file.');
      return false;
    }
  };

  // Reset to Demo
  const resetToDefaultNovel = () => {
    setWorks(DEFAULT_WORKS);
    setActiveWorkIdState(DEFAULT_WORKS[0].id);
    setProfile(DEFAULT_WRITER_PROFILE);
    setUserRoleState('writer');
    setAccessKeys(INITIAL_ACCESS_KEYS);
    setAuthKey(null);
    setIsAuthRequiredState(false);
    setIsCustomized(false);
    try {
      localStorage.removeItem(WORKS_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_WORK_STORAGE_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(ACCESS_KEYS_STORAGE_KEY);
      localStorage.removeItem(AUTH_KEY_STORAGE_KEY);
      localStorage.removeItem(AUTH_REQUIRED_STORAGE_KEY);
    } catch {}
  };

  // Writer Profile
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

  // NovelMeta bridge
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

  const setUserRole = (role: 'writer' | 'reader') => {
    setUserRoleState(role);
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
        setUserRole,
        accessKeys,
        authKey,
        authRole,
        isAuthRequired,
        setAuthRequired,
        authenticateStudio,
        logoutStudio,
        developerBypass,
        generateWriterKey,
        revokeAccessKey,
        updateMasterKey,
        saveChapterSnapshot,
        restoreChapterSnapshot,
        deleteChapterSnapshot,
        scratchpadNotes,
        addScratchpadNote,
        updateScratchpadNote,
        deleteScratchpadNote,
        typewriterMode,
        setTypewriterMode,
        typewriterSound,
        setTypewriterSound,
        setChapterWordTarget,
        writerApplications,
        submitWriterApplication,
        approveWriterApplication,
        rejectWriterApplication,
        deleteWriterApplication,
        exportDatabase,
        exportCurrentWorkCsv,
        importDatabase
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
