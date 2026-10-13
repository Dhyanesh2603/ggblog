import React, { useRef, useState } from 'react';
import { useNovel } from '../context/NovelContext';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose }) => {
  const {
    works,
    accessKeys,
    exportDatabase,
    exportCurrentWorkCsv,
    importDatabase
  } = useNovel();

  const [activeTab, setActiveTab] = useState<'backup' | 'schema'>('backup');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalChapters = works.reduce((sum, w) => sum + w.chapters.length, 0);
  const totalWords = works.reduce(
    (sum, w) => sum + w.chapters.reduce((csum, c) => csum + (c.wordCount || 0), 0),
    0
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDatabase(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const supabaseSchemaSql = `-- 1. WRITERS TABLE
CREATE TABLE writers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'writer',
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACCESS KEYS TABLE (MASTER & WRITER PASSES)
CREATE TABLE access_keys (
  code TEXT PRIMARY KEY,
  role TEXT NOT NULL, -- 'master' or 'writer'
  label TEXT,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORKS TABLE (NOVELS, ESSAYS, ETC.)
CREATE TABLE works (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  author_id TEXT REFERENCES writers(id),
  status TEXT DEFAULT 'draft', -- 'draft' or 'published'
  type TEXT DEFAULT 'novel',
  year TEXT,
  synopsis TEXT,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAPTERS TABLE
CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  work_id TEXT REFERENCES works(id) ON DELETE CASCADE,
  chapter_order INT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  epigraph_quote TEXT,
  epigraph_source TEXT,
  content_html TEXT,
  word_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Database Management"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileUpload}
      />
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-[var(--bg)] border border-[var(--border)] p-6 sm:p-8 shadow-md z-10 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
          <div>
            <div className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              ※ Modifiable & Transparent Architecture
            </div>
            <h2 className="font-editorial-title text-3xl text-[var(--text)]">
              Database & Cloud Sync
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono-meta text-xs tracking-wider px-2.5 py-1 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
          >
            CLOSE [×]
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 font-mono-meta text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1 cursor-pointer transition-colors ${
              activeTab === 'backup'
                ? 'bg-[var(--text)] text-[var(--bg)] font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            LOCAL BACKUPS & SPREADSHEETS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1 cursor-pointer transition-colors ${
              activeTab === 'schema'
                ? 'bg-[var(--text)] text-[var(--bg)] font-medium'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            SUPABASE POSTGRES SCHEMA
          </button>
        </div>

        {activeTab === 'backup' ? (
          <div className="space-y-6">
            {/* Database Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 border border-[var(--border)] bg-[var(--paper-tint)]/30">
                <span className="font-mono-meta text-[9px] text-[var(--text-muted)] block">TOTAL WORKS</span>
                <span className="font-editorial-title text-2xl font-semibold text-[var(--text)]">{works.length}</span>
              </div>
              <div className="p-3 border border-[var(--border)] bg-[var(--paper-tint)]/30">
                <span className="font-mono-meta text-[9px] text-[var(--text-muted)] block">CHAPTERS</span>
                <span className="font-editorial-title text-2xl font-semibold text-[var(--text)]">{totalChapters}</span>
              </div>
              <div className="p-3 border border-[var(--border)] bg-[var(--paper-tint)]/30">
                <span className="font-mono-meta text-[9px] text-[var(--text-muted)] block">TOTAL WORDS</span>
                <span className="font-editorial-title text-2xl font-semibold text-[var(--text)]">{totalWords.toLocaleString()}</span>
              </div>
              <div className="p-3 border border-[var(--border)] bg-[var(--paper-tint)]/30">
                <span className="font-mono-meta text-[9px] text-[var(--text-muted)] block">AUTH KEYS</span>
                <span className="font-editorial-title text-2xl font-semibold text-[var(--text)]">{accessKeys.length}</span>
              </div>
            </div>

            {/* Backup Actions */}
            <div className="space-y-4">
              <div className="p-4 border border-[var(--border)] bg-[var(--bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-editorial-title text-xl text-[var(--text)]">
                    Download Human-Readable JSON Backup
                  </h3>
                  <p className="font-editorial-body text-xs italic text-[var(--text-muted)] mt-0.5">
                    Exports all manuscripts, chapters, snapshots, and keys into a single editable JSON file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportDatabase}
                  className="font-mono-meta text-xs tracking-wider px-4 py-2 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 shrink-0 cursor-pointer"
                >
                  DOWNLOAD .JSON ↓
                </button>
              </div>

              <div className="p-4 border border-[var(--border)] bg-[var(--bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-editorial-title text-xl text-[var(--text)]">
                    Restore from JSON Backup File
                  </h3>
                  <p className="font-editorial-body text-xs italic text-[var(--text-muted)] mt-0.5">
                    Instantly restores entire library and settings from a previously saved JSON file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-mono-meta text-xs tracking-wider px-4 py-2 border border-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors shrink-0 cursor-pointer"
                >
                  UPLOAD .JSON ↑
                </button>
              </div>

              <div className="p-4 border border-[var(--border)] bg-[var(--bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-editorial-title text-xl text-[var(--text)]">
                    Export Current Novel to CSV Spreadsheet
                  </h3>
                  <p className="font-editorial-body text-xs italic text-[var(--text-muted)] mt-0.5">
                    Generates a clean spreadsheet of all chapters, word counts, and epigraphs for Excel or Google Sheets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportCurrentWorkCsv}
                  className="font-mono-meta text-xs tracking-wider px-4 py-2 border border-[var(--border)] hover:border-[var(--text)] shrink-0 cursor-pointer"
                >
                  EXPORT CSV ⊞
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-editorial-body text-xs italic text-[var(--text-muted)] leading-relaxed">
              If you or your friend decide to connect a cloud PostgreSQL database using Supabase, here is the clean, understandable 4-table schema. You can paste this directly into the Supabase SQL Editor:
            </p>
            <div className="relative">
              <pre className="p-4 bg-[var(--paper-tint)] border border-[var(--border)] font-mono text-[10px] leading-relaxed text-[var(--text)] overflow-x-auto max-h-[300px]">
                {supabaseSchemaSql}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(supabaseSchemaSql);
                  alert('Supabase SQL schema copied to clipboard!');
                }}
                className="absolute top-2 right-2 font-mono-meta text-[9px] px-2 py-1 bg-[var(--text)] text-[var(--bg)]"
              >
                COPY SQL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
