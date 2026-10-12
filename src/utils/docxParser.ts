import mammoth from 'mammoth';
import type { Chapter, ChapterParagraph } from '../types/novel';

// Helper to convert integer to Roman numeral
export function toRomanNumeral(num: number): string {
  const map: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I']
  ];
  let result = '';
  let n = num;
  for (const [val, roman] of map) {
    while (n >= val) {
      result += roman;
      n -= val;
    }
  }
  return result || 'I';
}

export interface ParseDocxResult {
  chapters: Chapter[];
  detectedNovelTitle?: string;
  detectedAuthor?: string;
  rawTextPreview: string;
}

/**
 * Rule-based DOCX Content Extractor:
 * 1. Converts DOCX to clean HTML/text via Mammoth.
 * 2. Scans for Chapter patterns (H1/H2, "Chapter I", "Chapter 1: The Beginning", etc.).
 * 3. Extracts Epigraphs (leading quotes with attribution).
 * 4. Normalizes dialogue, narrative paragraphs, and asterism breaks (* * *).
 * 5. Calculates accurate word counts and reading estimates.
 */
export async function parseDocxFile(file: File): Promise<ParseDocxResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Convert via Mammoth
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawHtml = result.value || '';

  // Also get raw text for preview
  const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = rawTextResult.value || '';

  return parseHtmlContentToChapters(rawHtml, rawText, file.name);
}

export function parseHtmlContentToChapters(
  html: string,
  rawText: string,
  fallbackFilename = 'manuscript.docx'
): ParseDocxResult {
  // Create a temporary DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements = Array.from(doc.body.children);

  let detectedNovelTitle: string | undefined;
  let detectedAuthor: string | undefined;

  // Chapter separation buckets
  interface RawChapterBucket {
    title: string;
    elements: Element[];
  }

  const chapterBuckets: RawChapterBucket[] = [];
  let currentBucket: RawChapterBucket | null = null;

  // Chapter header detector regex
  const chapterRegex = /^(?:Chapter|CHAPTER|Folio|FOLIO|Part|PART|Book|BOOK)\s+([IVXLCDM\d]+)(?:\s*[:—–-]\s*|\s*[\n\r]\s*|\s+)(.*)$/i;
  const simpleChapterRegex = /^(?:Chapter|CHAPTER)\s+([IVXLCDM\d]+)$/i;

  elements.forEach((el, index) => {
    const text = el.textContent?.trim() || '';
    if (!text) return;

    // Check if this element marks a new chapter
    const isHeadingTag = ['H1', 'H2', 'H3'].includes(el.tagName);
    const matchesChapter = chapterRegex.exec(text) || simpleChapterRegex.exec(text);

    // If it's the very first element and has no chapter label, it might be the Novel Title
    if (index === 0 && isHeadingTag && !matchesChapter && !detectedNovelTitle) {
      detectedNovelTitle = text;
      return;
    }

    // Check for author byline e.g. "by Julian Thorne"
    if (index <= 2 && /^by\s+/i.test(text) && !detectedAuthor) {
      detectedAuthor = text.replace(/^by\s+/i, '').trim();
      return;
    }

    if (isHeadingTag || matchesChapter) {
      let title = text;
      if (matchesChapter) {
        // e.g., "Chapter 1: The Beginning" -> title = "The Beginning"
        const remainder = matchesChapter[2]?.trim();
        title = remainder || text;
      }

      currentBucket = {
        title,
        elements: []
      };
      chapterBuckets.push(currentBucket);
    } else {
      if (!currentBucket) {
        // Default first chapter if content starts before any explicit heading
        currentBucket = {
          title: detectedNovelTitle || fallbackFilename.replace(/\.[^/.]+$/, ''),
          elements: []
        };
        chapterBuckets.push(currentBucket);
      }
      currentBucket.elements.push(el);
    }
  });

  // If no buckets formed (empty file), return empty
  if (chapterBuckets.length === 0) {
    chapterBuckets.push({
      title: 'Chapter I',
      elements
    });
  }

  // Format into final Chapter structures
  const chapters: Chapter[] = chapterBuckets.map((bucket, idx) => {
    const chapterIndex = idx + 1;
    const numberRoman = toRomanNumeral(chapterIndex);
    const numberDisplay = String(chapterIndex).padStart(2, '0');
    const slug = `chapter-${numberDisplay}`;

    let epigraph: { quote: string; source: string } | undefined;
    const paragraphs: ChapterParagraph[] = [];

    // Parse elements in this chapter
    const pElements = bucket.elements;
    let checkedEpigraph = false;

    pElements.forEach((el, elIdx) => {
      const text = el.textContent?.trim() || '';
      if (!text) return;

      // Check for epigraph in first 2 elements
      if (!checkedEpigraph && elIdx < 3) {
        // Is it a blockquote or starts with quote and has an attribution?
        const isBlockquote = el.tagName === 'BLOCKQUOTE';
        const hasQuoteFormat = /^["“].*["”]/s.test(text);
        const attributionMatch = text.match(/(?:—|--|-)\s*([^—\n]+)$/);

        if (isBlockquote || (hasQuoteFormat && attributionMatch)) {
          let quote = text;
          let source = 'Marginalia';
          if (attributionMatch) {
            source = attributionMatch[1].trim();
            quote = text.replace(/(?:—|--|-)\s*[^—\n]+$/, '').trim();
          }
          // Remove surrounding quotes for clean storage
          quote = quote.replace(/^["“]|["”]$/g, '').trim();
          epigraph = { quote, source };
          checkedEpigraph = true;
          return;
        }
      }

      // Check for section break asterisms (* * *, ---, ※)
      if (/^(\*\s*\*\s*\*|—{3,}|※\s*※\s*※|#{3,})$/.test(text)) {
        paragraphs.push({
          text: '※   ※   ※',
          isBreak: true
        });
        return;
      }

      // Check for dialogue
      const isDialogue = /^["“'‘]/.test(text);

      paragraphs.push({
        text,
        isDialogue
      });
    });

    // Compute word count and reading time
    const totalWords = paragraphs.reduce((acc, p) => {
      return acc + (p.isBreak ? 0 : p.text.split(/\s+/).filter(Boolean).length);
    }, 0);

    const readingTimeMin = Math.max(1, Math.round(totalWords / 200));

    return {
      id: chapterIndex,
      numberRoman,
      numberDisplay,
      title: bucket.title || `Chapter ${numberRoman}`,
      slug,
      readingTimeMin,
      wordCount: totalWords,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
      epigraph,
      paragraphs,
      nextSlug: idx < chapterBuckets.length - 1 ? `chapter-${String(chapterIndex + 1).padStart(2, '0')}` : undefined,
      prevSlug: idx > 0 ? `chapter-${String(chapterIndex - 1).padStart(2, '0')}` : undefined
    };
  });

  return {
    chapters,
    detectedNovelTitle,
    detectedAuthor,
    rawTextPreview: rawText.slice(0, 500)
  };
}
