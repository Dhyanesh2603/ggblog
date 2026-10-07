import type { Chapter } from '../types/novel';

export const NOVEL_META = {
  title: 'THE LAST LIGHT',
  subtitle: 'A Novel',
  author: 'Julian Thorne',
  year: '2026',
  totalChapters: 8,
  estimatedTotalReadingTime: '115 MIN',
  heroExcerpt: 'It had been raining since four in the afternoon, and by midnight the city had forgotten how to be quiet.',
  coverQuote: 'One carefully selected sentence from the actual novel.',
  synopsis: 'A quiet investigation into an inheritance of papers, an unmapped coastal town, and the lingering echoes of what people leave behind when they disappear without explanation.'
};

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    numberRoman: 'I',
    numberDisplay: '01',
    title: 'The Beginning',
    slug: 'chapter-01',
    readingTimeMin: 8,
    wordCount: 1840,
    date: 'OCTOBER 2026',
    epigraph: {
      quote: 'We never notice when the water turns to salt, only that thirst has arrived.',
      source: 'L. M. Rilke, Marginalia'
    },
    paragraphs: [
      {
        text: 'It had been raining since four in the afternoon, and by midnight the city had forgotten how to be quiet. The water did not fall in drops but drifted across the glass like grease, catching the halogen amber of the streetlamps and bending it into smeared horizontal ribbons.',
        noteId: 'note-1-1'
      },
      {
        text: 'Thomas stood by the tall sash window on the third floor of the St. Jude building, holding a half-folded telegram he had not opened for three days. The paper was dry, brittle at the creases, smelling faintly of tea and cold linoleum. In the street below, an electric tram hummed along its steel track with a lonely clatter, throwing blue sparks against the dripping telephone wires before vanishing into the fog near the canal.'
      },
      {
        text: 'He had not expected anything from his uncle after eleven years of silence. Families, Thomas had often told himself, were like maps drawn in pencil: after enough handling, the borders grew smudged, the names of provinces turned indistinct, until one could no longer say where the town ended and the wasteland began.'
      },
      {
        text: 'When the telephone had rung on Tuesday morning, it was not his uncle who spoke, but a clerk named Vane from the registrar’s office in Port Saint-Pierre. The man’s voice sounded like dry gravel being shifted in an iron pan.',
        noteId: 'note-1-2'
      },
      {
        text: '“Mr. Thomas Thorne? There is a key, an envelope of deeds, and thirty-four boxes of unbound manuscript pages deposited in the municipal vault under your name. The rent on the locker expired twelve months ago. If they are not claimed before the first frost, they will be transferred to the salvage depot.”'
      },
      {
        text: '“Manuscripts?” Thomas had asked, his hand tightening on the receiver. “My uncle was a surveyor. He spent forty years measuring elevations for drainage dikes.”'
      },
      {
        text: '“Perhaps,” Vane had answered without hesitation. “Or perhaps he was surveying something else entirely. The train from the capital runs twice daily. We close at five.”'
      },
      {
        text: 'Now, watching the wet black pavement reflect the solitary lanterns of the night porters, Thomas folded the telegram a second time and slipped it into the breast pocket of his wool coat. In the wardrobe behind him rested a leather valise containing three shirts, a notebook with linen covers, and an ivory-handled pen with black ink. Nothing else was required.'
      },
      {
        text: 'The city was dying down into that brief grey stillness between the last drunkards and the first bakery wagons. It was the only hour in which an honest decision could be made without the advice of other people’s clocks.'
      }
    ],
    notes: [
      {
        id: 'note-1-1',
        marker: '[1]',
        title: 'On the Opening Line',
        content: 'I originally drafted this chapter in the first person during a cold winter in Antwerp. Switching to this quiet, distant third-person voice removed the author’s temptation to over-explain the rain. The weather should be an atmospheric condition, not a metaphor.',
        targetExcerpt: 'It had been raining since four in the afternoon...'
      },
      {
        id: 'note-1-2',
        marker: '[2]',
        title: 'The Registrar at Port Saint-Pierre',
        content: 'The character of Vane was drawn from an archivist I encountered in Middelburg whose entire life was consumed by legal wills left unclaimed by mariners. Such men do not have opinions; they only have inventories.',
        targetExcerpt: 'When the telephone had rung on Tuesday morning...'
      }
    ],
    nextSlug: 'chapter-02'
  },
  {
    id: 2,
    numberRoman: 'II',
    numberDisplay: '02',
    title: 'The House',
    slug: 'chapter-02',
    readingTimeMin: 12,
    wordCount: 2410,
    date: 'OCTOBER 2026',
    epigraph: {
      quote: 'An empty room does not wait for anyone. It merely preserves the geometry of absence.',
      source: 'C. V. Sebald'
    },
    paragraphs: [
      {
        text: 'The house stood at the end of a stone jetty that had long ceased to welcome boats. At high tide, the grey brine rose to lick the bottom step of the terrace, leaving behind small crescents of black kelp and the brittle shells of shore crabs.'
      },
      {
        text: 'The key was long, made of pitted iron, with a notched bit that scraped against the brass tumbler before giving way with a dull, heavy clunk. Thomas pushed the door inward. The air that rushed to meet him was cold and still, carrying that singular odor of abandoned rooms: dried elderflowers, vinegar, and centuries of paper slowly oxidizing in darkness.'
      },
      {
        text: 'There were no curtains on the downstairs windows. The afternoon light fell across the bare floorboards in pale rectangular slabs, revealing the pale rectangular shadows where rugs and bookcases had once rested.',
        noteId: 'note-2-1'
      },
      {
        text: 'On the kitchen table sat an enamel kettle, a tin of dried chicory, and an open ledger. Thomas pulled out a wooden chair with a high ladder back and sat down without taking off his coat. The chair gave a brief, dry groan beneath his weight.'
      },
      {
        text: 'In the ledger, written in his uncle’s tight, upright surveyor’s hand, was an entry dated fourteen months earlier:'
      },
      {
        text: '“October 14. Wind NNE, force 4. Tide peaked at 15:22. The sandbar at Point Noir shifted forty paces eastward during the equinox. The old lighthouse keeper told me he saw two lanterns moving on the water where no vessel could draw draft. I did not record this in the district report. People who live by tides do not need encouragement to invent ghosts.”'
      },
      {
        text: 'Thomas turned the page. The next thirty pages were blank, perfectly clean, white sheets of vellum bound together by dark hemp cord. He touched the edge of the leaf. It was smooth, stiff, and completely silent.'
      },
      {
        text: 'Outside, a gull cried once, sharp and low, and then the wind drove the sound out to sea.'
      }
    ],
    notes: [
      {
        id: 'note-2-1',
        marker: '[1]',
        title: 'The Architecture of the Jetty House',
        content: 'The room described here was based on an abandoned coastal toll-house in Brittany. In architecture, emptiness has its own acoustic weight. When you strip away furniture, the room begins to speak in echoes rather than dialogue.',
        targetExcerpt: 'There were no curtains on the downstairs windows...'
      }
    ],
    prevSlug: 'chapter-01',
    nextSlug: 'chapter-03'
  },
  {
    id: 3,
    numberRoman: 'III',
    numberDisplay: '03',
    title: 'What He Remembered',
    slug: 'chapter-03',
    readingTimeMin: 17,
    wordCount: 3180,
    date: 'OCTOBER 2026',
    epigraph: {
      quote: 'Memory is an unfaithful servant that only answers when called by an accident.',
      source: 'M. Proust'
    },
    paragraphs: [
      {
        text: 'What Thomas remembered of his childhood with his uncle was not conversations or holidays, but specific intervals of light. A Tuesday afternoon in late August when the light had turned the color of brass wire; a Sunday morning when the frost on the greenhouse glass had made the world look like an engraving printed in grey ink.'
      },
      {
        text: 'His uncle had been a man of instruments: brass theodolites stored in velvet-lined mahogany cases, boxwood measuring chains whose links were polished smooth by mud and gravel, and notebooks bound in black oilcloth that could withstand rain.'
      },
      {
        text: '“A surveyor,” his uncle had said once while sharpening a hard pencil with an ivory-handled clasp knife, “does not invent reality. He merely prevents other people from lying about where their land ends.”',
        noteId: 'note-3-1'
      },
      {
        text: 'Yet here, in this damp room over the water, the boxes Thomas had brought from the municipal locker told a different story. They were not filled with survey charts. They contained hundreds of single sheets, written in fountain pen, recording names of people who had lived in the marshes during the previous century.'
      },
      {
        text: 'Beside each name was a date, an elevation above sea level, and a single observation: “Left for the colonies on the barque Helene.” “Drowned in the ditch behind the tannery, aged seven.” “Refused to answer the census collector, died alone in the dunes.”'
      },
      {
        text: 'It was not a survey of land. It was an inventory of disappearance.'
      },
      {
        text: 'Thomas set his lamp upon the table. The flame trembled as a draught found the crack beneath the door, throwing long dancing shadows against the whitewashed wall. He read until his eyes burned and the clock on the church tower across the mudflats struck three.'
      }
    ],
    notes: [
      {
        id: 'note-3-1',
        marker: '[1]',
        title: 'The Instrument Box',
        content: 'I bought an 1880s brass theodolite at an estate auction in Ghent while outlining this chapter. The mechanical weight of brass and glass forces a specific kind of physical patience onto the character. Surveyors before satellite navigation lived in constant negotiation with curvature and gravity.',
        targetExcerpt: 'A surveyor, his uncle had said once...'
      }
    ],
    prevSlug: 'chapter-02',
    nextSlug: 'chapter-04'
  },
  {
    id: 4,
    numberRoman: 'IV',
    numberDisplay: '04',
    title: 'The Call',
    slug: 'chapter-04',
    readingTimeMin: 9,
    wordCount: 1960,
    date: 'OCTOBER 2026',
    epigraph: {
      quote: 'Silence across a telephone wire is louder than shouting in an empty field.',
      source: 'J. Thorne'
    },
    paragraphs: [
      {
        text: 'The telephone in the hallway had not been connected to the main exchange in nine years, or so the postmaster had sworn when Thomas went to buy stamps for his telegram to London.'
      },
      {
        text: 'Yet at seven o’clock that evening, while the dusk was turning the estuary the color of lead, the bell inside the heavy black ebonite casing gave a short, hesitant ring. It was not the vigorous double-stroke of the city telephones, but a thin, dry trill, like a cricket caught behind a wainscot.',
        noteId: 'note-4-1'
      },
      {
        text: 'Thomas paused with a slice of bread halfway to his mouth. The kitchen was cold; he had not yet learned how to coax the iron stove into anything more than a sullen smudge of peat smoke.'
      },
      {
        text: 'The bell sounded again. Longer this time. Three seconds of vibrating metal, then silence.'
      },
      {
        text: 'He walked down the narrow corridor. The bare floor was ice beneath his woolen stockings. He lifted the heavy receiver and held it to his ear. For five seconds there was nothing but the oceanic hiss of fifty miles of salt-damp wire running through unpopulated salt marshes.'
      },
      {
        text: '“Yes?” Thomas said.'
      },
      {
        text: 'A woman’s voice, breathing closely against the mouthpiece, spoke without hesitation:'
      },
      {
        text: '“You are in the room with the ledger, aren’t you? Do not burn the papers in the bottom crate. The names are not what you think they are.”'
      },
      {
        text: '“Who is this?” Thomas demanded. “My uncle died in August.”'
      },
      {
        text: '“I know when he died,” the voice replied quietly. “I watched them dig the trench through the gravel. Listen to me: check the date on the map of the sandbar. He did not measure it in October. He drew it from memory three days before the water came up.”'
      },
      {
        text: 'Then a sharp click severed the connection, followed by the mechanical drone of an empty line.'
      }
    ],
    notes: [
      {
        id: 'note-4-1',
        marker: '[1]',
        title: 'The Ebonite Telephone',
        content: 'Telephones in rural coastal stations during this era were shared party lines strung on driftwood poles along the dikes. A call did not mean you had been dialed directly; it meant anyone on the ten-mile circuit who turned a hand crank could vibrate every bell simultaneously.',
        targetExcerpt: 'Yet at seven o’clock that evening...'
      }
    ],
    prevSlug: 'chapter-03',
    nextSlug: 'chapter-05'
  },
  {
    id: 5,
    numberRoman: 'V',
    numberDisplay: '05',
    title: 'Sunday',
    slug: 'chapter-05',
    readingTimeMin: 21,
    wordCount: 3890,
    date: 'OCTOBER 2026',
    epigraph: {
      quote: 'On Sundays, time ceases to march in single file and spreads across the sand like shallow water.',
      source: 'Alain-Fournier'
    },
    paragraphs: [
      {
        text: 'Sunday brought the morning mist off the shallows. The harbor was hidden; only the masts of three herring smacks stood out against the grey vapor like dead pines in a burnt swamp.'
      },
      {
        text: 'In the village square, two old women in black wool shawls were scrubbing the stone steps of the Protestant chapel with coarse pumice. They did not look up when Thomas walked past, though their scrubbing slowed by an imperceptible fraction of a second.'
      },
      {
        text: 'Thomas crossed the canal bridge and took the road that led past the fish drying racks toward the cemetery. The earth here was sandy, mixed with crushed cockle shells that crunched under his boots. The graves had no marble crosses; the salt wind would have eaten marble into powder within fifty years. Instead, they were marked by low slabs of grey granite or tarred oak posts inscribed with letters carved by pocketknives.'
      },
      {
        text: 'His uncle’s plot was in the newest row, near the brambles that bordered the ditch. The earth was still dark, mounded high, with a single sprig of sea lavender lying wilted upon the turf.'
      },
      {
        text: 'Beside the grave stood an umbrella with a horn handle, thrust point-down into the soft sand as though someone had leaned on it and forgotten to retrieve it.',
        noteId: 'note-5-1'
      },
      {
        text: 'Thomas knelt and pulled the umbrella free. Tied to the ferrule with a length of waxed butcher’s twine was a small brass key, no larger than a pocket watch key, stamped with the numeral 17.'
      }
    ],
    notes: [
      {
        id: 'note-5-1',
        marker: '[1]',
        title: 'The Horn-Handled Umbrella',
        content: 'Objects left behind in graveyards in coastal regions are rarely forgotten by accident. Leaving an umbrella or a tool was an old local superstition meant to ensure the dead would not seek shelter in the village houses during autumn storms.',
        targetExcerpt: 'Beside the grave stood an umbrella with a horn handle...'
      }
    ],
    prevSlug: 'chapter-04',
    nextSlug: 'chapter-06'
  },
  {
    id: 6,
    numberRoman: 'VI',
    numberDisplay: '06',
    title: 'The Distance',
    slug: 'chapter-06',
    readingTimeMin: 14,
    wordCount: 2650,
    date: 'OCTOBER 2026',
    epigraph: {
      quote: 'Every line drawn on a map is a confession that human eyes cannot see past the horizon.',
      source: 'J. Thorne'
    },
    paragraphs: [
      {
        text: 'The key stamped 17 belonged to nothing in the house. It did not fit the writing desk, nor the clock, nor the spice cupboard in the pantry.'
      },
      {
        text: 'It was only on Tuesday afternoon, while walking the six miles of dike that separated the low polder from the salt marshes, that Thomas remembered the boathouse at Point Noir. His uncle had rented it from the drainage commissioners since the year of the great breach in 1911.'
      },
      {
        text: 'The wind had shifted into the south-west. It carried the smell of rain that was still twenty miles away over open sea. The grass along the dike crest was bent double, pale silver undersides gleaming in the flat afternoon light.'
      },
      {
        text: 'As he approached the point, the low silhouette of the boathouse appeared: creosoted timber, corrugated iron roof green with lichen, half-buried in the dune. On the padlock of the side door, the number 17 was stamped into the tarnished brass plate.'
      },
      {
        text: 'Thomas inserted the key. It turned without resistance.'
      }
    ],
    prevSlug: 'chapter-05',
    nextSlug: 'chapter-07'
  },
  {
    id: 7,
    numberRoman: 'VII',
    numberDisplay: '07',
    title: 'Before the Rain',
    slug: 'chapter-07',
    readingTimeMin: 11,
    wordCount: 2120,
    date: 'OCTOBER 2026',
    epigraph: {
      quote: 'The sky darkens not to frighten us, but to show us where the lantern was all along.',
      source: 'Old Flemish Proverb'
    },
    paragraphs: [
      {
        text: 'Inside the boathouse there was no boat. There was only a workbench, an iron cot with a folded horsehair blanket, and an optical drawing table mounted on a cast-iron pedestal with counterweights.'
      },
      {
        text: 'Pinned to the table with four brass drafting pins was an unfinished chart of the coast. But it was not a chart of what existed; it was a chart of what would happen when the sea broke through the second dike.'
      },
      {
        text: 'His uncle had calculated the depths down to the centimetre. Every farmstead was marked with a red circle; every cattle pen was marked with a cross. At the bottom of the sheet, in the margins where surveyors usually record magnetic declination and contour intervals, was a single line of text:'
      },
      {
        text: '“They believe the stone will hold. But the stone is resting on sand that has been washing away since the great gale of November. In three weeks, the water will come as far as the chapel threshold. I have warned everyone who would listen. No one listens to a man who measures what has not yet fallen.”'
      },
      {
        text: 'The first heavy drops of the storm began to strike the tin roof above Thomas’s head, one by one, like lead shot dropped from a height.'
      }
    ],
    prevSlug: 'chapter-06',
    nextSlug: 'chapter-08'
  },
  {
    id: 8,
    numberRoman: 'VIII',
    numberDisplay: '08',
    title: 'The Harbor',
    slug: 'chapter-08',
    readingTimeMin: 15,
    wordCount: 2790,
    date: 'OCTOBER 2026',
    epigraph: {
      quote: 'And at the end, the sea takes back only what was borrowed from it.',
      source: 'The Last Light, Epilogue'
    },
    paragraphs: [
      {
        text: 'By evening the storm had reached its full weight. The harbor had turned into a cauldron of brown foam, with the waves hammering against the granite breakwater until the spray rose thirty feet into the dark sky, falling back over the jetty like wet gravel.'
      },
      {
        text: 'Thomas did not take the train back to the city. He walked down to the pier with his uncle’s notebook tucked securely beneath his coat, his hand pressed against his chest to keep the damp out.'
      },
      {
        text: 'In the distance, at the very edge of the headland where the beacon lamp had been extinguished since the war, a solitary yellow light blinked once, twice, and then held steady against the black wall of the horizon.'
      },
      {
        text: 'Someone was there, tending the wick.'
      },
      {
        text: 'Thomas stood in the rain for a long time, watching the circle of yellow beam cut through the spray. Then he turned his collar up against the salt gale and walked out onto the stone jetty toward the house.'
      }
    ],
    prevSlug: 'chapter-07'
  }
];
