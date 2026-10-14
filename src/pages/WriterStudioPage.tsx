import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNovel } from '../context/NovelContext';
import { TipTapEditor } from '../components/TipTapEditor';
import { ImportReviewModal } from '../components/ImportReviewModal';
import { StudioAuthModal } from '../components/StudioAuthModal';
import { MasterKeysModal } from '../components/MasterKeysModal';
import { ChapterSnapshotsDrawer } from '../components/ChapterSnapshotsDrawer';
import { ScratchpadDrawer } from '../components/ScratchpadDrawer';
import { DatabaseModal } from '../components/DatabaseModal';
import { WriterApplicationsDrawer } from '../components/WriterApplicationsDrawer';
import { WritingSprintModal } from '../components/WritingSprintModal';
import { LiteraryInspectorModal } from '../components/LiteraryInspectorModal';
import { FindReplaceBar } from '../components/FindReplaceBar';
import { ChapterExportModal } from '../components/ChapterExportModal';
import { playTypewriterKeySound } from '../utils/typewriterAudio';
import { parseDocxFile, type ParseDocxResult, toRomanNumeral } from '../utils/docxParser';
import { generateEpubBlob, downloadBlob } from '../utils/epubGenerator';
import type { Chapter, ChapterParagraph, Work } from '../types/novel';

export const WriterStudioPage: React.FC = () => {
  const {
    currentWork,
    chapters,
    addChapter,
    updateChapter,
    deleteChapter,
    duplicateChapter,
    reorderChapters,
    importDocxChapters,
    authRole,
    scratchpadNotes,
    typewriterMode,
    setTypewriterMode,
    typewriterSound,
    setTypewriterSound,
    setChapterWordTarget,
    writerApplications,
    authenticateStudio,
    developerBypass
  } = useNovel();

  // Selected Chapter State
  const [selectedChapterId, setSelectedChapterId] = useState<number>(() => {
    return chapters[0]?.id || 1;
  });

  // Keep selected chapter valid
  useEffect(() => {
    if (!chapters.find((c) => c.id === selectedChapterId)) {
      if (chapters.length > 0) {
        setSelectedChapterId(chapters[0].id);
      }
    }
  }, [chapters, selectedChapterId]);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) || chapters[0];

  // Helper to extract epigraph text & source safely
  const getEpigraphQuote = (ch?: Chapter): string => {
    if (!ch || !ch.epigraph) return '';
    if (typeof ch.epigraph === 'string') return ch.epigraph;
    return ch.epigraph.quote || '';
  };

  const getEpigraphSource = (ch?: Chapter): string => {
    if (!ch) return '';
    if (typeof ch.epigraph === 'object' && ch.epigraph?.source) {
      return ch.epigraph.source;
    }
    return ch.epigraphAttribution || '';
  };

  const getWorkWordCount = (w: Work): number => {
    if (w.wordCount) return w.wordCount;
    return w.chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  };

  // UI state
  const [showOutline, setShowOutline] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : false));
  const [isZenMode, setIsZenMode] = useState(false);
  const [isBookPreviewMode, setIsBookPreviewMode] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMasterKeysModalOpen, setIsMasterKeysModalOpen] = useState(false);
  const [isSnapshotsDrawerOpen, setIsSnapshotsDrawerOpen] = useState(false);
  const [isScratchpadDrawerOpen, setIsScratchpadDrawerOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingParsedDocx, setPendingParsedDocx] = useState<ParseDocxResult | null>(null);
  const [isParsingDocx, setIsParsingDocx] = useState(false);
  const [isExportingEpub, setIsExportingEpub] = useState(false);
  const [isApplicationsDrawerOpen, setIsApplicationsDrawerOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isExportHubOpen, setIsExportHubOpen] = useState(false);

  // Private Author Sanctum Gate state
  const [gatePasscode, setGatePasscode] = useState('');
  const [gateError, setGateError] = useState('');

  // Drag-and-drop chapter states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Inline rename chapter state
  const [editingChapterTitleId, setEditingChapterTitleId] = useState<number | null>(null);
  const [inlineChapterTitle, setInlineChapterTitle] = useState('');

  // Refs
  const manuscriptFileInputRef = useRef<HTMLInputElement>(null);

  // Check URL query for direct writer key authentication (e.g. /studio?key=WRITER-123)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const keyParam = urlParams.get('key') || urlParams.get('access_key');
      if (keyParam) {
        // Clear param from URL cleanly
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === 'Escape') {
        if (isZenMode) setIsZenMode(false);
        if (isBookPreviewMode) setIsBookPreviewMode(false);
        if (isSnapshotsDrawerOpen) setIsSnapshotsDrawerOpen(false);
        if (isScratchpadDrawerOpen) setIsScratchpadDrawerOpen(false);
        if (isApplicationsDrawerOpen) setIsApplicationsDrawerOpen(false);
        if (isSprintModalOpen) setIsSprintModalOpen(false);
        if (isInspectorModalOpen) setIsInspectorModalOpen(false);
        if (isFindReplaceOpen) setIsFindReplaceOpen(false);
        if (isExportHubOpen) setIsExportHubOpen(false);
        return;
      }

      // Shortcut: F for Zen Mode
      if (e.key === 'f' || e.key === 'F') {
        if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setIsZenMode((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isZenMode,
    isBookPreviewMode,
    isSnapshotsDrawerOpen,
    isScratchpadDrawerOpen,
    isApplicationsDrawerOpen,
    isSprintModalOpen,
    isInspectorModalOpen,
    isFindReplaceOpen,
    isExportHubOpen
  ]);

  // Tactile Typewriter Audio Key Listener
  useEffect(() => {
    if (!typewriterSound) return;

    const handleKeySound = (e: KeyboardEvent) => {
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;
      playTypewriterKeySound(e.key);
    };

    window.addEventListener('keydown', handleKeySound);
    return () => window.removeEventListener('keydown', handleKeySound);
  }, [typewriterSound]);

  // Private Author Sanctum Gate Submit Handler
  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');
    if (!gatePasscode.trim()) {
      setGateError('Please enter an authorization key to unlock.');
      return;
    }
    const res = authenticateStudio(gatePasscode.trim());
    if (!res.success) {
      setGateError(res.message);
    } else {
      setGatePasscode('');
    }
  };

  // Chapter Find & Replace
  const handleReplaceAll = (findText: string, replaceText: string, matchCase: boolean) => {
    if (!selectedChapter) return;
    try {
      const regex = new RegExp(
        findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        matchCase ? 'g' : 'gi'
      );
      const currentHtml = selectedChapter.contentHtml || selectedChapter.paragraphs.map((p) => `<p>${p.text}</p>`).join('');
      const updatedHtml = currentHtml.replace(regex, replaceText);

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = updatedHtml;
      const pElements = Array.from(tempDiv.querySelectorAll('p, div.editorial-asterism, blockquote, h1, h2, h3'));
      const updatedParagraphs = pElements.map((el, i) => ({
        id: i + 1,
        text: el.textContent || '',
        isAsterism: el.textContent?.trim() === '※' || el.classList.contains('editorial-asterism')
      }));

      const words = tempDiv.innerText.trim().split(/\s+/).filter(Boolean).length;
      updateChapter(selectedChapter.id, {
        contentHtml: updatedHtml,
        paragraphs: updatedParagraphs,
        wordCount: words,
        estimatedReadingTime: `${Math.ceil(words / 225)} min`,
        readingTimeMin: Math.ceil(words / 225)
      });
      alert(`Replaced occurrences in Chapter ${selectedChapter.title}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Full Manuscript DOCX
  const handleFullDocxFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      alert('Please upload a valid Microsoft Word (.docx) file.');
      return;
    }
    try {
      setIsParsingDocx(true);
      const parsed = await parseDocxFile(file);
      if (parsed.chapters.length === 0) {
        alert('Could not detect any chapter divisions or text in this document.');
        return;
      }
      setPendingParsedDocx(parsed);
      setIsImportModalOpen(true);
    } catch (err) {
      console.error('Docx parse error', err);
      alert('Error parsing DOCX file.');
    } finally {
      setIsParsingDocx(false);
    }
  };

  // Confirm Import
  const handleConfirmImport = (importedChapters: Chapter[], title?: string, author?: string) => {
    importDocxChapters(importedChapters, title, author);
    if (importedChapters[0]) {
      setSelectedChapterId(importedChapters[0].id);
    }
    setIsImportModalOpen(false);
    setPendingParsedDocx(null);
  };

  // Drag and drop handlers
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleDrop = (idx: number) => {
    if (draggedIndex !== null && draggedIndex !== idx) {
      reorderChapters(draggedIndex, idx);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Export EPUB
  const handleExportEpub = async () => {
    try {
      setIsExportingEpub(true);
      const totalWords = getWorkWordCount(currentWork);
      const epQuote = getEpigraphQuote(chapters[0]);
      const epSource = getEpigraphSource(chapters[0]);

      const meta = {
        title: currentWork.title,
        subtitle: currentWork.subtitle || '',
        author: currentWork.author,
        year: currentWork.year || '2026',
        totalChapters: chapters.length,
        estimatedTotalReadingTime: `${Math.ceil(totalWords / 225)} min`,
        heroExcerpt: currentWork.heroExcerpt || currentWork.description || '',
        coverQuote: currentWork.heroExcerpt || currentWork.title,
        synopsis: currentWork.synopsis || currentWork.description || '',
        coverImage: currentWork.coverImage,
        epigraph: epQuote,
        epigraphAttribution: epSource
      };
      const blob = await generateEpubBlob(meta, chapters);
      const safeTitle = currentWork.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadBlob(blob, `${safeTitle}_Edition.epub`);
    } catch (e) {
      console.error('EPUB Error', e);
      alert('Could not package EPUB file.');
    } finally {
      setIsExportingEpub(false);
    }
  };

  // Convert current selected chapter HTML content for initial TipTap
  const getChapterInitialHtml = (ch?: Chapter): string => {
    if (!ch) return '<p>Begin drafting chapter...</p>';
    if (ch.contentHtml) return ch.contentHtml;
    if (ch.paragraphs && ch.paragraphs.length > 0) {
      return ch.paragraphs
        .map((p) => {
          if (p.isAsterism) return '<div class="editorial-asterism text-center my-6">※</div>';
          return `<p>${p.text}</p>`;
        })
        .join('');
    }
    return '<p>Begin writing prose here...</p>';
  };

  // Handle TipTap content updates
  const handleEditorUpdate = (html: string, _plainText: string, words: number, _chars: number) => {
    if (!selectedChapter) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const pElements = Array.from(tempDiv.querySelectorAll('p, div.editorial-asterism, blockquote, h1, h2, h3'));

    const updatedParagraphs: ChapterParagraph[] = pElements.map((el, i) => {
      const isAst = el.textContent?.trim() === '※' || el.classList.contains('editorial-asterism');
      return {
        id: i + 1,
        text: el.textContent || '',
        isAsterism: isAst
      };
    });

    updateChapter(selectedChapter.id, {
      contentHtml: html,
      paragraphs: updatedParagraphs.length > 0 ? updatedParagraphs : [{ id: 1, text: tempDiv.innerText || '' }],
      wordCount: words,
      estimatedReadingTime: `${Math.ceil(words / 225)} min`,
      readingTimeMin: Math.ceil(words / 225)
    });
  };

  const selectedIndex = chapters.findIndex((c) => c.id === selectedChapter?.id);
  const romanNumber = toRomanNumeral(selectedIndex >= 0 ? selectedIndex + 1 : 1);
  const currentSnapshotsCount = selectedChapter?.snapshots?.length || 0;
  const targetWords = selectedChapter?.targetWordCount;
  const currentWordCount = selectedChapter?.wordCount || 0;
  const progressPercent = targetWords ? Math.min(100, Math.round((currentWordCount / targetWords) * 100)) : null;

  // 1. If unauthorized, render Private Author Sanctum Gate
  if (authRole === 'guest') {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center p-6 bg-[var(--bg)] text-[var(--text)]">
        <div className="max-w-md w-full border border-[var(--border)] p-8 sm:p-10 bg-[var(--paper-tint)]/40 shadow-xl space-y-6 text-center animate-fade-in">
          <div className="space-y-2">
            <span className="font-mono-meta text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase block">
              ※ Private Atelier Sanctum
            </span>
            <h1 className="font-editorial-title text-4xl text-[var(--text)]">
              Author Access Required
            </h1>
            <p className="font-editorial-body text-sm text-[var(--text-muted)] italic leading-relaxed">
              This digital writing studio is reserved exclusively for the author and editorial fellows.
            </p>
          </div>

          <form onSubmit={handleGateSubmit} className="space-y-3 pt-2 text-left">
            <label className="font-mono-meta text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">
              Enter Master Key or Writer Passkey:
            </label>
            <input
              type="password"
              value={gatePasscode}
              onChange={(e) => setGatePasscode(e.target.value)}
              placeholder="e.g. ATELIER-MASTER-2026"
              className="w-full bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2.5 font-mono text-sm text-[var(--text)] focus:border-[var(--text)] outline-none"
            />
            {gateError && (
              <p className="font-editorial-body text-xs text-red-700 italic">{gateError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-[var(--text)] text-[var(--bg)] font-mono-meta text-xs tracking-[0.16em] hover:opacity-90 transition-opacity cursor-pointer font-medium"
            >
              UNLOCK ATELIER →
            </button>
          </form>

          {/* Developer 1-Click Root Superuser Bypass */}
          <div className="pt-2 border-t border-[var(--border)] space-y-3">
            <button
              type="button"
              onClick={developerBypass}
              className="w-full py-2 border border-amber-800/70 text-amber-800 dark:border-amber-500/70 dark:text-amber-500 hover:bg-amber-800 hover:text-white dark:hover:bg-amber-500 dark:hover:text-black font-mono-meta text-[11px] tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>⚡</span>
              <span>DEVELOPER ROOT SUPERUSER BYPASS</span>
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 font-mono-meta text-[10px] text-[var(--text-muted)] pt-2">
              <Link to="/novel" className="hover:text-[var(--text)] underline underline-offset-4">
                ← Return to The Novel
              </Link>
              <Link to="/submissions" className="hover:text-[var(--text)] underline underline-offset-4">
                Apply for Authorship →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pendingApplicationsCount = writerApplications.filter((a) => a.status === 'pending').length;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* Hidden file input for DOCX import */}
      <input
        ref={manuscriptFileInputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFullDocxFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* 1. QUIET EDITORIAL STUDIO BAR */}
      {!isZenMode && (
        <div className="border-b border-[var(--border)] bg-[var(--paper-tint)]/30 px-4 sm:px-8 py-2 flex items-center justify-between gap-4 text-xs font-mono-meta flex-wrap">
          {/* Left: Outline Toggle & Status */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setShowOutline(!showOutline)}
              className={`px-2.5 py-1 border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showOutline
                  ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)] hover:text-[var(--text)]'
              }`}
              title="Toggle chapter outline sidebar"
            >
              <span>{showOutline ? '◀' : '▶'}</span>
              <span>CHAPTERS ({chapters.length})</span>
            </button>

            <span className="text-[var(--border)] hidden sm:inline">|</span>

            {/* Role Badges & Access Controls */}
            {authRole === 'developer' ? (
              <button
                type="button"
                onClick={() => setIsMasterKeysModalOpen(true)}
                className="px-2 py-0.5 border border-amber-800 text-amber-800 dark:border-amber-500 dark:text-amber-500 bg-amber-500/[0.08] hover:bg-amber-800 hover:text-white dark:hover:bg-amber-500 dark:hover:text-black transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                title="Developer Superuser Root Access & Access Key Governance"
              >
                <span>⚡</span>
                <span className="hidden sm:inline">DEVELOPER ROOT</span>
              </button>
            ) : authRole === 'master' ? (
              <button
                type="button"
                onClick={() => setIsMasterKeysModalOpen(true)}
                className="px-2 py-0.5 border border-[var(--text)] text-[var(--text)] bg-[var(--bg)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer flex items-center gap-1"
                title="Master Author Controls & Writer Pass Delegation"
              >
                <span>🗝</span>
                <span className="hidden sm:inline">MASTER AUTHOR</span>
              </button>
            ) : authRole === 'writer' ? (
              <span className="px-2 py-0.5 border border-[var(--border)] text-[var(--text-muted)]">
                ✒ WRITER ACCESS
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2 py-0.5 border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)] hover:text-[var(--text)] transition-colors cursor-pointer flex items-center gap-1"
                title="Sign in with Master Key or Developer Root"
              >
                <span>🗝</span>
                <span className="hidden sm:inline">AUTHOR ACCESS</span>
              </button>
            )}

            <span className="font-editorial-body text-sm italic text-[var(--text-muted)] truncate hidden md:inline">
              Chapter {romanNumber} — {selectedChapter?.title}
            </span>
          </div>

          {/* Right: Flagship Tools & Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Mobile Tools Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileToolsOpen(true)}
              className="lg:hidden px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text)] transition-colors cursor-pointer flex items-center gap-1 font-semibold"
              title="Open Atelier Toolbelt"
            >
              <span>TOOLS</span>
              <span>▾</span>
            </button>

            {/* Book View Toggle (Always visible) */}
            <button
              type="button"
              onClick={() => setIsBookPreviewMode(!isBookPreviewMode)}
              className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                isBookPreviewMode
                  ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-medium'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)] hover:text-[var(--text)]'
              }`}
              title="Toggle between writing desk and typeset book view"
            >
              {isBookPreviewMode ? 'EDITOR' : 'BOOK VIEW'}
            </button>

            {/* Desktop Tools (Hidden on mobile to keep bar clean) */}
            {/* Writer Submissions (Visible only to Master Author & Developer) */}
            {(authRole === 'master' || authRole === 'developer') && (
              <button
                type="button"
                onClick={() => setIsApplicationsDrawerOpen(true)}
                className="hidden lg:inline-flex px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer items-center gap-1.5"
                title="Review incoming writer applications and issue passes"
              >
                <span>SUBMISSIONS</span>
                {pendingApplicationsCount > 0 && (
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[var(--text)] text-[var(--bg)] font-bold">
                    {pendingApplicationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Writing Sprint Timer */}
            <button
              type="button"
              onClick={() => setIsSprintModalOpen(true)}
              className="hidden lg:inline-block px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Timed writing sprint and flow pacing"
            >
              SPRINT
            </button>

            {/* Literary Prose Stylometrics Inspector */}
            <button
              type="button"
              onClick={() => setIsInspectorModalOpen(true)}
              className="hidden lg:inline-block px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Inspect dialogue ratio, sentence cadence, and readability"
            >
              INSPECT
            </button>

            {/* Find & Replace Bar Toggle */}
            <button
              type="button"
              onClick={() => setIsFindReplaceOpen(!isFindReplaceOpen)}
              className={`hidden lg:inline-block px-2.5 py-1 border transition-colors cursor-pointer ${
                isFindReplaceOpen
                  ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-medium'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)] hover:text-[var(--text)]'
              }`}
              title="Search and replace within chapter"
            >
              FIND
            </button>

            {/* Revisions / Snapshots Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsSnapshotsDrawerOpen(true)}
              className="hidden sm:inline-block px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Version history and saved chapter snapshots"
            >
              SNAPSHOTS ({currentSnapshotsCount})
            </button>

            {/* Marginalia / Scratchpad Toggle */}
            <button
              type="button"
              onClick={() => setIsScratchpadDrawerOpen(true)}
              className="hidden sm:inline-block px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Character notes, plot reminders, research fragments"
            >
              SCRATCHPAD ({scratchpadNotes.length})
            </button>

            {/* Typewriter Mode Toggle */}
            <button
              type="button"
              onClick={() => setTypewriterMode(!typewriterMode)}
              className={`hidden xl:inline-block px-2.5 py-1 border transition-colors cursor-pointer ${
                typewriterMode
                  ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)]'
              }`}
              title="Center cursor like a mechanical typewriter"
            >
              TYPEWRITER
            </button>

            {/* Tactile Mechanical Typewriter Audio Toggle */}
            <button
              type="button"
              onClick={() => setTypewriterSound(!typewriterSound)}
              className={`hidden xl:inline-block px-2.5 py-1 border transition-colors cursor-pointer ${
                typewriterSound
                  ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-medium'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)]'
              }`}
              title="Tactile mechanical typewriter click sounds"
            >
              SOUND: {typewriterSound ? 'ON' : 'OFF'}
            </button>

            {/* Multi-Format Export Hub */}
            <button
              type="button"
              onClick={() => setIsExportHubOpen(true)}
              className="px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text)] transition-colors cursor-pointer"
              title="Export chapter or novel to Markdown, Text, EPUB, PDF"
            >
              {isExportingEpub ? 'EXPORTING...' : 'EXPORT'}
            </button>

            {/* Database & Cloud Sync Modal */}
            <button
              type="button"
              onClick={() => setIsDatabaseModalOpen(true)}
              className="hidden lg:inline-block px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Easily modifiable JSON/CSV backups and cloud sync"
            >
              DATABASE
            </button>

            {/* Import DOCX */}
            <button
              type="button"
              onClick={() => manuscriptFileInputRef.current?.click()}
              disabled={isParsingDocx}
              className="hidden sm:inline-block px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isParsingDocx ? 'PARSING...' : 'DOCX'}
            </button>

            {/* Zen Mode */}
            <button
              type="button"
              onClick={() => setIsZenMode(true)}
              className="hidden sm:inline-block px-2 py-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Distraction-free writing mode (Shortcut: F)"
            >
              ZEN (F)
            </button>

            {/* Reader Link */}
            <Link
              to="/novel"
              className="px-2.5 py-1 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity"
            >
              READ →
            </Link>
          </div>
        </div>
      )}

      {/* 1.1 FIND & REPLACE BAR (Rendered right beneath subbar when active) */}
      <FindReplaceBar
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        onReplaceAll={handleReplaceAll}
        currentContentText={selectedChapter?.paragraphs.map((p) => p.text).join(' ') || ''}
      />

      {/* ZEN MODE FLOATING EXIT BUTTON */}
      {isZenMode && (
        <div className="fixed top-4 right-6 z-50 flex items-center gap-3 bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 shadow-xs">
          <span className="font-mono-meta text-[10px] tracking-widest text-[var(--text-muted)]">
            ZEN MODE · PRESS ESC OR F TO RETURN
          </span>
          <button
            type="button"
            onClick={() => setIsZenMode(false)}
            className="font-mono-meta text-[10px] text-[var(--text)] px-2 py-0.5 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
          >
            EXIT [×]
          </button>
        </div>
      )}

      {/* 2. MAIN EDITORIAL WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================== */}
        {/* LEFT COLLAPSIBLE CHAPTER LIST                             */}
        {/* ========================================================== */}
        {showOutline && !isZenMode && (
          <>
            {/* Mobile Backdrop */}
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
              onClick={() => setShowOutline(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 md:static md:z-auto w-72 sm:w-80 md:w-72 border-r border-[var(--border)] bg-[var(--bg)] md:bg-[var(--paper-tint)]/20 flex flex-col shrink-0 h-full md:h-[calc(100vh-7.5rem)] shadow-2xl md:shadow-none">
              {/* Sidebar Header */}
              <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <span className="font-mono-meta text-[9.5px] tracking-[0.16em] text-[var(--text-muted)] uppercase block">
                    MANUSCRIPT
                  </span>
                  <span className="font-editorial-body text-xs italic text-[var(--text-faint)]">
                    {chapters.length} chapters · {getWorkWordCount(currentWork).toLocaleString()} words
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => addChapter()}
                    className="font-mono-meta text-[10px] px-2 py-1 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity cursor-pointer"
                    title="Add New Chapter"
                  >
                    + CHAPTER
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOutline(false)}
                    className="md:hidden font-mono-meta text-[11px] px-2 py-1 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] cursor-pointer"
                    aria-label="Close chapters drawer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Chapters List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {chapters.map((ch, idx) => {
                  const isSelected = ch.id === selectedChapter?.id;
                  const roman = toRomanNumeral(idx + 1);
                  const isBeingDragged = draggedIndex === idx;
                  const isDragOver = dragOverIndex === idx;

                  return (
                    <div
                      key={ch.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      onClick={() => {
                        setSelectedChapterId(ch.id);
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setShowOutline(false);
                        }
                      }}
                      className={`group px-2.5 py-2 transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                        isSelected
                          ? 'border-[var(--text)] bg-[var(--bg)] font-medium'
                          : 'border-transparent hover:border-[var(--border)] bg-transparent'
                      } ${isBeingDragged ? 'opacity-30' : ''} ${
                        isDragOver ? 'border-t-2 border-t-[var(--text)]' : ''
                      }`}
                    >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Drag Handle */}
                      <span
                        className="text-[var(--text-faint)] hover:text-[var(--text)] cursor-grab active:cursor-grabbing font-mono text-xs select-none"
                        title="Drag to reorder"
                      >
                        ⠿
                      </span>

                      <span className="font-mono-meta text-[9px] text-[var(--text-muted)] tracking-wider shrink-0">
                        {roman}.
                      </span>

                      {/* Chapter Title */}
                      {editingChapterTitleId === ch.id ? (
                        <input
                          type="text"
                          value={inlineChapterTitle}
                          autoFocus
                          onChange={(e) => setInlineChapterTitle(e.target.value)}
                          onBlur={() => {
                            if (inlineChapterTitle.trim()) {
                              updateChapter(ch.id, { title: inlineChapterTitle.trim() });
                            }
                            setEditingChapterTitleId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (inlineChapterTitle.trim()) {
                                updateChapter(ch.id, { title: inlineChapterTitle.trim() });
                              }
                              setEditingChapterTitleId(null);
                            } else if (e.key === 'Escape') {
                              setEditingChapterTitleId(null);
                            }
                          }}
                          className="font-editorial-body text-sm border-b border-[var(--text)] bg-transparent px-1 focus:outline-none w-full"
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingChapterTitleId(ch.id);
                            setInlineChapterTitle(ch.title);
                          }}
                          className="font-editorial-body text-sm truncate flex-1 leading-snug"
                          title="Double-click to rename"
                        >
                          {ch.title}
                        </span>
                      )}
                    </div>

                    {/* Word count & Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono-meta text-[8.5px] text-[var(--text-faint)] group-hover:hidden">
                        {ch.wordCount || 0}w
                      </span>

                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateChapter(ch.id);
                          }}
                          className="font-mono-meta text-[9px] text-[var(--text-muted)] hover:text-[var(--text)] px-1"
                          title="Duplicate"
                        >
                          DUP
                        </button>
                        {chapters.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${ch.title}"?`)) {
                                deleteChapter(ch.id);
                              }
                            }}
                            className="font-mono-meta text-[10px] text-[var(--text-faint)] hover:text-red-700 px-1"
                            title="Delete"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Bottom */}
            <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)] text-center">
              <button
                type="button"
                onClick={() => manuscriptFileInputRef.current?.click()}
                className="font-mono-meta text-[9.5px] tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] underline cursor-pointer"
              >
                + Import manuscript (.docx)
              </button>
            </div>
          </aside>
        </>
      )}

        {/* ========================================================== */}
        {/* CENTER WRITING DESK (OR TYPESET BOOK PREVIEW)             */}
        {/* ========================================================== */}
        <main
          className={`flex-1 flex flex-col h-[calc(100vh-7.5rem)] overflow-y-auto bg-[var(--bg)] ${
            typewriterMode ? 'pb-[45vh]' : ''
          }`}
        >
          {isBookPreviewMode ? (
            /* ==================================================== */
            /* PURE BOOK TYPESET VIEW (CALM, EDITORIAL, FULL-WIDTH) */
            /* ==================================================== */
            <div className="max-w-2xl w-full mx-auto px-3 xs:px-6 sm:px-12 py-8 sm:py-16">
              <div className="border border-[var(--border)] bg-[var(--bg)] p-4 xs:p-8 sm:p-14 shadow-xs">
                {/* Book View Header */}
                <div className="text-center pb-6 sm:pb-8 border-b border-[var(--border)]/70 mb-8 sm:mb-10 space-y-2">
                  <div className="font-mono-meta text-[10px] tracking-[0.24em] text-[var(--text-muted)] uppercase">
                    CHAPTER {romanNumber}
                  </div>
                  <h1 className="font-editorial-title text-3xl xs:text-4xl sm:text-5xl text-[var(--text)]">
                    {selectedChapter?.title}
                  </h1>
                  {selectedChapter?.subtitle && (
                    <p className="font-editorial-body text-base italic text-[var(--text-muted)]">
                      {selectedChapter.subtitle}
                    </p>
                  )}
                </div>

                {/* Epigraph */}
                {getEpigraphQuote(selectedChapter) && (
                  <div className="my-8 px-6 py-3 border-l-2 border-[var(--text)] italic font-editorial-body text-base text-[var(--text-muted)] max-w-lg mx-auto text-center">
                    <p>“{getEpigraphQuote(selectedChapter)}”</p>
                    {getEpigraphSource(selectedChapter) && (
                      <p className="font-mono-meta text-[9.5px] mt-2 text-[var(--text-faint)]">
                        — {getEpigraphSource(selectedChapter)}
                      </p>
                    )}
                  </div>
                )}

                {/* Prose Content */}
                <div className="space-y-4 font-editorial-body text-lg sm:text-[19px] leading-[1.8] text-[var(--text)] pt-4">
                  {selectedChapter?.paragraphs && selectedChapter.paragraphs.length > 0 ? (
                    selectedChapter.paragraphs.map((p, idx) => {
                      if (p.isAsterism) {
                        return (
                          <div key={idx} className="text-center text-sm tracking-widest my-8 opacity-70">
                            ※
                          </div>
                        );
                      }
                      const isFirst = idx === 0;
                      if (isFirst) {
                        const firstChar = p.text.charAt(0);
                        const rest = p.text.slice(1);
                        return (
                          <p key={idx}>
                            <span className="float-left text-5xl font-editorial-title leading-none pr-2 pt-1 text-[var(--text)]">
                              {firstChar}
                            </span>
                            {rest}
                          </p>
                        );
                      }
                      return (
                        <p key={idx} className="indent-6">
                          {p.text}
                        </p>
                      );
                    })
                  ) : (
                    <p className="italic text-[var(--text-faint)] text-center">No prose recorded yet.</p>
                  )}
                </div>

                {/* Book View Footer */}
                <div className="pt-12 mt-12 border-t border-[var(--border)]/70 flex items-center justify-between font-mono-meta text-[10px] text-[var(--text-muted)]">
                  <span>{selectedChapter?.wordCount || 0} WORDS</span>
                  <button
                    type="button"
                    onClick={() => setIsBookPreviewMode(false)}
                    className="underline text-[var(--text)] cursor-pointer"
                  >
                    ← RETURN TO EDITOR
                  </button>
                  <span>~{selectedChapter?.readingTimeMin || 1} MIN READ</span>
                </div>
              </div>
            </div>
          ) : (
            /* ==================================================== */
            /* WRITING DESK (SPACIOUS, TYPOGRAPHY-FIRST TIPTAP)     */
            /* ==================================================== */
            <div className="max-w-2xl sm:max-w-3xl w-full mx-auto px-3 xs:px-6 sm:px-12 py-6 sm:py-10 flex-1 flex flex-col">
              {/* Chapter Header Controls */}
              {selectedChapter && (
                <div className="mb-6 pb-6 border-b border-[var(--border)]/70 space-y-3">
                  <div className="flex items-center justify-between font-mono-meta text-[10px] text-[var(--text-muted)] flex-wrap gap-2">
                    <span className="tracking-[0.2em] uppercase">
                      CHAPTER {romanNumber}
                    </span>

                    {/* Word Target & Pacing meter */}
                    <div className="flex items-center gap-2">
                      {editingTarget ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={targetInput}
                            autoFocus
                            onChange={(e) => setTargetInput(e.target.value)}
                            placeholder="Target words..."
                            className="w-20 px-1 py-0.5 border border-[var(--border)] bg-transparent text-[10px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseInt(targetInput);
                              setChapterWordTarget(selectedChapter.id, isNaN(val) ? undefined : val);
                              setEditingTarget(false);
                            }}
                            className="px-1.5 py-0.5 bg-[var(--text)] text-[var(--bg)]"
                          >
                            SET
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTarget(false)}
                            className="px-1 text-[var(--text-faint)]"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetInput(targetWords ? String(targetWords) : '2000');
                            setEditingTarget(true);
                          }}
                          className="hover:underline cursor-pointer"
                          title="Click to set chapter word goal"
                        >
                          {targetWords ? (
                            <span>
                              {currentWordCount} / {targetWords} W ({progressPercent}%)
                            </span>
                          ) : (
                            <span className="text-[var(--text-faint)]">+ SET TARGET</span>
                          )}
                        </button>
                      )}

                      <span>·</span>
                      <span className="text-[var(--text-faint)]">
                        {currentWordCount} WORDS · {selectedChapter.readingTimeMin || 1} MIN READ
                      </span>
                    </div>
                  </div>

                  {/* Target Progress Bar */}
                  {targetWords && (
                    <div className="w-full bg-[var(--paper-tint)] h-[2px] overflow-hidden">
                      <div
                        className="bg-[var(--text)] h-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}

                  {/* Chapter Title Input */}
                  <input
                    type="text"
                    value={selectedChapter.title}
                    onChange={(e) => updateChapter(selectedChapter.id, { title: e.target.value })}
                    placeholder="Chapter Title..."
                    className="w-full font-editorial-title text-3xl xs:text-4xl sm:text-5xl text-[var(--text)] bg-transparent border-none focus:outline-none placeholder-[var(--text-faint)] font-normal leading-tight"
                  />

                  {/* Subtitle Input */}
                  <input
                    type="text"
                    value={selectedChapter.subtitle || ''}
                    onChange={(e) => updateChapter(selectedChapter.id, { subtitle: e.target.value })}
                    placeholder="Optional subtitle or setting..."
                    className="w-full font-editorial-body text-base italic text-[var(--text-muted)] bg-transparent border-none focus:outline-none placeholder-[var(--text-faint)]"
                  />

                  {/* Epigraph toggle */}
                  <details className="pt-1">
                    <summary className="font-mono-meta text-[9px] tracking-wider text-[var(--text-faint)] hover:text-[var(--text)] cursor-pointer select-none">
                      {getEpigraphQuote(selectedChapter) ? 'EDIT CHAPTER EPIGRAPH ▼' : '+ ADD EPIGRAPH ▼'}
                    </summary>
                    <div className="mt-2 p-3 border border-[var(--border)] bg-[var(--paper-tint)]/30 space-y-2">
                      <textarea
                        value={getEpigraphQuote(selectedChapter)}
                        onChange={(e) => {
                          const val = e.target.value;
                          const currentSrc = getEpigraphSource(selectedChapter);
                          updateChapter(selectedChapter.id, {
                            epigraph: { quote: val, source: currentSrc }
                          });
                        }}
                        placeholder="Chapter epigraph quote..."
                        rows={2}
                        className="w-full font-editorial-body text-sm italic bg-transparent border-none focus:outline-none text-[var(--text)] resize-none"
                      />
                      <input
                        type="text"
                        value={getEpigraphSource(selectedChapter)}
                        onChange={(e) => {
                          const srcVal = e.target.value;
                          const currentQuote = getEpigraphQuote(selectedChapter);
                          updateChapter(selectedChapter.id, {
                            epigraph: { quote: currentQuote, source: srcVal },
                            epigraphAttribution: srcVal
                          });
                        }}
                        placeholder="— Attribution"
                        className="w-full font-mono-meta text-[9.5px] bg-transparent border-none focus:outline-none text-[var(--text-muted)]"
                      />
                    </div>
                  </details>
                </div>
              )}

              {/* TipTap Rich Text Editor */}
              {selectedChapter && (
                <div className="flex-1 flex flex-col">
                  <TipTapEditor
                    key={selectedChapter.id}
                    initialContent={getChapterInitialHtml(selectedChapter)}
                    onUpdate={handleEditorUpdate}
                    placeholder="Write your prose here. Paragraph breaks and section dividers (※) flow naturally..."
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* DRAWERS & MODALS */}
      {/* MOBILE TOOLS SHEET (Responsive companion for writer on mobile phones) */}
      {isMobileToolsOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Atelier Tools"
        >
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setIsMobileToolsOpen(false)}
          />
          <div className="bg-[var(--bg)] border-t border-[var(--border)] p-5 sm:p-6 shadow-2xl max-h-[82vh] overflow-y-auto space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <span className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase block">
                  ATELIER WRITER SUITE
                </span>
                <span className="font-editorial-title text-xl text-[var(--text)]">
                  Studio Toolbelt
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileToolsOpen(false)}
                className="font-mono-meta text-xs tracking-wider px-3 py-1.5 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] cursor-pointer"
              >
                CLOSE [×]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono-meta text-[11px] tracking-wider">
              <button
                type="button"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsSprintModalOpen(true);
                }}
                className="p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-[var(--text)] font-semibold">SPRINT</span>
                <span className="text-[9px] text-[var(--text-muted)] normal-case font-normal">Paced writing timer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsInspectorModalOpen(true);
                }}
                className="p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-[var(--text)] font-semibold">INSPECT</span>
                <span className="text-[9px] text-[var(--text-muted)] normal-case font-normal">Stylometrics & rhythm</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsFindReplaceOpen(true);
                }}
                className="p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-[var(--text)] font-semibold">FIND & REPLACE</span>
                <span className="text-[9px] text-[var(--text-muted)] normal-case font-normal">Search chapter text</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsSnapshotsDrawerOpen(true);
                }}
                className="p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-[var(--text)] font-semibold">SNAPSHOTS ({currentSnapshotsCount})</span>
                <span className="text-[9px] text-[var(--text-muted)] normal-case font-normal">Version backups</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsScratchpadDrawerOpen(true);
                }}
                className="p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-[var(--text)] font-semibold">SCRATCHPAD</span>
                <span className="text-[9px] text-[var(--text-muted)] normal-case font-normal">{scratchpadNotes.length} notes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsExportHubOpen(true);
                }}
                className="p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-[var(--text)] font-semibold">EXPORT HUB</span>
                <span className="text-[9px] text-[var(--text-muted)] normal-case font-normal">EPUB, PDF, Text</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsDatabaseModalOpen(true);
                }}
                className="p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-[var(--text)] font-semibold">DATABASE</span>
                <span className="text-[9px] text-[var(--text-muted)] normal-case font-normal">JSON / CSV sync</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  manuscriptFileInputRef.current?.click();
                }}
                className="p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-[var(--text)] font-semibold">DOCX IMPORT</span>
                <span className="text-[9px] text-[var(--text-muted)] normal-case font-normal">Word manuscript</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTypewriterSound(!typewriterSound);
                }}
                className="p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-[var(--text)] font-semibold">TYPEWRITER AUDIO</span>
                <span className="text-[9px] text-[var(--text-muted)] normal-case font-normal">{typewriterSound ? 'Status: ON' : 'Status: OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsZenMode(true);
                }}
                className="p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex flex-col gap-1 cursor-pointer"
              >
                <span className="text-[var(--text)] font-semibold">ZEN MODE</span>
                <span className="text-[9px] text-[var(--text-muted)] normal-case font-normal">Distraction-free</span>
              </button>

              {(authRole === 'master' || authRole === 'developer') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    setIsApplicationsDrawerOpen(true);
                  }}
                  className="col-span-2 p-3 border border-[var(--text)] text-left hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold">REVIEW WRITER SUBMISSIONS</span>
                  {pendingApplicationsCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-black font-bold">
                      {pendingApplicationsCount} PENDING
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMobileToolsOpen(false);
                  setIsMasterKeysModalOpen(true);
                }}
                className="col-span-2 p-3 border border-[var(--border)] text-left hover:border-[var(--text)] transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="font-semibold">AUTHOR KEYS & PASSES</span>
                <span className="text-[9px] text-[var(--text-muted)]">GOVERNANCE →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <StudioAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <MasterKeysModal
        isOpen={isMasterKeysModalOpen}
        onClose={() => setIsMasterKeysModalOpen(false)}
      />

      <ChapterSnapshotsDrawer
        isOpen={isSnapshotsDrawerOpen}
        onClose={() => setIsSnapshotsDrawerOpen(false)}
        chapterId={selectedChapter.id}
        chapterTitle={selectedChapter.title}
      />

      <ScratchpadDrawer
        isOpen={isScratchpadDrawerOpen}
        onClose={() => setIsScratchpadDrawerOpen(false)}
      />

      <DatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
      />

      <WriterApplicationsDrawer
        isOpen={isApplicationsDrawerOpen}
        onClose={() => setIsApplicationsDrawerOpen(false)}
      />

      <WritingSprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        currentWordCount={selectedChapter?.wordCount || 0}
      />

      {selectedChapter && (
        <LiteraryInspectorModal
          isOpen={isInspectorModalOpen}
          onClose={() => setIsInspectorModalOpen(false)}
          chapter={selectedChapter}
        />
      )}

      {selectedChapter && (
        <ChapterExportModal
          isOpen={isExportHubOpen}
          onClose={() => setIsExportHubOpen(false)}
          chapter={selectedChapter}
          work={currentWork}
          onTriggerEpub={handleExportEpub}
          onTriggerPrint={() => window.print()}
        />
      )}

      {pendingParsedDocx && (
        <ImportReviewModal
          isOpen={isImportModalOpen}
          detectedTitle={pendingParsedDocx.detectedNovelTitle || currentWork.title}
          detectedAuthor={pendingParsedDocx.detectedAuthor || currentWork.author}
          chapters={pendingParsedDocx.chapters}
          rawTextPreview={pendingParsedDocx.rawTextPreview}
          onConfirm={(finalTitle, finalAuthor, finalChapters) =>
            handleConfirmImport(finalChapters, finalTitle, finalAuthor)
          }
          onCancel={() => {
            setIsImportModalOpen(false);
            setPendingParsedDocx(null);
          }}
        />
      )}
    </div>
  );
};
