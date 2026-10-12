import JSZip from 'jszip';
import type { NovelMeta, Chapter } from '../types/novel';

export async function generateEpubBlob(novel: NovelMeta, chapters: Chapter[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (MUST be uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.folder('META-INF')?.file('container.xml', containerXml);

  const oebps = zip.folder('OEBPS');
  if (!oebps) throw new Error('Could not create OEBPS folder');

  // 3. OEBPS/style.css
  const styleCss = `
body {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.05em;
  line-height: 1.75;
  color: #111111;
  background-color: #fafaf9;
  margin: 5% 8%;
  text-align: justify;
}
h1, h2, h3 {
  font-family: Georgia, serif;
  font-weight: normal;
  text-align: center;
  margin-top: 2em;
  margin-bottom: 0.8em;
}
h1.title {
  font-size: 2.2em;
  letter-spacing: 0.05em;
  margin-top: 3em;
}
p.subtitle {
  text-align: center;
  font-style: italic;
  color: #555555;
  margin-bottom: 2em;
}
p.author {
  text-align: center;
  font-size: 1.2em;
  margin-bottom: 3em;
}
.epigraph {
  margin: 2em 15%;
  font-style: italic;
  color: #444444;
  border-left: 2px solid #cccccc;
  padding-left: 1em;
}
.epigraph-source {
  text-align: right;
  font-size: 0.85em;
  font-style: normal;
  margin-top: 0.5em;
  color: #777777;
}
p {
  margin-top: 0;
  margin-bottom: 0.75em;
  text-indent: 1.2em;
}
p.first {
  text-indent: 0;
}
.asterism {
  text-align: center;
  margin: 2em 0;
  letter-spacing: 0.5em;
  color: #888888;
}
`;
  oebps.file('style.css', styleCss);

  // 4. OEBPS/title.xhtml
  const titleXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${novel.title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div style="text-align: center; margin-top: 20%;">
    <p style="font-size: 0.8em; letter-spacing: 0.2em; color: #888; text-transform: uppercase;">A Novel</p>
    <h1 class="title">${novel.title}</h1>
    <div style="width: 40px; height: 1px; background: #333; margin: 20px auto;"></div>
    <p class="author">by ${novel.author}</p>
    <p style="font-size: 0.85em; color: #777; margin-top: 60px;">First Digital Edition · ${novel.year}</p>
  </div>
</body>
</html>`;
  oebps.file('title.xhtml', titleXhtml);

  // 5. Each chapter XHTML
  chapters.forEach((ch, idx) => {
    const paragraphsHtml = ch.paragraphs
      .map((p, pIdx) => {
        if (p.isBreak) {
          return `<div class="asterism">※ ※ ※</div>`;
        }
        const pClass = pIdx === 0 ? 'class="first"' : '';
        return `<p ${pClass}>${escapeXml(p.text)}</p>`;
      })
      .join('\n');

    const epigraphHtml = ch.epigraph
      ? `<div class="epigraph">
          "${escapeXml(ch.epigraph.quote)}"
          <div class="epigraph-source">— ${escapeXml(ch.epigraph.source)}</div>
        </div>`
      : '';

    const chapterXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Chapter ${ch.numberRoman}: ${ch.title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div style="margin-top: 10%;">
    <p style="text-align: center; font-size: 0.8em; letter-spacing: 0.2em; color: #888; text-transform: uppercase;">Chapter ${ch.numberRoman}</p>
    <h1>${escapeXml(ch.title)}</h1>
    ${epigraphHtml}
    <div style="margin-top: 2em;">
      ${paragraphsHtml}
    </div>
  </div>
</body>
</html>`;

    oebps.file(`chapter-${idx + 1}.xhtml`, chapterXhtml);
  });

  // 6. OEBPS/nav.xhtml (EPUB 3 Navigation Document)
  const navItems = chapters
    .map((ch, idx) => `<li><a href="chapter-${idx + 1}.xhtml">Chapter ${ch.numberRoman} — ${escapeXml(ch.title)}</a></li>`)
    .join('\n');

  const navXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="title.xhtml">Title Page</a></li>
      ${navItems}
    </ol>
  </nav>
</body>
</html>`;
  oebps.file('nav.xhtml', navXhtml);

  // 7. OEBPS/toc.ncx (EPUB 2 backward compatibility)
  const navPoints = chapters
    .map((ch, idx) => `
    <navPoint id="navPoint-${idx + 2}" playOrder="${idx + 2}">
      <navLabel><text>Chapter ${ch.numberRoman} — ${escapeXml(ch.title)}</text></navLabel>
      <content src="chapter-${idx + 1}.xhtml"/>
    </navPoint>`)
    .join('\n');

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:editorial-novel-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(novel.title)}</text></docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel><text>Title Page</text></navLabel>
      <content src="title.xhtml"/>
    </navPoint>
    ${navPoints}
  </navMap>
</ncx>`;
  oebps.file('toc.ncx', tocNcx);

  // 8. OEBPS/content.opf
  const manifestItems = chapters
    .map((_, idx) => `<item id="chapter-${idx + 1}" href="chapter-${idx + 1}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('\n    ');

  const spineItems = chapters
    .map((_, idx) => `<itemref idref="chapter-${idx + 1}"/>`)
    .join('\n    ');

  const bookId = `urn:uuid:literary-${novel.title.toLowerCase().replace(/\s+/g, '-')}-${novel.year}`;

  const contentOpf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <dc:title>${escapeXml(novel.title)}</dc:title>
    <dc:creator>${escapeXml(novel.author)}</dc:creator>
    <dc:language>en</dc:language>
    <dc:publisher>Unbound Digital Archive</dc:publisher>
    <dc:date>${novel.year}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.[0-9]{3}/, '')}</meta>
  </metadata>
  <manifest>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    <itemref idref="title"/>
    ${spineItems}
  </spine>
</package>`;
  oebps.file('content.opf', contentOpf);

  // Generate EPUB Blob
  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
