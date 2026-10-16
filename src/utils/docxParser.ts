import JSZip from 'jszip';
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

interface ParsedXmlParagraph {
  text: string;
  html: string;
  fontSize: number; // in half-points (e.g. 24 = 12pt, 36 = 18pt)
  isBold: boolean;
  isItalic: boolean;
  styleId: string | null;
  isHeadingStyle: boolean;
}

/**
 * Font-Size-First DOCX Manuscript Parser:
 * 1. Font Size Analysis:
 *    - Calculates the statistical distribution of font sizes across all paragraphs.
 *    - Identifies the body/normal font size (the most frequent font size, e.g. 11pt/12pt).
 *    - Identifies higher font sizes (distinctly larger than body text).
 *    - Distinguishes Primary Chapter Headers (highest recurring size) and Sub-parts / Subtitles (intermediate size).
 * 2. Structure Extraction:
 *    - Higher font size paragraphs become Chapter Headers.
 *    - Immediate follow-up higher/intermediate font size paragraphs become Chapter Sub-parts / Subtitles.
 *    - Normal font size paragraphs become Chapter Prose Content.
 * 3. Literary Features:
 *    - Epigraph detection (blockquotes or "Quote" — Author).
 *    - Section break detection (* * *, ***, ---, ※).
 *    - Typography normalization (smart quotes, em-dashes, whitespace cleanup).
 *    - Metadata calculation (225 words/min, word count, character count, Roman numerals).
 */
export async function parseDocxFile(file: File): Promise<ParseDocxResult> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    // Attempt font-size XML parsing using JSZip
    const result = await parseDocxWithFontSizes(arrayBuffer, file.name);
    if (result.chapters.length > 0) {
      return result;
    }
  } catch (err) {
    console.warn('Font-size XML parser encountered error, falling back to Mammoth:', err);
  }

  // Graceful fallback to Mammoth HTML parsing if XML extraction was not possible
  try {
    const mammothResult = await mammoth.convertToHtml({ arrayBuffer });
    const rawHtml = mammothResult.value || '';
    const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
    const rawText = rawTextResult.value || '';
    return parseHtmlContentToChapters(rawHtml, rawText, file.name);
  } catch (fallbackErr) {
    console.error('All DOCX parsing attempts failed:', fallbackErr);
    throw new Error('Could not parse DOCX manuscript.');
  }
}

/**
 * Extracts paragraphs and font sizes directly from DOCX OpenXML
 */
export async function parseDocxWithFontSizes(
  arrayBuffer: ArrayBuffer,
  fallbackFilename = 'manuscript.docx'
): Promise<ParseDocxResult> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Parse word/styles.xml to obtain default font size and named style metrics
  let defaultSizeHalfPt = 22; // 11pt default (22 half-points)
  const styleSizes: Record<string, number> = {};
  const styleNames: Record<string, string> = {};

  if (zip.file('word/styles.xml')) {
    const stylesXml = await zip.file('word/styles.xml')!.async('text');

    // Document default run font size
    const docDefMatch = stylesXml.match(/<w:docDefaults>[\s\S]*?<w:sz\s+[^>]*w:val=["'](\d+)["']/);
    if (docDefMatch) {
      defaultSizeHalfPt = parseInt(docDefMatch[1], 10);
    }

    // Named styles
    const styleMatches = stylesXml.match(/<w:style\b[\s\S]*?<\/w:style>/g) || [];
    for (const s of styleMatches) {
      const idMatch = s.match(/w:styleId=["']([^"']+)["']/);
      const nameMatch = s.match(/<w:name\s+[^>]*w:val=["']([^"']+)["']/);
      const szMatch = s.match(/<w:sz\s+[^>]*w:val=["'](\d+)["']/);
      if (idMatch) {
        const id = idMatch[1];
        if (nameMatch) styleNames[id] = nameMatch[1];
        if (szMatch) styleSizes[id] = parseInt(szMatch[1], 10);
      }
    }
  }

  // 2. Parse word/document.xml
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('DOCX archive missing word/document.xml');
  }

  const docXml = await docFile.async('text');
  const pMatches = docXml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || [];

  const rawParagraphs: ParsedXmlParagraph[] = [];

  for (const p of pMatches) {
    // Check style ID
    const styleMatch = p.match(/<w:pStyle\s+[^>]*w:val=["']([^"']+)["']/);
    const styleId = styleMatch ? styleMatch[1] : null;
    const styleName = styleId ? (styleNames[styleId] || styleId) : '';
    const isHeadingStyle = /heading\s*[1-6]|title|subtitle/i.test(styleName);

    // Paragraph-level properties
    const pPrSzMatch = p.match(/<w:pPr>[\s\S]*?<w:sz\s+[^>]*w:val=["'](\d+)["']/);
    const pSize = pPrSzMatch
      ? parseInt(pPrSzMatch[1], 10)
      : (styleId && styleSizes[styleId] ? styleSizes[styleId] : defaultSizeHalfPt);

    // Runs
    const runs = p.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
    const runSizes: number[] = [];
    let plainText = '';
    let htmlContent = '';
    let hasBold = false;
    let hasItalic = false;

    for (const r of runs) {
      const texts = (r.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || []).map((t) =>
        t.replace(/<[^>]+>/g, '')
      );
      const runText = texts.join('');
      if (!runText) continue;

      plainText += runText;

      const rSzMatch = r.match(/<w:sz\s+[^>]*w:val=["'](\d+)["']/);
      if (rSzMatch) {
        runSizes.push(parseInt(rSzMatch[1], 10));
      }

      const isRunBold = /<w:b(\s|\/|>)/.test(r);
      const isRunItalic = /<w:i(\s|\/|>)/.test(r);

      if (isRunBold) hasBold = true;
      if (isRunItalic) hasItalic = true;

      let runHtml = escapeHtml(runText);
      if (isRunBold) runHtml = `<strong>${runHtml}</strong>`;
      if (isRunItalic) runHtml = `<em>${runHtml}</em>`;
      htmlContent += runHtml;
    }

    const trimmedText = plainText.trim();
    if (!trimmedText) continue;

    const effectiveSize = runSizes.length > 0 ? Math.max(...runSizes) : pSize;

    rawParagraphs.push({
      text: trimmedText,
      html: htmlContent.trim(),
      fontSize: effectiveSize,
      isBold: hasBold,
      isItalic: hasItalic,
      styleId,
      isHeadingStyle
    });
  }

  if (rawParagraphs.length === 0) {
    throw new Error('Document contains no text paragraphs');
  }

  // 3. Font Size Distribution Analysis
  const sizeFrequency: Record<number, number> = {};
  for (const p of rawParagraphs) {
    sizeFrequency[p.fontSize] = (sizeFrequency[p.fontSize] || 0) + 1;
  }

  // The most frequent font size is the body/content font size (e.g. 11pt or 12pt)
  let bodyFontSize = defaultSizeHalfPt;
  let maxFreq = 0;
  for (const [sz, count] of Object.entries(sizeFrequency)) {
    if (count > maxFreq) {
      maxFreq = count;
      bodyFontSize = parseInt(sz, 10);
    }
  }

  // All distinct font sizes noticeably higher than normal body text
  const higherSizes = Object.keys(sizeFrequency)
    .map(Number)
    .filter((sz) => sz >= bodyFontSize * 1.15)
    .sort((a, b) => b - a);

  const maxFontSize = higherSizes[0] || bodyFontSize;

  // 4. Book Title and Author Identification
  let detectedNovelTitle: string | undefined;
  let detectedAuthor: string | undefined;
  let startIndex = 0;

  if (rawParagraphs.length > 0) {
    const firstP = rawParagraphs[0];
    // If paragraph 0 has a higher font size than body text and only appears once or has title style
    if (firstP.fontSize > bodyFontSize * 1.25 || /title/i.test(firstP.styleId || '')) {
      const countAtFirstSize = rawParagraphs.filter((p) => p.fontSize === firstP.fontSize).length;
      if (countAtFirstSize === 1 || /title/i.test(firstP.styleId || '')) {
        detectedNovelTitle = normalizeLiteraryTypography(firstP.text);
        startIndex = 1;
      }
    }
  }

  // Author byline check in first 3 paragraphs
  if (startIndex < rawParagraphs.length && /^by\s+/i.test(rawParagraphs[startIndex].text)) {
    detectedAuthor = normalizeLiteraryTypography(rawParagraphs[startIndex].text.replace(/^by\s+/i, ''));
    startIndex++;
  }

  // Determine chapter header size and subpart size
  const chapterHeaderCandidates = higherSizes.filter((sz) => {
    if (detectedNovelTitle && sz === maxFontSize && higherSizes.length > 1) return false;
    return true;
  });

  const primaryHeaderSize = chapterHeaderCandidates[0] || maxFontSize;
  const subpartSize = chapterHeaderCandidates.find((sz) => sz < primaryHeaderSize && sz > bodyFontSize * 1.1) || null;

  // Chapter markers regex: Chapter 1, Chapter I, Folio I, Book 1, etc.
  const chapterMarkerRegex = /^(?:Chapter|CHAPTER|Folio|FOLIO|Book|BOOK|Part|PART)\s+([IVXLCDM\d]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)(?:\s*[:—–-]\s*|\s*[\n\r]\s*|\s+|$)(.*)$/i;

  const isSectionBreak = (str: string) =>
    /^(\*\s*\*\s*\*|\*{3,}|—{2,}|-{3,}|※\s*※\s*※|※|- - -|\*\s*\*\s*\*\s*\*)$/.test(str.trim());

  interface ChapterBucket {
    title: string;
    subtitle?: string;
    paragraphs: ParsedXmlParagraph[];
  }

  const buckets: ChapterBucket[] = [];
  let currentBucket: ChapterBucket | null = null;

  for (let i = startIndex; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];
    const matchesMarker = chapterMarkerRegex.exec(p.text);
    const isHigherSizeHeader = p.fontSize >= primaryHeaderSize && p.fontSize > bodyFontSize * 1.12;
    const isHeadingTagOrStyle = p.isHeadingStyle;

    // Sub-part / Subtitle detection:
    // If the active chapter has just been created (has 0 prose paragraphs yet), and this paragraph
    // has a higher font size (subpart size) or starts with "Part / Sub / Section",
    // it belongs as the Sub-part / Subtitle of the current chapter!
    const isSubpartOfCurrent =
      currentBucket !== null &&
      !currentBucket.subtitle &&
      currentBucket.paragraphs.length === 0 &&
      (
        (subpartSize !== null && p.fontSize === subpartSize) ||
        (p.fontSize > bodyFontSize * 1.12 && p.fontSize < primaryHeaderSize) ||
        (/^(part|sub|section|act)\b/i.test(p.text) && p.fontSize >= bodyFontSize)
      );

    if (isSubpartOfCurrent && currentBucket) {
      currentBucket.subtitle = normalizeLiteraryTypography(p.text);
      continue;
    }

    // New Chapter condition:
    // 1. Font size is >= primaryHeaderSize (higher font size for header)
    // 2. OR Word heading style (Heading 1, Heading 2, etc.)
    // 3. OR explicit text marker (Chapter 1, Folio I, etc.)
    const isNewChapter = isHigherSizeHeader || isHeadingTagOrStyle || Boolean(matchesMarker);

    if (isNewChapter) {
      let title = p.text;

      if (matchesMarker && matchesMarker[2]?.trim()) {
        title = matchesMarker[2].trim();
      }

      currentBucket = {
        title: normalizeLiteraryTypography(title),
        subtitle: undefined,
        paragraphs: []
      };
      buckets.push(currentBucket);
    } else {
      // Normal content paragraph
      if (!currentBucket) {
        currentBucket = {
          title: detectedNovelTitle || fallbackFilename.replace(/\.[^/.]+$/, ''),
          subtitle: undefined,
          paragraphs: []
        };
        buckets.push(currentBucket);
      }
      currentBucket.paragraphs.push(p);
    }
  }

  // Fallback if no buckets formed
  if (buckets.length === 0) {
    buckets.push({
      title: 'Chapter I',
      paragraphs: rawParagraphs
    });
  }

  // Format into final Chapter structures
  const chapters: Chapter[] = buckets.map((bucket, idx) => {
    const chapterIndex = idx + 1;
    const numberRoman = toRomanNumeral(chapterIndex);
    const numberDisplay = String(chapterIndex).padStart(2, '0');
    const slug = `chapter-${numberDisplay}`;

    let epigraph: { quote: string; source: string } | undefined;
    const finalParagraphs: ChapterParagraph[] = [];
    const htmlParagraphs: string[] = [];

    bucket.paragraphs.forEach((p, elIdx) => {
      // 1. Epigraph detection in opening 3 paragraphs
      if (!epigraph && elIdx < 3) {
        const hasQuoteFormat = /^["“].*["”]/s.test(p.text);
        const attributionMatch = p.text.match(/(?:—|--|-)\s*([^—\n]+)$/);
        if (hasQuoteFormat && attributionMatch) {
          const source = attributionMatch[1].trim();
          const quote = p.text.replace(/(?:—|--|-)\s*[^—\n]+$/, '').trim().replace(/^["“]|["”]$/g, '');
          epigraph = {
            quote: normalizeLiteraryTypography(quote),
            source: normalizeLiteraryTypography(source)
          };
          return;
        }
      }

      // 2. Section Break / Asterism detection
      if (isSectionBreak(p.text)) {
        finalParagraphs.push({
          id: finalParagraphs.length + 1,
          text: '※   ※   ※',
          isBreak: true,
          isAsterism: true
        });
        htmlParagraphs.push('<div class="editorial-asterism text-center my-6">※</div>');
        return;
      }

      // 3. Normal Prose Content
      const normalized = normalizeLiteraryTypography(p.text);
      const isDialogue = /^["“'‘]/.test(normalized);

      finalParagraphs.push({
        id: finalParagraphs.length + 1,
        text: normalized,
        isDialogue
      });

      htmlParagraphs.push(`<p>${p.html || escapeHtml(normalized)}</p>`);
    });

    const totalWords = finalParagraphs.reduce(
      (acc, p) => acc + (p.isBreak ? 0 : p.text.split(/\s+/).filter(Boolean).length),
      0
    );
    const totalChars = finalParagraphs.reduce((acc, p) => acc + (p.isBreak ? 0 : p.text.length), 0);
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
      paragraphs: finalParagraphs,
      contentHtml: htmlParagraphs.join(''),
      nextSlug: idx < buckets.length - 1 ? `chapter-${String(chapterIndex + 1).padStart(2, '0')}` : undefined,
      prevSlug: idx > 0 ? `chapter-${String(chapterIndex - 1).padStart(2, '0')}` : undefined
    };
  });

  const rawPreview = rawParagraphs.slice(0, 5).map((p) => p.text).join('\n\n').slice(0, 600);

  return {
    chapters,
    detectedNovelTitle,
    detectedAuthor,
    rawTextPreview: rawPreview
  };
}

/**
 * Legacy HTML parsing method (used as fallback for HTML-only content)
 */
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

  const chapterMarkerRegex = /^(?:Chapter|CHAPTER|Folio|FOLIO|Part|PART|Section|SECTION|Book|BOOK)\s+([IVXLCDM\d]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s*[:—–-]\s*|\s*[\n\r]\s*|\s+|$)(.*)$/i;

  const isSectionBreak = (str: string) =>
    /^(\*\s*\*\s*\*|\*{3,}|—{2,}|-{3,}|※\s*※\s*※|※|- - -|\*\s*\*\s*\*\s*\*)$/.test(str.trim());

  elements.forEach((el, index) => {
    const rawContent = el.textContent?.trim() || '';
    if (!rawContent) return;

    const isHeadingTag = ['H1', 'H2', 'H3'].includes(el.tagName);
    const matchesMarker = chapterMarkerRegex.exec(rawContent);

    if (index === 0 && isHeadingTag && !matchesMarker && !detectedNovelTitle) {
      detectedNovelTitle = normalizeLiteraryTypography(rawContent);
      return;
    }

    if (index <= 2 && /^by\s+/i.test(rawContent) && !detectedAuthor) {
      detectedAuthor = normalizeLiteraryTypography(rawContent.replace(/^by\s+/i, ''));
      return;
    }

    if (isHeadingTag || matchesMarker) {
      let title = rawContent;
      if (matchesMarker && matchesMarker[2]?.trim()) {
        title = matchesMarker[2].trim();
      }

      currentBucket = {
        title: normalizeLiteraryTypography(title),
        subtitle: undefined,
        elements: []
      };
      chapterBuckets.push(currentBucket);
    } else {
      if (!currentBucket) {
        currentBucket = {
          title: detectedNovelTitle || fallbackFilename.replace(/\.[^/.]+$/, ''),
          elements: []
        };
        chapterBuckets.push(currentBucket);
      }
      currentBucket.elements.push(el);
    }
  });

  if (chapterBuckets.length === 0) {
    chapterBuckets.push({
      title: 'Chapter I',
      elements
    });
  }

  const chapters: Chapter[] = chapterBuckets.map((bucket, idx) => {
    const chapterIndex = idx + 1;
    const numberRoman = toRomanNumeral(chapterIndex);
    const numberDisplay = String(chapterIndex).padStart(2, '0');
    const slug = `chapter-${numberDisplay}`;

    let epigraph: { quote: string; source: string } | undefined;
    const paragraphs: ChapterParagraph[] = [];
    const htmlParagraphs: string[] = [];

    bucket.elements.forEach((el, elIdx) => {
      const text = el.textContent?.trim() || '';
      if (!text) return;

      if (!epigraph && elIdx < 3) {
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
          quote = quote.replace(/^["“]|["”]$/g, '').trim();
          epigraph = {
            quote: normalizeLiteraryTypography(quote),
            source: normalizeLiteraryTypography(source)
          };
          return;
        }
      }

      if (isSectionBreak(text)) {
        paragraphs.push({
          id: paragraphs.length + 1,
          text: '※   ※   ※',
          isBreak: true,
          isAsterism: true
        });
        htmlParagraphs.push('<div class="editorial-asterism text-center my-6">※</div>');
        return;
      }

      const normalized = normalizeLiteraryTypography(text);
      const isDialogue = /^["“'‘]/.test(normalized);

      paragraphs.push({
        id: paragraphs.length + 1,
        text: normalized,
        isDialogue
      });

      htmlParagraphs.push(`<p>${escapeHtml(normalized)}</p>`);
    });

    const totalWords = paragraphs.reduce((acc, p) => acc + (p.isBreak ? 0 : p.text.split(/\s+/).filter(Boolean).length), 0);
    const totalChars = paragraphs.reduce((acc, p) => acc + (p.isBreak ? 0 : p.text.length), 0);
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
      contentHtml: htmlParagraphs.join(''),
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
