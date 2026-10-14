import React, { useState } from 'react';
import { useNovel } from '../context/NovelContext';
import { DEFAULT_MASTER_KEY, DEFAULT_DEVELOPER_KEY } from '../services/db';

interface StudioAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StudioAuthModal: React.FC<StudioAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { authenticateStudio, setAuthRequired, developerBypass } = useNovel();
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!passcode.trim()) {
      setErrorMsg('Please enter your Master Key, Developer Key, or Writer Passcode.');
      return;
    }

    const res = authenticateStudio(passcode.trim());
    if (res.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleBypass = () => {
    setAuthRequired(false);
    onClose();
    if (onSuccess) onSuccess();
  };

  const handleDevAccess = () => {
    developerBypass();
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Studio Access Gate"
    >
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-[var(--bg)] border border-[var(--border)] p-6 sm:p-8 shadow-md z-10 space-y-6">
        <div className="space-y-1.5 text-center">
          <div className="font-mono-meta text-[10px] tracking-[0.24em] text-[var(--text-muted)] uppercase">
            ※ Scribe Sanctuary
          </div>
          <h2 className="font-editorial-title text-3xl text-[var(--text)]">
            Atelier Access
          </h2>
          <p className="font-editorial-body text-xs italic text-[var(--text-muted)] leading-relaxed">
            Enter the Developer Key, Master Key, or an authorized Writer Passcode to open manuscript controls.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] mb-1.5 uppercase">
              Access Passcode
            </label>
            <input
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Access Key..."
              className="w-full bg-[var(--paper-tint)]/40 border border-[var(--border)] px-3.5 py-2.5 text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[var(--text)] tracking-wider"
            />
            {errorMsg && (
              <p className="font-mono-meta text-[9.5px] text-red-700 mt-1.5">
                {errorMsg}
              </p>
            )}
            <div className="font-mono-meta text-[8.5px] text-[var(--text-faint)] mt-2 space-y-0.5">
              <div>Master Author: <span className="text-[var(--text)] select-all">{DEFAULT_MASTER_KEY}</span></div>
              <div>Lead Developer: <span className="text-[var(--text)] select-all">{DEFAULT_DEVELOPER_KEY}</span></div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full font-mono-meta text-xs tracking-[0.16em] py-2.5 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity cursor-pointer text-center"
            >
              UNLOCK STUDIO →
            </button>

            {/* 1-Click Developer Superuser Access */}
            <button
              type="button"
              onClick={handleDevAccess}
              className="w-full font-mono-meta text-[10px] tracking-wider py-2 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text)] transition-colors cursor-pointer text-center bg-[var(--paper-tint)]/40"
              title="One-click full developer superuser access"
            >
              ⚡ DEVELOPER ROOT ACCESS (ALL PRIVILEGES)
            </button>

            {/* Optional Open Bypass Button */}
            <button
              type="button"
              onClick={handleBypass}
              className="w-full font-mono-meta text-[9.5px] tracking-wider py-1 text-[var(--text-muted)] hover:text-[var(--text)] underline cursor-pointer text-center"
              title="Bypass passcode and disable lock"
            >
              Disable passcode requirement (Open Studio freely)
            </button>
          </div>
        </form>

        <div className="border-t border-[var(--border)] pt-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="font-mono-meta text-[9px] text-[var(--text-faint)] hover:text-[var(--text)] cursor-pointer"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
};
