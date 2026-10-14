import React from 'react';
import type { Chapter, Work } from '../types/novel';

interface ChapterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter;
  work: Work;
  onTriggerEpub: () => void;
  onTriggerPrint: () => void;
}

export const ChapterExportModal: React.FC<ChapterExportModalProps> = ({
  isOpen,
  onClose,
  chapter,
  work,
  onTriggerEpub,
  onTriggerPrint
}) => {
  if (!isOpen) return null;

  // 1. Download Current Chapter as Markdown
  const downloadChapterMarkdown = () => {
    let md = `# ${chapter.title}\n`;
    if (chapter.subtitle) md += `*${chapter.subtitle}*\n\n`;
    if (chapter.epigraph) {
      const quote = typeof chapter.epigraph === 'string' ? chapter.epigraph : chapter.epigraph.quote;
      const src = typeof chapter.epigraph === 'object' ? chapter.epigraph.source : chapter.epigraphAttribution;
      md += `> "${quote}"\n> — ${src || ''}\n\n`;
    }
    chapter.paragraphs.forEach((p) => {
      if (p.isAsterism || p.text.trim() === '※') {
        md += `\n※\n\n`;
      } else {
        md += `${p.text}\n\n`;
      }
    });

    triggerFileDownload(md, `${chapter.slug || 'chapter'}.md`, 'text/markdown');
  };

  // 2. Download Current Chapter as Plain Text
  const downloadChapterPlainText = () => {
    let txt = `${chapter.title.toUpperCase()}\n`;
    if (chapter.subtitle) txt += `${chapter.subtitle}\n`;
    txt += `----------------------------------------\n\n`;
    chapter.paragraphs.forEach((p) => {
      txt += `${p.text}\n\n`;
    });

    triggerFileDownload(txt, `${chapter.slug || 'chapter'}.txt`, 'text/plain');
  };

  // 3. Download Full Manuscript as Markdown
  const downloadFullManuscriptMarkdown = () => {
    let md = `# ${work.title}\n`;
    if (work.subtitle) md += `## ${work.subtitle}\n\n`;
    md += `By ${work.author}\n\n---\n\n`;

    work.chapters.forEach((ch, idx) => {
      md += `\n## Chapter ${ch.numberRoman || idx + 1}: ${ch.title}\n\n`;
      ch.paragraphs.forEach((p) => {
        if (p.isAsterism || p.text.trim() === '※') {
          md += `\n※\n\n`;
        } else {
          md += `${p.text}\n\n`;
        }
      });
      md += `\n---\n`;
    });

    triggerFileDownload(md, `${work.slug || 'manuscript'}_complete.md`, 'text/markdown');
  };

  const triggerFileDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Manuscript Export Hub"
    >
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] p-6 sm:p-8 shadow-2xl z-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
          <div>
            <div className="font-mono-meta text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
              ※ Typesetting & Distribution
            </div>
            <h2 className="font-editorial-title text-3xl text-[var(--text)]">
              Manuscript Export Hub
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono-meta text-xs tracking-wider px-2 py-1 border border-[var(--border)] hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors cursor-pointer"
          >
            [×]
          </button>
        </div>

        {/* Section 1: Active Chapter Formats */}
        <div className="space-y-3">
          <span className="font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] uppercase block">
            THIS CHAPTER (CHAPTER {chapter.numberRoman} — {chapter.title})
          </span>

          <div className="grid grid-cols-2 gap-2 font-mono-meta text-xs">
            <button
              type="button"
              onClick={downloadChapterMarkdown}
              className="p-3 border border-[var(--border)] hover:border-[var(--text)] text-left space-y-1 transition-colors cursor-pointer bg-[var(--paper-tint)]/20"
            >
              <div className="font-semibold text-[var(--text)]">MARKDOWN (.md)</div>
              <p className="text-[10px] text-[var(--text-muted)] font-editorial-body italic">
                Clean headings, epigraph blockquotes, and dividers
              </p>
            </button>

            <button
              type="button"
              onClick={downloadChapterPlainText}
              className="p-3 border border-[var(--border)] hover:border-[var(--text)] text-left space-y-1 transition-colors cursor-pointer bg-[var(--paper-tint)]/20"
            >
              <div className="font-semibold text-[var(--text)]">PLAIN TEXT (.txt)</div>
              <p className="text-[10px] text-[var(--text-muted)] font-editorial-body italic">
                Raw prose formatted for archiving or plain editors
              </p>
            </button>
          </div>
        </div>

        {/* Section 2: Complete Work Formats */}
        <div className="space-y-3 pt-2 border-t border-[var(--border)]">
          <span className="font-mono-meta text-[10px] tracking-wider text-[var(--text-muted)] uppercase block">
            COMPLETE NOVEL ({work.chapters.length} CHAPTERS · {work.wordCount || 0} WORDS)
          </span>

          <div className="grid grid-cols-2 gap-2 font-mono-meta text-xs">
            <button
              type="button"
              onClick={() => {
                onTriggerEpub();
                onClose();
              }}
              className="p-3 border border-[var(--border)] hover:border-[var(--text)] text-left space-y-1 transition-colors cursor-pointer bg-[var(--paper-tint)]/20"
            >
              <div className="font-semibold text-[var(--text)]">EPUB 3 (.epub)</div>
              <p className="text-[10px] text-[var(--text-muted)] font-editorial-body italic">
                Standard reflowable e-book for Apple Books & Kindle
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                onTriggerPrint();
                onClose();
              }}
              className="p-3 border border-[var(--border)] hover:border-[var(--text)] text-left space-y-1 transition-colors cursor-pointer bg-[var(--paper-tint)]/20"
            >
              <div className="font-semibold text-[var(--text)]">PRINT / PDF</div>
              <p className="text-[10px] text-[var(--text-muted)] font-editorial-body italic">
                Hardcover margins, roman folios, and print CSS
              </p>
            </button>

            <button
              type="button"
              onClick={downloadFullManuscriptMarkdown}
              className="col-span-2 p-3 border border-[var(--border)] hover:border-[var(--text)] text-left space-y-1 transition-colors cursor-pointer bg-[var(--paper-tint)]/20"
            >
              <div className="font-semibold text-[var(--text)]">FULL MANUSCRIPT MARKDOWN (.md)</div>
              <p className="text-[10px] text-[var(--text-muted)] font-editorial-body italic">
                Complete omnibus edition formatted in Markdown with chapter breaks
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
