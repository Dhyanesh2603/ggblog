import React, { useState } from 'react';

interface FindReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  onReplaceAll: (findText: string, replaceText: string, matchCase: boolean) => void;
  currentContentText: string;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  onClose,
  onReplaceAll,
  currentContentText
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  if (!isOpen) return null;

  // Calculate occurrences
  let matchCount = 0;
  if (findText.trim()) {
    try {
      const regex = new RegExp(
        findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        matchCase ? 'g' : 'gi'
      );
      const matches = currentContentText.match(regex);
      matchCount = matches ? matches.length : 0;
    } catch {}
  }

  const handleExecuteReplaceAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findText) return;
    onReplaceAll(findText, replaceText, matchCase);
  };

  return (
    <div className="border-b border-[var(--border)] bg-[var(--paper-tint)]/70 px-4 sm:px-8 py-2.5 flex items-center justify-between gap-3 text-xs font-mono-meta flex-wrap animate-fade-in shadow-inner">
      <form onSubmit={handleExecuteReplaceAll} className="flex items-center gap-2 flex-wrap flex-1">
        <span className="text-[var(--text-muted)] text-[10px] tracking-wider uppercase font-semibold">
          FIND & REPLACE:
        </span>

        {/* Find Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            autoFocus
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Search in chapter..."
            className="bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text)] focus:border-[var(--text)] outline-none w-44 sm:w-52"
          />
          {findText && (
            <span className="absolute right-2 text-[9px] text-[var(--text-muted)]">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>

        {/* Replace Input */}
        <input
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Replace with..."
          className="bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text)] focus:border-[var(--text)] outline-none w-44 sm:w-52"
        />

        {/* Match Case Toggle */}
        <button
          type="button"
          onClick={() => setMatchCase(!matchCase)}
          className={`px-2 py-1 border transition-colors cursor-pointer text-[10px] ${
            matchCase
              ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-bold'
              : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text)]'
          }`}
          title="Toggle Match Case"
        >
          Aa
        </button>

        {/* Action Button */}
        <button
          type="submit"
          disabled={!findText || matchCount === 0}
          className="px-3 py-1 bg-[var(--text)] text-[var(--bg)] hover:opacity-85 transition-opacity cursor-pointer disabled:opacity-40 text-[10px] tracking-wider font-semibold"
        >
          REPLACE ALL ({matchCount})
        </button>
      </form>

      <button
        type="button"
        onClick={onClose}
        className="px-2 py-1 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer text-[10px]"
      >
        DONE [×]
      </button>
    </div>
  );
};
