import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNovel } from '../context/NovelContext';
import type { WorkType } from '../types/novel';

export const WriterApplicationPage: React.FC = () => {
  const { submitWriterApplication } = useNovel();

  const [name, setName] = useState('');
  const [penName, setPenName] = useState('');
  const [email, setEmail] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [workType, setWorkType] = useState<WorkType>('novel');
  const [proposedTitle, setProposedTitle] = useState('');
  const [pitch, setPitch] = useState('');
  const [sampleExcerpt, setSampleExcerpt] = useState('');
  const [statement, setStatement] = useState('');

  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pitchWords = pitch.trim() ? pitch.trim().split(/\s+/).length : 0;
  const excerptWords = sampleExcerpt.trim() ? sampleExcerpt.trim().split(/\s+/).length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !proposedTitle.trim() || !sampleExcerpt.trim()) {
      alert('Please fill in your name, email, proposed title, and manuscript excerpt.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const created = submitWriterApplication({
        name: name.trim(),
        penName: penName.trim() || undefined,
        email: email.trim(),
        portfolioUrl: portfolioUrl.trim() || undefined,
        workType,
        proposedTitle: proposedTitle.trim(),
        pitch: pitch.trim(),
        sampleExcerpt: sampleExcerpt.trim(),
        statement: statement.trim()
      });

      setSubmittedAppId(created.id);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 450);
  };

  return (
    <div className="w-full min-h-[85vh] py-12 md:py-20 bg-[var(--bg)] text-[var(--text)]">
      <div className="editorial-container max-w-3xl">
        {/* Breadcrumb / Top label */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-8">
          <Link
            to="/novel"
            className="font-mono-meta text-xs tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
          >
            <span>←</span>
            <span>RETURN TO THE NOVEL</span>
          </Link>
          <span className="font-mono-meta text-[10.5px] tracking-[0.18em] text-[var(--text-muted)] uppercase">
            ※ Editorial Submissions · {new Date().getFullYear()}
          </span>
        </div>

        {submittedAppId ? (
          /* Submission Receipt / Confirmation View */
          <div className="p-8 sm:p-12 border border-[var(--border)] bg-[var(--paper-tint)]/40 space-y-8 animate-fade-in">
            <div className="space-y-3">
              <span className="font-mono-meta text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase block">
                Folio Dispatched
              </span>
              <h1 className="font-editorial-title text-4xl sm:text-5xl text-[var(--text)]">
                Manuscript Received for Editorial Review
              </h1>
              <p className="font-editorial-body text-lg italic text-[var(--text-muted)]">
                Reference Code: <span className="font-mono text-sm not-italic font-semibold text-[var(--text)]">{submittedAppId}</span>
              </p>
            </div>

            <div className="space-y-4 font-editorial-body text-base sm:text-lg leading-relaxed text-[var(--text)] border-t border-b border-[var(--border)] py-6">
              <p>
                Thank you, <strong>{name}</strong>. Your prospectus for <em>"{proposedTitle}"</em> ({workType.toUpperCase()}) has been cataloged and placed directly before the Master Author's desk.
              </p>
              <p className="text-[var(--text-muted)] italic">
                Our press adheres to slow, deliberate editorial selection. If accepted for publication, you will receive an official Atelier Writer Passkey via <strong>{email}</strong> granting full studio creation privileges.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/novel"
                className="font-mono-meta text-xs tracking-wider px-6 py-3 border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] hover:opacity-90 transition-opacity"
              >
                BROWSE PUBLISHED FOLIOS →
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedAppId(null);
                  setProposedTitle('');
                  setPitch('');
                  setSampleExcerpt('');
                  setStatement('');
                }}
                className="font-mono-meta text-xs tracking-wider px-5 py-3 border border-[var(--border)] hover:border-[var(--text)] transition-colors"
              >
                SUBMIT ANOTHER PROPOSAL
              </button>
            </div>
          </div>
        ) : (
          /* Application Form */
          <div className="space-y-10">
            {/* Header */}
            <div className="space-y-3">
              <h1 className="font-editorial-title text-5xl sm:text-6xl text-[var(--text)] tracking-tight">
                Call for Submissions
              </h1>
              <p className="font-editorial-body text-xl sm:text-2xl italic text-[var(--text-muted)]">
                The atelier considers unhurried, physical literature for digital serialization.
              </p>
              <p className="font-editorial-body text-sm sm:text-base text-[var(--text-muted)] pt-2 leading-relaxed max-w-2xl">
                We publish novels, long-form essays, short fiction, and verse. Approved authors are granted a sovereign Atelier Writer Key with access to our distraction-free manuscript studio, versioning vault, and publication suite.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pt-4">
              {/* Section 1: Author Details */}
              <div className="space-y-4 border-t border-[var(--border)] pt-6">
                <span className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] uppercase block">
                  01 / The Author
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono-meta text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Thomas Sterling"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2.5 font-editorial-body text-base text-[var(--text)] focus:border-[var(--text)] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono-meta text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Pen Name / Byline (Optional)
                    </label>
                    <input
                      type="text"
                      value={penName}
                      onChange={(e) => setPenName(e.target.value)}
                      placeholder="e.g. T. S. Sterling"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2.5 font-editorial-body text-base text-[var(--text)] focus:border-[var(--text)] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-mono-meta text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="thomas@meridian.org"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2.5 font-editorial-body text-base text-[var(--text)] focus:border-[var(--text)] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono-meta text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Portfolio / Published Works URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2.5 font-editorial-body text-base text-[var(--text)] focus:border-[var(--text)] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Proposed Work */}
              <div className="space-y-4 border-t border-[var(--border)] pt-6">
                <span className="font-mono-meta text-[11px] tracking-[0.16em] text-[var(--text-muted)] uppercase block">
                  02 / The Manuscript Proposal
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-mono-meta text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Working Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={proposedTitle}
                      onChange={(e) => setProposedTitle(e.target.value)}
                      placeholder="e.g. The Cartographer's Winter"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2.5 font-editorial-body text-base text-[var(--text)] focus:border-[var(--text)] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono-meta text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Work Format
                    </label>
                    <select
                      value={workType}
                      onChange={(e) => setWorkType(e.target.value as WorkType)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] px-3 py-2.5 font-mono-meta text-xs text-[var(--text)] focus:border-[var(--text)] outline-none cursor-pointer"
                    >
                      <option value="novel">Novel (Serialized)</option>
                      <option value="short-story">Short Story / Folio</option>
                      <option value="essay">Literary Essay & Criticism</option>
                      <option value="poetry">Poetry / Verse Cycle</option>
                      <option value="research">Archival Research</option>
                    </select>
                  </div>
                </div>

                {/* Synopsis / Pitch */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono-meta text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Elevator Pitch & Synopsis (Max 500 words) *
                    </label>
                    <span className="font-mono-meta text-[10px] text-[var(--text-muted)]">
                      {pitchWords} words
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="Provide a concise distillation of the narrative arc, thematic landscape, and atmospheric intent..."
                    className="w-full bg-[var(--bg)] border border-[var(--border)] p-3.5 font-editorial-body text-base text-[var(--text)] leading-relaxed focus:border-[var(--text)] outline-none"
                  />
                </div>

                {/* Opening Chapter / Sample Excerpt */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono-meta text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                      Opening Excerpt or Sample Prose *
                    </label>
                    <span className="font-mono-meta text-[10px] text-[var(--text-muted)]">
                      {excerptWords} words
                    </span>
                  </div>
                  <textarea
                    required
                    rows={7}
                    value={sampleExcerpt}
                    onChange={(e) => setSampleExcerpt(e.target.value)}
                    placeholder="Paste the opening passage or a representative scene demonstrating your sentence rhythm and voice..."
                    className="w-full bg-[var(--bg)] border border-[var(--border)] p-3.5 font-editorial-body text-base text-[var(--text)] leading-relaxed focus:border-[var(--text)] outline-none"
                  />
                </div>

                {/* Statement of Philosophy */}
                <div className="space-y-1.5">
                  <label className="font-mono-meta text-[11px] text-[var(--text-muted)] uppercase tracking-wider block">
                    Letter to the Editorial Board (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="Why does your work belong with this publication?"
                    className="w-full bg-[var(--bg)] border border-[var(--border)] p-3.5 font-editorial-body text-base text-[var(--text)] leading-relaxed focus:border-[var(--text)] outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-between border-t border-[var(--border)]">
                <span className="font-mono-meta text-[10px] text-[var(--text-muted)] tracking-wider">
                  ※ DIRECT DISPATCH TO MASTER AUTHOR
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-mono-meta text-xs tracking-[0.16em] px-8 py-3.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'DISPATCHING FOLIO...' : 'TRANSMIT SUBMISSION →'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
