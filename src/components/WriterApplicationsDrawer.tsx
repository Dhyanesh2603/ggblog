import React, { useState } from 'react';
import { useNovel } from '../context/NovelContext';
import type { WriterApplication } from '../types/novel';

interface WriterApplicationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WriterApplicationsDrawer: React.FC<WriterApplicationsDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const {
    writerApplications,
    approveWriterApplication,
    rejectWriterApplication,
    deleteWriterApplication,
    authRole
  } = useNovel();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingCount = writerApplications.filter((a) => a.status === 'pending').length;
  const filteredApps = writerApplications.filter((a) => {
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'approved') return a.status === 'approved';
    return true;
  });

  const selectedApp = writerApplications.find((a) => a.id === selectedAppId) || filteredApps[0];

  const handleApprove = (app: WriterApplication) => {
    const res = approveWriterApplication(app.id);
    if (res) {
      const inviteText = `Dear ${app.name},\n\nYour manuscript prospectus for "${app.proposedTitle}" has been accepted by the editorial desk.\n\nYour sovereign Writer Studio Key is: ${res.key.code}\nDirect Studio URL: ${window.location.origin}/studio?key=${encodeURIComponent(res.key.code)}\n\nWelcome to the atelier.\n— The Editorial Board`;
      navigator.clipboard.writeText(inviteText);
      setCopiedNotification(app.id);
      setTimeout(() => setCopiedNotification(null), 3500);
    }
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}/studio?key=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    alert(`Copied direct studio link for writer key ${code}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Manuscript Submissions & Writer Applications"
    >
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-[var(--bg)] border-l border-[var(--border)] h-full shadow-2xl z-10 flex flex-col">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[var(--border)] bg-[var(--paper-tint)]/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                ※ Editorial Desk Review
              </span>
              <span className="font-mono-meta text-[9px] px-1.5 py-0.2 border border-[var(--border)] text-[var(--text)]">
                {authRole === 'developer' ? 'DEVELOPER ROOT' : 'MASTER AUTHOR'}
              </span>
            </div>
            <h2 className="font-editorial-title text-3xl text-[var(--text)] mt-0.5">
              Writer Submissions ({writerApplications.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono-meta text-xs tracking-wider px-2.5 py-1.5 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
          >
            CLOSE [×]
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2.5 border-b border-[var(--border)] flex items-center gap-3 font-mono-meta text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`pb-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'border-b-2 border-[var(--text)] text-[var(--text)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>PENDING</span>
            {pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--text)] text-[var(--bg)] font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`pb-1 transition-colors cursor-pointer ${
              activeTab === 'approved'
                ? 'border-b-2 border-[var(--text)] text-[var(--text)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            ACCEPTED FELLOWS ({writerApplications.filter((a) => a.status === 'approved').length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-1 transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'border-b-2 border-[var(--text)] text-[var(--text)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            ARCHIVE ({writerApplications.length})
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
          {filteredApps.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="font-editorial-body text-base italic text-[var(--text-muted)]">
                No submissions matching this filter.
              </p>
              <p className="font-mono-meta text-xs text-[var(--text-faint)]">
                Aspiring authors submit proposals at /submissions
              </p>
            </div>
          ) : (
            filteredApps.map((app) => {
              const isSelected = selectedApp?.id === app.id;

              return (
                <div
                  key={app.id}
                  className={`p-6 transition-colors ${
                    isSelected ? 'bg-[var(--paper-tint)]/30' : 'hover:bg-[var(--paper-tint)]/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-editorial-title text-xl text-[var(--text)]">
                          {app.proposedTitle}
                        </span>
                        <span className="font-mono-meta text-[9px] px-1.5 py-0.2 uppercase border border-[var(--border)]">
                          {app.workType}
                        </span>
                        <span
                          className={`font-mono-meta text-[9px] px-1.5 py-0.2 uppercase ${
                            app.status === 'approved'
                              ? 'border border-emerald-700 text-emerald-700 dark:border-emerald-500 dark:text-emerald-500'
                              : app.status === 'rejected'
                              ? 'border border-red-700 text-red-700'
                              : 'border border-amber-700 text-amber-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <p className="font-editorial-body text-sm text-[var(--text-muted)] italic">
                        By {app.name} {app.penName ? `(${app.penName})` : ''} · {app.email} · Submitted {new Date(app.submittedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedAppId(isSelected ? null : app.id)}
                        className="font-mono-meta text-[10px] px-2 py-1 border border-[var(--border)] hover:border-[var(--text)] cursor-pointer"
                      >
                        {isSelected ? 'COLLAPSE' : 'READ PROSE'}
                      </button>
                    </div>
                  </div>

                  {/* Summary Snippet */}
                  <div className="mt-3">
                    <p className="font-editorial-body text-sm text-[var(--text)] line-clamp-2">
                      “{app.pitch}”
                    </p>
                  </div>

                  {/* If Approved, show assigned Writer Key & Copy Link */}
                  {app.status === 'approved' && app.assignedKey && (
                    <div className="mt-4 p-3 border border-emerald-800/40 bg-emerald-900/[0.04] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono-meta text-[9.5px] text-emerald-800 dark:text-emerald-500 block uppercase font-semibold">
                          ✓ ACTIVE WRITER PASSKEY
                        </span>
                        <span className="font-mono text-xs font-semibold text-[var(--text)]">
                          {app.assignedKey}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(app.assignedKey!)}
                        className="font-mono-meta text-[9px] px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] cursor-pointer"
                      >
                        COPY STUDIO LINK
                      </button>
                    </div>
                  )}

                  {/* Expanded Reading & Decision View */}
                  {isSelected && (
                    <div className="mt-5 pt-5 border-t border-[var(--border)] space-y-4">
                      {/* Pitch */}
                      <div className="space-y-1">
                        <span className="font-mono-meta text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                          Manuscript Pitch & Arc:
                        </span>
                        <p className="font-editorial-body text-base text-[var(--text)] leading-relaxed bg-[var(--bg)] p-3 border border-[var(--border)]">
                          {app.pitch}
                        </p>
                      </div>

                      {/* Excerpt */}
                      <div className="space-y-1">
                        <span className="font-mono-meta text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                          Opening Excerpt / Writing Sample:
                        </span>
                        <div className="font-editorial-body text-base text-[var(--text)] leading-relaxed bg-[var(--bg)] p-4 border border-[var(--border)] max-h-64 overflow-y-auto whitespace-pre-line italic">
                          {app.sampleExcerpt}
                        </div>
                      </div>

                      {/* Author Statement */}
                      {app.statement && (
                        <div className="space-y-1">
                          <span className="font-mono-meta text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                            Statement of Intent:
                          </span>
                          <p className="font-editorial-body text-sm text-[var(--text-muted)] leading-relaxed italic">
                            “{app.statement}”
                          </p>
                        </div>
                      )}

                      {/* Action Decision Buttons */}
                      <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {app.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(app)}
                              className="font-mono-meta text-xs tracking-wider px-4 py-2 bg-[var(--text)] text-[var(--bg)] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                            >
                              <span>✓</span>
                              <span>ACCEPT & ISSUE WRITER PASS</span>
                            </button>
                          )}

                          {app.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => rejectWriterApplication(app.id)}
                              className="font-mono-meta text-xs tracking-wider px-3 py-2 border border-[var(--border)] text-red-700 hover:border-red-700 cursor-pointer"
                            >
                              DECLINE
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove submission from ${app.name}?`)) {
                              deleteWriterApplication(app.id);
                            }
                          }}
                          className="font-mono-meta text-[10px] text-[var(--text-muted)] hover:text-red-700 cursor-pointer"
                        >
                          DELETE RECORD
                        </button>
                      </div>

                      {copiedNotification === app.id && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-700/60 text-emerald-800 dark:text-emerald-400 font-mono-meta text-xs flex items-center gap-2">
                          <span>✓ Writer Pass generated & invitation letter copied to your clipboard!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
