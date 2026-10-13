import React, { useState } from 'react';
import { useNovel } from '../context/NovelContext';

interface ChapterSnapshotsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
  chapterTitle: string;
}

export const ChapterSnapshotsDrawer: React.FC<ChapterSnapshotsDrawerProps> = ({
  isOpen,
  onClose,
  chapterId,
  chapterTitle
}) => {
  const { currentWork, saveChapterSnapshot, restoreChapterSnapshot, deleteChapterSnapshot } = useNovel();
  const [snapshotNote, setSnapshotNote] = useState('');

  if (!isOpen) return null;

  const activeChapter = currentWork.chapters.find((c) => c.id === chapterId);
  const snapshots = activeChapter?.snapshots || [];

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    saveChapterSnapshot(chapterId, snapshotNote.trim() || undefined);
    setSnapshotNote('');
  };

  const handleRestore = (snapshotId: string) => {
    if (confirm('Restore this revision? Your current editor text will be replaced with this snapshot.')) {
      restoreChapterSnapshot(chapterId, snapshotId);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/35 backdrop-blur-[1px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Chapter Version History"
    >
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <aside className="relative w-full max-w-md h-full bg-[var(--bg)] border-l border-[var(--border)] p-6 sm:p-8 shadow-lg flex flex-col justify-between z-10 space-y-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
            <div>
              <div className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                ※ Manuscript History
              </div>
              <h2 className="font-editorial-title text-2xl text-[var(--text)]">
                Revisions & Snapshots
              </h2>
              <p className="font-editorial-body text-xs italic text-[var(--text-muted)] mt-0.5 truncate">
                {chapterTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="font-mono-meta text-xs tracking-wider px-2 py-1 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Create Snapshot Form */}
          <form onSubmit={handleCreateSnapshot} className="space-y-2 border border-[var(--border)] p-3 bg-[var(--paper-tint)]/30">
            <span className="font-mono-meta text-[9.5px] tracking-wider text-[var(--text-muted)] block uppercase">
              Save Current Progress Snapshot
            </span>
            <input
              type="text"
              value={snapshotNote}
              onChange={(e) => setSnapshotNote(e.target.value)}
              placeholder="Revision note (e.g. Before changing dialogue)..."
              className="w-full bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 text-xs font-editorial-body text-[var(--text)]"
            />
            <button
              type="submit"
              className="w-full font-mono-meta text-[10px] tracking-wider py-1.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 cursor-pointer text-center"
            >
              + TAKE CHAPTER SNAPSHOT
            </button>
          </form>

          {/* Snapshots List */}
          <div className="space-y-3">
            <div className="font-mono-meta text-[10px] text-[var(--text-muted)] tracking-wider">
              SAVED REVISIONS ({snapshots.length})
            </div>

            {snapshots.length === 0 ? (
              <div className="p-6 text-center text-xs font-editorial-body italic text-[var(--text-muted)] border border-dashed border-[var(--border)]">
                No previous snapshots saved for this chapter. Take a snapshot before attempting major structural revisions.
              </div>
            ) : (
              <div className="space-y-2">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 border border-[var(--border)] bg-[var(--bg)] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-editorial-body text-sm font-semibold text-[var(--text)] block">
                          {snap.note || 'Draft revision'}
                        </span>
                        <div className="font-mono-meta text-[9px] text-[var(--text-faint)] mt-0.5">
                          {new Date(snap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(snap.createdAt).toLocaleDateString()} · {snap.wordCount} words
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border)]/50">
                      <button
                        type="button"
                        onClick={() => handleRestore(snap.id)}
                        className="font-mono-meta text-[9px] px-2.5 py-1 border border-[var(--text)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
                      >
                        RESTORE THIS
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteChapterSnapshot(chapterId, snap.id)}
                        className="font-mono-meta text-[9px] px-2 py-1 text-[var(--text-faint)] hover:text-red-700 cursor-pointer"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-4 text-center">
          <p className="font-mono-meta text-[8.5px] text-[var(--text-faint)]">
            Snapshots are stored in local storage and included in database backups.
          </p>
        </div>
      </aside>
    </div>
  );
};
