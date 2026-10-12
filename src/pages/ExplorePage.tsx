import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNovel } from '../context/NovelContext';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { works, setActiveWorkId, userRole } = useNovel();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reader only sees published works unless they are in writer role
  const displayableWorks = works.filter((w) => {
    if (userRole === 'writer') return true;
    return w.status === 'published';
  });

  const filteredWorks = displayableWorks.filter((w) => {
    const matchesCategory =
      selectedType === 'all' || w.type === selectedType;
    const matchesSearch =
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.synopsis && w.synopsis.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleStartReading = (workId: string) => {
    setActiveWorkId(workId);
    navigate('/novel');
  };

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text)] pb-32">
      {/* 1. HERO HEADER */}
      <section className="border-b border-[var(--border)] bg-[var(--paper-tint)]/40 py-12 md:py-16">
        <div className="editorial-container">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              <span>※</span>
              <span>Library & Reader Catalog</span>
              <span className="opacity-40">/</span>
              <span>Curated Literature</span>
            </div>
            <h1 className="font-editorial-title text-4xl sm:text-5xl lg:text-6xl text-[var(--text)] tracking-tight">
              Published Works & Folios
            </h1>
            <p className="font-editorial-body text-base text-[var(--text-muted)] italic leading-relaxed">
              Explore long-form novels, collected essays, short fiction, and serial articles authored in the studio.
            </p>
          </div>

          {/* Quick Filters & Search */}
          <div className="pt-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 font-mono-meta text-xs">
              {[
                { id: 'all', label: 'ALL COLLECTIONS' },
                { id: 'novel', label: 'NOVELS' },
                { id: 'short_story', label: 'SHORT FICTION' },
                { id: 'article', label: 'ARTICLES' },
                { id: 'poetry', label: 'POETRY' },
                { id: 'essay', label: 'ESSAYS' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedType(tab.id)}
                  className={`px-3 py-1.5 tracking-[0.14em] transition-colors cursor-pointer border ${
                    selectedType === tab.id
                      ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] border-transparent hover:border-[var(--border)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, motif..."
                className="w-full bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2 text-xs font-mono-meta text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--text)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATALOGUE GRID */}
      <section className="editorial-container pt-12">
        {filteredWorks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--border)] p-12">
            <span className="font-editorial-title text-3xl italic text-[var(--text-muted)] block mb-2">
              No publications found
            </span>
            <p className="font-mono-meta text-xs tracking-wider text-[var(--text-faint)]">
              Try adjusting your filter or search keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorks.map((work) => {
              const chapterCount = work.chapters.length;
              const words = work.wordCount || 0;
              const estReadTime = Math.ceil(words / 225);

              return (
                <article
                  key={work.id}
                  onClick={() => handleStartReading(work.id)}
                  className="group flex flex-col justify-between border border-[var(--border)] hover:border-[var(--text)] bg-[var(--bg)] p-6 sm:p-7 transition-all duration-200 cursor-pointer"
                >
                  <div>
                    {/* Header meta */}
                    <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]/60 font-mono-meta text-[9.5px]">
                      <span className="uppercase tracking-[0.18em] px-2 py-0.5 border border-[var(--border)] text-[var(--text-muted)] bg-[var(--paper-tint)]/40">
                        {work.type.replace('_', ' ')}
                      </span>
                      <span className="text-[var(--text-faint)] tracking-wider">
                        {work.year || '2026'}
                      </span>
                    </div>

                    {/* Book Title & Author */}
                    <div className="pt-6 pb-3">
                      <h2 className="font-editorial-title text-3xl text-[var(--text)] group-hover:italic transition-all leading-tight">
                        {work.title}
                      </h2>
                      {work.subtitle && (
                        <p className="font-editorial-body text-sm text-[var(--text-muted)] italic mt-1 line-clamp-1">
                          {work.subtitle}
                        </p>
                      )}
                      <p className="font-mono-meta text-[10px] text-[var(--text-faint)] mt-2 uppercase tracking-wider">
                        By {work.author}
                      </p>
                    </div>

                    {/* Synopsis */}
                    <p className="font-editorial-body text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed mt-2 opacity-85">
                      {work.synopsis || work.heroExcerpt || 'An editorial narrative preserved in the digital atelier.'}
                    </p>
                  </div>

                  {/* Footer Meta & Start Reading */}
                  <div className="pt-6 mt-6 border-t border-[var(--border)]/60">
                    <div className="flex items-center justify-between font-mono-meta text-[10px] text-[var(--text-muted)] mb-4">
                      <span>{chapterCount} Chapters</span>
                      <span>{words.toLocaleString()} words</span>
                      <span>~{estReadTime} min</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartReading(work.id);
                        }}
                        className="font-mono-meta text-xs tracking-[0.16em] px-4 py-2 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity"
                      >
                        READ ONLINE →
                      </button>

                      <Link
                        to="/profile"
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] underline"
                      >
                        AUTHOR BIO
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
