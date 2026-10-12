import React, { useState } from 'react';
import { useNovel } from '../context/NovelContext';
import type { WorkType } from '../types/novel';

interface CreateWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (workId: string) => void;
}

const WORK_TYPES: { id: WorkType; label: string; desc: string; icon: string }[] = [
  { id: 'novel', label: 'Novel', desc: 'Long-form fiction split into folios and chapters', icon: '📖' },
  { id: 'short-story', label: 'Short Story', desc: 'Single-sitting standalone narrative prose', icon: '✦' },
  { id: 'essay', label: 'Essay', desc: 'Critical thought, cultural inquiry, and reflections', icon: '✒' },
  { id: 'poetry', label: 'Poetry', desc: 'Verses, sonnets, stanzas, and lyrical sequences', icon: '※' },
  { id: 'article', label: 'Article', desc: 'Journalistic critique, dispatch, or review', icon: '📰' },
  { id: 'research', label: 'Research', desc: 'Archival documentation and analytical treatise', icon: '⚖' }
];

const PRESET_TINTS = [
  { label: 'Paper Sepia', value: '' },
  { label: 'Indigo Dye', value: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop' },
  { label: 'Tidal Mist', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { label: 'Antique Vellum', value: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop' }
];

export const CreateWorkModal: React.FC<CreateWorkModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { createWork, profile } = useNovel();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState(profile.name);
  const [type, setType] = useState<WorkType>('novel');
  const [category, setCategory] = useState('Literary Fiction');
  const [description, setDescription] = useState('');
  const [heroExcerpt, setHeroExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newWork = createWork({
      title: title.trim(),
      subtitle: subtitle.trim(),
      author: author.trim() || profile.name,
      type,
      category: category.trim() || 'General',
      description: description.trim(),
      heroExcerpt: heroExcerpt.trim(),
      coverImage: coverImage.trim(),
      year: new Date().getFullYear().toString()
    });

    onClose();
    if (onCreated) {
      onCreated(newWork.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Create New Work"
    >
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-[var(--bg)] border border-[var(--border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 animate-reveal-1">
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[var(--border)]">
          <div>
            <span className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] block uppercase">
              STUDIO MANUSCRIPT FOLIO
            </span>
            <h2 className="font-editorial-title text-3xl sm:text-4xl text-[var(--text)] tracking-tight mt-1">
              Create New Work
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text)] p-2 border border-transparent hover:border-[var(--border)] transition-colors"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Work Type Selection */}
          <div className="space-y-2">
            <label className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] block">
              WORK TYPE
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {WORK_TYPES.map((wt) => (
                <button
                  key={wt.id}
                  type="button"
                  onClick={() => setType(wt.id)}
                  className={`p-3 text-left border transition-all cursor-pointer ${
                    type === wt.id
                      ? 'border-[var(--text)] bg-[var(--paper-tint)] shadow-sm'
                      : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{wt.icon}</span>
                    <span className="font-mono-meta text-[10px] text-[var(--text-muted)]">{wt.id.toUpperCase()}</span>
                  </div>
                  <h4 className="font-editorial-title text-lg text-[var(--text)] mt-1">{wt.label}</h4>
                  <p className="font-editorial-body text-[11px] text-[var(--text-muted)] line-clamp-1 italic mt-0.5">
                    {wt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] block">
                WORK TITLE *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. The Lost Horizon"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-editorial-title text-2xl sm:text-3xl text-[var(--text)] outline-none focus:border-[var(--text)]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] block">
                SUBTITLE / EDITION NOTE (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. A Serialized Novel in Eight Folios"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full p-2.5 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-editorial-body italic text-base text-[var(--text)] outline-none focus:border-[var(--text)]"
              />
            </div>
          </div>

          {/* Author & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] block">
                AUTHOR NAME
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full p-2.5 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-editorial-body text-base text-[var(--text)] outline-none focus:border-[var(--text)]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] block">
                GENRE / CATEGORY
              </label>
              <input
                type="text"
                placeholder="e.g. Literary Fiction, Philosophy, Poetry"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-editorial-body text-base text-[var(--text)] outline-none focus:border-[var(--text)]"
              />
            </div>
          </div>

          {/* Description & Hero Excerpt */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] block">
                SYNOPSIS / PREMISE
              </label>
              <textarea
                rows={3}
                placeholder="A concise archival description of this literary work..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-editorial-body text-base text-[var(--text)] leading-relaxed outline-none focus:border-[var(--text)]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] block">
                HERO OPENING TEASER EXCERPT
              </label>
              <textarea
                rows={2}
                placeholder="The rain fell silently across the glass like grease..."
                value={heroExcerpt}
                onChange={(e) => setHeroExcerpt(e.target.value)}
                className="w-full p-2.5 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-editorial-body italic text-base text-[var(--text)] leading-relaxed outline-none focus:border-[var(--text)]"
              />
            </div>
          </div>

          {/* Cover Artwork Texture Preset / URL */}
          <div className="space-y-2">
            <label className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] block">
              COVER ARTWORK / TEXTURE (OPTIONAL)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_TINTS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setCoverImage(t.value)}
                  className={`px-3 py-1 font-mono-meta text-[10px] tracking-[0.14em] border transition-colors cursor-pointer ${
                    coverImage === t.value
                      ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or paste an image URL (https://...)"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full p-2 bg-[var(--paper-tint)]/40 border border-[var(--border)] font-mono-meta text-xs text-[var(--text)] outline-none focus:border-[var(--text)]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[var(--border-faint)] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="font-mono-meta text-xs tracking-[0.18em] py-3 px-6 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity disabled:opacity-30 cursor-pointer font-semibold"
            >
              INITIALIZE MANUSCRIPT →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
