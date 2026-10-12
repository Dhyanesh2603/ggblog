import type { Work, WriterProfile } from '../types/novel';
import { NOVEL_META, CHAPTERS } from './novelData';

export const DEFAULT_WRITER_PROFILE: WriterProfile = {
  name: 'Julian Thorne',
  handle: '@julianthorne',
  bio: 'Author, surveyor, and essayist writing on memory, coastal isolation, and forgotten architecture.',
  location: 'Finistère, Brittany',
  avatarUrl: '',
  philosophy: 'A novel is not an argument; it is a room one steps into when the weather outside has become uninhabitable.',
  followerCount: 1420,
  isFollowing: false,
  categories: ['Literary Fiction', 'Essays', 'Poetry', 'Architecture', 'Cartography']
};

export const DEFAULT_WORKS: Work[] = [
  {
    id: 'work-last-light',
    slug: 'the-last-light',
    title: NOVEL_META.title,
    subtitle: NOVEL_META.subtitle,
    author: NOVEL_META.author,
    type: 'novel',
    status: 'published',
    year: NOVEL_META.year,
    description: NOVEL_META.synopsis,
    heroExcerpt: NOVEL_META.heroExcerpt,
    category: 'Literary Fiction',
    coverImage: '',
    chapters: CHAPTERS.map((ch) => ({
      ...ch,
      scenes: [
        {
          id: `scene-${ch.id}-1`,
          title: 'Opening Scene',
          content: ch.paragraphs.map((p) => `<p>${p.text}</p>`).join(''),
          wordCount: ch.wordCount
        }
      ]
    })),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 4,
    estimatedTotalReadingTime: NOVEL_META.estimatedTotalReadingTime,
    readCount: 3840,
    likesCount: 520
  },
  {
    id: 'work-fog-estuary',
    slug: 'notes-from-the-fog-estuary',
    title: 'Notes from the Fog Estuary',
    subtitle: 'An Inquiry into Disappearing Coastlines and Tidal Solitude',
    author: 'Julian Thorne',
    type: 'essay',
    status: 'draft',
    year: '2026',
    description: 'Thirty-four boxes of unbound surveyor leaves deposited under an expired lease, smelling of tea, damp linoleum, and thirty years of tidal measurements.',
    heroExcerpt: 'We never notice when the water turns to salt, only that thirst has arrived.',
    category: 'Essays',
    coverImage: '',
    chapters: [
      {
        id: 1,
        numberRoman: 'I',
        numberDisplay: '01',
        title: 'The High Water Mark',
        subtitle: 'On the measurement of receding silt',
        slug: 'chapter-01',
        readingTimeMin: 4,
        wordCount: 840,
        characterCount: 5120,
        date: 'OCTOBER 2026',
        epigraph: {
          quote: 'A surveyor does not invent reality. He merely prevents other people from lying about where their land ends.',
          source: 'Surveyor’s Log, 1912'
        },
        paragraphs: [
          {
            text: 'At high tide the grey brine rises to lick the bottom step of the terrace, leaving behind small crescents of black kelp and the brittle shells of shore crabs.'
          },
          {
            text: 'I have kept the barometer on the cedar desk beside the window for twenty years. When the glass falls below twenty-nine inches, the gulls abandon the jetty and perch in rows along the slate roof of the salt storehouse, their heads tucked beneath their wings like stones.'
          }
        ],
        scenes: [
          {
            id: 'scene-fe-1',
            title: 'The Terrace Tide',
            content: '<p>At high tide the grey brine rises to lick the bottom step of the terrace, leaving behind small crescents of black kelp and the brittle shells of shore crabs.</p><p>I have kept the barometer on the cedar desk beside the window for twenty years. When the glass falls below twenty-nine inches, the gulls abandon the jetty and perch in rows along the slate roof of the salt storehouse, their heads tucked beneath their wings like stones.</p>',
            wordCount: 840
          }
        ]
      },
      {
        id: 2,
        numberRoman: 'II',
        numberDisplay: '02',
        title: 'The Ledger of Currents',
        subtitle: 'Soundings taken in the North Channel',
        slug: 'chapter-02',
        readingTimeMin: 5,
        wordCount: 1120,
        characterCount: 6840,
        date: 'OCTOBER 2026',
        paragraphs: [
          {
            text: 'Soundings are taken with braided hemp weighted with seven pounds of tallow-filled lead. When it strikes bottom, the grease brings up whatever lies below—fine shell grit, dark mud, or the sharp gravel of forgotten shoals.'
          }
        ],
        scenes: [
          {
            id: 'scene-fe-2',
            title: 'Taking Soundings',
            content: '<p>Soundings are taken with braided hemp weighted with seven pounds of tallow-filled lead. When it strikes bottom, the grease brings up whatever lies below—fine shell grit, dark mud, or the sharp gravel of forgotten shoals.</p>',
            wordCount: 1120
          }
        ]
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 30,
    estimatedTotalReadingTime: '9 MIN',
    readCount: 180,
    likesCount: 42
  },
  {
    id: 'work-tidal-cartography',
    slug: 'tidal-cartography',
    title: 'Tidal Cartography',
    subtitle: 'Vespers for Empty Harbors',
    author: 'Julian Thorne',
    type: 'poetry',
    status: 'draft',
    year: '2026',
    description: 'Poetic meditations on fog horns, brass verniers, and the acoustic geography of coastal promontories.',
    heroExcerpt: 'Between the bell buoy and the headland, sound travels faster through cold fog than light.',
    category: 'Poetry',
    coverImage: '',
    chapters: [
      {
        id: 1,
        numberRoman: 'I',
        numberDisplay: '01',
        title: 'Nocturne for Iron Buoy',
        slug: 'chapter-01',
        readingTimeMin: 2,
        wordCount: 320,
        characterCount: 1940,
        date: 'OCTOBER 2026',
        paragraphs: [
          {
            text: 'The bell has one syllable, repeated until the swell tires.'
          },
          {
            text: 'Rust does not sleep upon the mooring chain; it eats in silence while the gannets dive.'
          }
        ],
        scenes: [
          {
            id: 'scene-tc-1',
            title: 'Stanza 1-4',
            content: '<p>The bell has one syllable, repeated until the swell tires.</p><p>Rust does not sleep upon the mooring chain; it eats in silence while the gannets dive.</p>',
            wordCount: 320
          }
        ]
      }
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    estimatedTotalReadingTime: '4 MIN',
    readCount: 95,
    likesCount: 28
  }
];
