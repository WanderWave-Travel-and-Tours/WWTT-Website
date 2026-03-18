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
  'boracay',  // ← Island Hopping rates confirmed in seller rate list
  'batanes',  // ← North & South / Complete Tour rates confirmed in seller rate list
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
  // Cebu-specific synonyms — connects verbose inclusion text to short rate activity names
  'whale':          ['oslob', 'shark', 'whaleshark'],
  'oslob':          ['whale', 'shark', 'whaleshark', 'swimming'],
  'moalboal':       ['sardine', 'panagsama', 'snorkeling', 'canyoneering'],
  'sardine':        ['moalboal', 'panagsama', 'snorkeling'],
  'sumilon':        ['oslob', 'island', 'sandbar'],
  // Bohol-specific synonyms
  'countryside':    ['tarsier', 'chocolate', 'loboc', 'baclayon', 'bohol'],
  'chocolate':      ['hills', 'countryside', 'bohol'],
  'tarsier':        ['countryside', 'sanctuary', 'bohol'],
  'loboc':          ['river', 'cruise', 'countryside', 'bohol'],
  // El Nido / Palawan synonyms
  'underground':    ['river', 'cave', 'subterranean', 'palawan', 'sabang'],
  'subterranean':   ['underground', 'river', 'cave', 'palawan'],
  'sabang':         ['underground', 'river', 'palawan'],
  // Siargao synonyms
  'sohoton':        ['jellyfish', 'lagoon', 'cave', 'siargao'],
  'jellyfish':      ['sohoton', 'lagoon', 'sanctuary'],
  'surf':           ['surfing', 'surfboard', 'wave', 'cloud9', 'siargao'],
  'surfing':        ['surf', 'board', 'wave', 'lesson'],
  // General activity terms
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
  // Batanes-specific synonyms
  'north':          ['batanes', 'ivatan', 'sabtang'],
  'south':          ['batanes', 'ivatan', 'sabtang'],
  'complete':       ['batanes', 'full', 'comprehensive'],
  // Puerto Princesa synonyms
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
  'accommodation', 'accomodation', // ← one-m typo present in Puerto Princesa 3D2N (min.2) seller rate
  'hotel', 'lodging', 'inn', 'resort', 'room', 'stay',
];

// ─────────────────────────────────────────────────────────────
// ACTIVITY ALIAS MAP  (NEW)
//
// Hard-coded table mapping canonical activity name → all known variants
// as they appear in rate.activity fields (per the seller rate PDF).
//
// WHY THIS EXISTS:
//   Fuzzy matching can still fail for highly abbreviated or single-word
//   rate names (e.g. "Oslob", "Complete", "Moalboal") when the package
//   inclusion uses a completely different vocabulary ("Whale Shark Tour",
//   "Batanes Full Tour", "Sardine Run"). The alias map provides an
//   additional deterministic lookup path in scoreInclusionForRate BEFORE
//   fuzzy scoring, guaranteeing a match even when all fuzzy layers miss.
//
// FORMAT:
//   Each key is the canonical (normalized) activity name.
//   The value is an array of normalized text fragments that, if found
//   ANYWHERE in the stripped inclusion text, confirm this is the right rate.
//   Fragments are checked via substring — no word-boundary needed.
//
// RULES:
//   • All keys and values must be LOWERCASE, pre-normalized (no parens, no &).
//   • Values should be SPECIFIC enough to not false-match other activities.
//   • Add new entries here whenever a new destination's rates are added to the DB.
// ─────────────────────────────────────────────────────────────
export const ACTIVITY_ALIAS_MAP = {
  // ── El Nido ────────────────────────────────────────────────
  'tour a':               ['tour a', 'tour-a', 'elnido tour a'],
  'tour c with picnic':   ['tour c', 'tour-c', 'picnic lunch'],

  // ── Coron ──────────────────────────────────────────────────
  'ultimate tour b with picnic lunch': ['ultimate tour', 'ultimate b'],
  'ultimate tour b with picnic':       ['ultimate tour', 'ultimate b'],
  'island tour b with picnic lunch':   ['island tour b', 'tour b'],
  'island tour a with picnic lunch':   ['island tour a', 'tour a'],
  'coron town tour':                   ['town tour', 'coron town'],

  // ── Cebu ───────────────────────────────────────────────────
  'oslob tour':    ['oslob', 'whale shark', 'whaleshark', 'sumilon'],
  'oslob':         ['oslob', 'whale shark', 'whaleshark', 'sumilon'],
  'moalboal':      ['moalboal', 'sardine', 'panagsama', 'canyoneering', 'kawasan'],
  'city tour':     ['city tour', 'half day city', 'heritage tour', 'city heritage'],

  // ── Bohol ──────────────────────────────────────────────────
  'island hopping':    ['island hopping', 'balicasag', 'panglao'],
  'bohol countryside': ['countryside', 'chocolate hills', 'tarsier', 'loboc river', 'baclayon'],

  // ── Puerto Princesa ────────────────────────────────────────
  'honda bay island hopping tour': ['honda bay', 'island hopping'],
  'half day city tour':            ['city tour', 'half day', 'halfday', 'half-day'],
  'underground river tour':        ['underground river', 'subterranean', 'sabang'],

  // ── Siargao ────────────────────────────────────────────────
  'sohoton tour':  ['sohoton', 'jellyfish', 'sugba lagoon'],
  'land tour':     ['land tour', 'magpupungko', 'tayangban', 'daku island'],
  // "island hopping" shared across destinations — no alias needed (keyword match suffices)

  // ── Siquijor ───────────────────────────────────────────────
  'mountain tour': ['mountain tour', 'mt bandila', 'cambugahay', 'lazi'],
  'coastal tour':  ['coastal tour', 'san juan', 'salagdoong', 'paliton'],

  // ── Batanes ────────────────────────────────────────────────
  'north and south': ['north and south', 'north south', 'sabtang', 'ivatan', 'batan'],
  'complete':        ['complete', 'full batanes', 'all sites'],
  'complete tour':   ['complete tour', 'full batanes', 'all sites'],
};

/**
 * aliasMatch
 * Returns the alias-map score bonus for a (inclusion, rate) pair.
 * Returns 800 if any alias fragment is found in the stripped inclusion text — 
 * higher than the lead-keyword +500 but below exact-match 1000, so dedup
 * and disambiguation can still override it.
 * Returns 0 if no alias matches.
 *
 * @param {string} normStripped  — normalized stripped inclusion text
 * @param {string} normActivity  — normalized rate activity name
 * @returns {number} 0 or 800
 */
const aliasMatch = (normStripped, normActivity, norm1 = '') => {
  const textToSearch = normStripped || norm1;
  if (!textToSearch) return 0;

  // Try exact key first
  const aliases = ACTIVITY_ALIAS_MAP[normActivity];
  if (aliases && aliases.some(frag => textToSearch.includes(frag))) return 800;

  // Also check against the full normalized inclusion (before stripping destination)
  // handles cases where stripInclusionMetadata removes a keyword the alias needs
  if (norm1 && norm1 !== textToSearch) {
    if (aliases && aliases.some(frag => norm1.includes(frag))) return 800;
  }

  // Try partial key match — handles "tour a" matching "tour a pick up only"
  for (const [key, frags] of Object.entries(ACTIVITY_ALIAS_MAP)) {
    if (normActivity.includes(key) || key.includes(normActivity)) {
      if (frags.some(frag => textToSearch.includes(frag) || norm1.includes(frag))) return 800;
    }
  }
  return 0;
};


//
// Certain package inclusions are "meta" items — taxes, guide fees,
// insurance — that are NEVER backed by a seller rate in the DB.
// If these reach the fuzzy matcher, shared words like "tour" in
// "Private Tour Guide" risk false-positive matches against real
// activity rates (e.g. "Mountain Tour", "Island Hopping Tour").
//
// isNoMatchInclusion() returns true for any inclusion whose text
// contains one of these phrases. matchInclusionsWithPrices returns
// noMatch immediately for such inclusions, before any pool lookups.
//
// Pattern principles:
//   • Use PHRASES (≥2 words) where possible — avoids false triggers
//     (e.g. "taxes" alone might appear in a legitimate activity name,
//      but "taxes and surcharges" never does).
//   • Single words are only used when they are completely unambiguous
//     and would never appear in a real seller rate activity name.
// ─────────────────────────────────────────────────────────────
export const NO_MATCH_INCLUSION_KEYWORDS = [
  // Fees & government charges
  'taxes and surcharges', 'taxes & surcharges',
  'government tax', 'local government tax', 'local tax',
  'municipal tax', 'terminal fee', 'environmental fee',
  'airport tax', 'community tax', 'port tax',
  // Insurance
  'travel insurance', 'personal accident insurance',
  // Guide services (these are human labor bundled in tour price, not separate rates)
  'tour guide', 'private guide', 'licensed guide',
  'tour escort', 'tour leader', 'tour manager',
  'guide fee', 'guide service',
  // Discretionary / logistics
  'free and easy', 'leisure day', 'leisure time',
  'tips and gratuities', 'tips & gratuities', 'driver tips', 'driver gratuity',
  'coordination fee', 'service charge',
  // Meals when listed as a standalone meta-inclusion (not part of a tour name)
  // NOTE: only exact standalone phrases — "lunch" alone is too broad
  // (e.g. "Loboc River Cruise with Lunch" is a real tour, not a meta-item)
  'welcome dinner', 'farewell dinner', 'welcome lunch',
  'complimentary breakfast', 'daily breakfast',
  // Documentation / admin
  'documentary fee', 'processing fee', 'admin fee', 'administrative fee',
  // Use of facilities
  'use of equipment', 'use of kayak', 'use of snorkel gear', 'use of snorkel equipment',
];

/**
 * isNoMatchInclusion
 * Returns true if the inclusion text is a "meta" package item that has no
 * corresponding seller rate and should immediately return noMatch.
 *
 * Prevents false positives where shared words (e.g. "tour" in
 * "Private Tour Guide") accidentally score against real activity rates.
 *
 * IMPORTANT — parenthetical stripping:
 *   Package inclusions often embed a fee/services list in parentheses after
 *   the activity name, e.g.:
 *     "Joining City Tour (Entrance Fees, Tour Guide, Venue Fees)"
 *     "Oslob Whale Shark Tour (Whale swimming fees, Entrance Fees, Guide)"
 *   The parenthetical content must be STRIPPED before the keyword check so
 *   that words like "Tour Guide" or "guide" appearing only inside the fees
 *   list do NOT trigger the blacklist and discard a valid activity inclusion.
 *   Without stripping, "Joining City Tour (..., Tour Guide, ...)" would
 *   match the 'tour guide' keyword and return noMatch — blocking the entire
 *   City Tour price lookup for the package.
 *
 * @param {string} text — raw inclusion string from the package
 */
export const isNoMatchInclusion = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  // Strip all parenthetical content (fees lists, descriptions) before checking.
  // "(Entrance Fees, Tour Guide, Venue Fees)" → ""
  const withoutParens = lower.replace(/\([^)]*\)/g, '').trim();
  return NO_MATCH_INCLUSION_KEYWORDS.some(kw => withoutParens.includes(kw));
};

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
  // ✅ FIX: Siargao DOES have RT (PUDO) rates (airport/ferry van transfers).
  //   Setting rt: false was incorrect — it caused all RT inclusions to return
  //   price=0 even when valid "RT (PUDO)" seller rates exist for the destination.
  
  'siargao':         { accommodation: true,  rt: true  },
  'siquijor':        { accommodation: true,  rt: true  },
  'cebu':            { accommodation: true,  rt: true  },  // ← was 'CEBU' (uppercase) — never matched destinationSupports lookup
  'coron':           { accommodation: true,  rt: true  },
  // Bohol: accommodation and RT seller rates are not in the DB.
  //   General activity rates (tours, transfers, meals) DO exist — see
  //   DESTINATION_SUBDEST_MAP below for how sub-location names are resolved.
  'bohol':           { accommodation: true, rt: true },
  // Boracay: activity rates (Island Hopping) confirmed. Accommodation and RT
  //   rates may exist but are excluded from the exported rate list —
  //   set both true so the matcher attempts to find them if they exist in the DB.
  'boracay':         { accommodation: true,  rt: true  },
  // Batanes: activity rates confirmed (North & South, Complete Tour).
  //   Accommodation and RT rates may exist — set both true so matcher will attempt.
  'batanes':         { accommodation: true,  rt: true  },
};

// ─────────────────────────────────────────────────────────────
// DESTINATION SUB-LOCATION MAP  (NEW)
//
// Seller rates for Bohol and Siargao are sometimes stored in the DB
// under specific sub-location names (e.g. "Tagbilaran", "Panglao",
// "Loboc River", "Cloud 9") rather than the top-level destination name.
//
// Without this map, destinationsMatch would fail to include those rates
// in the destinationPool because KNOWN_DESTINATIONS only checks for the
// top-level name ("bohol", "siargao") — and the pkgWords fallback would
// also miss them since sub-location words do not appear in the package
// destination field.
//
// The map is used in destinationsMatch as a secondary check AFTER the
// KNOWN_DESTINATIONS loop. If the rate destination contains any known
// sub-location for the package's top-level destination, it is accepted
// into the pool — preventing a "no rates found → all prices 0" situation.
//
// Add entries here whenever a destination's rates are entered in the DB
// under sub-location names rather than the top-level destination name.
// ─────────────────────────────────────────────────────────────
export const DESTINATION_SUBDEST_MAP = {
  'siargao': [
    'general luna', 'cloud 9', 'cloud9', 'dapa', 'pacifico',
    'pilar', 'del carmen', 'burgos',
  ],
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
    // Normalize & → and BEFORE stripping non-alphanum characters
    // because [^a-z0-9\s] removes & before the \b&\b pattern can match
    // "North & South" → "North and South" → then lowercased → "north and south"
    .replace(/\s*&\s*/g, ' and ')
    // Strip parenthetical content — fee lists, descriptions in parens hurt matching
    // e.g. "City Tour (Entrance Fees, Guide, Venue Fees)" → "City Tour"
    // Done BEFORE other replacements so parens don't leave debris
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    // Strip "Joining" prefix used in Coron seller rate activity names
    // e.g. "Joining Island Tour B with Picnic Lunch" → "island tour b with picnic lunch"
    // Package inclusions never say "Joining" — the prefix is an internal admin label.
    .replace(/^\s*joining\s+/, '')
    // Strip "pick.?up only" / "drop.?off only" suffixes common in El Nido rate names
    // e.g. "(Tour A) - pick up only" → "tour a"
    .replace(/\bpick\s*up\s*only\b/g, '')
    .replace(/\bdrop\s*off\s*only\b/g, '')
    .replace(/\bpickup\s*only\b/g, '')
    .replace(/roundtrip/g, 'round trip')
    .replace(/twoway/g, 'two way')
    .replace(/oneway/g, 'one way')
    // Normalize common shorthand / abbreviations
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
      // Always keep single-letter tour codes (a, b, c, d) when preceded by "tour"
      // These are filtered in the pipeline via the tourCodePattern guard in activitiesMatch
      // but we need them as keywords for scoring comparisons
      if (w.length === 1) return false; // still filter isolated single chars
      if (w.length === 2 && !/^\d+$/.test(w)) return false; // keep 2-digit numbers
      return w.length >= 3;
    })
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

  // Strip parenthetical content (fee lists, descriptions)
  // e.g. "Oslob Tour (Whale swimming fees, Entrance Fees, Guide, Boat)" → "Oslob Tour"
  // Must happen before punctuation replacement so parens are removed cleanly
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
    // "+" is used as a list separator in verbose inclusions like
    // "Oslob Whale Shark + Sumilon Island + Oslob Cuartel"
    // Replace with space so only the FIRST item (before the first "+") survives
    // as meaningful lead words — the rest become noise after the split
    .replace(/\+/g, ' ')
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
      // ✅ FIX: was `>= 5` — raised to allow 4-char activity roots such as
      //   "surf" (→ "surfing"), "boat" (→ "boating"), "trek" (→ "trekking"),
      //   "dive" (→ "diving").  The shorter/longer >= 0.7 ratio guard below
      //   already prevents false positives on truly dissimilar short words.
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

  const toWordBoundaryRegex = (word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`);
  };

  // Guard 1: Palawan sub-destination conflict (now strict)
  const pkgSubDest  = PALAWAN_SUBDESTS.find(s => toWordBoundaryRegex(s).test(pkgLower));
  const rateSubDest = PALAWAN_SUBDESTS.find(s => toWordBoundaryRegex(s).test(rateLower));
  if (pkgSubDest && rateSubDest && pkgSubDest !== rateSubDest) return false;

  // NEW CROSS-DESTINATION GUARD – blocks any rate that contains a different known destination
  const pkgMainDest = KNOWN_DESTINATIONS.find(d => toWordBoundaryRegex(d).test(pkgLower));
  if (pkgMainDest) {
    const rateHasForeignDest = KNOWN_DESTINATIONS.some(d => 
      d !== pkgMainDest && toWordBoundaryRegex(d).test(rateLower)
    );
    if (rateHasForeignDest) return false;
  }

  // KNOWN_DESTINATIONS loop – now word-boundary
  for (const dest of KNOWN_DESTINATIONS) {
    if (toWordBoundaryRegex(dest).test(pkgLower) && toWordBoundaryRegex(dest).test(rateLower)) 
      return true;
  }

  // Sub-location expansion – now word-boundary
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

  // pkgWords fallback – now word-boundary
  const pkgWords = pkgLower
    .split(/\s+/)
    .filter(w => w.length >= 4 && !GENERIC_DESTINATION_WORDS.has(w));
  return pkgWords.some(w => toWordBoundaryRegex(w).test(rateLower));
};


// ─────────────────────────────────────────────────────────────
// ACTIVITY MATCHING  (existing 6-layer logic preserved exactly)
// ─────────────────────────────────────────────────────────────

/**
 * activitiesMatch — 6-layer matching pipeline.
 *
 *   Guard 0 — Tour letter-code check (NEW)
 *             If both texts contain a "Tour [A-Z]" single-letter code pattern
 *             (e.g. "Tour A", "Tour B", "Tour C"), the codes MUST match.
 *             Single-letter codes are filtered out by extractKeywords (< 3 chars)
 *             so without this guard, "Tour A" and "Tour B" would score identically
 *             through layers 1-6 and produce wrong price assignments.
 *             Context: El Nido has Tour A and Tour C; Coron has Tour A and Tour B.
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
  // ── Guard 0: Tour letter-code hard gate ──────────────────────────────────
  // Pattern: "Tour A", "Tour B", "Tour C" — single-letter suffix (case insensitive).
  // If both sides have a tour code and they differ, reject immediately.
  // This prevents "Tour A" inclusion from matching "Tour C with picnic Lunch" rate
  // or "Island Tour B" rate from matching an "Island Tour A" inclusion.
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

    // ── Layer 4b: Prominent-keyword lead match (NEW) ───────────────────────
    // Handles seller rates with SHORT activity names (e.g. "Oslob Tour",
    // "Moalboal", "City Tour") that map to LONG descriptive package inclusions
    // (e.g. "Oslob Whale Shark + Sumilon Island + Oslob Cuartel + Oslob Church
    //        + Simala Shrine + Carcar (Whale swimming fees, Entrance Fees, Guide, Boat)").
    //
    // Root cause of the failure:
    //   Rate "Oslob Tour" → keywords: ["oslob", "tour"].
    //   The word "tour" NEVER appears in the verbose inclusion text — the
    //   inclusion describes what places are visited, not that it IS a tour.
    //   keywordCoverageCheck (Layer 4) = 1/2 = 0.5 < 0.75 threshold → no match.
    //   All other layers also fail because similarity is diluted by the many
    //   extra words (whale shark, sumilon, cuartel, church, simala, carcar...).
    //
    // Fix: if any SPECIFIC (non-generic) keyword from the rate activity name
    // appears within the first 4 words of the normalized stripped inclusion,
    // it is a strong signal that the inclusion IS this activity.
    //
    //   "Oslob Tour"   ↔ first 4 of "oslob whale shark sumilon..." → "oslob" ✅
    //   "City Tour"    ↔ first 4 of "city tour entrance fees..."   → "city"  ✅
    //   "Moalboal"     ↔ first 4 of "moalboal panagsama snorkeling"→ "moalboal" ✅
    //   "Mountain Tour"↔ first 4 of "underground river tour..."    → "mountain"? ✗ ✅
    //
    // GENERIC WORD GUARD: common activity words ("tour", "trip", "package", etc.)
    // are excluded from this check. Without this guard, "tour" in "Mountain Tour"
    // would match any inclusion starting with the word "tour".
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
      // A package sold as "Solo/Joiners" accepts:
      //   • exact (Solo/Joiners) rates → ideal
      //   • (Solo) rates → acceptable fallback (solo price floor)
      //   • generic (no qualifier) rates → already handled above
      // REJECTS: (min. of N pax) only
      return rq.type === 'solo_joiners' || rq.type === 'solo';
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
  if (qualifier.type === 'solo_joiners') return rq.type === 'solo_joiners' || rq.type === 'solo';

  return true;
};


// ─────────────────────────────────────────────────────────────
// DEDICATED RATE FINDER — ACCOMMODATION
// (RT PUDO finder lives in rtPudoMatcher.js)
// ─────────────────────────────────────────────────────────────

/**
 * findAccommodationRate
 * Finds the best seller rate for an accommodation inclusion.
 * Keyword match only — never calls activitiesMatch.
 */
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


// ─────────────────────────────────────────────────────────────
// RATE-FIRST MATCHING FOR GENERAL ACTIVITIES  (NEW)
// ─────────────────────────────────────────────────────────────

/**
 * activityNameScore
 * Signal 3 for scoreInclusionForRate / scoreRateForInclusion.
 * Returns 0–150 bonus based on how closely the inclusion text matches
 * the seller rate's activity name.
 *
 * Tiers:
 *   150 — normalized activity name is a substring of the normalized inclusion
 *          AND length ratio >= 0.7 (prevents very short activity names from
 *          scoring full points against very long inclusions)
 *   100 — inclusion contains the normalized activity name as a substring
 *          (length ratio < 0.7, still a strong signal)
 *    60 — activity name contains the normalized inclusion (reverse substring)
 *         with length ratio >= 0.7 (inclusion is an abbreviation of the rate)
 *   0–50— proportional similarity bonus (calculateSimilarity * 50)
 *
 * @param {string} inclusionText — raw inclusion string from the package
 * @param {string} rateActivity  — rate.activity field value
 * @param {string} destination   — package destination (for stripInclusionMetadata)
 * @returns {number} 0–150
 */
const activityNameScore = (inclusionText, rateActivity, destination = '') => {
  if (!inclusionText || !rateActivity) return 0;

  const normInclusion = normalizeActivity(
    stripInclusionMetadata(inclusionText, destination)
  );
  const normActivity  = normalizeActivity(rateActivity);

  if (!normInclusion || !normActivity) return 0;

  // Substring: activity name inside the inclusion (most common case)
  if (normInclusion.includes(normActivity)) {
    const ratio = normActivity.length / normInclusion.length;
    return ratio >= 0.7 ? 150 : 100;
  }

  // Reverse substring: inclusion inside the activity name
  if (normActivity.includes(normInclusion)) {
    const ratio = normInclusion.length / normActivity.length;
    if (ratio >= 0.7) return 60;
  }

  // Synonym-based coverage for SHORT activity names (≤3 keywords)
  // e.g. "Oslob Tour" → keywords [oslob, tour] — "oslob" has synonyms [whale, shark, swimming]
  // If the inclusion mentions "whale shark" it indirectly refers to Oslob
  const actKws = extractKeywords(normActivity).filter(kw => !_GENERIC_RATE_WORDS.has(kw.word));
  if (actKws.length > 0 && actKws.length <= 3) {
    let synHits = 0;
    actKws.forEach(kw => {
      // Direct word match
      if (normInclusion.includes(kw.word)) { synHits++; return; }
      // Synonym match — any synonym of the rate keyword appears in the inclusion
      if (kw.synonyms.some(s => normInclusion.includes(s))) { synHits++; return; }
    });
    const synCoverage = synHits / actKws.length;
    if (synCoverage >= 1.0) return 90;   // all keywords matched via synonyms
    if (synCoverage >= 0.5) return 40;   // partial synonym coverage
  }

  // Proportional similarity fallback
  const sim = calculateSimilarity(normInclusion, normActivity);
  return Math.round(sim * 50);
};

/**
 * inclusionsFieldScore
 * Signal 4 for scoreInclusionForRate / scoreRateForInclusion.
 * Returns 0–80 bonus based on keyword overlap between the package inclusion
 * text and the seller rate's `inclusions` field (e.g. "entrance fees, bangka
 * ride, guide, lunch").
 *
 * Logic: extract keywords from each side, count how many rate inclusion
 * keywords appear in the package inclusion text (or via synonyms), then
 * return a proportional bonus capped at 80.
 *
 * @param {string} inclusionText    — raw inclusion string from the package
 * @param {string} rateInclusionsText — rate.inclusions field value
 * @returns {number} 0–80
 */
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

// Generic activity words — too broad to act as identification keywords.
// e.g. "tour" in "Mountain Tour" would match any inclusion containing "tour".
const _GENERIC_RATE_WORDS = new Set([
  'tour', 'tours', 'trip', 'package', 'day', 'night',
  'half', 'full', 'joining', 'private', 'group', 'shared',
]);

// A (rate, inclusion) pair must score at least this to be assigned.
const _MIN_RATE_FIRST_SCORE = 50;

/**
 * scoreInclusionForRate
 * Scores how well a package inclusion string describes a seller rate's activity.
 * Direction: RATE → INCLUSION (inverse of scoreRateForInclusion).
 *
 * Tiers:
 *   1000  exact normalized match
 *    500  prominent-keyword lead: a specific rate keyword (≥4 chars, non-generic)
 *         appears in the first 4 words of the stripped inclusion.
 *         Fixes: "Oslob Tour" → "oslob" found in "oslob whale shark..." → +500
 *                "City Tour"  → "city"  found in "city tour entrance..." → +500
 *                "Moalboal"   → "moalboal" found in "moalboal panagsama..." → +500
 *   0–150 activityNameScore (text closeness)
 *   0–80  inclusionsFieldScore (rate.inclusions field overlap)
 *   0–100 keyword coverage (rate keywords in stripped inclusion)
 *   0–50  reverse coverage (stripped keywords in rate, short inclusions only)
 */
const scoreInclusionForRate = (inclusionText, rate, signals) => {
  const norm2        = normalizeActivity(rate.activity);
  const stripped     = stripInclusionMetadata(inclusionText, signals.destination);
  const normStripped = normalizeActivity(stripped);
  const norm1        = normalizeActivity(inclusionText);

  // Tier 1: exact match
  if (normStripped === norm2 || norm1 === norm2) return 1000;

  // Tier 1.5: alias map lookup — deterministic, built directly from the PDF
  // Fires before fuzzy scoring so specific activity names like "Oslob", "Moalboal",
  // "Honda Bay Island Hopping Tour" always match even when fuzzy layers miss
  const aliasBonus = aliasMatch(normStripped, norm2, norm1);
  if (aliasBonus > 0) {
    // Still accumulate lower tiers so disambiguation penalty can still override
    // when two rates both alias-match (shouldn't happen, but defensive)
    let score = aliasBonus;
    score += activityNameScore(inclusionText, rate.activity, signals.destination);
    if (rate.inclusions) score += inclusionsFieldScore(inclusionText, rate.inclusions);
    return score;
  }

  let score = 0;

  // Tier 2: prominent-keyword lead
  // Look at first 6 words (widened from 4) so multi-word activity names like
  // "Chocolate Hills Tour" can still match "Chocolate Hills and Tarsier Sanctuary"
  const leadWords = normStripped.split(/\s+/).slice(0, 6).join(' ');
  const rateKws   = extractKeywords(norm2);
  const specificRateKws = rateKws.filter(kw =>
    kw.word.length >= 4 && !_GENERIC_RATE_WORDS.has(kw.word)
  );
  const leadMatchCount = specificRateKws.filter(kw => leadWords.includes(kw.word)).length;

  if (specificRateKws.length > 0) {
    // Partial credit for lead matches — more specific keywords matched = higher bonus
    const leadRatio = leadMatchCount / specificRateKws.length;
    if (leadRatio >= 1.0) score += 500;       // all specific keywords in lead → full bonus
    else if (leadRatio >= 0.5) score += 300;  // majority in lead → strong signal
    else if (leadMatchCount >= 1) score += 150; // at least one specific keyword → weak signal
  }

  // Tier 3: text closeness
  score += activityNameScore(inclusionText, rate.activity, signals.destination);

  // Tier 4: rate inclusions field overlap
  if (rate.inclusions) {
    score += inclusionsFieldScore(inclusionText, rate.inclusions);
  }

  // Tier 5: keyword coverage (rate → inclusion direction)
  const coverage = keywordCoverageCheck(rate.activity, normStripped);
  score += Math.round(coverage * 100);

  // Tier 6: reverse coverage (only for short inclusions ≤ 6 words)
  const wordCount = normStripped.split(/\s+/).filter(w => w.length >= 3).length;
  if (wordCount <= 6) {
    score += Math.round(keywordCoverageCheck(inclusionText, norm2) * 50);
  }

  // Tier 7: DISAMBIGUATION PENALTY
  // If the inclusion contains a specific keyword that belongs to a DIFFERENT
  // known activity (and the rate does NOT contain it), penalize this pair.
  // Prevents "Moalboal Snorkeling" from scoring well against "Oslob Tour".
  // Only fires when both sides have specific keywords and they conflict.
  if (specificRateKws.length > 0 && score > 0) {
    const normInc = normStripped || norm1;
    // Check if inclusion starts with a specific keyword that is NOT in this rate
    const incLeadKws = extractKeywords(normInc.split(/\s+/).slice(0, 3).join(' '))
      .filter(kw => kw.word.length >= 5 && !_GENERIC_RATE_WORDS.has(kw.word));
    const conflictCount = incLeadKws.filter(kw =>
      !norm2.includes(kw.word) &&
      !rateKws.some(rk => rk.synonyms.includes(kw.word) || kw.synonyms.includes(rk.word))
    ).length;
    if (conflictCount > 0 && leadMatchCount === 0) {
      // Inclusion clearly leads with a keyword this rate doesn't own → strong penalty
      score -= Math.min(conflictCount * 200, 400);
    }
  }

  return score;
};

/**
 * buildRateFirstAssignments
 *
 * Implements the RATE-FIRST architecture for general activity matching.
 *
 * WHY RATE-FIRST:
 *   The old inclusion-first approach iterated every package inclusion and asked
 *   "does this inclusion match a rate?" — verbose inclusions like
 *   "Oslob Whale Shark + Sumilon Island + Oslob Cuartel + Simala Shrine..."
 *   failed fuzzy matching because the extra words diluted similarity below
 *   every threshold. Result: only 3 of 24 inclusions got prices.
 *
 *   Rate-first inverts the question: "for each rate we know exists for this
 *   destination+duration+qualifier, which inclusion best describes it?"
 *   The strictPool already contains exactly the rates the admin has configured.
 *   Each rate finds its best-scoring inclusion regardless of how verbose the
 *   inclusion text is.
 *
 * ALGORITHM:
 *   1. Collect all general (non-accommodation, non-RT) rates from strictPool.
 *   2. Score every (rate, eligible-inclusion) pair with scoreInclusionForRate.
 *   3. Sort pairs by score descending.
 *   4. Greedy assign: highest score wins; each rate and inclusion used at most once.
 *   5. Discard pairs below _MIN_RATE_FIRST_SCORE (prevents false assignments).
 *
 * NUMBER OF PRICED INCLUSIONS = NUMBER OF GENERAL RATES IN STRICTPOOL.
 *   Cebu 5D4N (Solo) has 3 general rates → exactly 3 inclusions get prices.
 *   Siargao 4D3N (Solo/Joiners) has 2 → exactly 2 get prices.
 *
 * @param {object[]} strictPool
 * @param {object[]} destinationPool
 * @param {string[]} inclusions
 * @param {object}   signals
 * @returns {Map<number, object>} inclusionIndex → seller rate
 */
const buildRateFirstAssignments = (strictPool, destinationPool, inclusions, signals) => {
  const generalFilter = (pool) => pool.filter(r =>
    !isAccommodationInclusion(r.activity) && !isRtPudoActivity(r.activity)
  );

  let generalRates = generalFilter(strictPool);
  const usedDestPool = generalRates.length === 0;
  if (usedDestPool) generalRates = generalFilter(destinationPool);
  if (generalRates.length === 0) return new Map();

  // Deduplicate rates by normalized activity name — when there are multiple supplier
  // entries for the same activity (e.g. two suppliers for "Oslob Tour"), keep the
  // one with the highest sellingPrice so only one inclusion slot is consumed.
  const rateByActivity = new Map();
  for (const rate of generalRates) {
    const key = normalizeActivity(rate.activity);
    const existing = rateByActivity.get(key);
    if (!existing || (rate.sellingPrice || 0) > (existing.sellingPrice || 0)) {
      rateByActivity.set(key, rate);
    }
  }
  const dedupedRates = [...rateByActivity.values()];

  // Eligible inclusion indices: skip meta-inclusions, accommodation, RT
  const eligible = inclusions
    .map((inc, i) => ({ inc, i }))
    .filter(({ inc }) =>
      !isNoMatchInclusion(inc) &&
      !isAccommodationInclusion(inc) &&
      !isRoundtripInclusion(inc)
    );

  if (eligible.length === 0) return new Map();

  // Score all (rate, inclusionIdx) pairs
  const allPairs = [];
  for (const rate of dedupedRates) {
    for (const { inc, i } of eligible) {
      const score = scoreInclusionForRate(inc, rate, signals);
      if (score >= _MIN_RATE_FIRST_SCORE) {
        allPairs.push({ rate, idx: i, score });
      }
    }
  }

  // Sort by score descending
  allPairs.sort((a, b) => b.score - a.score);

  // Greedy assignment: each rate and each inclusion used at most once
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

/**
 * findTourActivityRate
 * Retained for backward compatibility / external use.
 * matchInclusionsWithPrices now uses buildRateFirstAssignments for the general path.
 */
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


// ─────────────────────────────────────────────────────────────
// MAIN MATCHER
// ─────────────────────────────────────────────────────────────

/**
 * matchInclusionsWithPrices
 *
 * Rate-first architecture — 3 stages:
 *
 *   Stage 1 — Parse signals (dest, duration, qualifier) → build strictPool.
 *
 *   Stage 2 — Pre-compute rate-first assignments BEFORE the per-inclusion loop:
 *             buildRateFirstAssignments() iterates every general (non-accom,
 *             non-RT) rate in strictPool and assigns each rate to the package
 *             inclusion that best matches it via greedy scoring.
 *             Number of priced general inclusions = number of general rates.
 *
 *   Stage 3 — Per-inclusion result assembly (simple Map lookup for general path):
 *               RT          → findRtPudoRate()       (exact activity name)
 *               Accommodation → findAccommodationRate() (keyword match)
 *               General     → rateFirstMap.get(idx)  (pre-computed above)
 *               Meta/blocked → noMatch immediately
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

  // ── Stage 1 ───────────────────────────────────────────────────────────────
  const signals = parsePkgTitleSignals(
    pkgTitle, destination, pkgDuration, tourType, minPax,
  );
  const { strictPool, destinationPool } = buildStage1Pool(sellerRates, signals);

  // ── Stage 2: pre-compute rate-first general assignments ───────────────────
  const rateFirstMap = buildRateFirstAssignments(
    strictPool, destinationPool, inclusions, signals,
  );

  // ── Result builders ───────────────────────────────────────────────────────
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

  // ── Stage 3: per-inclusion result assembly ────────────────────────────────
  const matched = inclusions.map((inclusion, idx) => {

    if (destinationPool.length === 0) return noMatch(idx, inclusion);

    // Meta-inclusions (taxes, insurance, guide fees, etc.)
    if (isNoMatchInclusion(inclusion)) return noMatch(idx, inclusion);

    // RT path — must come before accommodation
    if (isRoundtripInclusion(inclusion)) {
      if (!destinationSupports(signals.destination, 'rt')) return noMatch(idx, inclusion);
      const rate = findRtPudoRate(strictPool, destinationPool, signals);
      if (!rate) return noMatch(idx, inclusion);
      matchCount++;
      return buildResult(idx, inclusion, rate);
    }

    // Accommodation path
    if (isAccommodationInclusion(inclusion)) {
      if (!destinationSupports(signals.destination, 'accommodation')) return noMatch(idx, inclusion);
      const rate = findAccommodationRate(strictPool, destinationPool, signals, inclusion);
      if (!rate) return noMatch(idx, inclusion);
      matchCount++;
      return buildResult(idx, inclusion, rate);
    }

    // General path — O(1) lookup into pre-computed rate-first assignment Map.
    // If this inclusion index has no assignment, it means no general rate in
    // the strictPool scored above the minimum threshold for it → noMatch.
    const assignedRate = rateFirstMap.get(idx);
    if (!assignedRate) return noMatch(idx, inclusion);
    matchCount++;
    return buildResult(idx, inclusion, assignedRate);
  });

  return { matched, matchCount };
};