import React from 'react';
import type { Chapter } from '../types/novel';

interface LiteraryInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter;
}

export const LiteraryInspectorModal: React.FC<LiteraryInspectorModalProps> = ({
  isOpen,
  onClose,
  chapter
}) => {
  if (!isOpen) return null;

  // Extract all plain text from chapter paragraphs
  const allText = chapter.paragraphs.map((p) => p.text).join(' ');
  const words = allText.trim() ? allText.trim().split(/\s+/) : [];
  const wordCount = words.length;
  const charCount = allText.length;

  // Sentences count
  const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;
  const avgSentenceLength = Math.round((wordCount / sentenceCount) * 10) / 10;

  // Dialogue ratio calculation
  const dialogueMatches = allText.match(/[“"][^”"]+[”"]/g) || [];
  const dialogueWords = dialogueMatches.reduce((acc, match) => {
    return acc + match.trim().split(/\s+/).length;
  }, 0);
  const dialoguePercent = wordCount > 0 ? Math.round((dialogueWords / wordCount) * 100) : 0;
  const narrativePercent = 100 - dialoguePercent;

  // Lexical diversity (Unique words / Total words)
  const cleanWords = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
  const uniqueWords = new Set(cleanWords).size;
  const lexicalDiversity = wordCount > 0 ? Math.round((uniqueWords / cleanWords.length) * 100) : 0;

  // Section breaks count
  const asterismsCount = chapter.paragraphs.filter((p) => p.isAsterism || p.text.trim() === '※').length;

  // Approximate Flesch Reading Ease
  // 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
  const syllables = cleanWords.reduce((acc, word) => {
    const vowels = word.match(/[aeiouy]{1,2}/g);
    return acc + (vowels ? vowels.length : 1);
  }, 0);
  const flesch = wordCount > 0 && sentenceCount > 0
    ? Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount))))
    : 70;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Literary Metrics Inspector"
    >
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] p-6 sm:p-8 shadow-2xl z-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
          <div>
            <div className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              ※ Editorial Stylometry & Pacing
            </div>
            <h2 className="font-editorial-title text-3xl text-[var(--text)]">
              Literary Prose Inspector
            </h2>
            <p className="font-editorial-body text-xs italic text-[var(--text-muted)] mt-0.5">
              Chapter {chapter.numberRoman} — {chapter.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono-meta text-xs tracking-wider px-2 py-1 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
          >
            [×]
          </button>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-3 gap-3 font-mono-meta text-xs">
          <div className="p-3 border border-[var(--border)] bg-[var(--paper-tint)]/40">
            <span className="text-[var(--text-muted)] block text-[9.5px] uppercase">TOTAL WORDS</span>
            <span className="text-xl font-bold text-[var(--text)]">{wordCount.toLocaleString()}</span>
          </div>

          <div className="p-3 border border-[var(--border)] bg-[var(--paper-tint)]/40">
            <span className="text-[var(--text-muted)] block text-[9.5px] uppercase">CHARACTERS</span>
            <span className="text-xl font-bold text-[var(--text)]">{charCount.toLocaleString()}</span>
          </div>

          <div className="p-3 border border-[var(--border)] bg-[var(--paper-tint)]/40">
            <span className="text-[var(--text-muted)] block text-[9.5px] uppercase">EST. READING</span>
            <span className="text-xl font-bold text-[var(--text)]">{Math.ceil(wordCount / 225)} min</span>
          </div>
        </div>

        {/* Cadence & Stylometrics */}
        <div className="space-y-4 pt-1">
          {/* Dialogue vs Narrative Balance Bar */}
          <div className="space-y-1.5 font-mono-meta text-xs">
            <div className="flex justify-between text-[10px]">
              <span className="text-[var(--text-muted)]">DIALOGUE: {dialoguePercent}%</span>
              <span className="text-[var(--text-muted)]">NARRATIVE PROSE: {narrativePercent}%</span>
            </div>
            <div className="w-full h-2 border border-[var(--border)] flex overflow-hidden">
              <div
                style={{ width: `${dialoguePercent}%` }}
                className="bg-[var(--text)] transition-all duration-300"
                title={`Dialogue: ${dialoguePercent}%`}
              />
              <div
                style={{ width: `${narrativePercent}%` }}
                className="bg-[var(--border)] transition-all duration-300"
                title={`Narrative: ${narrativePercent}%`}
              />
            </div>
          </div>

          {/* Metrics List */}
          <div className="border border-[var(--border)] divide-y divide-[var(--border)] font-mono-meta text-xs">
            <div className="p-2.5 flex items-center justify-between">
              <span className="text-[var(--text-muted)]">AVERAGE SENTENCE CADENCE</span>
              <span className="font-semibold text-[var(--text)]">{avgSentenceLength} words / sentence</span>
            </div>

            <div className="p-2.5 flex items-center justify-between">
              <span className="text-[var(--text-muted)]">LEXICAL DIVERSITY (VOCABULARY)</span>
              <span className="font-semibold text-[var(--text)]">{lexicalDiversity}% unique words</span>
            </div>

            <div className="p-2.5 flex items-center justify-between">
              <span className="text-[var(--text-muted)]">READING EASE INDEX (FLESCH)</span>
              <span className="font-semibold text-[var(--text)]">
                {flesch} / 100 {flesch > 60 ? '(Fluid Literary)' : '(Dense / Academic)'}
              </span>
            </div>

            <div className="p-2.5 flex items-center justify-between">
              <span className="text-[var(--text-muted)]">EDITORIAL SECTION ASTERISMS (※)</span>
              <span className="font-semibold text-[var(--text)]">{asterismsCount} breaks</span>
            </div>
          </div>
        </div>

        {/* Tip / Advice */}
        <div className="p-3 border border-[var(--border)] bg-[var(--paper-tint)]/20 font-editorial-body text-xs italic text-[var(--text-muted)]">
          "A novel lives in the alternating rhythm of compression and expansion. Alternate brisk dialogue exchanges with measured, sensory descriptive paragraphs."
        </div>
      </div>
    </div>
  );
};
