import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useNovel } from '../context/NovelContext';
import { TipTapEditor } from '../components/TipTapEditor';
import { CreateWorkModal } from '../components/CreateWorkModal';
import { ImportReviewModal } from '../components/ImportReviewModal';
import { parseDocxFile, type ParseDocxResult, toRomanNumeral } from '../utils/docxParser';
import { generateEpubBlob, downloadBlob } from '../utils/epubGenerator';
import type { Chapter, ChapterParagraph, TypesetStyle, Work } from '../types/novel';

type DeviceViewport = 'desktop' | 'tablet' | 'mobile' | 'kindle';

export const WriterStudioPage: React.FC = () => {
  const { workId: paramWorkId } = useParams<{ workId?: string }>();
  const {
    works,
    activeWorkId,
    setActiveWorkId,
    currentWork,
    togglePublishWork,
    chapters,
    addChapter,
    updateChapter,
    deleteChapter,
    duplicateChapter,
    reorderChapters,
    addSceneToChapter,
    deleteScene,
    importDocxChapters
  } = useNovel();

  // If workId is provided in URL, switch to it
  useEffect(() => {
    if (paramWorkId && paramWorkId !== activeWorkId) {
      const found = works.find((w) => w.id === paramWorkId);
      if (found) {
        setActiveWorkId(paramWorkId);
      }
    }
  }, [paramWorkId, activeWorkId, works, setActiveWorkId]);

  // Selected Chapter State
  const [selectedChapterId, setSelectedChapterId] = useState<number>(() => {
    return chapters[0]?.id || 1;
  });

  // Keep selected chapter valid if chapters change
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

  // Panel visibility
  const [showLeftOutline, setShowLeftOutline] = useState(true);
  const [showRightPreview, setShowRightPreview] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);

  // Preview options
  const [previewDevice, setPreviewDevice] = useState<DeviceViewport>('kindle');
  const [previewStyle, setPreviewStyle] = useState<TypesetStyle>('classic');

  // Drag-and-drop chapter states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modals & Upload
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingParsedDocx, setPendingParsedDocx] = useState<ParseDocxResult | null>(null);
  const [isParsingDocx, setIsParsingDocx] = useState(false);
  const [isExportingEpub, setIsExportingEpub] = useState(false);

  // Inline rename chapter state
  const [editingChapterTitleId, setEditingChapterTitleId] = useState<number | null>(null);
  const [inlineChapterTitle, setInlineChapterTitle] = useState('');

  // Refs
  const manuscriptFileInputRef = useRef<HTMLInputElement>(null);
  const singleChapterFileInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcuts (Zen Mode toggle via F, Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setIsZenMode((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode]);

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

  // Handle Single Chapter DOCX Replacement
  const handleSingleChapterDocx = async (file: File) => {
    if (!selectedChapter) return;
    try {
      setIsParsingDocx(true);
      const parsed = await parseDocxFile(file);
      if (parsed.chapters.length > 0) {
        const first = parsed.chapters[0];
        updateChapter(selectedChapter.id, {
          title: first.title !== 'Chapter I' ? first.title : selectedChapter.title,
          epigraph: first.epigraph || selectedChapter.epigraph,
          paragraphs: first.paragraphs,
          contentHtml: first.contentHtml
        });
        alert(`Successfully imported content into ${selectedChapter.title}.`);
      }
    } catch (e) {
      console.error(e);
      alert('Could not parse chapter DOCX.');
    } finally {
      setIsParsingDocx(false);
    }
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

  // Export Markdown
  const handleExportMarkdown = () => {
    let md = `# ${currentWork.title}\n`;
    if (currentWork.subtitle) md += `*${currentWork.subtitle}*\n\n`;
    md += `**Author:** ${currentWork.author}\n\n`;
    const syn = currentWork.synopsis || currentWork.description;
    if (syn) md += `> ${syn}\n\n`;
    md += `---\n\n`;

    chapters.forEach((ch, idx) => {
      md += `## Chapter ${toRomanNumeral(idx + 1)}: ${ch.title}\n\n`;
      const q = getEpigraphQuote(ch);
      const s = getEpigraphSource(ch);
      if (q) {
        md += `> "${q}"\n`;
        if (s) md += `> — *${s}*\n`;
        md += `\n`;
      }
      ch.paragraphs.forEach((p) => {
        md += `${p.text}\n\n`;
      });
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${currentWork.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`);
  };

  // Export Plain Text
  const handleExportPlainText = () => {
    let txt = `${currentWork.title}\nBy ${currentWork.author}\n\n====================\n\n`;
    chapters.forEach((ch, idx) => {
      txt += `CHAPTER ${toRomanNumeral(idx + 1)}: ${ch.title.toUpperCase()}\n\n`;
      const q = getEpigraphQuote(ch);
      const s = getEpigraphSource(ch);
      if (q) {
        txt += `"${q}"\n— ${s}\n\n`;
      }
      ch.paragraphs.forEach((p) => {
        txt += `${p.text}\n\n`;
      });
      txt += `\n* * *\n\n`;
    });
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${currentWork.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`);
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

    // Convert HTML back into paragraphs for backward compatibility & reading mode
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

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* Hidden inputs */}
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
      <input
        ref={singleChapterFileInputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSingleChapterDocx(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* 1. TOP STUDIO NAVIGATION & TOOLBAR (Hidden in Zen Mode) */}
      {!isZenMode && (
        <header className="border-b border-[var(--border)] bg-[var(--paper-tint)]/40 px-4 py-2.5 flex items-center justify-between gap-4 sticky top-14 md:top-16 z-30">
          {/* Left: Work Selector & Status */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard"
              className="font-mono-meta text-[10px] tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1.5 shrink-0"
              title="Return to Writer Dashboard"
            >
              <span>←</span>
              <span className="hidden sm:inline">DASHBOARD</span>
            </Link>

            <span className="text-[var(--border)]">/</span>

            {/* Work Title Selector Dropdown */}
            <div className="relative flex items-center gap-2 min-w-0">
              <select
                value={activeWorkId}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsCreateModalOpen(true);
                  } else {
                    setActiveWorkId(e.target.value);
                  }
                }}
                className="font-editorial-title text-base sm:text-lg font-medium text-[var(--text)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:outline-none cursor-pointer truncate max-w-[180px] sm:max-w-[280px]"
              >
                {works.map((w) => (
                  <option key={w.id} value={w.id} className="bg-[var(--bg)] text-[var(--text)] font-sans text-xs">
                    {w.title} ({w.type})
                  </option>
                ))}
                <option value="__NEW__" className="bg-[var(--bg)] text-[var(--text)] font-sans text-xs font-semibold">
                  + Create New Work...
                </option>
              </select>

              {/* Status pill */}
              <button
                type="button"
                onClick={() => togglePublishWork(currentWork.id)}
                className={`font-mono-meta text-[9px] px-2 py-0.5 border transition-colors shrink-0 cursor-pointer ${
                  currentWork.status === 'published'
                    ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-medium'
                    : 'border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                title="Click to toggle Draft / Published"
              >
                {currentWork.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
              </button>
            </div>
          </div>

          {/* Center: Quick Panel Toggles */}
          <div className="hidden lg:flex items-center gap-1 border border-[var(--border)] p-0.5 bg-[var(--bg)]">
            <button
              type="button"
              onClick={() => setShowLeftOutline(!showLeftOutline)}
              className={`font-mono-meta text-[9.5px] px-2.5 py-1 transition-colors cursor-pointer ${
                showLeftOutline
                  ? 'bg-[var(--text)] text-[var(--bg)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
              title="Toggle Scrivener Outline Panel"
            >
              OUTLINE
            </button>
            <button
              type="button"
              onClick={() => setShowRightPreview(!showRightPreview)}
              className={`font-mono-meta text-[9.5px] px-2.5 py-1 transition-colors cursor-pointer ${
                showRightPreview
                  ? 'bg-[var(--text)] text-[var(--bg)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
              title="Toggle Real-time Book Preview Panel"
            >
              PREVIEW
            </button>
            <button
              type="button"
              onClick={() => setIsZenMode(true)}
              className="font-mono-meta text-[9.5px] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--highlight)] transition-colors cursor-pointer"
              title="Zen Mode (Shortcut: F)"
            >
              ZEN (F)
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* DOCX Import Button */}
            <button
              type="button"
              onClick={() => manuscriptFileInputRef.current?.click()}
              disabled={isParsingDocx}
              className="font-mono-meta text-[10px] tracking-[0.12em] px-2.5 py-1.5 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text)] transition-colors cursor-pointer disabled:opacity-50"
              title="Import Microsoft Word .docx Manuscript"
            >
              {isParsingDocx ? 'PARSING...' : 'IMPORT DOCX'}
            </button>

            {/* Export EPUB Button */}
            <button
              type="button"
              onClick={handleExportEpub}
              disabled={isExportingEpub}
              className="hidden sm:inline-block font-mono-meta text-[10px] tracking-[0.12em] px-3 py-1.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isExportingEpub ? 'PACKAGING...' : 'EPUB 3 ↓'}
            </button>

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden md:inline-block font-mono-meta text-[10px] tracking-[0.12em] px-2.5 py-1.5 border border-[var(--border)] hover:border-[var(--text)] transition-colors cursor-pointer"
              title="Typeset Print PDF"
            >
              PRINT ⎙
            </button>

            {/* Reader Preview Link */}
            <Link
              to="/novel"
              className="font-mono-meta text-[10px] tracking-[0.12em] px-2.5 py-1.5 border border-[var(--border)] hover:border-[var(--text)] transition-colors"
              title="Open Reader Experience"
            >
              READ →
            </Link>
          </div>
        </header>
      )}

      {/* ZEN MODE FLOATING CONTROLS */}
      {isZenMode && (
        <div className="fixed top-4 right-6 z-50 flex items-center gap-3 bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 shadow-md">
          <span className="font-mono-meta text-[10px] tracking-widest text-[var(--text-muted)]">
            ZEN MODE · PRESS ESC OR F TO EXIT
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

      {/* 2. MAIN THREE-PANEL WRITING WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================== */}
        {/* PANEL 1: LEFT CHAPTER MANAGEMENT (SCRIVENER OUTLINE TREE)  */}
        {/* ========================================================== */}
        {showLeftOutline && !isZenMode && (
          <aside className="w-72 sm:w-80 border-r border-[var(--border)] bg-[var(--paper-tint)]/25 flex flex-col shrink-0 h-[calc(100vh-6.5rem)] overflow-y-auto">
            {/* Outline Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="font-mono-meta text-[9.5px] tracking-[0.18em] text-[var(--text-muted)] block uppercase">
                  MANUSCRIPT TREE
                </span>
                <span className="font-editorial-body text-xs italic text-[var(--text-faint)]">
                  {chapters.length} chapters · {getWorkWordCount(currentWork).toLocaleString()} words
                </span>
              </div>
              <button
                type="button"
                onClick={() => addChapter()}
                className="font-mono-meta text-[10px] tracking-[0.14em] px-2.5 py-1 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity cursor-pointer"
                title="Add New Chapter"
              >
                + CHAPTER
              </button>
            </div>

            {/* Chapters & Scenes Drag-and-Drop List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
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
                    className={`group rounded-none border transition-all duration-150 ${
                      isSelected
                        ? 'border-[var(--text)] bg-[var(--bg)] shadow-xs'
                        : 'border-transparent hover:border-[var(--border)] bg-transparent'
                    } ${isBeingDragged ? 'opacity-40' : ''} ${
                      isDragOver ? 'border-t-2 border-t-[var(--text)]' : ''
                    }`}
                  >
                    {/* Chapter Row */}
                    <div
                      onClick={() => setSelectedChapterId(ch.id)}
                      className="p-2.5 flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        {/* Drag Handle */}
                        <span
                          className="text-[var(--text-faint)] hover:text-[var(--text)] cursor-grab active:cursor-grabbing font-mono text-xs select-none pt-0.5"
                          title="Drag to reorder"
                        >
                          ⠿
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono-meta text-[9px] tracking-widest text-[var(--text-muted)] font-semibold shrink-0">
                              {roman}
                            </span>
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
                                className="font-editorial-title text-sm border-b border-[var(--text)] bg-transparent px-1 focus:outline-none w-full"
                              />
                            ) : (
                              <span
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingChapterTitleId(ch.id);
                                  setInlineChapterTitle(ch.title);
                                }}
                                className={`font-editorial-title text-sm truncate block leading-snug ${
                                  isSelected ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)]'
                                }`}
                                title="Double click to rename"
                              >
                                {ch.title}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 font-mono-meta text-[8.5px] text-[var(--text-faint)] mt-1">
                            <span>{ch.wordCount || 0} w</span>
                            <span>·</span>
                            <span>{ch.readingTimeMin || 1}m read</span>
                            {ch.scenes && ch.scenes.length > 0 && (
                              <>
                                <span>·</span>
                                <span>{ch.scenes.length} scenes</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row actions */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addSceneToChapter(ch.id);
                          }}
                          className="font-mono-meta text-[9px] text-[var(--text-muted)] hover:text-[var(--text)] px-1"
                          title="Add Scene"
                        >
                          +SCENE
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateChapter(ch.id);
                          }}
                          className="font-mono-meta text-[9px] text-[var(--text-muted)] hover:text-[var(--text)] px-1"
                          title="Duplicate chapter"
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
                            className="font-mono-meta text-[9px] text-[var(--text-faint)] hover:text-red-700 px-1"
                            title="Delete chapter"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Nested Scenes (Scrivener Style) */}
                    {ch.scenes && ch.scenes.length > 0 && (
                      <div className="ml-7 pr-2 pb-2 space-y-1 border-l border-[var(--border)]/60 pl-2">
                        {ch.scenes.map((sc, sIdx) => (
                          <div
                            key={sc.id}
                            className="group/sc flex items-center justify-between text-xs py-1 px-1.5 hover:bg-[var(--highlight)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                          >
                            <span className="font-editorial-body text-xs truncate">
                              § {sIdx + 1}. {sc.title}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteScene(ch.id, sc.id);
                              }}
                              className="opacity-0 group-hover/sc:opacity-100 text-[10px] text-[var(--text-faint)] hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar Bottom Drawer: Chapter Replacement & Shortcuts */}
            <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)] space-y-2">
              <button
                type="button"
                onClick={() => singleChapterFileInputRef.current?.click()}
                className="w-full font-mono-meta text-[9.5px] tracking-wider py-1.5 px-2 border border-dashed border-[var(--border)] hover:border-[var(--text)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-center block cursor-pointer"
              >
                REPLACE THIS CHAPTER VIA DOCX ↑
              </button>
              <div className="font-mono-meta text-[8.5px] text-[var(--text-faint)] text-center">
                Drag handles (⠿) to reorder · Double-click to rename
              </div>
            </div>
          </aside>
        )}

        {/* ========================================================== */}
        {/* PANEL 2: CENTER RICH WRITING EDITOR                        */}
        {/* ========================================================== */}
        <main className="flex-1 flex flex-col h-[calc(100vh-6.5rem)] overflow-y-auto bg-[var(--bg)] transition-all">
          <div className="max-w-3xl w-full mx-auto px-6 sm:px-12 py-10 flex-1 flex flex-col">
            {/* Chapter Header Controls */}
            {selectedChapter && (
              <div className="mb-8 pb-6 border-b border-[var(--border)]/70 space-y-4">
                {/* Chapter Number Badge */}
                <div className="flex items-center justify-between">
                  <div className="font-mono-meta text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                    CHAPTER {toRomanNumeral(chapters.findIndex((c) => c.id === selectedChapter.id) + 1)}
                  </div>
                  <div className="flex items-center gap-3 font-mono-meta text-[10px] text-[var(--text-faint)]">
                    <span>{selectedChapter.wordCount || 0} WORDS</span>
                    <span>·</span>
                    <span>{selectedChapter.readingTimeMin || 1} MIN READ</span>
                  </div>
                </div>

                {/* Chapter Title Input */}
                <input
                  type="text"
                  value={selectedChapter.title}
                  onChange={(e) => updateChapter(selectedChapter.id, { title: e.target.value })}
                  placeholder="Chapter Title..."
                  className="w-full font-editorial-title text-3xl sm:text-4xl text-[var(--text)] bg-transparent border-none focus:outline-none placeholder-[var(--text-faint)] font-normal"
                />

                {/* Chapter Subtitle Input */}
                <input
                  type="text"
                  value={selectedChapter.subtitle || ''}
                  onChange={(e) => updateChapter(selectedChapter.id, { subtitle: e.target.value })}
                  placeholder="Optional chapter subtitle or setting..."
                  className="w-full font-editorial-body text-base italic text-[var(--text-muted)] bg-transparent border-none focus:outline-none placeholder-[var(--text-faint)]"
                />

                {/* Epigraph Accordion/Toggle */}
                <div className="pt-2">
                  <details className="group">
                    <summary className="font-mono-meta text-[9.5px] tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer select-none">
                      {selectedChapter.epigraph ? 'EDIT CHAPTER EPIGRAPH ▼' : '+ ADD CHAPTER EPIGRAPH ▼'}
                    </summary>
                    <div className="mt-3 p-3 bg-[var(--paper-tint)]/40 border border-[var(--border)] space-y-2">
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
                        placeholder="— Attribution / Source"
                        className="w-full font-mono-meta text-[10px] bg-transparent border-none focus:outline-none text-[var(--text-muted)]"
                      />
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* TipTap Rich Text Prose Editor */}
            {selectedChapter && (
              <div className="flex-1 flex flex-col">
                <TipTapEditor
                  key={selectedChapter.id}
                  initialContent={getChapterInitialHtml(selectedChapter)}
                  onUpdate={handleEditorUpdate}
                  placeholder="Type your literary prose here. Double line breaks create paragraphs. Use '※' for section dividers..."
                />
              </div>
            )}
          </div>
        </main>

        {/* ========================================================== */}
        {/* PANEL 3: RIGHT REAL-TIME BOOK PREVIEW (KINDLE / BOOK VIEW) */}
        {/* ========================================================== */}
        {showRightPreview && !isZenMode && (
          <aside className="w-80 sm:w-96 lg:w-[420px] border-l border-[var(--border)] bg-[var(--paper-tint)]/30 flex flex-col shrink-0 h-[calc(100vh-6.5rem)] overflow-hidden">
            {/* Preview Toolbar */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-2">
              <span className="font-mono-meta text-[9.5px] tracking-[0.16em] text-[var(--text-muted)] uppercase">
                LIVE BOOK PREVIEW
              </span>

              {/* Device Viewport Switcher */}
              <div className="flex items-center border border-[var(--border)] p-0.5" role="group">
                {[
                  { id: 'kindle', label: 'KINDLE' },
                  { id: 'desktop', label: 'BOOK' },
                  { id: 'mobile', label: 'PHONE' }
                ].map((dev) => (
                  <button
                    key={dev.id}
                    type="button"
                    onClick={() => setPreviewDevice(dev.id as DeviceViewport)}
                    className={`font-mono-meta text-[8.5px] px-2 py-0.5 tracking-wider transition-colors cursor-pointer ${
                      previewDevice === dev.id
                        ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {dev.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Typesetting Style Switcher */}
            <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--paper-tint)]/20 flex items-center justify-between text-xs">
              <span className="font-mono-meta text-[9px] text-[var(--text-faint)]">TYPESETTING:</span>
              <div className="flex items-center gap-1">
                {(['classic', 'minimal', 'academic', 'magazine'] as TypesetStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPreviewStyle(st)}
                    className={`font-mono-meta text-[8.5px] px-2 py-0.5 uppercase tracking-wider border transition-colors cursor-pointer ${
                      previewStyle === st
                        ? 'border-[var(--text)] text-[var(--text)] font-semibold bg-[var(--bg)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Device Frame & Rendered Content */}
            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-[var(--paper-tint)]/15">
              {/* Device Container */}
              <div
                className={`transition-all duration-200 bg-[var(--bg)] border shadow-sm w-full overflow-y-auto max-h-full ${
                  previewDevice === 'kindle'
                    ? 'border-neutral-800 rounded-sm p-6 ring-4 ring-neutral-200'
                    : previewDevice === 'mobile'
                    ? 'max-w-[300px] border-neutral-700 rounded-xl p-5 shadow-md'
                    : 'border-[var(--border)] p-6'
                }`}
              >
                {/* Kindle Header bar */}
                {previewDevice === 'kindle' && (
                  <div className="flex items-center justify-between border-b border-neutral-300 pb-2 mb-4 font-mono text-[8px] text-neutral-500 tracking-wider">
                    <span>{currentWork.title.toUpperCase()}</span>
                    <span>CH. {toRomanNumeral(chapters.findIndex((c) => c.id === selectedChapter?.id) + 1)}</span>
                    <span>100%</span>
                  </div>
                )}

                {/* Live Typeset Content Rendering */}
                {selectedChapter && (
                  <article
                    className={`preview-typeset-${previewStyle} transition-all duration-150 text-[var(--text)]`}
                  >
                    {/* Chapter Header */}
                    <div className="text-center mb-6 space-y-1">
                      <div className="font-mono-meta text-[9px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                        CHAPTER {toRomanNumeral(chapters.findIndex((c) => c.id === selectedChapter.id) + 1)}
                      </div>
                      <h2 className="font-editorial-title text-2xl tracking-tight text-[var(--text)]">
                        {selectedChapter.title}
                      </h2>
                      {selectedChapter.subtitle && (
                        <p className="font-editorial-body text-xs italic text-[var(--text-muted)]">
                          {selectedChapter.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Epigraph */}
                    {getEpigraphQuote(selectedChapter) && (
                      <div className="my-5 px-4 py-2 border-l-2 border-[var(--border)] italic font-editorial-body text-xs text-[var(--text-muted)] text-center">
                        <p>“{getEpigraphQuote(selectedChapter)}”</p>
                        {getEpigraphSource(selectedChapter) && (
                          <p className="font-mono-meta text-[8.5px] mt-1 text-[var(--text-faint)]">
                            — {getEpigraphSource(selectedChapter)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Prose paragraphs */}
                    <div className="space-y-3 font-editorial-body text-xs sm:text-[13px] leading-relaxed text-[var(--text)]">
                      {selectedChapter.paragraphs && selectedChapter.paragraphs.length > 0 ? (
                        selectedChapter.paragraphs.slice(0, 8).map((p, pIdx) => {
                          if (p.isAsterism) {
                            return (
                              <div key={p.id || pIdx} className="text-center text-xs tracking-widest my-3 opacity-60">
                                ※
                              </div>
                            );
                          }
                          // Apply Drop Cap to first paragraph in Classic & Magazine styles
                          const isFirst = pIdx === 0;
                          if (isFirst && (previewStyle === 'classic' || previewStyle === 'magazine')) {
                            const firstChar = p.text.charAt(0);
                            const restText = p.text.slice(1);
                            return (
                              <p key={p.id || pIdx} className="relative">
                                <span className="float-left text-3xl font-editorial-title leading-none pr-1.5 pt-0.5 text-[var(--text)]">
                                  {firstChar}
                                </span>
                                {restText}
                              </p>
                            );
                          }
                          return (
                            <p
                              key={p.id || pIdx}
                              className={previewStyle === 'classic' ? 'indent-4 mt-0' : ''}
                            >
                              {p.text}
                            </p>
                          );
                        })
                      ) : (
                        <p className="italic text-[var(--text-faint)] text-center">Chapter text is empty...</p>
                      )}

                      {selectedChapter.paragraphs && selectedChapter.paragraphs.length > 8 && (
                        <div className="text-center py-2 text-[var(--text-faint)] font-mono-meta text-[8.5px]">
                          + {selectedChapter.paragraphs.length - 8} more paragraphs...
                        </div>
                      )}
                    </div>

                    {/* Kindle Footer */}
                    {previewDevice === 'kindle' && (
                      <div className="flex items-center justify-between border-t border-neutral-300 pt-2 mt-6 font-mono text-[8px] text-neutral-400">
                        <span>Page 1 of {Math.ceil((selectedChapter.wordCount || 100) / 250)}</span>
                        <span>{selectedChapter.readingTimeMin || 1}m left</span>
                      </div>
                    )}
                  </article>
                )}
              </div>
            </div>

            {/* Bottom Export Bar */}
            <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleExportEpub}
                className="font-mono-meta text-[9px] px-2.5 py-1.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity cursor-pointer"
              >
                EPUB 3 ↓
              </button>
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="font-mono-meta text-[9px] px-2.5 py-1.5 border border-[var(--border)] hover:border-[var(--text)] transition-colors cursor-pointer"
              >
                MARKDOWN ↓
              </button>
              <button
                type="button"
                onClick={handleExportPlainText}
                className="font-mono-meta text-[9px] px-2.5 py-1.5 border border-[var(--border)] hover:border-[var(--text)] transition-colors cursor-pointer"
              >
                TXT ↓
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="font-mono-meta text-[9px] px-2.5 py-1.5 border border-[var(--border)] hover:border-[var(--text)] transition-colors cursor-pointer"
              >
                PDF ⎙
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* MODALS */}
      <CreateWorkModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(workId) => {
          setActiveWorkId(workId);
          setIsCreateModalOpen(false);
        }}
      />

      {pendingParsedDocx && (
        <ImportReviewModal
          isOpen={isImportModalOpen}
          detectedTitle={pendingParsedDocx.detectedNovelTitle || 'Imported Manuscript'}
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
