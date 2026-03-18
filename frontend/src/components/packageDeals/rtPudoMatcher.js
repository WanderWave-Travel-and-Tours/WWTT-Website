// ============================================================
// rtPudoMatcher.js
// All roundtrip / airfare / RT (PUDO) inclusion-to-seller-rate
// matching logic, fully isolated from accommodation and general
// activity matching.
//
// ─────────────────────────────────────────────────────────────
// ZERO IMPORTS — this file is intentionally self-contained.
//
// inclusionMatcher.js imports FROM this file.
// This file must NEVER import from inclusionMatcher.js.
//
// Reason: a circular dependency (A imports B, B imports A)
// causes bundlers (Webpack, Vite) to resolve one side as
// `undefined` at runtime, silently breaking isRtPudoActivity
// and making RT inclusions fall through to accommodation matching.
//
// All shared helpers needed by findRtPudoRate are inlined below
// as private (non-exported) functions so this file stands alone.
// ─────────────────────────────────────────────────────────────
//
// KEY ARCHITECTURE NOTE:
//   The canonical activity name in seller rates for roundtrips is:
//     "RT (PUDO)"
//   This file matches inclusion strings that describe a roundtrip
//   service and maps them exclusively to seller rates whose activity
//   field is exactly "RT (PUDO)" (or a known variant).
//
// ─────────────────────────────────────────────────────────────
// WHY A SEPARATE FILE:
//   The general fuzzy matcher (activitiesMatch) uses a similarity
//   scorer that checks for flight-related keywords using substring
//   matching against "rt" — which causes false positives on activity
//   names like "Resort Room" (contains "rt" as letters).
//   Keeping RT matching here, with exact-equality only on
//   rate.activity, completely eliminates that class of cross-match bug.
//
// ─────────────────────────────────────────────────────────────
// MATCHING PIPELINE (RT inclusions only):
//
//   Stage 1 — Reuses the strictPool + destinationPool already built
//             by buildStage1Pool() in inclusionMatcher.js.
//             (destination + duration + qualifier pre-filtered)
//
//   Stage 2 — Filter pool to only rates where isRtPudoActivity()
//             returns true. NEVER calls activitiesMatch.
//             Try strictPool first, fall back to destinationPool.
//
//   Stage 3 — Score survivors with scoreRateForInclusion(),
//             walk sorted list, take first that passes verifyRateFinal().
//             If none pass → return best-scored so price is always shown.
// ============================================================


// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

// Keywords that signal a roundtrip / airfare / PUDO inclusion string.
// Matched against the INCLUSION TEXT to decide if it should be routed
// to this file's matcher instead of the general fuzzy path.
export const RT_PUDO_INCLUSION_KEYWORDS = [
  'roundtrip', 'round trip', 'round-trip',
  'airfare', 'air fare',
  'flight', 'airline', 'air ticket', 'plane ticket',
  'return flight', 'return ticket',
  'pudo', 'rt airfare', 'rt flight', 'rt ticket', 'rt transfer',
  'rt transport',   // ← Siquijor (min. of 2 pax) uses "RT Transport" as inclusion text
];

// Exact canonical names for the "RT (PUDO)" activity in seller rates.
// ONLY exact equality is used when matching against rate.activity —
// never substring, never regex includes — to prevent false positives
// on activity names whose letters happen to contain "rt"
// (e.g. "Resort Room", "airport transfer", "portrait session").
export const RT_PUDO_ACTIVITY_EXACT = [
  'rt (pudo)', 'rt(pudo)', 'rt pudo',
  'rt transfer', 'rttransfer',   // ← Bohol
  'rt transport',                // ← Siquijor (min. of 2 pax) seller rates use this exact name
];


// ─────────────────────────────────────────────────────────────
// PRIVATE HELPERS  (inlined — not exported)
// These are intentionally duplicated from inclusionMatcher.js
// to keep this file free of imports and avoid circular dependencies.
// ─────────────────────────────────────────────────────────────

const _KNOWN_DESTINATIONS = [
  'puerto princesa', 'el nido', 'coron palawan', 'siargao island',
  'siargao', 'siquijor', 'bohol', 'cebu', 'coron',
  'boracay',  // ← Island Hopping rates confirmed in seller rate list
  'batanes',  // ← North & South / Complete Tour rates confirmed in seller rate list
  // 'bohol' is included so destinationsMatch can build a destination pool for Bohol.
  //   findRtPudoRate is never actually called for Bohol — the capability guard in
  //   inclusionMatcher.js (destinationSupports) intercepts RT inclusions for Bohol
  //   before this function is reached and returns noMatch immediately.
  // 'siargao' is included for accommodation matching; RT inclusions for Siargao are
  //   also intercepted by the capability guard before findRtPudoRate is called.
  // 'palawan' intentionally omitted — mirrors the same change in inclusionMatcher.js.
  // As a standalone token it causes El Nido / Coron / Puerto Princesa packages to
  // cross-match each other's rates. Sub-destinations are already precise via
  // 'coron palawan', 'el nido', and 'puerto princesa'.
];

// Generic geographic / English words that must NOT act as destination match
// tokens in the pkgWords fallback of _destinationsMatch.
// Mirrors GENERIC_DESTINATION_WORDS in inclusionMatcher.js — kept in sync.
// Root-cause: 'island' in 'Siargao Island' would match 'El Nido Island Hopping 4D3N',
// bleeding El Nido RT rates into Siargao's candidatepool.
const _GENERIC_DESTINATION_WORDS = new Set([
  'island', 'islands', 'isle', 'islet',
  'province', 'area', 'region', 'district',
  'city', 'town', 'north', 'south', 'east', 'west', 'central',
  'tour', 'tours', 'beach', 'resort',
  'philippines', 'pilipinas', 'luzon', 'visayas', 'mindanao',
]);

// Palawan sub-destinations — prevents cross-sub-destination matching
// when 'palawan' appears in both pkg and rate destination strings.
const _PALAWAN_SUBDESTS = ['el nido', 'puerto princesa', 'coron'];

// ── Private mirror of DESTINATION_SUBDEST_MAP in inclusionMatcher.js ────────
// Resolves Bohol / Siargao seller rates that are stored in the DB under a
// sub-location name (e.g. "Tagbilaran", "Panglao", "Cloud 9") rather than
// the top-level destination name.  Must be kept in sync with the exported
// DESTINATION_SUBDEST_MAP in inclusionMatcher.js.
const _DESTINATION_SUBDEST_MAP = {
  'siargao': [
    'general luna', 'cloud 9', 'cloud9', 'dapa', 'pacifico',
    'pilar', 'del carmen', 'burgos',
  ],
};

const _extractDurationCode = (text) => {
  if (!text) return null;
  const match = String(text).match(/\b(\d+D\d+N)\b/i);
  return match ? match[1].toUpperCase() : null;
};

const _extractMinPax = (text) => {
  if (!text) return null;
  const match = text.match(/\bmin(?:imum)?\.?\s*(?:of\s*)?(\d+)\s*pax\b/i);
  return match ? parseInt(match[1]) : null;
};

const _extractPaxQualifierType = (text) => {
  if (!text) return { type: 'generic' };
  const lower = text.toLowerCase();
  if (/solo\s*\/\s*joiners?/i.test(lower)) return { type: 'solo_joiners' };
  const minPax = _extractMinPax(lower);
  if (minPax !== null) return { type: 'minpax', count: minPax };
  if (/\bsolo\b/.test(lower)) return { type: 'solo' };
  return { type: 'generic' };
};

const _destinationsMatch = (rateDestination, packageDestination) => {
  if (!rateDestination || !packageDestination) return false;
  const rateLower = rateDestination.toLowerCase();
  const pkgLower  = packageDestination.toLowerCase();

  const toWordBoundaryRegex = (word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`);
  };

  // Guard 1: Palawan sub-destination conflict
  const pkgSubDest  = _PALAWAN_SUBDESTS.find(s => toWordBoundaryRegex(s).test(pkgLower));
  const rateSubDest = _PALAWAN_SUBDESTS.find(s => toWordBoundaryRegex(s).test(rateLower));
  if (pkgSubDest && rateSubDest && pkgSubDest !== rateSubDest) return false;

  // NEW CROSS-DESTINATION GUARD
  const pkgMainDest = _KNOWN_DESTINATIONS.find(d => toWordBoundaryRegex(d).test(pkgLower));
  if (pkgMainDest) {
    const rateHasForeignDest = _KNOWN_DESTINATIONS.some(d => 
      d !== pkgMainDest && toWordBoundaryRegex(d).test(rateLower)
    );
    if (rateHasForeignDest) return false;
  }

  // KNOWN_DESTINATIONS precise loop – word-boundary
  for (const dest of _KNOWN_DESTINATIONS) {
    if (toWordBoundaryRegex(dest).test(pkgLower) && toWordBoundaryRegex(dest).test(rateLower)) 
      return true;
  }

  // Sub-location expansion – word-boundary
  const _resolveTopDestination = (lower) => {
    const pairs = [];
    for (const [top, subs] of Object.entries(_DESTINATION_SUBDEST_MAP)) {
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

  // pkgWords fallback – word-boundary
  const pkgWords = pkgLower
    .split(/\s+/)
    .filter(w => w.length >= 4 && !_GENERIC_DESTINATION_WORDS.has(w));
  return pkgWords.some(w => toWordBoundaryRegex(w).test(rateLower));
};

// Scores a candidate rate against the package's Stage 1 signals.
// PRIMARY (+200/-100): duration match. SECONDARY (+100/+50/0/-200): qualifier.
const _scoreRate = (rate, pkgDuration, pkgQualifier) => {
  let score = 0;
  const rateDuration = _extractDurationCode(rate.destination || '');
  if (pkgDuration && rateDuration) {
    if (pkgDuration === rateDuration) score += 200;
    else                              score -= 100;
  }
  const rq = _extractPaxQualifierType(rate.destination || '');
  if      (rq.type === 'generic')     { score += 0; }
  else if (rq.type === 'solo_joiners'){ score += 50; }
  else if (pkgQualifier.type === 'solo'   && rq.type === 'solo')   { score += 100; }
  else if (pkgQualifier.type === 'minpax' && rq.type === 'minpax'
           && rq.count === pkgQualifier.count)                      { score += 100; }
  else                                { score -= 200; }
  return score;
};

// Re-examines a candidate rate against all Stage 1 signals.
const _verifyRate = (rate, signals) => {
  const { destination, duration, qualifier } = signals;
  if (!_destinationsMatch(rate.destination, destination)) return false;
  const rateDuration = _extractDurationCode(rate.destination || '');
  if (duration && rateDuration && rateDuration !== duration) return false;
  const rq = _extractPaxQualifierType(rate.destination || '');
  if (rq.type === 'generic')      return true;
  if (rq.type === 'solo_joiners') return true;
  if (qualifier.type === 'solo')         return rq.type === 'solo';
  if (qualifier.type === 'minpax')       return rq.type === 'minpax' && rq.count === qualifier.count;
  if (qualifier.type === 'solo_joiners') return rq.type === 'solo_joiners';
  return true;
};


// ─────────────────────────────────────────────────────────────
// DETECTORS  (exported — used by inclusionMatcher.js for routing)
// ─────────────────────────────────────────────────────────────

/**
 * isRoundtripInclusion
 * Returns true if the inclusion text describes a roundtrip / airfare / PUDO service.
 * Routes the inclusion to findRtPudoRate — NEVER to the general fuzzy path.
 *
 * Uses two checks:
 *   1. Keyword list  — multi-word phrases, safe substring match
 *   2. \brt\b        — word-boundary regex catches bare "RT Ticket", "RT Transfer"
 *                      without false-matching words containing "rt" as letters
 *                      (e.g. "resort", "portrait")
 *
 * Examples that return true:
 *   "Roundtrip Airfare"   "Round Trip Air Ticket"   "Airfare"
 *   "RT Ticket"           "RT Transfer"             "RT (PUDO)"
 *   "PUDO Transfer"       "Return Flight Ticket"
 *
 * Examples that return false:
 *   "Hotel Accommodation"   "Resort Room"   "Island Hopping"
 *   "Van Transfer"          "Entrance Fee"
 */
export const isRoundtripInclusion = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (RT_PUDO_INCLUSION_KEYWORDS.some(kw => lower.includes(kw))) return true;
  if (/\brt\b/.test(lower)) return true;
  return false;
};

/**
 * isRtPudoActivity
 * Returns true ONLY if a seller rate's activity field is exactly "RT (PUDO)"
 * or one of its known canonical variants.
 *
 * Uses EXACT equality ONLY — never substring, never regex includes —
 * because any looser match risks false positives on activity names whose
 * letters happen to contain "rt" (e.g. "Resort Room", "airport transfer").
 *
 * Internal whitespace is collapsed to a single space before comparing so
 * that data-entry variants like "RT  (PUDO)" (double space) still match.
 *
 * Canonical values stored in seller rates DB:
 *   "RT (PUDO)"  →  lower === 'rt (pudo)'  ✅
 *   "RT(PUDO)"   →  lower === 'rt(pudo)'   ✅
 *   "RT PUDO"    →  lower === 'rt pudo'    ✅
 *   "RT  (PUDO)" →  collapsed → 'rt (pudo)' ✅  (Coron double-space variant)
 *
 * Will NOT match:
 *   "Resort Room"   "airport transfer"   "Accommodation"   "Hotel"
 *   "RT Airfare"    "RT Ticket"   (those are inclusion strings, not rate activities)
 */
export const isRtPudoActivity = (text) => {
  if (!text) return false;
  // Normalize: lowercase, trim outer whitespace, collapse internal whitespace to single space
  const lower = text.toLowerCase().trim().replace(/\s+/g, ' ');
  return RT_PUDO_ACTIVITY_EXACT.some(kw => lower === kw);
};


// ─────────────────────────────────────────────────────────────
// FINDER  (exported — called by matchInclusionsWithPrices)
// ─────────────────────────────────────────────────────────────

/**
 * findRtPudoRate
 * Finds the best seller rate for a roundtrip / airfare / PUDO inclusion.
 *
 * Matching rules:
 *   - Searches ONLY rates where isRtPudoActivity(rate.activity) is true
 *   - NEVER calls activitiesMatch (the general fuzzy scorer)
 *   - Completely isolated from accommodation and general matching paths
 *
 * Pool priority:
 *   1. strictPool  — destination + duration + qualifier pre-filtered (Stage 1)
 *   2. destinationPool — destination-only fallback if strictPool has no RT rates
 *
 * Selection:
 *   - Score survivors with _scoreRate()
 *   - Walk sorted list top-to-bottom, take first that passes _verifyRate()
 *   - If none pass re-verification → return best-scored so price is always shown
 *
 * @param {object[]} strictPool      — Stage 1 filtered pool (all 3 signals)
 * @param {object[]} destinationPool — destination-only fallback pool
 * @param {object}   signals         — { destination, duration, qualifier }
 *                                     from parsePkgTitleSignals()
 *
 * @returns {object|null} matched seller rate record, or null if no RT rates found
 */
export const findRtPudoRate = (strictPool, destinationPool, signals) => {
  // Stage 2: exact activity match — try strictPool first
  let candidates = strictPool.filter(rate => isRtPudoActivity(rate.activity));

  // Stage 2 fallback: no RT (PUDO) rate in strictPool → try destination-only pool
  if (candidates.length === 0) {
    candidates = destinationPool.filter(rate => isRtPudoActivity(rate.activity));
  }

  // No RT (PUDO) rate exists at all for this destination
  if (candidates.length === 0) return null;

  // Score and sort: best duration + qualifier alignment first
  const scored = candidates
    .map(rate => ({ rate, score: _scoreRate(rate, signals.duration, signals.qualifier) }))
    .sort((a, b) => b.score - a.score);

  // Stage 3: walk and re-verify — take first that passes all Stage 1 checks
  for (const { rate } of scored) {
    if (_verifyRate(rate, signals)) return rate;
  }

  // No candidate passed re-verification — return best-scored so price is always shown
  return scored[0].rate;
};