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
  headingLevel: number | null;
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
    // Check style ID and named style metrics
    const styleMatch = p.match(/<w:pStyle\s+[^>]*w:val=["']([^"']+)["']/);
    const styleId = styleMatch ? styleMatch[1] : null;
    const styleName = styleId ? (styleNames[styleId] || styleId) : '';

    let headingLevel: number | null = null;
    if (styleName) {
      const hMatch = styleName.match(/heading\s*(\d)/i);
      if (hMatch) {
        headingLevel = parseInt(hMatch[1], 10);
      } else if (/^title$/i.test(styleName)) {
        headingLevel = 1;
      } else if (/^subtitle$/i.test(styleName)) {
        headingLevel = 2;
      }
    }

    // Paragraph-level properties
    const pPrSzMatch = p.match(/<w:pPr>[\s\S]*?<w:sz\s+[^>]*w:val=["'](\d+)["']/);
    const pSize = pPrSzMatch
      ? parseInt(pPrSzMatch[1], 10)
      : (styleId && styleSizes[styleId] ? styleSizes[styleId] : defaultSizeHalfPt);

    // Runs
    const runs = p.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
    const runSizesWithLength: { size: number; len: number }[] = [];
    let plainText = '';
    let htmlContent = '';
    let hasBold = false;
    let hasItalic = false;

    for (const r of runs) {
      const hasBreak = /<w:br\b/.test(r);
      const texts = (r.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || []).map((t) =>
        t.replace(/<[^>]+>/g, '')
      );
      const runText = texts.join('') + (hasBreak ? '\n' : '');
      if (!runText && !hasBreak) continue;

      plainText += runText;

      const rSzMatch = r.match(/<w:sz\s+[^>]*w:val=["'](\d+)["']/);
      const rSize = rSzMatch ? parseInt(rSzMatch[1], 10) : pSize;
      runSizesWithLength.push({ size: rSize, len: runText.length || 1 });

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

    let effectiveSize = pSize;
    if (runSizesWithLength.length > 0) {
      const sizeCharWeight: Record<number, number> = {};
      for (const item of runSizesWithLength) {
        sizeCharWeight[item.size] = (sizeCharWeight[item.size] || 0) + item.len;
      }
      let maxWeight = 0;
      for (const [sz, weight] of Object.entries(sizeCharWeight)) {
        if (weight > maxWeight) {
          maxWeight = weight;
          effectiveSize = parseInt(sz, 10);
        }
      }
      const maxRunSize = Math.max(...runSizesWithLength.map((x) => x.size));
      if (maxRunSize > effectiveSize && trimmedText.length < 150) {
        effectiveSize = maxRunSize;
      }
    }

    rawParagraphs.push({
      text: trimmedText,
      html: htmlContent.trim(),
      fontSize: effectiveSize,
      isBold: hasBold,
      isItalic: hasItalic,
      styleId,
      headingLevel
    });
  }

  if (rawParagraphs.length === 0) {
    throw new Error('Document contains no text paragraphs');
  }

  // 3. Font Size Distribution Analysis
  const sizeCharCount: Record<number, number> = {};
  const sizeFreq: Record<number, number> = {};

  for (const p of rawParagraphs) {
    sizeCharCount[p.fontSize] = (sizeCharCount[p.fontSize] || 0) + p.text.length;
    sizeFreq[p.fontSize] = (sizeFreq[p.fontSize] || 0) + 1;
  }

  // The body / least font size carries the bulk of text across the manuscript
  let bodyFontSize = defaultSizeHalfPt;
  let maxChars = 0;
  for (const [szStr, chars] of Object.entries(sizeCharCount)) {
    if (chars > maxChars) {
      maxChars = chars;
      bodyFontSize = parseInt(szStr, 10);
    }
  }

  // Distinct font sizes noticeably higher than normal body text (>= bodyFontSize * 1.12)
  const distinctlyHigherSizes = Object.keys(sizeCharCount)
    .map(Number)
    .filter((sz) => sz >= Math.round(bodyFontSize * 1.12))
    .sort((a, b) => b - a);

  // 4. Book Title and Author Identification
  let detectedNovelTitle: string | undefined;
  let detectedAuthor: string | undefined;
  let startIndex = 0;

  if (rawParagraphs.length > 0) {
    const firstP = rawParagraphs[0];
    if (
      (distinctlyHigherSizes.length > 0 &&
        firstP.fontSize === distinctlyHigherSizes[0] &&
        sizeFreq[firstP.fontSize] === 1 &&
        rawParagraphs.length > 2) ||
      (firstP.headingLevel === 1 && /title/i.test(firstP.styleId || ''))
    ) {
      detectedNovelTitle = normalizeLiteraryTypography(firstP.text);
      startIndex = 1;
    }
  }

  // Author byline check in first 3 paragraphs
  if (startIndex < rawParagraphs.length && /^by\s+/i.test(rawParagraphs[startIndex].text)) {
    detectedAuthor = normalizeLiteraryTypography(rawParagraphs[startIndex].text.replace(/^by\s+/i, ''));
    startIndex++;
  }

  // Candidate heading sizes for chapters (excluding standalone novel title if detected)
  const chapterCandidateSizes = distinctlyHigherSizes.filter((sz) => {
    if (detectedNovelTitle && sz === rawParagraphs[0].fontSize && sizeFreq[sz] === 1) {
      return false;
    }
    return true;
  });

  // 3-TIER HIERARCHY:
  // Tier 1: Highest Heading -> Chapter Title
  const highestHeaderSize = chapterCandidateSizes.length > 0 ? chapterCandidateSizes[0] : 0;

  // Tier 2: Intermediate Headings -> Sub-headings
  const intermediateSizes = chapterCandidateSizes.filter(
    (sz) => sz < Math.round(highestHeaderSize * 0.95) && sz >= Math.round(bodyFontSize * 1.12)
  );

  // Chapter markers regex: Chapter 1, Chapter I, Folio I, Book 1, etc.
  const chapterMarkerRegex = /^(?:Chapter|CHAPTER|Folio|FOLIO|Book|BOOK)\s+([IVXLCDM\d]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)(?:\s*[:—–-]\s*|\s*[\n\r]\s*|\s+|$)(.*)$/i;

  const isSectionBreak = (str: string) =>
    /^(\*\s*\*\s*\*|\*{3,}|—{2,}|-{3,}|※\s*※\s*※|※|- - -|\*\s*\*\s*\*\s*\*)$/.test(str.trim());

  interface ChapterBucketParagraph {
    text: string;
    html: string;
    isSubheading?: boolean;
  }

  interface ChapterBucket {
    title: string;
    subtitle?: string;
    paragraphs: ChapterBucketParagraph[];
  }

  const buckets: ChapterBucket[] = [];
  let currentBucket: ChapterBucket | null = null;

  for (let i = startIndex; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];
    const markerMatch = chapterMarkerRegex.exec(p.text);

    // 1. INTERMEDIATE HEADING -> SUB-HEADING
    const isIntermediateSize =
      intermediateSizes.includes(p.fontSize) ||
      (highestHeaderSize > 0 &&
        p.fontSize < Math.round(highestHeaderSize * 0.95) &&
        p.fontSize >= Math.round(bodyFontSize * 1.12));

    const isSubheadingStyle =
      (p.headingLevel !== null && p.headingLevel >= 2) || /subtitle/i.test(p.styleId || '');

    const isExplicitSubpartMarker =
      /^(?:part|sub|section|act|scene|interlude)\b/i.test(p.text) &&
      (highestHeaderSize === 0 || p.fontSize < Math.round(highestHeaderSize * 0.95)) &&
      p.fontSize >= bodyFontSize;

    const isSubheading = isIntermediateSize || isSubheadingStyle || isExplicitSubpartMarker;

    // 2. HIGHEST HEADING -> CHAPTER TITLE
    const isHighestSize = highestHeaderSize > 0 && p.fontSize >= Math.round(highestHeaderSize * 0.95);
    const isH1Style = p.headingLevel === 1;
    const isChapterMarker =
      Boolean(markerMatch) &&
      !isSubheading &&
      (highestHeaderSize === 0 || p.fontSize >= Math.round(highestHeaderSize * 0.85));

    const isChapterTitle = !isSubheading && (isHighestSize || isH1Style || isChapterMarker);

    if (isChapterTitle) {
      let title = p.text;
      if (markerMatch && markerMatch[2]?.trim()) {
        title = markerMatch[2].trim();
      }

      currentBucket = {
        title: normalizeLiteraryTypography(title),
        subtitle: undefined,
        paragraphs: []
      };
      buckets.push(currentBucket);
      continue;
    }

    if (!currentBucket) {
      currentBucket = {
        title: detectedNovelTitle || fallbackFilename.replace(/\.[^/.]+$/, ''),
        subtitle: undefined,
        paragraphs: []
      };
      buckets.push(currentBucket);
    }

    if (isSubheading) {
      // If this chapter has no prose paragraphs yet and no subtitle, set it as Chapter Subtitle / Sub-part
      if (!currentBucket.subtitle && currentBucket.paragraphs.length === 0) {
        currentBucket.subtitle = normalizeLiteraryTypography(p.text);
      } else {
        // In-chapter sub-heading within content
        currentBucket.paragraphs.push({
          text: normalizeLiteraryTypography(p.text),
          html: p.html || escapeHtml(p.text),
          isSubheading: true
        });
      }
      continue;
    }

    // 3. LEAST FONT SIZE -> NORMAL CONTENT
    currentBucket.paragraphs.push({
      text: normalizeLiteraryTypography(p.text),
      html: p.html || escapeHtml(p.text),
      isSubheading: false
    });
  }

  // Fallback if no buckets formed
  if (buckets.length === 0) {
    buckets.push({
      title: 'Chapter I',
      paragraphs: rawParagraphs.map((p) => ({ text: p.text, html: p.html, isSubheading: false }))
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
      if (!epigraph && elIdx < 3 && !p.isSubheading) {
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

      // 3. Intermediate Sub-heading inside chapter content
      if (p.isSubheading) {
        finalParagraphs.push({
          id: finalParagraphs.length + 1,
          text: p.text,
          isSubheading: true
        });
        htmlParagraphs.push(
          `<h3 class="font-editorial-title editorial-subheading text-xl sm:text-2xl mt-8 mb-4 tracking-wide text-[var(--text)]">${p.html || escapeHtml(p.text)}</h3>`
        );
        return;
      }

      // 4. Normal Prose Content (least font size)
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

  // Determine highest heading tag in the document (H1 vs H2 vs H3)
  const hasH1 = elements.some((el) => el.tagName === 'H1');
  const hasH2 = elements.some((el) => el.tagName === 'H2');
  const hasH3 = elements.some((el) => el.tagName === 'H3');
  const highestHeadingTag = hasH1 ? 'H1' : hasH2 ? 'H2' : hasH3 ? 'H3' : null;

  interface RawChapterBucketElement {
    text: string;
    html: string;
    tagName: string;
    isSubheading?: boolean;
  }

  interface RawChapterBucket {
    title: string;
    subtitle?: string;
    elements: RawChapterBucketElement[];
  }

  const chapterBuckets: RawChapterBucket[] = [];
  let currentBucket: RawChapterBucket | null = null;

  const chapterMarkerRegex = /^(?:Chapter|CHAPTER|Folio|FOLIO|Book|BOOK)\s+([IVXLCDM\d]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s*[:—–-]\s*|\s*[\n\r]\s*|\s+|$)(.*)$/i;

  const isSectionBreak = (str: string) =>
    /^(\*\s*\*\s*\*|\*{3,}|—{2,}|-{3,}|※\s*※\s*※|※|- - -|\*\s*\*\s*\*\s*\*)$/.test(str.trim());

  let startIndex = 0;
  // Novel title check on first element
  if (elements.length > 0) {
    const firstText = elements[0].textContent?.trim() || '';
    if (elements[0].tagName === 'H1' && !chapterMarkerRegex.test(firstText) && elements.length > 2) {
      detectedNovelTitle = normalizeLiteraryTypography(firstText);
      startIndex = 1;
    }
  }

  // Author byline check
  if (startIndex < elements.length) {
    const byText = elements[startIndex].textContent?.trim() || '';
    if (/^by\s+/i.test(byText)) {
      detectedAuthor = normalizeLiteraryTypography(byText.replace(/^by\s+/i, ''));
      startIndex++;
    }
  }

  for (let index = startIndex; index < elements.length; index++) {
    const el = elements[index];
    const rawContent = el.textContent?.trim() || '';
    if (!rawContent) continue;

    const matchesMarker = chapterMarkerRegex.exec(rawContent);

    // Intermediate headings: tags lower than highest heading tag (e.g. H2/H3/H4 if highest is H1, or H3/H4 if highest is H2)
    const isIntermediateTag =
      (highestHeadingTag === 'H1' && ['H2', 'H3', 'H4'].includes(el.tagName)) ||
      (highestHeadingTag === 'H2' && ['H3', 'H4'].includes(el.tagName)) ||
      /^(?:part|sub|section|act|scene)\b/i.test(rawContent);

    const isHighestHeading =
      (highestHeadingTag !== null && el.tagName === highestHeadingTag) ||
      (Boolean(matchesMarker) && !isIntermediateTag);

    if (isHighestHeading) {
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
      continue;
    }

    if (!currentBucket) {
      currentBucket = {
        title: detectedNovelTitle || fallbackFilename.replace(/\.[^/.]+$/, ''),
        subtitle: undefined,
        elements: []
      };
      chapterBuckets.push(currentBucket);
    }

    if (isIntermediateTag) {
      // If this chapter has no prose elements yet and no subtitle, set it as Chapter Subtitle / Sub-part
      if (!currentBucket.subtitle && currentBucket.elements.length === 0) {
        currentBucket.subtitle = normalizeLiteraryTypography(rawContent);
      } else {
        // In-chapter sub-heading within content
        currentBucket.elements.push({
          text: normalizeLiteraryTypography(rawContent),
          html: el.innerHTML || escapeHtml(rawContent),
          tagName: el.tagName,
          isSubheading: true
        });
      }
      continue;
    }

    // Least font size / normal prose content
    currentBucket.elements.push({
      text: normalizeLiteraryTypography(rawContent),
      html: el.innerHTML || escapeHtml(rawContent),
      tagName: el.tagName,
      isSubheading: false
    });
  }

  if (chapterBuckets.length === 0) {
    chapterBuckets.push({
      title: 'Chapter I',
      elements: elements.map((el) => ({
        text: el.textContent?.trim() || '',
        html: el.innerHTML || escapeHtml(el.textContent?.trim() || ''),
        tagName: el.tagName,
        isSubheading: false
      }))
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
      const text = el.text;
      if (!text) return;

      if (!epigraph && elIdx < 3 && !el.isSubheading) {
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

      // Intermediate sub-heading
      if (el.isSubheading) {
        paragraphs.push({
          id: paragraphs.length + 1,
          text,
          isSubheading: true
        });
        htmlParagraphs.push(
          `<h3 class="font-editorial-title editorial-subheading text-xl sm:text-2xl mt-8 mb-4 tracking-wide text-[var(--text)]">${escapeHtml(text)}</h3>`
        );
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

    const totalWords = paragraphs.reduce(
      (acc, p) => acc + (p.isBreak ? 0 : p.text.split(/\s+/).filter(Boolean).length),
      0
    );
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
