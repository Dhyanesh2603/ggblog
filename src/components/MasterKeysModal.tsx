import React, { useState } from 'react';
import { useNovel } from '../context/NovelContext';

interface MasterKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterKeysModal: React.FC<MasterKeysModalProps> = ({ isOpen, onClose }) => {
  const {
    accessKeys,
    generateWriterKey,
    revokeAccessKey,
    updateMasterKey,
    isAuthRequired,
    setAuthRequired
  } = useNovel();

  const [newWriterLabel, setNewWriterLabel] = useState('');
  const [editingMasterKey, setEditingMasterKey] = useState(false);
  const [newMasterKeyValue, setNewMasterKeyValue] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const masterKeyObj = accessKeys.find((k) => k.role === 'master');
  const writerKeys = accessKeys.filter((k) => k.role === 'writer');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const key = generateWriterKey(newWriterLabel.trim() || 'Invited Writer');
    setNewWriterLabel('');
    setCopiedKey(key.code);
    navigator.clipboard.writeText(key.code);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(code);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyInviteLink = (code: string) => {
    const link = `${window.location.origin}/studio?key=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(link);
    setCopiedKey(code);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveNewMasterKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMasterKeyValue.trim()) {
      updateMasterKey(newMasterKeyValue.trim());
      setEditingMasterKey(false);
      setNewMasterKeyValue('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Master Key Governance"
    >
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-[var(--bg)] border border-[var(--border)] p-6 sm:p-8 shadow-md z-10 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
          <div>
            <div className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              ※ Sovereign Author Controls
            </div>
            <h2 className="font-editorial-title text-3xl text-[var(--text)]">
              Master Key & Writer Delegation
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

        {/* 1. Master Passcode Card */}
        <div className="p-4 border border-[var(--border)] bg-[var(--paper-tint)]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] block uppercase">
                YOUR MASTER KEY (SUPER ADMIN)
              </span>
              <span className="font-mono text-sm font-semibold tracking-wider text-[var(--text)]">
                {masterKeyObj?.code || 'ATELIER-MASTER-2026'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(masterKeyObj?.code || 'ATELIER-MASTER-2026')}
                className="font-mono-meta text-[9.5px] px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] cursor-pointer"
              >
                {copiedKey === masterKeyObj?.code ? 'COPIED!' : 'COPY KEY'}
              </button>
              <button
                type="button"
                onClick={() => setEditingMasterKey(!editingMasterKey)}
                className="font-mono-meta text-[9.5px] px-2.5 py-1 border border-[var(--border)] hover:border-[var(--text)] cursor-pointer"
              >
                {editingMasterKey ? 'CANCEL' : 'CHANGE KEY'}
              </button>
            </div>
          </div>

          {editingMasterKey && (
            <form onSubmit={handleSaveNewMasterKey} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={newMasterKeyValue}
                onChange={(e) => setNewMasterKeyValue(e.target.value)}
                placeholder="Enter new Master Key..."
                className="flex-1 bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--text)]"
              />
              <button
                type="submit"
                className="font-mono-meta text-[10px] px-3 py-1.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 cursor-pointer"
              >
                SAVE KEY
              </button>
            </form>
          )}

          {/* Optional Gate Toggle */}
          <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between font-mono-meta text-[10px]">
            <span className="text-[var(--text-muted)]">REQUIRE PASSCODE TO ACCESS STUDIO:</span>
            <button
              type="button"
              onClick={() => setAuthRequired(!isAuthRequired)}
              className={`px-2.5 py-1 border transition-colors cursor-pointer ${
                isAuthRequired
                  ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-medium'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)]'
              }`}
            >
              {isAuthRequired ? 'LOCKED (PASSCODE REQUIRED)' : 'UNLOCKED (OPEN ACCESS)'}
            </button>
          </div>
        </div>

        {/* 2. Generate New Writer Key */}
        <div className="space-y-3">
          <div className="font-mono-meta text-[10.5px] tracking-wider text-[var(--text-muted)] uppercase">
            GRANT WRITER ACCESS
          </div>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newWriterLabel}
              onChange={(e) => setNewWriterLabel(e.target.value)}
              placeholder="Writer Name / Note (e.g. Co-Author Sarah)..."
              className="flex-1 bg-[var(--paper-tint)]/40 border border-[var(--border)] px-3 py-2 text-xs font-mono-meta text-[var(--text)]"
            />
            <button
              type="submit"
              className="font-mono-meta text-xs tracking-wider px-4 py-2 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity cursor-pointer shrink-0"
            >
              + ISSUE WRITER PASS
            </button>
          </form>
        </div>

        {/* 3. Existing Writer Keys Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between font-mono-meta text-[10px] text-[var(--text-muted)] tracking-wider">
            <span>ACTIVE WRITER PASSES ({writerKeys.filter((k) => !k.revoked).length})</span>
            <span>ONLY WRITERS WITH ACTIVE KEYS CAN DRAFT</span>
          </div>

          <div className="border border-[var(--border)] divide-y divide-[var(--border)]">
            {writerKeys.length === 0 ? (
              <div className="p-6 text-center text-xs font-editorial-body italic text-[var(--text-muted)]">
                No external writers issued yet. Your friend is currently the sole authorized author.
              </div>
            ) : (
              writerKeys.map((k) => (
                <div
                  key={k.code}
                  className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    k.revoked ? 'opacity-40 bg-[var(--paper-tint)]/20' : 'bg-[var(--bg)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold tracking-wider text-[var(--text)]">
                        {k.code}
                      </span>
                      {k.revoked ? (
                        <span className="font-mono-meta text-[8.5px] px-1.5 py-0.2 border border-red-700 text-red-700">
                          REVOKED
                        </span>
                      ) : (
                        <span className="font-mono-meta text-[8.5px] px-1.5 py-0.2 border border-[var(--border)] text-[var(--text)]">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="font-editorial-body text-xs text-[var(--text-muted)] italic mt-0.5">
                      {k.label} · Issued {new Date(k.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {!k.revoked && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(k.code)}
                        className="font-mono-meta text-[9px] px-2 py-1 border border-[var(--border)] hover:border-[var(--text)] cursor-pointer"
                      >
                        {copiedKey === k.code ? 'COPIED!' : 'COPY PASS'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyInviteLink(k.code)}
                        className="font-mono-meta text-[9px] px-2 py-1 border border-[var(--border)] hover:border-[var(--text)] cursor-pointer"
                      >
                        COPY LINK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Revoke writer pass "${k.code}"? They will immediately lose studio access.`)) {
                            revokeAccessKey(k.code);
                          }
                        }}
                        className="font-mono-meta text-[9px] px-2 py-1 border border-[var(--border)] text-red-700 hover:border-red-700 cursor-pointer"
                      >
                        REVOKE
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
