import type { ReadingShelfItem } from '../types/novel';

export const READING_SHELF: ReadingShelfItem[] = [
  {
    id: 'shelf-1',
    title: 'The Rings of Saturn',
    author: 'W. G. Sebald',
    year: '1995',
    isCurrentlyReading: true,
    reflection: 'I keep returning to this because the boundary between walking across a county and walking through historical memory dissolves without notice. A book that teaches you how to look at grass and see an empire crumbling.'
  },
  {
    id: 'shelf-2',
    title: 'The Book of Disquiet',
    author: 'Fernando Pessoa',
    year: '1982',
    isCurrentlyReading: false,
    reflection: 'A book that should never be read in sequence, only opened like a window when the evening is cold and the room feels too narrow. Bernardo Soares remains the patron saint of all quiet desk work.'
  },
  {
    id: 'shelf-3',
    title: 'Invisible Cities',
    author: 'Italo Calvino',
    year: '1972',
    isCurrentlyReading: false,
    reflection: 'Mathematical precision used not to describe engineering reality, but to create a poetic space reality cannot reach. Every city is a meditation on what desire leaves unbuilt.'
  },
  {
    id: 'shelf-4',
    title: 'Light Years',
    author: 'James Salter',
    year: '1975',
    isCurrentlyReading: false,
    reflection: 'Sentence cadence as physical weight. There is not a single lazy syllable in three hundred pages. It hurts to read because it reminds you how much life passes without being recorded.'
  },
  {
    id: 'shelf-5',
    title: 'A Month in the Country',
    author: 'J. L. Carr',
    year: '1980',
    isCurrentlyReading: false,
    reflection: 'A small, perfect English masterpiece about an ancient church wall painting, a summer after the trenches, and the rare peace that comes from patient physical restoration.'
  }
];
