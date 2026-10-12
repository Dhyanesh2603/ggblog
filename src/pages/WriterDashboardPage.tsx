import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNovel } from '../context/NovelContext';
import { CreateWorkModal } from '../components/CreateWorkModal';
import { ImportReviewModal } from '../components/ImportReviewModal';
import { parseDocxFile, type ParseDocxResult } from '../utils/docxParser';
import { generateEpubBlob, downloadBlob } from '../utils/epubGenerator';
import type { Work, Chapter } from '../types/novel';

export const WriterDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    works,
    activeWorkId,
    setActiveWorkId,
    createWork,
    deleteWork,
    duplicateWork,
    togglePublishWork,
    profile
  } = useNovel();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingParsedDocx, setPendingParsedDocx] = useState<ParseDocxResult | null>(null);
  const [isParsingDocx, setIsParsingDocx] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Time-based literary greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Helper for total work words
  const getWorkWordCount = (w: Work) => {
    if (w.wordCount) return w.wordCount;
    return w.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  };

  // Aggregated studio stats
  const totalWorks = works.length;
  const draftCount = works.filter((w) => w.status === 'draft').length;
  const publishedCount = works.filter((w) => w.status === 'published').length;
  const totalWordCount = works.reduce((acc, w) => acc + getWorkWordCount(w), 0);
  const totalChaptersCount = works.reduce((acc, w) => acc + w.chapters.length, 0);

  // Filter works by category & search query
  const filteredWorks = works.filter((w) => {
    const matchesCategory =
      activeCategory === 'all' ||
      w.type === activeCategory ||
      (activeCategory === 'published' && w.status === 'published') ||
      (activeCategory === 'drafts' && w.status === 'draft');

    const matchesSearch =
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.subtitle && w.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Handle DOCX upload -> triggers Review Screen
  const handleDocxFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      alert('Please select a valid Microsoft Word (.docx) manuscript.');
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
      console.error('Failed to parse manuscript', err);
      alert('Error parsing DOCX file. Please ensure the document is not password-protected.');
    } finally {
      setIsParsingDocx(false);
    }
  };

  // Confirm import from the review screen
  const handleConfirmImport = (importedChapters: Chapter[], bookTitle?: string, bookAuthor?: string) => {
    const totalWords = importedChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
    const newWork = createWork({
      title: bookTitle || 'Imported Manuscript',
      subtitle: `Imported with ${importedChapters.length} chapter divisions`,
      author: bookAuthor || profile.name,
      type: 'novel',
      status: 'draft',
      chapters: importedChapters,
      wordCount: totalWords,
      description: `Imported manuscript consisting of ${importedChapters.length} chapters and ${totalWords.toLocaleString()} words.`
    });
    setActiveWorkId(newWork.id);
    setIsImportModalOpen(false);
    setPendingParsedDocx(null);
    navigate(`/studio`);
  };

  const handleOpenStudio = (workId: string) => {
    setActiveWorkId(workId);
    navigate('/studio');
  };

  const handleExportWorkEpub = async (work: Work, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const words = getWorkWordCount(work);
      const firstEpigraph = work.chapters[0]?.epigraph;
      const epigraphStr = typeof firstEpigraph === 'string' ? firstEpigraph : firstEpigraph?.quote || '';
      const epigraphAttrStr = typeof firstEpigraph === 'object' ? firstEpigraph?.source : work.chapters[0]?.epigraphAttribution || '';

      const meta = {
        title: work.title,
        subtitle: work.subtitle || '',
        author: work.author,
        year: work.year || '2026',
        totalChapters: work.chapters.length,
        estimatedTotalReadingTime: `${Math.ceil(words / 225)} min`,
        heroExcerpt: work.heroExcerpt || work.description || '',
        coverQuote: work.heroExcerpt || work.title,
        synopsis: work.synopsis || work.description || '',
        coverImage: work.coverImage,
        epigraph: epigraphStr,
        epigraphAttribution: epigraphAttrStr
      };
      const blob = await generateEpubBlob(meta, work.chapters);
      const safeTitle = work.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadBlob(blob, `${safeTitle}_Edition.epub`);
    } catch (err) {
      console.error(err);
      alert('Could not package EPUB for this work.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text)] pb-32">
      {/* Hidden file input for DOCX import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleDocxFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* 1. GREETING & HERO HEADER */}
      <section className="border-b border-[var(--border)] bg-[var(--paper-tint)]/40 pt-12 pb-10">
        <div className="editorial-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                <span>※</span>
                <span>Writing Studio</span>
                <span className="opacity-40">/</span>
                <span>Personal Creative Atelier</span>
              </div>
              <h1 className="font-editorial-title text-4xl sm:text-5xl lg:text-6xl text-[var(--text)] tracking-tight">
                {getGreeting()}, <span className="italic">{profile.name.split(' ')[0]}</span>.
              </h1>
              <p className="font-editorial-body text-base text-[var(--text-muted)] italic max-w-xl">
                Continue crafting your narratives. All manuscripts are preserved with offline zero-auth storage.
              </p>
            </div>

            {/* Quick Primary Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="font-mono-meta text-xs tracking-[0.16em] px-5 py-3 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <span>+</span>
                <span>CREATE NEW WORK</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsingDocx}
                className="font-mono-meta text-xs tracking-[0.16em] px-5 py-3 border border-[var(--border)] hover:border-[var(--text)] hover:bg-[var(--bg)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <span>↑</span>
                <span>{isParsingDocx ? 'PARSING DOCX...' : 'IMPORT DOCX'}</span>
              </button>

              <Link
                to="/profile"
                className="font-mono-meta text-xs tracking-[0.16em] px-4 py-3 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-muted)] hover:text-[var(--text)] transition-all"
              >
                PROFILE
              </Link>
            </div>
          </div>

          {/* 2. STATS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 pt-10 mt-10 border-t border-[var(--border)]/70">
            <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
              <div className="font-mono-meta text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                TOTAL WORKS
              </div>
              <div className="font-editorial-title text-3xl text-[var(--text)] mt-1 font-semibold">
                {totalWorks}
              </div>
              <div className="font-mono-meta text-[10px] text-[var(--text-faint)] mt-0.5">
                {draftCount} drafts · {publishedCount} published
              </div>
            </div>

            <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
              <div className="font-mono-meta text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                TOTAL CHAPTERS
              </div>
              <div className="font-editorial-title text-3xl text-[var(--text)] mt-1 font-semibold">
                {totalChaptersCount}
              </div>
              <div className="font-mono-meta text-[10px] text-[var(--text-faint)] mt-0.5">
                Across library
              </div>
            </div>

            <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
              <div className="font-mono-meta text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                WORDS WRITTEN
              </div>
              <div className="font-editorial-title text-3xl text-[var(--text)] mt-1 font-semibold">
                {totalWordCount.toLocaleString()}
              </div>
              <div className="font-mono-meta text-[10px] text-[var(--text-faint)] mt-0.5">
                ~{Math.round(totalWordCount / 225)} min read
              </div>
            </div>

            <div className="p-4 border border-[var(--border)] bg-[var(--bg)]">
              <div className="font-mono-meta text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                PUBLICATIONS
              </div>
              <div className="font-editorial-title text-3xl text-[var(--text)] mt-1 font-semibold">
                {publishedCount}
              </div>
              <div className="font-mono-meta text-[10px] text-[var(--text-faint)] mt-0.5">
                In reader catalog
              </div>
            </div>

            <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-4 border border-[var(--border)] bg-[var(--bg)]">
              <div className="font-mono-meta text-[10px] tracking-[0.18em] text-[var(--text-muted)]">
                READERS & FOLLOWERS
              </div>
              <div className="font-editorial-title text-3xl text-[var(--text)] mt-1 font-semibold">
                {(profile.followerCount || profile.followersCount || 1480).toLocaleString()}
              </div>
              <div className="font-mono-meta text-[10px] text-[var(--text-faint)] mt-0.5">
                Subscribed readers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STUDIO LIBRARY SECTION */}
      <section className="editorial-container pt-12">
        {/* Filter Tabs and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1 font-mono-meta text-xs">
            {[
              { id: 'all', label: 'ALL WORKS' },
              { id: 'novel', label: 'NOVELS' },
              { id: 'short-story', label: 'SHORT STORIES' },
              { id: 'article', label: 'ARTICLES' },
              { id: 'poetry', label: 'POETRY' },
              { id: 'essay', label: 'ESSAYS' },
              { id: 'drafts', label: 'DRAFTS' },
              { id: 'published', label: 'PUBLISHED' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 tracking-[0.14em] transition-colors cursor-pointer border ${
                  activeCategory === tab.id
                    ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] border-transparent hover:border-[var(--border)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manuscripts..."
              className="w-full bg-[var(--paper-tint)]/40 border border-[var(--border)] px-3 py-1.5 text-xs font-mono-meta text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--text)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Works Grid */}
        <div className="pt-8">
          {filteredWorks.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[var(--border)] p-12">
              <span className="font-editorial-title text-3xl italic text-[var(--text-muted)] block mb-3">
                No manuscripts match this selection
              </span>
              <p className="font-mono-meta text-xs tracking-wider text-[var(--text-faint)] mb-6">
                Create a new piece or import a Microsoft Word manuscript to begin writing.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="font-mono-meta text-xs tracking-[0.16em] px-4 py-2 border border-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
              >
                CREATE A NEW WORK
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorks.map((work) => {
                const isActive = work.id === activeWorkId;
                const chapterCount = work.chapters.length;
                const words = getWorkWordCount(work);
                const estReadTime = Math.ceil(words / 225);

                return (
                  <article
                    key={work.id}
                    onClick={() => handleOpenStudio(work.id)}
                    className={`group relative flex flex-col justify-between border transition-all duration-200 p-6 bg-[var(--bg)] cursor-pointer hover:border-[var(--text)] ${
                      isActive
                        ? 'border-[var(--text)] shadow-sm'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    <div>
                      {/* Top Meta & Badges */}
                      <div className="flex items-center justify-between gap-2 pb-4 border-b border-[var(--border)]/60">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-meta text-[9.5px] uppercase tracking-[0.16em] px-1.5 py-0.5 border border-[var(--border)] bg-[var(--paper-tint)]/50 text-[var(--text-muted)]">
                            {work.type.replace('-', ' ')}
                          </span>
                          {isActive && (
                            <span className="font-mono-meta text-[9px] uppercase tracking-[0.14em] text-[var(--text)] font-semibold">
                              ● ACTIVE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePublishWork(work.id);
                            }}
                            title="Toggle status"
                            className={`font-mono-meta text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 border transition-colors cursor-pointer ${
                              work.status === 'published'
                                ? 'border-[var(--text)] text-[var(--text)] font-medium'
                                : 'border-dashed border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text)]'
                            }`}
                          >
                            {work.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                          </button>
                        </div>
                      </div>

                      {/* Work Title & Subtitle */}
                      <div className="pt-5 pb-3">
                        <h2 className="font-editorial-title text-2xl sm:text-3xl text-[var(--text)] group-hover:italic transition-all leading-tight">
                          {work.title}
                        </h2>
                        {work.subtitle && (
                          <p className="font-editorial-body text-sm text-[var(--text-muted)] italic mt-1 line-clamp-1">
                            {work.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Synopsis excerpt */}
                      <p className="font-editorial-body text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed opacity-80">
                        {work.synopsis || work.description || work.heroExcerpt || 'No synopsis added yet. Open studio to begin writing prose.'}
                      </p>
                    </div>

                    {/* Bottom Metadata & Action Bar */}
                    <div className="pt-6 mt-6 border-t border-[var(--border)]/60">
                      <div className="flex items-center justify-between font-mono-meta text-[10.5px] text-[var(--text-muted)] mb-4">
                        <span>{chapterCount} {chapterCount === 1 ? 'Chapter' : 'Chapters'}</span>
                        <span>{words.toLocaleString()} words</span>
                        <span>~{estReadTime}m read</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStudio(work.id);
                            }}
                            className="font-mono-meta text-[10px] tracking-[0.16em] px-3 py-1.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity"
                          >
                            STUDIO →
                          </button>

                          <Link
                            to={`/novel`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveWorkId(work.id);
                            }}
                            className="font-mono-meta text-[10px] tracking-[0.16em] px-2.5 py-1.5 border border-[var(--border)] hover:border-[var(--text)] transition-colors"
                          >
                            PREVIEW
                          </Link>
                        </div>

                        {/* Extra Menu: Export, Duplicate, Delete */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleExportWorkEpub(work, e)}
                            title="Export EPUB for this work"
                            className="font-mono-meta text-[10px] p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                          >
                            EPUB ↓
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateWork(work.id);
                            }}
                            title="Duplicate manuscript"
                            className="font-mono-meta text-[10px] p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                          >
                            DUP
                          </button>
                          {works.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete "${work.title}"?`)) {
                                  deleteWork(work.id);
                                }
                              }}
                              title="Delete manuscript"
                              className="font-mono-meta text-[10px] p-1.5 text-[var(--text-faint)] hover:text-red-700 transition-colors"
                            >
                              DEL
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. DRAG & DROP MANUSCRIPT UPLOAD BANNER */}
      <section className="editorial-container pt-16">
        <div
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleDocxFile(e.dataTransfer.files[0]);
            }
          }}
          className="border border-dashed border-[var(--border)] bg-[var(--paper-tint)]/30 p-10 text-center hover:border-[var(--text)] transition-all cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="max-w-lg mx-auto space-y-3">
            <span className="font-mono-meta text-xs tracking-[0.2em] text-[var(--text-muted)] block uppercase">
              Drag & Drop DOCX Manuscript
            </span>
            <h3 className="font-editorial-title text-3xl text-[var(--text)]">
              Transform your Word manuscript into an editorial book
            </h3>
            <p className="font-editorial-body text-sm text-[var(--text-muted)] italic leading-relaxed">
              Supports automatic chapter detection (H1, H2, "Chapter 1", "Folio I"), epigraph extraction, section asterisms (※), and typography normalization.
            </p>
            <div className="pt-2">
              <span className="inline-block font-mono-meta text-xs tracking-[0.16em] px-4 py-2 border border-[var(--text)] bg-[var(--bg)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors">
                CHOOSE .DOCX FILE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MODALS */}
      <CreateWorkModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(workId) => {
          setActiveWorkId(workId);
          setIsCreateModalOpen(false);
          navigate('/studio');
        }}
      />

      {pendingParsedDocx && (
        <ImportReviewModal
          isOpen={isImportModalOpen}
          detectedTitle={pendingParsedDocx.detectedNovelTitle || 'Imported Manuscript'}
          detectedAuthor={pendingParsedDocx.detectedAuthor || profile.name}
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
