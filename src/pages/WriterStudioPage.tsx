import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNovel } from '../context/NovelContext';
import { parseDocxFile } from '../utils/docxParser';
import { generateEpubBlob, downloadBlob } from '../utils/epubGenerator';

export const WriterStudioPage: React.FC = () => {
  const {
    novelMeta,
    updateNovelField,
    chapters,
    reorderChapters,
    addChapter,
    updateChapter,
    deleteChapter,
    importDocxChapters,
    resetToDefaultNovel,
    isCustomized
  } = useNovel();

  const [activeTab, setActiveTab] = useState<'chapters' | 'metadata' | 'editor'>('chapters');
  const [selectedChapterId, setSelectedChapterId] = useState<number>(chapters[0]?.id || 1);

  // DOCX Upload States
  const [isParsingDocx, setIsParsingDocx] = useState(false);
  const [docxSuccessMsg, setDocxSuccessMsg] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Drag and drop reordering states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // EPUB generation state
  const [isExportingEpub, setIsExportingEpub] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chapterDocxInputRef = useRef<HTMLInputElement>(null);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) || chapters[0];

  // Handle Full Manuscript DOCX Upload
  const handleDocxUpload = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      alert('Please upload a valid Microsoft Word (.docx) file.');
      return;
    }

    try {
      setIsParsingDocx(true);
      setDocxSuccessMsg(null);
      const parsed = await parseDocxFile(file);

      if (parsed.chapters.length === 0) {
        alert('Could not detect any chapters in this file. Please ensure text is present.');
        return;
      }

      importDocxChapters(parsed.chapters, parsed.detectedNovelTitle, parsed.detectedAuthor);
      setDocxSuccessMsg(
        `Successfully imported ${parsed.chapters.length} chapter(s) (${parsed.chapters
          .reduce((a, b) => a + b.wordCount, 0)
          .toLocaleString()} words).`
      );
      setSelectedChapterId(1);
    } catch (err) {
      console.error('Error parsing DOCX', err);
      alert('An error occurred while parsing the .docx file. Ensure it is a valid Word document.');
    } finally {
      setIsParsingDocx(false);
    }
  };

  // Handle Per-Chapter DOCX Upload
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
          paragraphs: first.paragraphs
        });
        alert(`Imported ${first.paragraphs.length} paragraphs into ${selectedChapter.title}.`);
      }
    } catch (e) {
      console.error(e);
      alert('Could not parse chapter DOCX.');
    } finally {
      setIsParsingDocx(false);
    }
  };

  // Handle Drag & Drop Reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderChapters(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle EPUB Export
  const handleExportEpub = async () => {
    try {
      setIsExportingEpub(true);
      const blob = await generateEpubBlob(novelMeta, chapters);
      const safeTitle = novelMeta.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadBlob(blob, `${safeTitle}_Edition.epub`);
    } catch (e) {
      console.error('EPUB Generation error', e);
      alert('Could not generate EPUB. Please try again.');
    } finally {
      setIsExportingEpub(false);
    }
  };

  // Handle Print Edition PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full relative min-h-screen pb-32">
      {/* 1. STUDIO HEADER */}
      <header className="border-b border-[var(--border)] bg-[var(--paper-tint)]/40 py-8">
        <div className="editorial-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)]">
                  WRITER STUDIO · CREATOR WORKSPACE
                </span>
                {isCustomized && (
                  <span className="font-mono-meta text-[9px] px-2 py-0.5 border border-[var(--border)] text-[var(--text)]">
                    CUSTOM NOVEL ACTIVE
                  </span>
                )}
              </div>
              <h1 className="font-editorial-title text-4xl sm:text-5xl text-[var(--text)] tracking-tight">
                {novelMeta.title}
              </h1>
              <p className="font-editorial-body text-base italic text-[var(--text-muted)]">
                by {novelMeta.author} · {chapters.length} Chapters
              </p>
            </div>

            {/* Studio Header Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/novel"
                className="font-mono-meta text-xs tracking-[0.16em] px-4 py-2.5 border border-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors"
              >
                PREVIEW LIVE BOOK →
              </Link>

              <button
                type="button"
                onClick={handleExportEpub}
                disabled={isExportingEpub}
                className="font-mono-meta text-xs tracking-[0.16em] px-4 py-2.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {isExportingEpub ? 'PACKAGING EPUB...' : 'EXPORT EPUB ↓'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="font-mono-meta text-xs tracking-[0.16em] px-4 py-2.5 border border-[var(--border)] hover:border-[var(--text)] transition-colors cursor-pointer"
                title="Print or Save as Book PDF"
              >
                PRINT / PDF ⎙
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Wipe ALL browser storage (reading progress, custom manuscripts, themes, font settings) and reload pristine default state?')) {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }
                }}
                className="font-mono-meta text-[10px] text-[var(--text-faint)] hover:text-red-700 underline px-2 cursor-pointer transition-colors"
                title="Wipes all localStorage and reloads pristine project defaults"
              >
                Clear All Data ↺
              </button>

              {isCustomized && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset back to Julian Thorne’s "The Last Light"? Any custom changes will be replaced.')) {
                      resetToDefaultNovel();
                    }
                  }}
                  className="font-mono-meta text-[10px] text-[var(--text-faint)] hover:text-[var(--text)] underline px-2 cursor-pointer"
                >
                  Reset Demo
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 border-t border-[var(--border-faint)] mt-8 pt-4 font-mono-meta text-xs tracking-[0.14em]">
            <button
              type="button"
              onClick={() => setActiveTab('chapters')}
              className={`pb-2 transition-all cursor-pointer ${
                activeTab === 'chapters'
                  ? 'border-b-2 border-[var(--text)] text-[var(--text)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              1. MANUSCRIPT & CHAPTERS ({chapters.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`pb-2 transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'border-b-2 border-[var(--text)] text-[var(--text)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              2. CHAPTER PROSE EDITOR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metadata')}
              className={`pb-2 transition-all cursor-pointer ${
                activeTab === 'metadata'
                  ? 'border-b-2 border-[var(--text)] text-[var(--text)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              3. NOVEL FOLIO DETAILS
            </button>
          </div>
        </div>
      </header>

      {/* 2. TAB CONTENT */}
      <div className="editorial-container pt-10">
        {/* TAB 1: MANUSCRIPT & CHAPTERS (Drag & Drop Reordering + DOCX Upload) */}
        {activeTab === 'chapters' && (
          <div className="space-y-12">
            {/* DOCX Upload Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleDocxUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`p-8 sm:p-12 border-2 border-dashed transition-all text-center space-y-4 rounded-[2px] ${
                isDraggingOver
                  ? 'border-[var(--text)] bg-[var(--paper-tint)]'
                  : 'border-[var(--border)] bg-[var(--paper-tint)]/30 hover:border-[var(--text)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleDocxUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 mx-auto rounded-full border border-[var(--border)] flex items-center justify-center font-editorial-title text-2xl text-[var(--text)]">
                ※
              </div>

              <div className="space-y-1 max-w-lg mx-auto">
                <h3 className="font-editorial-title text-2xl sm:text-3xl text-[var(--text)]">
                  Import Word Document (.docx)
                </h3>
                <p className="font-editorial-body text-sm sm:text-base text-[var(--text-muted)]">
                  Drag and drop your manuscript file here. Our rule-based parser automatically detects chapter headings, epigraphs, dialogue, and asterisms.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsingDocx}
                  className="font-mono-meta text-xs tracking-[0.16em] px-6 py-3 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isParsingDocx ? 'PARSING MANUSCRIPT...' : 'SELECT .DOCX FILE'}
                </button>
              </div>

              {docxSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono-meta text-xs max-w-md mx-auto">
                  {docxSuccessMsg}
                </div>
              )}
            </div>

            {/* Chapters Table with Drag and Drop */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                <div>
                  <h3 className="font-editorial-title text-3xl text-[var(--text)]">
                    Manuscript Chapters
                  </h3>
                  <p className="font-mono-meta text-[10px] text-[var(--text-muted)] tracking-[0.14em]">
                    DRAG ANY ROW TO REORDER · OR USE THE UP/DOWN CONTROLS
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newCh = addChapter('New Folio');
                    setSelectedChapterId(newCh.id);
                    setActiveTab('editor');
                  }}
                  className="font-mono-meta text-xs tracking-[0.14em] px-4 py-2.5 border border-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer self-start sm:self-auto"
                >
                  + ADD NEW CHAPTER
                </button>
              </div>

              {/* Chapter Rows */}
              <div className="divide-y divide-[var(--border)]">
                {chapters.map((ch, index) => {
                  const isBeingDragged = draggedIndex === index;
                  const isDragTarget = dragOverIndex === index;

                  return (
                    <div
                      key={ch.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      className={`group py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        isBeingDragged ? 'opacity-30' : ''
                      } ${isDragTarget ? 'border-t-2 border-[var(--text)] bg-[var(--paper-tint)]/60' : ''}`}
                    >
                      {/* Left: Drag Grip & Number & Title */}
                      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing p-1.5 text-[var(--text-faint)] group-hover:text-[var(--text)] transition-colors select-none"
                          title="Drag to reorder"
                        >
                          <span className="font-mono text-sm leading-none block">⋮⋮</span>
                        </div>

                        {/* Reorder Up/Down arrows for mobile/touch */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => reorderChapters(index, index - 1)}
                            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-20 cursor-pointer"
                            title="Move up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={index === chapters.length - 1}
                            onClick={() => reorderChapters(index, index + 1)}
                            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-20 cursor-pointer"
                            title="Move down"
                          >
                            ▼
                          </button>
                        </div>

                        <span className="font-mono-meta text-xs text-[var(--text-muted)] w-8">
                          {ch.numberDisplay}
                        </span>

                        <div className="min-w-0">
                          <h4 className="font-editorial-title text-2xl sm:text-3xl text-[var(--text)] truncate">
                            {ch.title}
                          </h4>
                          <span className="font-mono-meta text-[10px] text-[var(--text-faint)]">
                            CHAPTER {ch.numberRoman} · {ch.wordCount.toLocaleString()} WORDS · ~{ch.readingTimeMin} MIN READ
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 pl-12 sm:pl-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChapterId(ch.id);
                            setActiveTab('editor');
                          }}
                          className="font-mono-meta text-xs tracking-[0.14em] px-3.5 py-1.5 border border-[var(--border)] hover:border-[var(--text)] transition-colors cursor-pointer"
                        >
                          EDIT PROSE
                        </button>

                        <Link
                          to={`/novel/${ch.slug}`}
                          className="font-mono-meta text-xs tracking-[0.14em] px-3.5 py-1.5 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors"
                        >
                          READ →
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete "${ch.title}"?`)) {
                              deleteChapter(ch.id);
                            }
                          }}
                          disabled={chapters.length <= 1}
                          className="text-[var(--text-faint)] hover:text-red-700 p-1.5 transition-colors disabled:opacity-20 cursor-pointer text-xs"
                          title="Delete Chapter"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHAPTER PROSE EDITOR */}
        {activeTab === 'editor' && (
          <div className="space-y-8 max-w-4xl">
            {/* Chapter Selector Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <span className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)]">
                  ACTIVE CHAPTER:
                </span>
                <select
                  value={selectedChapter?.id}
                  onChange={(e) => setSelectedChapterId(Number(e.target.value))}
                  className="bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] px-3 py-1.5 font-editorial-body text-base outline-none cursor-pointer"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.numberDisplay} — {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Per-Chapter DOCX Import Button */}
              <div>
                <input
                  ref={chapterDocxInputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleSingleChapterDocx(e.target.files[0]);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => chapterDocxInputRef.current?.click()}
                  className="font-mono-meta text-xs tracking-[0.14em] px-3.5 py-2 border border-[var(--border)] hover:border-[var(--text)] transition-colors cursor-pointer"
                >
                  IMPORT DOCX INTO THIS CHAPTER ↑
                </button>
              </div>
            </div>

            {/* Chapter Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
              <div className="sm:col-span-8 space-y-2">
                <label className="font-mono-meta text-[11px] text-[var(--text-muted)] block tracking-[0.14em]">
                  CHAPTER TITLE
                </label>
                <input
                  type="text"
                  value={selectedChapter.title}
                  onChange={(e) => updateChapter(selectedChapter.id, { title: e.target.value })}
                  className="w-full p-3 bg-[var(--paper-tint)]/50 border border-[var(--border)] font-editorial-title text-2xl sm:text-3xl text-[var(--text)] outline-none focus:border-[var(--text)]"
                />
              </div>

              <div className="sm:col-span-4 space-y-2">
                <label className="font-mono-meta text-[11px] text-[var(--text-muted)] block tracking-[0.14em]">
                  ROMAN NUMERAL
                </label>
                <input
                  type="text"
                  value={selectedChapter.numberRoman}
                  onChange={(e) => updateChapter(selectedChapter.id, { numberRoman: e.target.value })}
                  className="w-full p-3 bg-[var(--paper-tint)]/50 border border-[var(--border)] font-mono-meta text-lg text-[var(--text)] outline-none focus:border-[var(--text)]"
                />
              </div>
            </div>

            {/* Epigraph Input */}
            <div className="p-6 bg-[var(--paper-tint)]/40 border border-[var(--border)] space-y-4">
              <span className="font-mono-meta text-[10px] tracking-[0.16em] text-[var(--text-muted)] block">
                OPTIONAL EPIGRAGH / OPENING QUOTATION
              </span>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Epigraph quote (e.g. We never notice when the water turns to salt...)"
                  value={selectedChapter.epigraph?.quote || ''}
                  onChange={(e) => {
                    const quote = e.target.value;
                    const source = selectedChapter.epigraph?.source || '';
                    updateChapter(selectedChapter.id, {
                      epigraph: quote ? { quote, source } : undefined
                    });
                  }}
                  className="w-full p-2.5 bg-[var(--bg)] border border-[var(--border)] font-editorial-body italic text-base text-[var(--text)] outline-none focus:border-[var(--text)]"
                />
                <input
                  type="text"
                  placeholder="Source attribution (e.g. L. M. Rilke, Marginalia)"
                  value={selectedChapter.epigraph?.source || ''}
                  onChange={(e) => {
                    const source = e.target.value;
                    const quote = selectedChapter.epigraph?.quote || '';
                    if (quote) {
                      updateChapter(selectedChapter.id, {
                        epigraph: { quote, source }
                      });
                    }
                  }}
                  className="w-full p-2 bg-[var(--bg)] border border-[var(--border)] font-mono-meta text-xs text-[var(--text)] outline-none focus:border-[var(--text)]"
                />
              </div>
            </div>

            {/* Prose Content Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono-meta text-[11px] text-[var(--text-muted)] tracking-[0.14em]">
                  CHAPTER PROSE PARAGRAPHS
                </label>
                <span className="font-mono-meta text-[10px] text-[var(--text-faint)]">
                  {selectedChapter.wordCount.toLocaleString()} WORDS · SEPARATE PARAGRAPHS WITH DOUBLE NEWLINE
                </span>
              </div>

              <textarea
                rows={18}
                value={selectedChapter.paragraphs.map((p) => p.text).join('\n\n')}
                onChange={(e) => {
                  const raw = e.target.value;
                  const splitParagraphs = raw
                    .split(/\n\s*\n/)
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((text) => {
                      const isBreak = /^(\*\s*\*\s*\*|※\s*※\s*※|—{3,})$/.test(text);
                      const isDialogue = /^["“'‘]/.test(text);
                      return { text, isBreak, isDialogue };
                    });

                  updateChapter(selectedChapter.id, {
                    paragraphs: splitParagraphs.length > 0 ? splitParagraphs : [{ text: '' }]
                  });
                }}
                className="w-full p-6 bg-[var(--bg)] border border-[var(--border)] font-editorial-body text-lg sm:text-xl text-[var(--text)] leading-relaxed outline-none focus:border-[var(--text)] shadow-inner"
                placeholder="Write or paste your chapter prose here..."
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('chapters')}
                className="font-mono-meta text-xs tracking-[0.14em] px-4 py-2 border border-[var(--border)] hover:border-[var(--text)] transition-colors cursor-pointer"
              >
                ← BACK TO CHAPTERS LIST
              </button>

              <Link
                to={`/novel/${selectedChapter.slug}`}
                className="font-mono-meta text-xs tracking-[0.14em] px-5 py-2.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity"
              >
                VIEW CHAPTER IN BOOK MODE →
              </Link>
            </div>
          </div>
        )}

        {/* TAB 3: NOVEL FOLIO DETAILS */}
        {activeTab === 'metadata' && (
          <div className="space-y-8 max-w-2xl">
            <div className="pb-4 border-b border-[var(--border)]">
              <h3 className="font-editorial-title text-3xl text-[var(--text)]">
                Novel Folio & Colophon Details
              </h3>
              <p className="font-editorial-body text-sm text-[var(--text-muted)]">
                These details define the title folio, cover artwork, and digital publishing colophon.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] block">
                  NOVEL TITLE
                </label>
                <input
                  type="text"
                  value={novelMeta.title}
                  onChange={(e) => updateNovelField('title', e.target.value)}
                  className="w-full p-3 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-editorial-title text-3xl text-[var(--text)] outline-none focus:border-[var(--text)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] block">
                    AUTHOR NAME
                  </label>
                  <input
                    type="text"
                    value={novelMeta.author}
                    onChange={(e) => updateNovelField('author', e.target.value)}
                    className="w-full p-2.5 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-editorial-body text-lg text-[var(--text)] outline-none focus:border-[var(--text)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] block">
                    PUBLICATION YEAR
                  </label>
                  <input
                    type="text"
                    value={novelMeta.year}
                    onChange={(e) => updateNovelField('year', e.target.value)}
                    className="w-full p-2.5 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-mono-meta text-sm text-[var(--text)] outline-none focus:border-[var(--text)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] block">
                  SYNOPSIS / ARCHIVAL SUMMARY
                </label>
                <textarea
                  rows={4}
                  value={novelMeta.synopsis}
                  onChange={(e) => updateNovelField('synopsis', e.target.value)}
                  className="w-full p-3 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-editorial-body text-base text-[var(--text)] leading-relaxed outline-none focus:border-[var(--text)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] block">
                  HERO OPENING EXCERPT
                </label>
                <textarea
                  rows={2}
                  value={novelMeta.heroExcerpt}
                  onChange={(e) => updateNovelField('heroExcerpt', e.target.value)}
                  className="w-full p-3 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-editorial-body italic text-base text-[var(--text)] leading-relaxed outline-none focus:border-[var(--text)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
