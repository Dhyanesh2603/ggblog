import type { Work, ScratchpadNote, AccessKey, WriterProfile, WriterApplication } from '../types/novel';

export interface DatabaseExportPayload {
  version: number;
  exportedAt: string;
  profile: WriterProfile;
  accessKeys: AccessKey[];
  works: Work[];
  scratchpadNotes: ScratchpadNote[];
  writerApplications?: WriterApplication[];
}

export const DEFAULT_MASTER_KEY = 'ATELIER-MASTER-2026';
export const DEFAULT_DEVELOPER_KEY = 'DEV-ROOT-ACCESS-2026';

export const INITIAL_ACCESS_KEYS: AccessKey[] = [
  {
    code: DEFAULT_DEVELOPER_KEY,
    role: 'developer',
    label: 'Lead Developer / Root Superuser',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    revoked: false
  },
  {
    code: DEFAULT_MASTER_KEY,
    role: 'master',
    label: 'Primary Author / Master Key',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    revoked: false
  },
  {
    code: 'WRITER-FELLOW-8821',
    role: 'writer',
    label: 'Invited Writer (Fellow)',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    revoked: false
  }
];

export const INITIAL_SCRATCHPAD: ScratchpadNote[] = [
  {
    id: 'note-1',
    title: 'Tone and Atmosphere Guide',
    content: 'Keep sentences maritime, restrained, with occasional long cadences. The fog is not a meteorological event; it is historical amnesia.',
    tag: 'research',
    updatedAt: Date.now()
  },
  {
    id: 'note-2',
    title: 'Character: The Surveyor',
    content: 'Carries a brass level from 1894. Never speaks about the mainland. Smells of cold wool and steeped tea.',
    tag: 'character',
    updatedAt: Date.now()
  }
];

export const INITIAL_APPLICATIONS: WriterApplication[] = [
  {
    id: 'app-editorial-01',
    name: 'Julian Mercer',
    penName: 'J. M. Mercer',
    email: 'mercer.prose@meridian.org',
    portfolioUrl: 'https://meridianjournal.org/mercer',
    workType: 'novel',
    proposedTitle: 'The Sound of Receding Bells',
    pitch: 'A quiet historical narrative following an itinerant bellfounder across Brittany in the winter of 1888, casting bronze bells for church towers that no longer have congregations.',
    sampleExcerpt: 'The furnace clay had cracked twice before November, and each time Julian had sealed it with river loam and salt. He worked in sheepskin gloves with the fingers cut out, his knuckles raw and violet in the draught from the quay.',
    statement: 'I write slow, physical literature about work, solitude, and vanishing trades. The typography of this atelier is the only home I envision for this manuscript.',
    status: 'pending',
    submittedAt: Date.now() - 1000 * 60 * 60 * 14
  }
];

/**
 * Downloads a JavaScript object as a clean, human-readable JSON backup file.
 */
export function exportDatabaseToJson(payload: DatabaseExportPayload, filename = 'atelier_database.json') {
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports manuscript chapters to a readable CSV spreadsheet format.
 */
export function exportChaptersToCsv(work: Work, filename = `${work.slug}_manuscript.csv`) {
  const headers = ['Order', 'Title', 'Subtitle', 'Words', 'Est_Minutes', 'Epigraph', 'Epigraph_Source', 'First_Line'];
  const rows = work.chapters.map((ch, idx) => {
    const epigraphText = typeof ch.epigraph === 'string' ? ch.epigraph : ch.epigraph?.quote || '';
    const epigraphSource = typeof ch.epigraph === 'object' ? ch.epigraph?.source : ch.epigraphAttribution || '';
    const firstLine = ch.paragraphs[0]?.text?.replace(/"/g, '""') || '';
    
    return [
      idx + 1,
      `"${ch.title.replace(/"/g, '""')}"`,
      `"${(ch.subtitle || '').replace(/"/g, '""')}"`,
      ch.wordCount,
      ch.readingTimeMin,
      `"${epigraphText.replace(/"/g, '""')}"`,
      `"${epigraphSource.replace(/"/g, '""')}"`,
      `"${firstLine}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an authentic cryptographic-style writer passkey.
 * Example: "WRITER-7A9B-4D21"
 */
export function generateRandomWriterKey(prefix = 'WRITER'): string {
  const randSegment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randSegment()}-${randSegment()}`;
}
