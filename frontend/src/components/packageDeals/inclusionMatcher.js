// ============================================================
// inclusionMatcher.js
// All inclusion-to-seller-rate matching logic for PackageCustomizer.
// Extracted for separation of concerns and easier unit testing.
//
// KEY ARCHITECTURE NOTE:
//   Seller rate `destination` field encodes location + duration + pax qualifier:
//     e.g. "El Nido 4D3N (Solo)", "El Nido 4D3N (min. of 2 pax)"
//
// ─────────────────────────────────────────────────────────────
// DEPENDENCY DIRECTION (one-way, no circular imports):
//
//   PackageCustomizer.jsx
//         ↓ imports
//   inclusionMatcher.js
//         ↓ imports
//   rtPudoMatcher.js   (zero imports — fully self-contained)
//
// ─────────────────────────────────────────────────────────────
// MATCHING PIPELINE (per inclusion):
//
//   Stage 1 — Read the PACKAGE TITLE to extract all three signals simultaneously:
//               (a) destination  e.g. "El Nido"
//               (b) duration     e.g. "4D3N"
//               (c) pax qualifier at end of title:
//                     "(Solo)", "(Solo/Joiners)", "(min. of 2 pax)"
//             Filter ALL seller rates where rate.destination satisfies
//             ALL THREE at once → this is the narrowed Stage 1 pool.
//             Hard qualifier rules:
//               solo pkg      → keeps (Solo), (Solo/Joiners), no-qualifier
//                               REJECTS all (min. of N pax)
//               minpax N pkg  → keeps exact (min. of N pax), (Solo/Joiners),
//                               no-qualifier; REJECTS (Solo) + wrong counts
//
//   Stage 2 — From the Stage 1 pool, find the rate whose activity matches
//             the inclusion's service type:
//               "Accommodation" → keyword match on rate.activity
//               "RT (PUDO)"     → exact activity match via rtPudoMatcher.js
//                                 (roundtrip / airfare / PUDO inclusions)
//               Others          → 6-layer fuzzy match on rate.activity
//             If Stage 1 pool has no candidates for that inclusion,
//             fall back to a destination-only pool.
//
//   Stage 3 — Final re-examination of the top candidate.
//             Re-confirm it satisfies destination + duration + qualifier.
//             Walk scored list until one passes.
//             If none pass → use best-scored (price always shown, never 0).
// ============================================================


// ─────────────────────────────────────────────────────────────
// IMPORTS
// RT (PUDO) matching is fully handled by rtPudoMatcher.js.
// rtPudoMatcher.js has ZERO imports — it is self-contained.
// This is a one-way dependency: inclusionMatcher → rtPudoMatcher.
// ─────────────────────────────────────────────────────────────

import {
  isRoundtripInclusion,
  isRtPudoActivity,
  findRtPudoRate,
} from './rtPudoMatcher.js';


// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

export const KNOWN_DESTINATIONS = [
  'puerto princesa', 'el nido', 'coron palawan', 'siargao island',
  'siargao', 'siquijor', 'bohol', 'cebu', 'coron',
  // 'bohol' IS included so Bohol packages can build a destinationPool and
  //   match general activity rates (tours, transfers, meals).
  //   Accommodation and RT inclusions are blocked for Bohol via the
  //   DESTINATION_CAPABILITIES guard in matchInclusionsWithPrices — not by
  //   removing Bohol from this list (which would break all other inclusions too).
  // 'palawan' intentionally omitted — too generic as a standalone token.
  // It lets El Nido packages cross-match Coron Palawan rates and vice versa
  // via the KNOWN_DESTINATIONS loop. Sub-destinations are already covered
  // precisely by 'coron palawan', 'el nido', and 'puerto princesa' above.
];

export const SYNONYM_MAP = {
  'flight':         ['airfare', 'air', 'plane', 'aviation', 'ticket', 'roundtrip', 'round trip', 'rt'],
  'airfare':        ['flight', 'air', 'plane', 'ticket', 'roundtrip', 'round trip'],
  'roundtrip':      ['round trip', 'return', 'twoway', 'two way', 'rt', 'flight', 'airfare', 'air'],
  'round':          ['roundtrip', 'return'],
  'trip':           ['journey', 'travel'],
  'oneway':         ['one way', 'single', 'ow'],
  'accommodation':  ['hotel', 'lodging', 'stay', 'room', 'inn'],
  'hotel':          ['accommodation', 'lodging', 'inn', 'resort'],
  'resort':         ['hotel', 'accommodation', 'inn'],
  'room':           ['accommodation', 'hotel', 'lodging'],
  'transport':      ['transfer', 'transportation', 'shuttle', 'vehicle', 'ride'],
  'transfer':       ['transport', 'shuttle', 'pickup', 'dropoff', 'pudo'],
  'van':            ['vehicle', 'shuttle', 'transport'],
  'tricycle':       ['trike', 'vehicle'],
  'boat':           ['ferry', 'vessel', 'ship'],
  'meal':           ['food', 'dining', 'breakfast', 'lunch', 'dinner'],
  'breakfast':      ['meal', 'food', 'morning'],
  'lunch':          ['meal', 'food', 'midday', 'luncheon'],
  'dinner':         ['meal', 'food', 'evening', 'supper'],
  'tour':           ['trip', 'excursion', 'visit', 'sightseeing', 'experience'],
  'island':         ['isle', 'islet'],
  'hopping':        ['hop', 'jumping', 'tour'],
  'snorkel':        ['snorkeling', 'diving', 'underwater', 'swim'],
  'dive':           ['diving', 'snorkel', 'underwater'],
  'trek':           ['trekking', 'hike', 'hiking', 'walking'],
  'climb':          ['climbing', 'ascent', 'hike'],
  'beach':          ['shore', 'coast', 'seaside'],
  'coastal':        ['coast', 'beach', 'shore', 'seaside'],
  'guide':          ['escort', 'leader', 'companion'],
  'entrance':       ['admission', 'entry', 'fee', 'ticket'],
  'museum':         ['gallery', 'exhibit'],
  'pudo':           ['pickup', 'dropoff', 'transfer', 'transport', 'rt'],
  'rt':             ['roundtrip', 'round trip', 'return', 'transfer', 'pudo'],
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
  'accommodation', 'hotel', 'lodging', 'inn', 'resort', 'room', 'stay',
];

// ─────────────────────────────────────────────────────────────
// DESTINATION CAPABILITIES MAP
//
// Declares which rate types are available per destination.
// If a destination does NOT support 'accommodation' or 'rt',
// the matcher immediately returns noMatch for that inclusion type
// instead of falling through to a wrong rate.
//
// accommodation — seller rates with an accommodation-type activity exist
// rt            — seller rates with "RT (PUDO)" activity exist
//
// Bohol:   NO accommodation rates, NO RT rates → only general activity rates
// Siargao: accommodation rates exist, NO RT rates
// All Palawan sub-dests + Cebu + Siquijor: both types available
//
// IMPORTANT: entries must be ordered longest-key-first within overlapping groups
// (e.g. 'puerto princesa' before 'princesa', 'coron palawan' before 'coron')
// so the find() in destinationSupports never short-circuits on a shorter key.
// ─────────────────────────────────────────────────────────────
export const DESTINATION_CAPABILITIES = {
  'puerto princesa': { accommodation: true,  rt: true  },
  'coron palawan':   { accommodation: true,  rt: true  },
  'el nido':         { accommodation: true,  rt: true  },
  'siargao island':  { accommodation: true,  rt: false },
  'siargao':         { accommodation: true,  rt: false },
  'siquijor':        { accommodation: true,  rt: true  },
  'cebu':            { accommodation: true,  rt: true  },
  'coron':           { accommodation: true,  rt: true  },
  'bohol':           { accommodation: false, rt: false },
};

/**
 * destinationSupports
 * Returns true if the given destination has seller rates of the requested type.
 *
 * Matching strategy: finds the LONGEST capability key that appears as a
 * substring of the destination string, to avoid 'coron' shadowing 'coron palawan'.
 * Falls back to true (permissive) for any destination not in the map,
 * so new destinations automatically attempt matching rather than being silently blocked.
 *
 * @param {string} destination — package destination DB field (e.g. "Siargao Island")
 * @param {'accommodation'|'rt'} rateType
 */
export const destinationSupports = (destination, rateType) => {
  if (!destination) return true;
  const lower = destination.toLowerCase();
  // Sort entries by key length descending — longest (most specific) match wins
  const entries = Object.entries(DESTINATION_CAPABILITIES)
    .sort((a, b) => b[0].length - a[0].length);
  const entry = entries.find(([key]) => lower.includes(key));
  if (!entry) return true; // unknown destination — allow matching
  return entry[1][rateType] === true;
};

// ─────────────────────────────────────────────────────────────
// DESTINATION MATCH HELPERS
// ─────────────────────────────────────────────────────────────

// Generic geographic / English words that must NEVER act as destination
// match tokens in the pkgWords fallback of destinationsMatch.
// These words appear in many seller rate destination strings and would
// cause false-positive cross-destination matches if used as tokens.
//
// Root-cause examples this prevents:
//   'island' in 'Siargao Island' pkg → would match 'El Nido Island Hopping 4D3N' rate
//   'island' in 'Bohol Island' pkg   → would match 'Coron Island Tour 4D3N' rate
//   'island' leak → wrong RT/accommodation rate from El Nido shown for Siargao packages
//
// The KNOWN_DESTINATIONS loop handles all precise destination names.
// This set guards only the pkgWords last-resort fallback.
export const GENERIC_DESTINATION_WORDS = new Set([
  'island', 'islands', 'isle', 'islet',
  'province', 'area', 'region', 'district',
  'city', 'town', 'north', 'south', 'east', 'west', 'central',
  'tour', 'tours', 'beach', 'resort',
  'philippines', 'pilipinas', 'luzon', 'visayas', 'mindanao',
]);

// Palawan sub-destinations that share the regional word 'palawan'.
// Used by destinationsMatch to hard-reject cross-sub-destination matches.
// e.g. an El Nido package must NEVER match Coron Palawan rates.
const PALAWAN_SUBDESTS = ['el nido', 'puerto princesa', 'coron'];


// ─────────────────────────────────────────────────────────────
// TEXT HELPERS  (all existing helpers preserved exactly)
// ─────────────────────────────────────────────────────────────

/**
 * isAccommodationInclusion
 * Returns true if the text describes an accommodation service.
 * Used to route the inclusion to the accommodation keyword-match path
 * instead of the general fuzzy-match path.
 *
 * Examples that return true:
 *   "Hotel Accommodation"
 *   "4D3N Accommodation"
 *   "Resort Room"
 */
export const isAccommodationInclusion = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return ACCOMMODATION_KEYWORDS.some(kw => lower.includes(kw));
};

export const getSynonyms = (word) => {
  const lower = word.toLowerCase();
  return [lower, ...(SYNONYM_MAP[lower] || [])];
};

export const isCrossDestinationActivity = (text) => {
  const normalized = (text || '').toLowerCase();
  return CROSS_DESTINATION_KEYWORDS.some(k => normalized.includes(k));
};

/**
 * extractDurationCode
 * Pulls the XDxN code out of any text string.
 * Works on package titles, seller rate destination fields, inclusion strings.
 * Returns uppercase e.g. "4D3N", or null.
 */
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

/**
 * extractMinPax
 * Pulls the minimum-pax number out of a destination or package title string.
 * Returns the number, or null if not found.
 *
 * Matches:
 *   "El Nido (min. of 2 pax)"       → 2
 *   "El Nido 5D4N (min. of 2 pax)"  → 2
 *   "min of 3 pax"                  → 3
 */
export const extractMinPax = (text) => {
  if (!text) return null;
  const match = text.match(/\bmin(?:imum)?\.?\s*(?:of\s*)?(\d+)\s*pax\b/i);
  return match ? parseInt(match[1]) : null;
};

/**
 * extractPaxQualifierType
 * Classifies the pax qualifier embedded in a destination string or package title.
 * Used on BOTH package titles AND seller rate destination fields.
 *
 *   "El Nido 4D3N (Solo/Joiners)" → { type: 'solo_joiners' }
 *   "El Nido 4D3N (Solo)"         → { type: 'solo' }
 *   "El Nido 4D3N (min. of 2 pax)"→ { type: 'minpax', count: 2 }
 *   "El Nido 4D3N"                 → { type: 'generic' }
 */
export const extractPaxQualifierType = (text) => {
  if (!text) return { type: 'generic' };
  const lower = text.toLowerCase();

  // Check solo/joiners first — it also contains "solo", so must come first
  if (/solo\s*\/\s*joiners?/i.test(lower)) return { type: 'solo_joiners' };

  const minPax = extractMinPax(lower);
  if (minPax !== null) return { type: 'minpax', count: minPax };

  if (/\bsolo\b/.test(lower)) return { type: 'solo' };

  return { type: 'generic' };
};

export const normalizeActivity = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/roundtrip/g, 'round trip')
    .replace(/twoway/g, 'two way')
    .replace(/oneway/g, 'one way')
    .replace(/\s+/g, ' ')
    .trim();
};

export const extractKeywords = (text) => {
  const normalized = normalizeActivity(text);
  const noiseWords = ['the', 'and', 'or', 'with', 'for', 'in', 'on', 'at', 'to', 'from', 'a', 'an'];
  return normalized
    .split(' ')
    .filter(w => w.length >= 3 && !noiseWords.includes(w))
    .map(word => ({ word, length: word.length, synonyms: getSynonyms(word) }));
};

/**
 * stripInclusionMetadata
 * Removes package-level metadata from an inclusion string so only the core
 * activity label remains for text comparison.
 *
 * Removes: duration codes, pax labels, known destination names,
 *          dynamic destination words, separators/punctuation.
 *
 * NOTE: Always extract signals BEFORE calling this — it destroys them.
 *
 * Examples:
 *   "Puerto Princesa 4D3N (Solo) Roundtrip Airfare" → "roundtrip airfare"
 *   "4D3N Hotel Accommodation"                      → "hotel accommodation"
 *   "Siargao Island – Surf Lesson"                  → "surf lesson"
 */
export const stripInclusionMetadata = (text, destination = '') => {
  if (!text) return '';
  let stripped = text.toLowerCase();

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
    .replace(/[-–—|:,/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};


// ─────────────────────────────────────────────────────────────
// SIMILARITY / KEYWORD MATCHING  (all existing logic preserved exactly)
// ─────────────────────────────────────────────────────────────

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
      if (k1.length >= 5 && k2.length >= 5) {
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


// ─────────────────────────────────────────────────────────────
// DESTINATION MATCHING  (existing logic preserved exactly)
// ─────────────────────────────────────────────────────────────

/**
 * destinationsMatch
 * Returns true if a seller rate's destination field refers to the same
 * physical location as the package destination.
 *
 * LOCATION ONLY — qualifier matching is handled separately in buildStage1Pool.
 *
 * Two cross-contamination guards:
 *
 *   Guard 1 — PALAWAN SUBDEST CONFLICT
 *     El Nido, Coron, and Puerto Princesa all share the regional word 'palawan'.
 *     If both sides name a specific Palawan sub-destination and they differ,
 *     reject immediately before the KNOWN_DESTINATIONS loop runs.
 *     e.g. pkg='El Nido, Palawan' vs rate='Coron Palawan 4D3N' → false.
 *
 *   Guard 2 — GENERIC_DESTINATION_WORDS blacklist on pkgWords fallback
 *     The pkgWords fallback splits the package destination into word tokens and
 *     checks each against the rate destination string. Generic geographic words
 *     like 'island', 'beach', 'tour' appear in many rate destination strings
 *     and MUST be filtered out so they cannot act as false-positive match tokens.
 *     Root cause this fixes:
 *       'Siargao Island' pkg → 'island' token → matches 'El Nido Island Hopping 4D3N'
 *       → El Nido RT/accommodation rates bleed into Siargao's destinationPool
 *       → wrong prices shown for Siargao packages.
 *     With the filter: 'island' is blocked, only 'siargao' survives as a token,
 *     and the match is correctly scoped to Siargao-only rates.
 */
export const destinationsMatch = (rateDestination, packageDestination) => {
  if (!rateDestination || !packageDestination) return false;

  const rateLower = rateDestination.toLowerCase();
  const pkgLower  = packageDestination.toLowerCase();

  // Guard 1: Palawan sub-destination conflict
  const pkgSubDest  = PALAWAN_SUBDESTS.find(s => pkgLower.includes(s));
  const rateSubDest = PALAWAN_SUBDESTS.find(s => rateLower.includes(s));
  if (pkgSubDest && rateSubDest && pkgSubDest !== rateSubDest) return false;

  // KNOWN_DESTINATIONS precise loop
  for (const dest of KNOWN_DESTINATIONS) {
    if (pkgLower.includes(dest) && rateLower.includes(dest)) return true;
  }

  // Guard 2: pkgWords fallback — filter out generic geographic words so they
  // cannot leak cross-destination rates into the pool.
  const pkgWords = pkgLower
    .split(/\s+/)
    .filter(w => w.length >= 4 && !GENERIC_DESTINATION_WORDS.has(w));
  return pkgWords.some(w => rateLower.includes(w));
};


// ─────────────────────────────────────────────────────────────
// ACTIVITY MATCHING  (existing 6-layer logic preserved exactly)
// ─────────────────────────────────────────────────────────────

/**
 * activitiesMatch — 6-layer matching pipeline.
 *
 *   Layer 1 — Exact normalized equality
 *   Layer 2 — Flight/cross-destination keyword shortcut
 *   Layer 3 — Similarity on STRIPPED inclusion vs rate activity
 *   Layer 4 — Keyword coverage: % of rate keywords found in stripped inclusion
 *   Layer 5 — Similarity on ORIGINAL inclusion text (unchanged fallback)
 *   Layer 6 — Category guard: reject obvious category mismatches
 *
 * NOTE: Only determines IF two texts describe the same activity.
 * Rate selection among multiple matches is handled by scoreRateForInclusion.
 */
export const activitiesMatch = (inclusion, activity, destination = '') => {
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


// ─────────────────────────────────────────────────────────────
// STAGE 1 — PACKAGE TITLE PARSER  (NEW)
// ─────────────────────────────────────────────────────────────

/**
 * parsePkgTitleSignals
 * Reads the package title to extract all three Stage 1 matching signals.
 *
 * Package titles always follow this format:
 *   "<Destination> <Duration> (<Qualifier>) [rest of title]"
 *   e.g. "El Nido 4D3N (min. of 2 pax) Island Hopping Tour"
 *        "Siargao 3D2N (Solo/Joiners) Surf Package"
 *        "Puerto Princesa 5D4N (Solo) Budget Tour"
 *
 * Signal priority:
 *   destination → always pkg.destination DB field (ground truth, never from title text)
 *   duration    → XDxN from title first, then pkg.duration field as fallback
 *   qualifier   → pax label at end of title first, then tourType+minPax DB fields
 *
 * Returns: { destination: string, duration: string|null, qualifier: object }
 */
export const parsePkgTitleSignals = (pkgTitle, pkgDestination, pkgDuration, tourType, minPax) => {
  const title = pkgTitle || '';

  // 1. Destination — always the explicit pkg.destination DB field
  const destination = (pkgDestination || '').trim();

  // 2. Duration — try to read from title first, fall back to pkg.duration field
  const duration = extractDurationCode(title) || extractDurationCode(pkgDuration || '') || null;

  // 3. Qualifier — try to read from title first, fall back to DB fields
  let qualifier = extractPaxQualifierType(title);
  if (qualifier.type === 'generic') {
    // Title had no pax qualifier — derive from tourType + minPax DB fields
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


// ─────────────────────────────────────────────────────────────
// STAGE 1 — POOL BUILDER  (NEW)
// ─────────────────────────────────────────────────────────────

/**
 * buildStage1Pool
 * Filters ALL seller rates to only those where rate.destination satisfies
 * ALL THREE Stage 1 signals simultaneously.
 *
 * (a) Destination — rate.destination contains the same location keyword
 * (b) Duration    — rate.destination XDxN equals pkg duration
 *                   (rates with NO duration code are kept as neutral fallbacks)
 * (c) Qualifier   — HARD rules, zero cross-contamination:
 *
 *   solo pkg      → accepts (Solo), (Solo/Joiners), no-qualifier rates
 *                   REJECTS every (min. of N pax) rate, regardless of count
 *
 *   minpax N pkg  → accepts (min. of N pax) with EXACT matching count,
 *                   (Solo/Joiners), and no-qualifier rates
 *                   REJECTS (Solo) and (min. of M pax) where M ≠ N
 *
 * Returns:
 *   strictPool      — rates that pass all 3 signals → primary pool for Stage 2
 *   destinationPool — rates that pass destination only → fallback pool for Stage 2
 */
export const buildStage1Pool = (sellerRates, signals) => {
  const { destination, duration, qualifier } = signals;

  // Broadest pool: destination match only (used as Stage 2 fallback)
  const destinationPool = sellerRates.filter(rate =>
    destinationsMatch(rate.destination, destination)
  );

  // Apply duration filter on top of destination
  const durationPool = duration
    ? destinationPool.filter(rate => {
        const rd = extractDurationCode(rate.destination || '');
        if (!rd) return true;       // no duration code in rate → neutral, keep
        return rd === duration;
      })
    : destinationPool;

  // Apply qualifier filter — HARD, no exceptions
  const strictPool = durationPool.filter(rate => {
    const rq = extractPaxQualifierType(rate.destination || '');

    // No qualifier in rate → neutral, always accepted
    if (rq.type === 'generic') return true;

    // (Solo/Joiners) is accepted by every package type
    if (rq.type === 'solo_joiners') return true;

    if (qualifier.type === 'solo') {
      // Solo package: only (Solo) rates survive; all (min. of N pax) are rejected
      return rq.type === 'solo';
    }

    if (qualifier.type === 'minpax') {
      // Minpax package: (Solo) is always rejected; exact count match required
      if (rq.type === 'solo') return false;
      if (rq.type === 'minpax') return rq.count === qualifier.count;
      return true;
    }

    if (qualifier.type === 'solo_joiners') {
      return rq.type === 'solo_joiners';
    }

    return true;
  });

  return { strictPool, destinationPool };
};


// ─────────────────────────────────────────────────────────────
// RATE SCORING  (updated: scores against Stage 1 signals, not inclusion text)
// ─────────────────────────────────────────────────────────────

/**
 * scoreRateForInclusion
 * Scores a candidate rate against the package's Stage 1 signals.
 * Used to rank multiple candidates that survive Stage 2 activity matching.
 *
 * PRIMARY   (+200 / -100) — duration code in rate.destination vs pkg duration
 * SECONDARY (+100 / +50 / 0 / -200) — qualifier alignment
 *
 *   +200  exact duration match
 *   -100  duration mismatch
 *   +100  exact qualifier match (solo↔solo  or  minpax N ↔ minpax N)
 *   +50   (Solo/Joiners) in rate — accepted by all, but not an exact match
 *     0   no qualifier in rate — neutral fallback
 *   -200  conflicting qualifier — safety net (should not survive buildStage1Pool)
 *
 * @param {object} rate         — seller rate record
 * @param {string} pkgDuration  — e.g. "4D3N" from parsePkgTitleSignals
 * @param {object} pkgQualifier — e.g. { type: 'minpax', count: 2 }
 */
export const scoreRateForInclusion = (rate, pkgDuration, pkgQualifier) => {
  let score = 0;

  // Duration (PRIMARY discriminator)
  const rateDuration = extractDurationCode(rate.destination || '');
  if (pkgDuration && rateDuration) {
    if (pkgDuration === rateDuration) score += 200;
    else                              score -= 100;
  }

  // Qualifier (SECONDARY discriminator)
  const rq = extractPaxQualifierType(rate.destination || '');
  if (rq.type === 'generic') {
    score += 0;           // neutral
  } else if (rq.type === 'solo_joiners') {
    score += 50;          // accepted by all, not exact
  } else if (pkgQualifier.type === 'solo' && rq.type === 'solo') {
    score += 100;         // exact match
  } else if (
    pkgQualifier.type === 'minpax' &&
    rq.type === 'minpax' &&
    rq.count === pkgQualifier.count
  ) {
    score += 100;         // exact match
  } else {
    score -= 200;         // conflicting — safety net, should not appear after buildStage1Pool
  }

  return score;
};


// ─────────────────────────────────────────────────────────────
// STAGE 3 — FINAL VERIFICATION  (NEW)
// ─────────────────────────────────────────────────────────────

/**
 * verifyRateFinal
 * Re-examines a candidate rate against ALL Stage 1 signals.
 * This is the final gate before committing to a rate's sellingPrice.
 *
 * Checks:
 *   1. Destination matches
 *   2. Duration matches (only when both sides carry a code)
 *   3. Qualifier is compatible with the package type
 *
 * Returns true only when all three pass.
 */
export const verifyRateFinal = (rate, signals) => {
  const { destination, duration, qualifier } = signals;

  // 1. Destination must match
  if (!destinationsMatch(rate.destination, destination)) return false;

  // 2. Duration must match (only enforced when both sides have a code)
  const rateDuration = extractDurationCode(rate.destination || '');
  if (duration && rateDuration && rateDuration !== duration) return false;

  // 3. Qualifier must be compatible
  const rq = extractPaxQualifierType(rate.destination || '');
  if (rq.type === 'generic') return true;        // neutral — always passes
  if (rq.type === 'solo_joiners') return true;   // accepted by all

  if (qualifier.type === 'solo')         return rq.type === 'solo';
  if (qualifier.type === 'minpax')       return rq.type === 'minpax' && rq.count === qualifier.count;
  if (qualifier.type === 'solo_joiners') return rq.type === 'solo_joiners';

  return true;
};


// ─────────────────────────────────────────────────────────────
// DEDICATED RATE FINDER — ACCOMMODATION
// (RT PUDO finder lives in rtPudoMatcher.js)
// ─────────────────────────────────────────────────────────────

/**
 * findAccommodationRate
 * Finds the best seller rate for an accommodation inclusion.
 * Searches ONLY rates whose activity is an accommodation keyword.
 * Never calls activitiesMatch — keyword match only.
 *
 * @returns matched rate object, or null if none found
 */
export const findAccommodationRate = (strictPool, destinationPool, signals) => {
  // Try strictPool (destination + duration + qualifier filtered) first
  let candidates = strictPool.filter(rate => isAccommodationInclusion(rate.activity));

  // Fallback to destination-only pool
  if (candidates.length === 0) {
    candidates = destinationPool.filter(rate => isAccommodationInclusion(rate.activity));
  }

  if (candidates.length === 0) return null;

  const scored = candidates
    .map(rate => ({ rate, score: scoreRateForInclusion(rate, signals.duration, signals.qualifier) }))
    .sort((a, b) => b.score - a.score);

  // Stage 3: walk and re-verify
  for (const { rate } of scored) {
    if (verifyRateFinal(rate, signals)) return rate;
  }

  // No candidate passed re-verification — return best-scored so price is always shown
  return scored[0].rate;
};


// ─────────────────────────────────────────────────────────────
// MAIN MATCHER
// ─────────────────────────────────────────────────────────────

/**
 * matchInclusionsWithPrices
 *
 * Per-inclusion pipeline — 3 stages:
 *
 *   Stage 1 — Parse package title → extract destination, duration, qualifier.
 *             buildStage1Pool() filters all seller rates where rate.destination
 *             matches ALL THREE simultaneously.
 *             strictPool and destinationPool are computed ONCE and reused
 *             for every inclusion in the same package.
 *
 *   Stage 2 — Search strictPool for rates whose activity matches the inclusion:
 *               Accommodation → findAccommodationRate() — keyword match only
 *               RT (PUDO)     → findRtPudoRate() from rtPudoMatcher.js
 *                               — exact activity name match only, fully isolated
 *               Others        → 6-layer fuzzy match on rate.activity
 *             If strictPool yields no candidates for that inclusion →
 *             fall back to destinationPool (same activity-match logic).
 *             Score and sort survivors.
 *
 *   Stage 3 — Walk the scored list top-to-bottom.
 *             Take the FIRST rate that passes verifyRateFinal
 *             (destination + duration + qualifier all re-confirmed).
 *             If none pass → use best-scored (price always shown, never 0).
 *
 * @param {string[]} inclusions   — raw inclusion strings from the package
 * @param {object[]} sellerRates  — full seller rate records from the API
 * @param {string}   destination  — package destination field (e.g. "El Nido")
 * @param {string}   tourType     — 'private' | 'joiners'
 * @param {number}   minPax       — only relevant when tourType='joiners'
 * @param {string}   pkgDuration  — package duration field (e.g. "4D3N"), fallback
 * @param {string}   pkgTitle     — full package title — PRIMARY source for all signals
 *
 * Returns: { matched: Array, matchCount: number }
 */
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

  // ── Stage 1: parse signals from title once, build pools once ──────────────
  const signals = parsePkgTitleSignals(
    pkgTitle,
    destination,
    pkgDuration,
    tourType,
    minPax,
  );

  const { strictPool, destinationPool } = buildStage1Pool(sellerRates, signals);

  // ── Shared result builders ────────────────────────────────────────────────
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

  // ── Per-inclusion matching ─────────────────────────────────────────────────
  const matched = inclusions.map((inclusion, idx) => {

    // Nothing at all for this destination → immediate noMatch
    if (destinationPool.length === 0) return noMatch(idx, inclusion);

    // ── RT (PUDO) PATH ────────────────────────────────────────────────────────
    // MUST come before the accommodation check.
    // RT inclusion strings can contain accommodation-adjacent words
    // (e.g. "Roundtrip to Resort", "Hotel Transfer (RT)", "RT from Resort Area").
    // If accommodation were checked first, those inclusions would be misrouted to
    // findAccommodationRate and return accommodation prices instead of RT prices.
    //
    // Capability guard: if this destination has no RT (PUDO) rates in the DB
    // (e.g. Siargao, Bohol), return noMatch immediately — do NOT let the fuzzy
    // path pick up an unrelated rate as a false positive.
    //
    // Delegates entirely to findRtPudoRate (rtPudoMatcher.js) —
    // exact activity name match only, completely isolated from fuzzy matching.
    if (isRoundtripInclusion(inclusion)) {
      if (!destinationSupports(signals.destination, 'rt')) {
        return noMatch(idx, inclusion);
      }
      const rate = findRtPudoRate(strictPool, destinationPool, signals);
      if (!rate) return noMatch(idx, inclusion);
      matchCount++;
      return buildResult(idx, inclusion, rate);
    }

    // ── ACCOMMODATION PATH ─────────────────────────────────────────────────
    // Only reached when isRoundtripInclusion() returned false above.
    //
    // Capability guard: if this destination has no accommodation rates in the DB
    // (e.g. Bohol), return noMatch immediately — prevents the fuzzy path from
    // accidentally scoring a tour/activity rate as an accommodation match.
    //
    // Delegates entirely to findAccommodationRate — keyword match only, never fuzzy.
    if (isAccommodationInclusion(inclusion)) {
      if (!destinationSupports(signals.destination, 'accommodation')) {
        return noMatch(idx, inclusion);
      }
      const rate = findAccommodationRate(strictPool, destinationPool, signals);
      if (!rate) return noMatch(idx, inclusion);
      matchCount++;
      return buildResult(idx, inclusion, rate);
    }

    // ── GENERAL PATH ──────────────────────────────────────────────────────────
    // Hard guard: accommodation and RT inclusions must NEVER reach this path.
    // They have already been handled above with their dedicated finders.
    if (isAccommodationInclusion(inclusion) || isRoundtripInclusion(inclusion)) {
      return noMatch(idx, inclusion);
    }

    // Stage 2: 6-layer fuzzy activity match — try strictPool first.
    // Exclude accommodation and RT (PUDO) rates from the pool so the fuzzy
    // scorer can never accidentally score them as a match for other inclusions.
    const generalPool = (pool) => pool.filter(rate =>
      !isAccommodationInclusion(rate.activity) && !isRtPudoActivity(rate.activity)
    );

    let candidates = generalPool(strictPool).filter(rate =>
      activitiesMatch(inclusion, rate.activity, destination)
    );

    // Stage 2 fallback: strictPool had no activity match → try destinationPool
    if (candidates.length === 0) {
      candidates = generalPool(destinationPool).filter(rate =>
        activitiesMatch(inclusion, rate.activity, destination)
      );
    }

    if (candidates.length === 0) return noMatch(idx, inclusion);

    // Score and sort
    const scored = candidates
      .map(rate => ({
        rate,
        score: scoreRateForInclusion(rate, signals.duration, signals.qualifier),
      }))
      .sort((a, b) =>
        b.score !== a.score
          ? b.score - a.score
          : (a.rate.sellingPrice || 0) - (b.rate.sellingPrice || 0)
      );

    // Stage 3: walk and re-verify — take first that passes all Stage 1 checks
    for (const { rate } of scored) {
      if (verifyRateFinal(rate, signals)) {
        matchCount++;
        return buildResult(idx, inclusion, rate);
      }
    }

    // No candidate passed re-verification — use best-scored
    matchCount++;
    return buildResult(idx, inclusion, scored[0].rate);
  });

  return { matched, matchCount };
};