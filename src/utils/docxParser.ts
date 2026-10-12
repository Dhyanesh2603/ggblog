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

/**
 * Normalizes literary typography:
 * - Dialogue & em dashes: double/triple hyphens to true em-dash (—)
 * - Smart curly double quotes (“ ”)
 * - Smart curly single quotes and apostrophes (‘ ’)
 * - Cleans double spaces
 */
export function normalizeLiteraryTypography(text: string): string {
  if (!text) return '';
  let s = text;
  // Convert hyphens to em dashes
  s = s.replace(/---/g, '—').replace(/--/g, '—');
  // Collapse duplicate horizontal spaces
  s = s.replace(/[ \t]{2,}/g, ' ');
  // Smart double quotes: opening vs closing
  s = s.replace(/(^|[\s(\[{<])"/g, '$1“');
  s = s.replace(/"/g, '”');
  // Smart single quotes & apostrophes
  s = s.replace(/(^|[\s(\[{<])'/g, '$1‘');
  s = s.replace(/'/g, '’');
  return s.trim();
}

export interface ParseDocxResult {
  chapters: Chapter[];
  detectedNovelTitle?: string;
  detectedAuthor?: string;
  rawTextPreview: string;
}

/**
 * Professional Rule-Based DOCX Manuscript Parser:
 * 1. Heading Detection: H1 & H2 automatically trigger new chapters.
 * 2. Text Marker Detection: Chapter 1, Chapter I, CHAPTER ONE, Folio I, Part I, Section 1.
 * 3. Blockquote Detection: extracts blockquotes or quotes with attribution as Chapter Epigraph.
 * 4. Section Break Detection: * * *, ***, ---, ※ converted to editorial asterisms.
 * 5. Typography Normalization: curly quotes, em-dashes, apostrophes, double spaces.
 * 6. Metadata Extraction: word count, character count, reading time (225 words/min).
 */
export async function parseDocxFile(file: File): Promise<ParseDocxResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Convert via Mammoth
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawHtml = result.value || '';

  // Extract raw text for preview
  const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = rawTextResult.value || '';

  return parseHtmlContentToChapters(rawHtml, rawText, file.name);
}

export function parseHtmlContentToChapters(
  html: string,
  rawText: string,
  fallbackFilename = 'manuscript.docx'
): ParseDocxResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements = Array.from(doc.body.children);

  let detectedNovelTitle: string | undefined;
  let detectedAuthor: string | undefined;

  interface RawChapterBucket {
    title: string;
    subtitle?: string;
    elements: Element[];
  }

  const chapterBuckets: RawChapterBucket[] = [];
  let currentBucket: RawChapterBucket | null = null;

  // Chapter markers regex: Chapter 1, Chapter I, CHAPTER ONE, Folio I, Part I, Section 1
  const chapterMarkerRegex = /^(?:Chapter|CHAPTER|Folio|FOLIO|Part|PART|Section|SECTION|Book|BOOK)\s+([IVXLCDM\d]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)(?:\s*[:—–-]\s*|\s*[\n\r]\s*|\s+|$)(.*)$/i;
  const standaloneChapterRegex = /^(?:Chapter|CHAPTER|Folio|FOLIO|Part|PART|Section|SECTION)\s+([IVXLCDM\d]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)$/i;

  // Section break detector: * * *, ***, ---, ※, - - -
  const isSectionBreak = (str: string) =>
    /^(\*\s*\*\s*\*|\*{3,}|—{2,}|-{3,}|※\s*※\s*※|※|- - -|\*\s*\*\s*\*\s*\*)$/.test(str.trim());

  elements.forEach((el, index) => {
    const rawContent = el.textContent?.trim() || '';
    if (!rawContent) return;

    // Check heading tags (H1 and H2 per specification)
    const isHeadingTag = ['H1', 'H2'].includes(el.tagName);
    const matchesMarker = chapterMarkerRegex.exec(rawContent) || standaloneChapterRegex.exec(rawContent);

    // If it's the very first element and has no chapter label, it is likely the Book Title
    if (index === 0 && isHeadingTag && !matchesMarker && !detectedNovelTitle) {
      detectedNovelTitle = normalizeLiteraryTypography(rawContent);
      return;
    }

    // Check for author byline e.g. "by Julian Thorne"
    if (index <= 2 && /^by\s+/i.test(rawContent) && !detectedAuthor) {
      detectedAuthor = normalizeLiteraryTypography(rawContent.replace(/^by\s+/i, ''));
      return;
    }

    if (isHeadingTag || matchesMarker) {
      let title = rawContent;
      let subtitle: string | undefined;

      if (matchesMarker) {
        const remainder = matchesMarker[2]?.trim();
        if (remainder) {
          title = remainder;
        } else {
          title = rawContent;
        }
      }

      currentBucket = {
        title: normalizeLiteraryTypography(title),
        subtitle,
        elements: []
      };
      chapterBuckets.push(currentBucket);
    } else {
      if (!currentBucket) {
        // Default first chapter if content begins before an explicit heading
        currentBucket = {
          title: detectedNovelTitle || fallbackFilename.replace(/\.[^/.]+$/, ''),
          elements: []
        };
        chapterBuckets.push(currentBucket);
      }
      currentBucket.elements.push(el);
    }
  });

  // If no buckets formed (empty file), return single fallback bucket
  if (chapterBuckets.length === 0) {
    chapterBuckets.push({
      title: 'Chapter I',
      elements
    });
  }

  // Format into final Chapter structures with full editorial rules
  const chapters: Chapter[] = chapterBuckets.map((bucket, idx) => {
    const chapterIndex = idx + 1;
    const numberRoman = toRomanNumeral(chapterIndex);
    const numberDisplay = String(chapterIndex).padStart(2, '0');
    const slug = `chapter-${numberDisplay}`;

    let epigraph: { quote: string; source: string } | undefined;
    const paragraphs: ChapterParagraph[] = [];

    const pElements = bucket.elements;
    let checkedEpigraph = false;

    pElements.forEach((el, elIdx) => {
      const text = el.textContent?.trim() || '';
      if (!text) return;

      // 1. Blockquote Detection: Tag or Leading Quote with Attribution
      if (!checkedEpigraph && elIdx < 3) {
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
          // Clean quotes
          quote = quote.replace(/^["“]|["”]$/g, '').trim();
          epigraph = {
            quote: normalizeLiteraryTypography(quote),
            source: normalizeLiteraryTypography(source)
          };
          checkedEpigraph = true;
          return;
        }
      }

      // 2. Section Break Detection (* * *, ***, ---, ※)
      if (isSectionBreak(text)) {
        paragraphs.push({
          text: '※   ※   ※',
          isBreak: true
        });
        return;
      }

      // 3. Narrative & Dialogue Paragraphs with Typography Normalization
      const normalized = normalizeLiteraryTypography(text);
      const isDialogue = /^["“'‘]/.test(normalized);

      paragraphs.push({
        text: normalized,
        isDialogue
      });
    });

    // 4. Metadata Extraction: Word count, Character count, Reading time (225 wpm)
    const totalWords = paragraphs.reduce((acc, p) => {
      return acc + (p.isBreak ? 0 : p.text.split(/\s+/).filter(Boolean).length);
    }, 0);

    const totalChars = paragraphs.reduce((acc, p) => {
      return acc + (p.isBreak ? 0 : p.text.length);
    }, 0);

    const readingTimeMin = Math.max(1, Math.round(totalWords / 225));

    return {
      id: chapterIndex,
      numberRoman,
      numberDisplay,
      title: bucket.title || `Chapter ${numberRoman}`,
      subtitle: bucket.subtitle,
      slug,
      readingTimeMin,
      wordCount: totalWords,
      characterCount: totalChars,
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
