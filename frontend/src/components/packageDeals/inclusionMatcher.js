import {
  isRoundtripInclusion,
  isRtPudoActivity,
  findRtPudoRate,
} from './rtPudoMatcher.js';

export const KNOWN_DESTINATIONS = [
  'puerto princesa', 'el nido', 'coron palawan',
  'siargao', 'siquijor', 'bohol', 'cebu', 'coron',
  'boracay', 'batanes',
];

export const SYNONYM_MAP = {
  'flight':         ['airfare', 'air', 'plane', 'aviation', 'ticket', 'roundtrip', 'round trip', 'rt'],
  'airfare':        ['flight', 'air', 'plane', 'ticket', 'roundtrip', 'round trip'],
  'roundtrip':      ['round trip', 'return', 'twoway', 'two way', 'rt', 'flight', 'airfare', 'air'],
  'round':          ['roundtrip', 'return'],
  'trip':           ['journey', 'travel'],
  'oneway':         ['one way', 'single', 'ow'],
  'accommodation':  ['hotel', 'lodging', 'stay', 'room', 'inn', 'villa', 'hostel', 'guesthouse'],
  'hotel':          ['accommodation', 'lodging', 'inn', 'resort'],
  'resort':         ['hotel', 'accommodation', 'inn'],
  'room':           ['accommodation', 'hotel', 'lodging'],
  'transport':      ['transfer', 'transportation', 'shuttle', 'vehicle', 'ride'],
  'transfer':       ['transport', 'shuttle', 'pickup', 'dropoff', 'pudo'],
  'van':            ['vehicle', 'shuttle', 'transport'],
  'tricycle':       ['trike', 'vehicle'],
  'boat':           ['ferry', 'vessel', 'ship', 'bangka', 'banca'],
  'bangka':         ['boat', 'banca', 'ferry', 'vessel'],
  'meal':           ['food', 'dining', 'breakfast', 'lunch', 'dinner', 'buffet'],
  'breakfast':      ['meal', 'food', 'morning', 'buffet'],
  'lunch':          ['meal', 'food', 'midday', 'luncheon', 'buffet'],
  'dinner':         ['meal', 'food', 'evening', 'supper'],
  'buffet':         ['meal', 'lunch', 'dinner', 'food', 'dining'],
  'tour':           ['trip', 'excursion', 'visit', 'sightseeing', 'experience', 'adventure'],
  'island':         ['isle', 'islet'],
  'hopping':        ['hop', 'jumping', 'tour', 'island'],
  'snorkel':        ['snorkeling', 'diving', 'underwater', 'swim', 'swimming'],
  'snorkeling':     ['snorkel', 'diving', 'underwater', 'swim'],
  'swimming':       ['swim', 'snorkel', 'snorkeling'],
  'dive':           ['diving', 'snorkel', 'underwater'],
  'diving':         ['dive', 'snorkel', 'snorkeling', 'underwater'],
  'trek':           ['trekking', 'hike', 'hiking', 'walking'],
  'trekking':       ['trek', 'hike', 'hiking', 'walking'],
  'hiking':         ['hike', 'trek', 'trekking', 'walking'],
  'climb':          ['climbing', 'ascent', 'hike'],
  'beach':          ['shore', 'coast', 'seaside', 'sand', 'cove'],
  'coastal':        ['coast', 'beach', 'shore', 'seaside'],
  'cove':           ['beach', 'bay', 'inlet', 'lagoon'],
  'lagoon':         ['cove', 'bay', 'lake', 'inlet'],
  'guide':          ['escort', 'leader', 'companion'],
  'entrance':       ['admission', 'entry', 'fee', 'ticket', 'pass'],
  'museum':         ['gallery', 'exhibit', 'heritage', 'historical'],
  'pudo':           ['pickup', 'dropoff', 'transfer', 'transport', 'rt'],
  'rt':             ['roundtrip', 'round trip', 'return', 'transfer', 'pudo'],

  'whale':          ['oslob', 'shark', 'whaleshark'],
  'oslob':          ['whale', 'shark', 'whaleshark', 'swimming'],
  'moalboal':       ['sardine', 'panagsama', 'snorkeling', 'canyoneering'],
  'sardine':        ['moalboal', 'panagsama', 'snorkeling'],
  'sumilon':        ['oslob', 'island', 'sandbar'],

  'countryside':    ['tarsier', 'chocolate', 'loboc', 'baclayon', 'bohol'],
  'chocolate':      ['hills', 'countryside', 'bohol'],
  'tarsier':        ['countryside', 'sanctuary', 'bohol'],
  'loboc':          ['river', 'cruise', 'countryside', 'bohol'],

  'underground':    ['river', 'cave', 'subterranean', 'palawan', 'sabang'],
  'subterranean':   ['underground', 'river', 'cave', 'palawan'],
  'sabang':         ['underground', 'river', 'palawan'],

  'sohoton':        ['jellyfish', 'lagoon', 'cave', 'siargao'],
  'jellyfish':      ['sohoton', 'lagoon', 'sanctuary'],
  'surf':           ['surfing', 'surfboard', 'wave', 'cloud9', 'siargao'],
  'surfing':        ['surf', 'board', 'wave', 'lesson'],

  'land':           ['countryside', 'road', 'tour', 'trip'],
  'city':           ['town', 'urban', 'local', 'heritage'],
  'heritage':       ['historical', 'museum', 'church', 'heritage', 'culture'],
  'church':         ['heritage', 'historical', 'cathedral', 'basilica'],
  'waterfall':      ['falls', 'cascade', 'tumalog', 'kawasan'],
  'falls':          ['waterfall', 'cascade', 'swimming'],
  'kawasan':        ['falls', 'waterfall', 'moalboal', 'canyoneering'],
  'canyoneering':   ['kawasan', 'moalboal', 'falls', 'adventure'],
  'firefly':        ['mangrove', 'river', 'night', 'bohol', 'palawan'],
  'mangrove':       ['firefly', 'river', 'kayak'],
  'kayak':          ['kayaking', 'paddling', 'mangrove', 'river'],

  'north':          ['batanes', 'ivatan', 'sabtang'],
  'south':          ['batanes', 'ivatan', 'sabtang'],
  'complete':       ['batanes', 'full', 'comprehensive'],

  'honda':          ['bay', 'island hopping', 'palawan'],
  'underground':    ['river', 'cave', 'subterranean', 'palawan', 'sabang', 'puerto princesa'],
  'half':           ['city tour', 'half day', 'halfday'],
};

export const CROSS_DESTINATION_KEYWORDS = [
  'roundtrip', 'round trip', 'rt', 'flight', 'airfare', 'air ticket',
  'return flight', 'return ticket', 'plane ticket',
];

export const PAX_TYPE_PATTERNS = [
  /\(\s*solo\s*\/\s*joiners?\s*\)/gi,
  /\(\s*solo\s*\)/gi,
  /\(\s*group\s*\)/gi,
  /\(\s*\d+\s*pax\s*\)/gi,
  /\(\s*\d+\s*person[s]?\s*\)/gi,
  /\(\s*per\s*pax\s*\)/gi,
  /\(\s*per\s*person\s*\)/gi,
  /\(\s*min\.?\s*(?:of\s*)?\d+\s*pax\s*\)/gi,
  /\bsolo\b/gi,
  /\bgroup\b/gi,
  /\b\d+\s*pax\b/gi,
];

export const ACCOMMODATION_KEYWORDS = [
  'accommodation', 'accomodation',
  'hotel', 'lodging', 'hostel',
];

export const ACTIVITY_ALIAS_MAP = {

  'tour a':               ['tour a', 'tour-a', 'elnido tour a'],
  'tour c with picnic':   ['tour c', 'tour-c', 'picnic lunch'],

  'ultimate tour b with picnic lunch': ['ultimate tour', 'ultimate b'],
  'ultimate tour b with picnic':       ['ultimate tour', 'ultimate b'],
  'island tour b with picnic lunch':   ['island tour b', 'tour b'],
  'island tour a with picnic lunch':   ['island tour a', 'tour a'],
  'coron town tour':                   ['town tour', 'coron town'],

  'oslob tour':    ['oslob', 'whale shark', 'whaleshark', 'sumilon'],
  'oslob':         ['oslob', 'whale shark', 'whaleshark', 'sumilon'],
  'moalboal':      ['moalboal', 'sardine', 'panagsama', 'canyoneering', 'kawasan'],
  'city tour':     ['city tour', 'half day city', 'heritage tour', 'city heritage'],

  'island hopping':    ['island hopping', 'balicasag', 'panglao'],
  'bohol countryside': ['countryside', 'chocolate hills', 'tarsier', 'loboc river', 'baclayon'],

  'honda bay island hopping tour': ['honda bay', 'island hopping'],
  'half day city tour':            ['city tour', 'half day', 'halfday', 'half-day'],
  'underground river tour':        ['underground river', 'subterranean', 'sabang'],

  'sohoton tour':  ['sohoton', 'jellyfish', 'sugba lagoon'],
  'land tour':     ['land tour', 'magpupungko', 'tayangban', 'daku island'],

  'mountain tour': ['mountain tour', 'mt bandila', 'cambugahay', 'lazi'],
  'coastal tour':  ['coastal tour', 'san juan', 'salagdoong', 'paliton'],

  'north and south': ['north and south', 'north south', 'sabtang', 'ivatan', 'batan'],
  'complete':        ['complete', 'full batanes', 'all sites'],
  'complete tour':   ['complete tour', 'full batanes', 'all sites'],
};

const aliasMatch = (normStripped, normActivity, norm1 = '') => {
  const textToSearch = normStripped || norm1;
  if (!textToSearch) return 0;

  const aliases = ACTIVITY_ALIAS_MAP[normActivity];
  if (aliases && aliases.some(frag => textToSearch.includes(frag))) return 800;

  if (norm1 && norm1 !== textToSearch) {
    if (aliases && aliases.some(frag => norm1.includes(frag))) return 800;
  }

  for (const [key, frags] of Object.entries(ACTIVITY_ALIAS_MAP)) {
    if (normActivity.includes(key) || key.includes(normActivity)) {
      if (frags.some(frag => textToSearch.includes(frag) || norm1.includes(frag))) return 800;
    }
  }
  return 0;
};

export const NO_MATCH_INCLUSION_KEYWORDS = [

  'taxes and surcharges', 'taxes & surcharges',
  'government tax', 'local government tax', 'local tax',
  'municipal tax', 'terminal fee', 'environmental fee',
  'airport tax', 'community tax', 'port tax',

  'travel insurance', 'personal accident insurance',

  'tour guide', 'private guide', 'licensed guide',
  'tour escort', 'tour leader', 'tour manager',
  'guide fee', 'guide service',

  'free and easy', 'leisure day', 'leisure time',
  'tips and gratuities', 'tips & gratuities', 'driver tips', 'driver gratuity',
  'coordination fee', 'service charge',

  'welcome dinner', 'farewell dinner', 'welcome lunch',
  'complimentary breakfast', 'daily breakfast',
  'complimentary roundtrip', 'complimentary round trip', 'complimentary transfer',
  'free roundtrip', 'free round trip', 'free transfer',
  'roundtrip transfers during', 'round trip transfers during',

  'documentary fee', 'processing fee', 'admin fee', 'administrative fee',

  'use of equipment', 'use of kayak', 'use of snorkel gear', 'use of snorkel equipment',
];

export const isNoMatchInclusion = (text) => {
  if (!text) return false;
  const lower = normalizeUnicode(text).toLowerCase();

  const withoutParens = lower.replace(/\([^)]*\)/g, '').trim();
  return NO_MATCH_INCLUSION_KEYWORDS.some(kw => withoutParens.includes(kw));
};

export const DESTINATION_CAPABILITIES = {
  'puerto princesa': { accommodation: true,  rt: true  },
  'coron palawan':   { accommodation: true,  rt: true  },
  'el nido':         { accommodation: true,  rt: true  },

  'siargao':         { accommodation: true,  rt: true  },
  'siquijor':        { accommodation: true,  rt: true  },
  'cebu':            { accommodation: true,  rt: true  },
  'coron':           { accommodation: true,  rt: true  },

  'bohol':           { accommodation: true, rt: true },

  'boracay':         { accommodation: true,  rt: true  },

  'batanes':         { accommodation: true,  rt: true  },
};

export const DESTINATION_SUBDEST_MAP = {
  'siargao': [
    'general luna', 'cloud 9', 'cloud9', 'dapa', 'pacifico',
    'pilar', 'del carmen', 'burgos',
  ],
};

export const destinationSupports = (destination, rateType) => {
  if (!destination) return true;
  const lower = destination.toLowerCase();

  const entries = Object.entries(DESTINATION_CAPABILITIES)
    .sort((a, b) => b[0].length - a[0].length);
  const entry = entries.find(([key]) => lower.includes(key));
  if (!entry) return true;
  return entry[1][rateType] === true;
};

export const GENERIC_DESTINATION_WORDS = new Set([
  'island', 'islands', 'isle', 'islet',
  'province', 'area', 'region', 'district',
  'city', 'town', 'north', 'south', 'east', 'west', 'central',
  'tour', 'tours', 'beach', 'resort',
  'philippines', 'pilipinas', 'luzon', 'visayas', 'mindanao',
]);

const PALAWAN_SUBDESTS = ['el nido', 'puerto princesa', 'coron'];

export const isAccommodationInclusion = (text) => {
  if (!text) return false;
  const lower = normalizeUnicode(text).toLowerCase();
  // Strip parenthetical content before checking — prevents fee descriptions like
  // "Island Hopping (Pickup and Drop Off to Accommodation w/in general luna, ...)"
  // from falsely triggering the accommodation path due to "Accommodation" in parens.
  const withoutParens = lower.replace(/\([^)]*\)/g, '').trim();
  return ACCOMMODATION_KEYWORDS.some(kw => withoutParens.includes(kw));
};

export const getSynonyms = (word) => {
  const lower = word.toLowerCase();
  return [lower, ...(SYNONYM_MAP[lower] || [])];
};

export const isCrossDestinationActivity = (text) => {
  const normalized = (text || '').toLowerCase();
  return CROSS_DESTINATION_KEYWORDS.some(k => normalized.includes(k));
};

export const extractDurationCode = (text) => {
  if (!text) return null;
  const match = String(text).match(/\b(\d+D\d+N)\b/i);
  return match ? match[1].toUpperCase() : null;
};

export const extractNights = (text) => {
  if (!text) return null;
  const lower = String(text).toLowerCase();
  const durationMatch = lower.match(/\b(\d+)d(\d+)n\b/i);
  if (durationMatch) return parseInt(durationMatch[2]);
  const nightsMatch = lower.match(/\b(\d+)\s*night[s]?\b/i);
  if (nightsMatch) return parseInt(nightsMatch[1]);
  const shortMatch = lower.match(/\b(\d+)n\b/i);
  if (shortMatch) return parseInt(shortMatch[1]);
  return null;
};

export const extractPaxType = (text) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/\bsolo\b/.test(lower)) return 'solo';
  if (/\bgroup\b/.test(lower)) return 'group';
  if (/\b[2-9]\d*\s*pax\b/.test(lower)) return 'group';
  if (/\bmultiple\b/.test(lower)) return 'group';
  return null;
};

export const extractMinPax = (text) => {
  if (!text) return null;
  const match = text.match(/\bmin(?:imum)?\.?\s*(?:of\s*)?(\d+)\s*pax\b/i);
  return match ? parseInt(match[1]) : null;
};

export const extractPaxQualifierType = (text) => {
  if (!text) return { type: 'generic' };
  const lower = text.toLowerCase();

  if (/solo\s*\/\s*joiners?/i.test(lower)) return { type: 'solo_joiners' };

  const minPax = extractMinPax(lower);
  if (minPax !== null) return { type: 'minpax', count: minPax };

  if (/\bsolo\b/.test(lower)) return { type: 'solo' };

  return { type: 'generic' };
};

const normalizeUnicode = (text) => {
  if (!text) return text;
  let result = '';
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp >= 0x1D400 && cp <= 0x1D419) { result += String.fromCharCode(cp - 0x1D400 + 65); continue; }
    if (cp >= 0x1D41A && cp <= 0x1D433) { result += String.fromCharCode(cp - 0x1D41A + 97); continue; }
    if (cp >= 0x1D434 && cp <= 0x1D44D) { result += String.fromCharCode(cp - 0x1D434 + 65); continue; }
    if (cp >= 0x1D44E && cp <= 0x1D467) { result += String.fromCharCode(cp - 0x1D44E + 97); continue; }
    if (cp >= 0x1D468 && cp <= 0x1D481) { result += String.fromCharCode(cp - 0x1D468 + 65); continue; }
    if (cp >= 0x1D482 && cp <= 0x1D49B) { result += String.fromCharCode(cp - 0x1D482 + 97); continue; }
    if (cp >= 0x1D49C && cp <= 0x1D4B5) { result += String.fromCharCode(cp - 0x1D49C + 65); continue; }
    if (cp >= 0x1D4D0 && cp <= 0x1D4E9) { result += String.fromCharCode(cp - 0x1D4D0 + 65); continue; }
    if (cp >= 0x1D4EA && cp <= 0x1D503) { result += String.fromCharCode(cp - 0x1D4EA + 97); continue; }
    if (cp >= 0x1D504 && cp <= 0x1D51D) { result += String.fromCharCode(cp - 0x1D504 + 65); continue; }
    if (cp >= 0x1D51E && cp <= 0x1D537) { result += String.fromCharCode(cp - 0x1D51E + 97); continue; }
    if (cp >= 0x1D538 && cp <= 0x1D551) { result += String.fromCharCode(cp - 0x1D538 + 65); continue; }
    if (cp >= 0x1D552 && cp <= 0x1D56B) { result += String.fromCharCode(cp - 0x1D552 + 97); continue; }
    if (cp >= 0x1D56C && cp <= 0x1D585) { result += String.fromCharCode(cp - 0x1D56C + 65); continue; }
    if (cp >= 0x1D586 && cp <= 0x1D59F) { result += String.fromCharCode(cp - 0x1D586 + 97); continue; }
    if (cp >= 0x1D5A0 && cp <= 0x1D5B9) { result += String.fromCharCode(cp - 0x1D5A0 + 65); continue; }
    if (cp >= 0x1D5BA && cp <= 0x1D5D3) { result += String.fromCharCode(cp - 0x1D5BA + 97); continue; }
    if (cp >= 0x1D5D4 && cp <= 0x1D5ED) { result += String.fromCharCode(cp - 0x1D5D4 + 65); continue; }
    if (cp >= 0x1D5EE && cp <= 0x1D607) { result += String.fromCharCode(cp - 0x1D5EE + 97); continue; }
    if (cp >= 0x1D608 && cp <= 0x1D621) { result += String.fromCharCode(cp - 0x1D608 + 65); continue; }
    if (cp >= 0x1D622 && cp <= 0x1D63B) { result += String.fromCharCode(cp - 0x1D622 + 97); continue; }
    if (cp >= 0x1D63C && cp <= 0x1D655) { result += String.fromCharCode(cp - 0x1D63C + 65); continue; }
    if (cp >= 0x1D656 && cp <= 0x1D66F) { result += String.fromCharCode(cp - 0x1D656 + 97); continue; }
    if (cp >= 0x1D670 && cp <= 0x1D689) { result += String.fromCharCode(cp - 0x1D670 + 65); continue; }
    if (cp >= 0x1D68A && cp <= 0x1D6A3) { result += String.fromCharCode(cp - 0x1D68A + 97); continue; }
    if (cp >= 0x1D7CE && cp <= 0x1D7D7) { result += String.fromCharCode(cp - 0x1D7CE + 48); continue; }
    if (cp >= 0x1D7D8 && cp <= 0x1D7E1) { result += String.fromCharCode(cp - 0x1D7D8 + 48); continue; }
    if (cp >= 0x1D7E2 && cp <= 0x1D7EB) { result += String.fromCharCode(cp - 0x1D7E2 + 48); continue; }
    if (cp >= 0x1D7EC && cp <= 0x1D7F5) { result += String.fromCharCode(cp - 0x1D7EC + 48); continue; }
    if (cp >= 0x1D7F6 && cp <= 0x1D7FF) { result += String.fromCharCode(cp - 0x1D7F6 + 48); continue; }
    result += char;
  }
  return result;
};

export const normalizeActivity = (text) => {
  if (!text) return '';
  return normalizeUnicode(text)
    .toLowerCase()

    .replace(/\s*&\s*/g, ' and ')

    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')

    .replace(/^\s*joining\s+/, '')

    .replace(/\bpick\s*up\s*only\b/g, '')
    .replace(/\bdrop\s*off\s*only\b/g, '')
    .replace(/\bpickup\s*only\b/g, '')
    .replace(/roundtrip/g, 'round trip')
    .replace(/twoway/g, 'two way')
    .replace(/oneway/g, 'one way')

    .replace(/\bw\/\b/g, 'with ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const extractKeywords = (text) => {
  const normalized = normalizeActivity(text);
  const noiseWords = new Set([
    'the', 'and', 'or', 'with', 'for', 'in', 'on', 'at', 'to', 'from', 'a', 'an',
    'of', 'by', 'its', 'per', 'via', 'plus', 'only', 'also', 'all', 'any',
  ]);
  const words = normalized.split(' ');
  return words
    .filter(w => {
      if (noiseWords.has(w)) return false;

      if (w.length === 1) return false;
      if (w.length === 2 && !/^\d+$/.test(w)) return false;
      return w.length >= 3;
    })
    .map(word => ({ word, length: word.length, synonyms: getSynonyms(word) }));
};

export const stripInclusionMetadata = (text, destination = '') => {
  if (!text) return '';
  let stripped = text.toLowerCase();

  stripped = stripped.replace(/\([^)]*\)/g, ' ');

  stripped = stripped.replace(/\b\d+d\d+n\b/gi, '');
  PAX_TYPE_PATTERNS.forEach(p => { stripped = stripped.replace(p, ''); });

  KNOWN_DESTINATIONS.forEach(dest => {
    const escaped = dest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    stripped = stripped.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
  });

  if (destination) {
    destination
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(w => w.length >= 4)
      .forEach(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        stripped = stripped.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
      });
  }

  return stripped

    .replace(/\+/g, ' ')
    .replace(/[-–—|:,/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const calculateSimilarity = (text1, text2) => {
  const kw1 = extractKeywords(text1);
  const kw2 = extractKeywords(text2);
  if (!kw1.length || !kw2.length) return 0;

  let matchScore = 0;
  let totalPossibleScore = 0;

  const flightKws = ['roundtrip', 'round trip', 'flight', 'airfare', 'air ticket', 'rt'];
  const t1 = text1.toLowerCase();
  const t2 = text2.toLowerCase();
  if (flightKws.some(k => t1.includes(k)) && flightKws.some(k => t2.includes(k))) {
    matchScore += 10;
    totalPossibleScore += 10;
  }

  kw1.forEach(k1 => {
    const w = Math.min(k1.length / 4, 3);
    totalPossibleScore += w * 3;
    kw2.forEach(k2 => { if (k1.word === k2.word) matchScore += w * 3; });
  });

  kw1.forEach(k1 => {
    const w = Math.min(k1.length / 4, 3);
    kw2.forEach(k2 => {
      if (k1.word !== k2.word && k1.synonyms.some(s => k2.synonyms.includes(s))) {
        matchScore += w * 2;
      }
    });
  });

  kw1.forEach(k1 => {
    const w = Math.min(k1.length / 4, 3);
    kw2.forEach(k2 => {

      if (k1.length >= 4 && k2.length >= 4) {
        if (k1.word.includes(k2.word) || k2.word.includes(k1.word)) {
          const shorter = Math.min(k1.word.length, k2.word.length);
          const longer  = Math.max(k1.word.length, k2.word.length);
          if (shorter / longer >= 0.7) matchScore += w;
        }
      }
    });
  });

  return totalPossibleScore > 0 ? matchScore / totalPossibleScore : 0;
};

export const keywordCoverageCheck = (rateActivityText, inclusionText) => {
  const rateKws = extractKeywords(normalizeActivity(rateActivityText));
  if (!rateKws.length) return 0;
  const inclNorm = normalizeActivity(inclusionText);

  let hits = 0;
  rateKws.forEach(kw => {
    if (inclNorm.includes(kw.word))                              { hits++;        return; }
    if (kw.synonyms.some(s => inclNorm.includes(s)))            { hits++;        return; }
    if (kw.word.length >= 6) {
      const stem = kw.word.slice(0, kw.word.length - 2);
      if (inclNorm.includes(stem))                               { hits += 0.6;         }
    }
  });

  return hits / rateKws.length;
};

export const destinationsMatch = (rateDestination, packageDestination) => {
  if (!rateDestination || !packageDestination) return false;
  const rateLower = rateDestination.toLowerCase();
  const pkgLower  = packageDestination.toLowerCase();

  const toWordBoundaryRegex = (word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`);
  };

  const pkgSubDest  = PALAWAN_SUBDESTS.find(s => toWordBoundaryRegex(s).test(pkgLower));
  const rateSubDest = PALAWAN_SUBDESTS.find(s => toWordBoundaryRegex(s).test(rateLower));
  if (pkgSubDest && rateSubDest && pkgSubDest !== rateSubDest) return false;

  const pkgMainDest = KNOWN_DESTINATIONS.find(d => toWordBoundaryRegex(d).test(pkgLower));
  if (pkgMainDest) {
    const rateHasForeignDest = KNOWN_DESTINATIONS.some(d =>
      d !== pkgMainDest && toWordBoundaryRegex(d).test(rateLower)
    );
    if (rateHasForeignDest) return false;
  }

  for (const dest of KNOWN_DESTINATIONS) {
    if (toWordBoundaryRegex(dest).test(pkgLower) && toWordBoundaryRegex(dest).test(rateLower))
      return true;
  }

  const _resolveTopDestination = (lower) => {
    const pairs = [];
    for (const [top, subs] of Object.entries(DESTINATION_SUBDEST_MAP)) {
      pairs.push({ topDest: top, token: top });
      for (const sub of subs) pairs.push({ topDest: top, token: sub });
    }
    pairs.sort((a, b) => b.token.length - a.token.length);
    const found = pairs.find(({ token }) => toWordBoundaryRegex(token).test(lower));
    return found ? found.topDest : null;
  };

  const pkgTop  = _resolveTopDestination(pkgLower);
  const rateTop = _resolveTopDestination(rateLower);
  if (pkgTop !== null && rateTop !== null) return pkgTop === rateTop;

  const pkgWords = pkgLower
    .split(/\s+/)
    .filter(w => w.length >= 4 && !GENERIC_DESTINATION_WORDS.has(w));
  return pkgWords.some(w => toWordBoundaryRegex(w).test(rateLower));
};

export const activitiesMatch = (inclusion, activity, destination = '') => {

  const tourCodePattern = /\btour\s+([a-z])\b/i;
  const code1 = (inclusion || '').match(tourCodePattern);
  const code2 = (activity  || '').match(tourCodePattern);
  if (code1 && code2 && code1[1].toLowerCase() !== code2[1].toLowerCase()) return false;

  const norm1 = normalizeActivity(inclusion);
  const norm2 = normalizeActivity(activity);

  if (norm1 === norm2) return true;

  const isCross1 = isCrossDestinationActivity(inclusion);
  const isCross2 = isCrossDestinationActivity(activity);

  if (isCross1 || isCross2) {
    const flightKws = ['roundtrip', 'round trip', 'flight', 'airfare', 'air', 'ticket', 'rt', 'pudo'];
    if (flightKws.some(k => norm1.includes(k)) && flightKws.some(k => norm2.includes(k))) return true;
  }

  const stripped = stripInclusionMetadata(inclusion, destination);

  if (stripped.length >= 3) {
    const simThreshold = (isCross1 || isCross2) ? 0.40 : 0.50;
    if (calculateSimilarity(stripped, norm2) >= simThreshold) return true;

    if (keywordCoverageCheck(activity, stripped) >= 0.75) return true;

    const meaningfulWords = stripped.split(' ').filter(w => w.length >= 3).length;
    if (meaningfulWords <= 4 && keywordCoverageCheck(stripped, activity) >= 0.75) return true;

    const GENERIC_ACTIVITY_WORDS = new Set([
      'tour', 'tours', 'trip', 'package', 'day', 'night', 'half', 'full',
      'joining', 'private', 'group', 'shared',
    ]);
    const normStrippedLead = normalizeActivity(stripped).split(/\s+/).slice(0, 4).join(' ');
    const rateKwsLead = extractKeywords(norm2);
    if (rateKwsLead.some(kw =>
      kw.word.length >= 4 &&
      !GENERIC_ACTIVITY_WORDS.has(kw.word) &&
      normStrippedLead.includes(kw.word)
    )) return true;
  }

  const threshold = (isCross1 || isCross2) ? 0.50 : 0.60;
  if (calculateSimilarity(norm1, norm2) >= threshold) return true;

  const categories = {
    flight:        ['flight', 'airfare', 'air', 'plane', 'ticket', 'roundtrip', 'round', 'trip', 'return', 'pudo', 'rt'],
    accommodation: ['accommodation', 'hotel', 'lodging', 'room', 'resort', 'inn'],
    transport:     ['transport', 'transfer', 'van', 'vehicle', 'shuttle', 'tricycle', 'boat'],
    meal:          ['meal', 'breakfast', 'lunch', 'dinner', 'food'],
    tour:          ['tour', 'hopping', 'island', 'snorkel', 'trek', 'visit', 'coastal', 'beach'],
  };

  const getCategories = (kws) => {
    const cats = new Set();
    kws.forEach(kw => {
      Object.entries(categories).forEach(([cat, words]) => {
        if (words.some(w => kw.synonyms.includes(w) || kw.word === w)) cats.add(cat);
      });
    });
    return cats;
  };

  const cats1 = getCategories(extractKeywords(norm1));
  const cats2 = getCategories(extractKeywords(norm2));

  if (cats1.size > 0 && cats2.size > 0) {
    if (![...cats1].some(c => cats2.has(c))) return false;
  }

  return false;
};

export const parsePkgTitleSignals = (pkgTitle, pkgDestination, pkgDuration, tourType, minPax) => {
  const title = pkgTitle || '';

  const destination = (pkgDestination || '').trim();

  const duration = extractDurationCode(title) || extractDurationCode(pkgDuration || '') || null;

  let qualifier = extractPaxQualifierType(title);
  if (qualifier.type === 'generic') {

    const resolvedMinPax = (minPax !== null && minPax !== undefined && minPax !== '')
      ? Number(minPax) : null;
    if (tourType === 'joiners' && resolvedMinPax != null) {
      qualifier = { type: 'minpax', count: resolvedMinPax };
    } else {
      qualifier = { type: 'solo' };
    }
  }

  return { destination, duration, qualifier };
};

export const buildStage1Pool = (sellerRates, signals) => {
  const { destination, duration, qualifier } = signals;

  const destinationPool = sellerRates.filter(rate =>
    destinationsMatch(rate.destination, destination)
  );

  const durationPool = duration
    ? destinationPool.filter(rate => {
        const rd = extractDurationCode(rate.destination || '');
        if (!rd) return true;
        return rd === duration;
      })
    : destinationPool;

  const strictPool = durationPool.filter(rate => {
    const rq = extractPaxQualifierType(rate.destination || '');

    if (rq.type === 'generic') return true;

    if (rq.type === 'solo_joiners') return true;

    if (qualifier.type === 'solo') {

      return rq.type === 'solo';
    }

    if (qualifier.type === 'minpax') {

      if (rq.type === 'solo') return false;
      if (rq.type === 'minpax') return rq.count === qualifier.count;
      return true;
    }

    if (qualifier.type === 'solo_joiners') {

      return rq.type === 'solo_joiners' || rq.type === 'solo';
    }

    return true;
  });

  return { strictPool, destinationPool };
};

export const scoreRateForInclusion = (rate, pkgDuration, pkgQualifier) => {
  let score = 0;

  const rateDuration = extractDurationCode(rate.destination || '');
  if (pkgDuration && rateDuration) {
    if (pkgDuration === rateDuration) score += 200;
    else                              score -= 100;
  }

  const rq = extractPaxQualifierType(rate.destination || '');
  if (rq.type === 'generic') {
    score += 0;
  } else if (rq.type === 'solo_joiners') {
    score += 50;
  } else if (pkgQualifier.type === 'solo' && rq.type === 'solo') {
    score += 100;
  } else if (
    pkgQualifier.type === 'minpax' &&
    rq.type === 'minpax' &&
    rq.count === pkgQualifier.count
  ) {
    score += 100;
  } else {
    score -= 200;
  }

  return score;
};

export const verifyRateFinal = (rate, signals) => {
  const { destination, duration, qualifier } = signals;

  if (!destinationsMatch(rate.destination, destination)) return false;

  const rateDuration = extractDurationCode(rate.destination || '');
  if (duration && rateDuration && rateDuration !== duration) return false;

  const rq = extractPaxQualifierType(rate.destination || '');
  if (rq.type === 'generic') return true;
  if (rq.type === 'solo_joiners') return true;

  if (qualifier.type === 'solo')         return rq.type === 'solo';
  if (qualifier.type === 'minpax')       return rq.type === 'minpax' && rq.count === qualifier.count;
  if (qualifier.type === 'solo_joiners') return rq.type === 'solo_joiners' || rq.type === 'solo';

  return true;
};

export const findAccommodationRate = (strictPool, destinationPool, signals, inclusionText = '') => {
  let candidates = strictPool.filter(rate => isAccommodationInclusion(rate.activity));
  if (candidates.length === 0) {
    candidates = destinationPool.filter(rate => isAccommodationInclusion(rate.activity));
  }
  if (candidates.length === 0) return null;

  const scored = candidates
    .map(rate => ({
      rate,
      score: scoreRateForInclusion(
        rate, signals.duration, signals.qualifier, inclusionText, signals.destination,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  for (const { rate } of scored) {
    if (verifyRateFinal(rate, signals)) return rate;
  }
  return scored[0].rate;
};

const activityNameScore = (inclusionText, rateActivity, destination = '') => {
  if (!inclusionText || !rateActivity) return 0;

  const normInclusion = normalizeActivity(
    stripInclusionMetadata(inclusionText, destination)
  );
  const normActivity  = normalizeActivity(rateActivity);

  if (!normInclusion || !normActivity) return 0;

  if (normInclusion.includes(normActivity)) {
    const ratio = normActivity.length / normInclusion.length;
    return ratio >= 0.7 ? 150 : 100;
  }

  if (normActivity.includes(normInclusion)) {
    const ratio = normInclusion.length / normActivity.length;
    if (ratio >= 0.7) return 60;
  }

  const actKws = extractKeywords(normActivity).filter(kw => !_GENERIC_RATE_WORDS.has(kw.word));
  if (actKws.length > 0 && actKws.length <= 3) {
    let synHits = 0;
    actKws.forEach(kw => {

      if (normInclusion.includes(kw.word)) { synHits++; return; }

      if (kw.synonyms.some(s => normInclusion.includes(s))) { synHits++; return; }
    });
    const synCoverage = synHits / actKws.length;
    if (synCoverage >= 1.0) return 90;
    if (synCoverage >= 0.5) return 40;
  }

  const sim = calculateSimilarity(normInclusion, normActivity);
  return Math.round(sim * 50);
};

const inclusionsFieldScore = (inclusionText, rateInclusionsText) => {
  if (!inclusionText || !rateInclusionsText) return 0;

  const rateKws = extractKeywords(normalizeActivity(rateInclusionsText));
  if (!rateKws.length) return 0;

  const inclNorm = normalizeActivity(inclusionText);

  let hits = 0;
  rateKws.forEach(kw => {
    if (inclNorm.includes(kw.word))                          { hits++; return; }
    if (kw.synonyms.some(s => inclNorm.includes(s)))         { hits++; return; }
  });

  const coverage = hits / rateKws.length;
  return Math.round(coverage * 80);
};

const _GENERIC_RATE_WORDS = new Set([
  'tour', 'tours', 'trip', 'package', 'day', 'night',
  'half', 'full', 'joining', 'private', 'group', 'shared',
]);

const _MIN_RATE_FIRST_SCORE = 50;

const scoreInclusionForRate = (inclusionText, rate, signals) => {
  const norm2        = normalizeActivity(rate.activity);
  const stripped     = stripInclusionMetadata(inclusionText, signals.destination);
  const normStripped = normalizeActivity(stripped);
  const norm1        = normalizeActivity(inclusionText);

  if (normStripped === norm2 || norm1 === norm2) return 1000;

  const aliasBonus = aliasMatch(normStripped, norm2, norm1);
  if (aliasBonus > 0) {

    let score = aliasBonus;
    score += activityNameScore(inclusionText, rate.activity, signals.destination);
    if (rate.inclusions) score += inclusionsFieldScore(inclusionText, rate.inclusions);
    return score;
  }

  let score = 0;

  const leadWords = normStripped.split(/\s+/).slice(0, 6).join(' ');
  const rateKws   = extractKeywords(norm2);
  const specificRateKws = rateKws.filter(kw =>
    kw.word.length >= 4 && !_GENERIC_RATE_WORDS.has(kw.word)
  );
  const leadMatchCount = specificRateKws.filter(kw => leadWords.includes(kw.word)).length;

  if (specificRateKws.length > 0) {

    const leadRatio = leadMatchCount / specificRateKws.length;
    if (leadRatio >= 1.0) score += 500;
    else if (leadRatio >= 0.5) score += 300;
    else if (leadMatchCount >= 1) score += 150;
  }

  score += activityNameScore(inclusionText, rate.activity, signals.destination);

  if (rate.inclusions) {
    score += inclusionsFieldScore(inclusionText, rate.inclusions);
  }

  const coverage = keywordCoverageCheck(rate.activity, normStripped);
  score += Math.round(coverage * 100);

  const wordCount = normStripped.split(/\s+/).filter(w => w.length >= 3).length;
  if (wordCount <= 6) {
    score += Math.round(keywordCoverageCheck(inclusionText, norm2) * 50);
  }

  if (specificRateKws.length > 0 && score > 0) {
    const normInc = normStripped || norm1;

    const incLeadKws = extractKeywords(normInc.split(/\s+/).slice(0, 3).join(' '))
      .filter(kw => kw.word.length >= 5 && !_GENERIC_RATE_WORDS.has(kw.word));
    const conflictCount = incLeadKws.filter(kw =>
      !norm2.includes(kw.word) &&
      !rateKws.some(rk => rk.synonyms.includes(kw.word) || kw.synonyms.includes(rk.word))
    ).length;
    if (conflictCount > 0 && leadMatchCount === 0) {

      score -= Math.min(conflictCount * 200, 400);
    }
  }

  return score;
};

const buildRateFirstAssignments = (strictPool, destinationPool, inclusions, signals) => {
  const generalFilter = (pool) => pool.filter(r =>
    !isAccommodationInclusion(r.activity) && !isRtPudoActivity(r.activity)
  );

  let generalRates = generalFilter(strictPool);
  const usedDestPool = generalRates.length === 0;
  if (usedDestPool) generalRates = generalFilter(destinationPool);
  if (generalRates.length === 0) {
    console.warn('[matcher] ⚠ No general rates found in pool — activity inclusions will not be priced');
    return new Map();
  }

  const rateByActivity = new Map();
  for (const rate of generalRates) {
    const key = normalizeActivity(rate.activity);
    const existing = rateByActivity.get(key);
    if (!existing || (rate.sellingPrice || 0) > (existing.sellingPrice || 0)) {
      rateByActivity.set(key, rate);
    }
  }
  const dedupedRates = [...rateByActivity.values()];

  const eligible = inclusions
    .map((inc, i) => ({ inc, i }))
    .filter(({ inc }) =>
      !isNoMatchInclusion(inc) &&
      !isAccommodationInclusion(inc) &&
      !isRoundtripInclusion(inc)
    );

  if (eligible.length === 0) {
    console.warn('[matcher] ⚠ No eligible general inclusions (all are meta/accommodation/RT)');
    return new Map();
  }

  const allPairs = [];
  for (const rate of dedupedRates) {
    for (const { inc, i } of eligible) {
      const score = scoreInclusionForRate(inc, rate, signals);
      if (score >= _MIN_RATE_FIRST_SCORE) {
        allPairs.push({ rate, idx: i, score });
      }
    }
  }

  allPairs.sort((a, b) => b.score - a.score);

  const usedRates      = new Set();
  const usedInclusions = new Set();
  const assignment     = new Map();

  for (const { rate, idx } of allPairs) {
    const rateKey = normalizeActivity(rate.activity);
    if (usedRates.has(rateKey) || usedInclusions.has(idx)) continue;
    assignment.set(idx, rate);
    usedRates.add(rateKey);
    usedInclusions.add(idx);
  }

  return assignment;
};

export const findTourActivityRate = (strictPool, destinationPool, signals, inclusionText) => {
  const generalPool = (pool) => pool.filter(rate =>
    !isAccommodationInclusion(rate.activity) && !isRtPudoActivity(rate.activity)
  );

  let candidates = generalPool(strictPool).filter(rate =>
    activitiesMatch(inclusionText, rate.activity, signals.destination)
  );
  if (candidates.length === 0) {
    candidates = generalPool(destinationPool).filter(rate =>
      activitiesMatch(inclusionText, rate.activity, signals.destination)
    );
  }
  if (candidates.length === 0) return null;

  const scored = candidates
    .map(rate => ({
      rate,
      score: scoreRateForInclusion(
        rate, signals.duration, signals.qualifier, inclusionText, signals.destination,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  for (const { rate } of scored) {
    if (verifyRateFinal(rate, signals)) return rate;
  }
  return scored[0].rate;
};

export const matchInclusionsWithPrices = (
  inclusions,
  sellerRates,
  destination,
  tourType    = 'private',
  minPax      = null,
  pkgDuration = null,
  pkgTitle    = '',
) => {
  let matchCount = 0;

  const signals = parsePkgTitleSignals(
    pkgTitle, destination, pkgDuration, tourType, minPax,
  );
  const { strictPool, destinationPool } = buildStage1Pool(sellerRates, signals);

  // ── Diagnostics (all destinations) ───────────────────────────────────────
  console.group(`[matcher] ${destination} — "${pkgTitle}"`);
  console.log('signals     :', JSON.stringify(signals));
  console.log('sellerRates :', sellerRates.length, '| destPool:', destinationPool.length, '| strictPool:', strictPool.length);
  if (strictPool.length > 0) {
    console.log('strictPool  :', strictPool.map(r => `${r.activity} (${r.destination})`).join(' | '));
  } else {
    console.warn('⚠ strictPool is EMPTY — check destination spelling, duration, or qualifier');
  }
  console.log('inclusions  :', inclusions);
  // ─────────────────────────────────────────────────────────────────────────

  const rateFirstMap = buildRateFirstAssignments(
    strictPool, destinationPool, inclusions, signals,
  );

  // Single-use guards for RT and Accommodation paths.
  // Prevents multiple inclusions from all being assigned the same rate
  // (e.g. a package with 3 inclusions that pass isAccommodationInclusion
  // should only get ONE accommodation price, not 3 copies of the same rate).
  // The general path already has this via buildRateFirstAssignments greedy logic.
  let rtRateUsed   = false;
  let accomRateUsed = false;

  const buildResult = (idx, inclusion, rate) => ({
    id:                 `original-${idx}`,
    name:               inclusion,
    matchedActivity:    rate.activity,
    matchedDestination: rate.destination,
    price:              rate.sellingPrice || 0,
    supplierRate:       rate.supplierRate,
    markup:             rate.markup,
    markupType:         rate.markupType,
    supplier:           rate.supplierName,
    destination:        rate.destination,
    pax:                rate.pax,
    notes:              rate.notes,
    isOriginal:         true,
    isChecked:          true,
    source:             'seller-rate',
    sellerRateId:       rate._id,
  });

  const noMatch = (idx, inclusion) => ({
    id:                 `original-${idx}`,
    name:               inclusion,
    matchedActivity:    null,
    matchedDestination: null,
    price:              0,
    isOriginal:         true,
    isChecked:          true,
    source:             'package',
  });

  const matched = inclusions.map((inclusion, idx) => {

    if (destinationPool.length === 0) {
      console.warn(`  [${idx}] NO MATCH — destinationPool empty:`, inclusion);
      return noMatch(idx, inclusion);
    }

    if (isNoMatchInclusion(inclusion)) {
      console.log(`  [${idx}] blacklisted (meta):`, inclusion);
      return noMatch(idx, inclusion);
    }

    if (isRoundtripInclusion(inclusion)) {
      if (!destinationSupports(signals.destination, 'rt')) {
        console.log(`  [${idx}] RT not supported for dest:`, inclusion);
        return noMatch(idx, inclusion);
      }
      if (rtRateUsed) {
        console.log(`  [${idx}] RT already assigned to another inclusion — skipping:`, inclusion);
        return noMatch(idx, inclusion);
      }
      const rate = findRtPudoRate(strictPool, destinationPool, signals);
      if (!rate) {
        console.warn(`  [${idx}] RT NO MATCH — no RT rate found:`, inclusion);
        return noMatch(idx, inclusion);
      }
      rtRateUsed = true;
      matchCount++;
      console.log(`  [${idx}] ✓ RT →`, rate.activity, rate.destination, '₱' + rate.sellingPrice);
      return buildResult(idx, inclusion, rate);
    }

    if (isAccommodationInclusion(inclusion)) {
      if (!destinationSupports(signals.destination, 'accommodation')) {
        console.log(`  [${idx}] Accommodation not supported for dest:`, inclusion);
        return noMatch(idx, inclusion);
      }
      if (accomRateUsed) {
        console.log(`  [${idx}] Accommodation already assigned to another inclusion — skipping:`, inclusion);
        return noMatch(idx, inclusion);
      }
      const rate = findAccommodationRate(strictPool, destinationPool, signals, inclusion);
      if (!rate) {
        console.warn(`  [${idx}] ACCOMMODATION NO MATCH — no rate found:`, inclusion);
        return noMatch(idx, inclusion);
      }
      accomRateUsed = true;
      matchCount++;
      console.log(`  [${idx}] ✓ Accommodation →`, rate.activity, rate.destination, '₱' + rate.sellingPrice);
      return buildResult(idx, inclusion, rate);
    }

    const assignedRate = rateFirstMap.get(idx);
    if (!assignedRate) {
      console.warn(`  [${idx}] GENERAL NO MATCH — scored below threshold:`, inclusion);
      return noMatch(idx, inclusion);
    }
    matchCount++;
    console.log(`  [${idx}] ✓ General →`, assignedRate.activity, assignedRate.destination, '₱' + assignedRate.sellingPrice);
    return buildResult(idx, inclusion, assignedRate);
  });

  console.log(`matched: ${matchCount} / ${inclusions.length}`);
  console.groupEnd();

  return { matched, matchCount };
};