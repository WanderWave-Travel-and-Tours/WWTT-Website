// ============================================================
// tourActivityMatcher.js
// Dedicated tour / activity inclusion-to-seller-rate matching.
// Completely isolated from the accommodation and RT (PUDO) paths.
//
// ─────────────────────────────────────────────────────────────
// ZERO IMPORTS — fully self-contained.
// inclusionMatcher.js imports FROM this file.
// This file must NEVER import from inclusionMatcher.js.
//
// Reason: avoids circular dependency (same architecture rule as
// rtPudoMatcher.js). All shared helpers needed here are inlined
// as private (non-exported) functions so this file stands alone.
// ─────────────────────────────────────────────────────────────
//
// WHY A SEPARATE FILE:
//   The general fuzzy matcher (activitiesMatch) uses text-similarity
//   scoring across ALL activities, which causes false positives when
//   two activities share common words — e.g. "Island Hopping Tour A"
//   matching "Snorkeling Tour" (both contain "Tour"), or "Tour A"
//   matching "Tour B" because the tour-type keywords are the same.
//
//   This file classifies each inclusion into an ACTIVITY TYPE first
//   (e.g. 'island_hopping', 'firefly_watching', 'snorkeling'), then
//   considers ONLY seller rates of the same type — completely
//   eliminating cross-type contamination.
//
//   Within the same activity type, it scores candidates by:
//     1. Duration alignment in rate.destination   (+200 / -100)
//     2. Pax qualifier alignment                  (+100 to -200)
//     3. Activity name similarity                 (+300 to -150)
//        — includes tour-variant label matching
//          so "Tour A" is always preferred over "Tour B"
//
// ─────────────────────────────────────────────────────────────
// MATCHING PIPELINE:
//
//   Stage 1 — strictPool + destinationPool already built by
//             buildStage1Pool() in inclusionMatcher.js.
//             (destination + duration + qualifier pre-filtered)
//             Passed in as arguments; NOT rebuilt here.
//
//   Stage 2 — Classify inclusion → getTourActivityType().
//             Filter pool to same-type rates only.
//             Accommodation and RT rates are excluded unconditionally.
//             Try strictPool first, fall back to destinationPool.
//
//   Stage 3 — Score survivors:
//               duration score + qualifier score + name-similarity score.
//             Walk sorted list, take first that passes _verifyRate().
//             If none pass → return best-scored (price always shown).
//
//   Fallback — If inclusionType is null (unrecognized activity type),
//              use keyword overlap scoring on all general-pool rates.
//              Returns null only when no rate clears the minimum overlap
//              threshold — UI then shows price = 0 for that inclusion.
// ============================================================


// ─────────────────────────────────────────────────────────────
// TOUR ACTIVITY TYPES
// ─────────────────────────────────────────────────────────────

/**
 * TOUR_ACTIVITY_TYPES
 * Maps an activity type key → array of keyword phrases (all lowercase).
 *
 * Used to classify BOTH inclusion strings AND seller rate activity names
 * into a common type key, so only same-type rates are ever compared.
 *
 * Ordering rules within each array:
 *   - Longer / more specific phrases come BEFORE shorter ones.
 *     This prevents a short substring from matching prematurely before
 *     a more specific multi-word phrase is tested.
 *     e.g. 'loboc river cruise' must come before 'river cruise' so that
 *     "Loboc River Cruise" is NOT also classified as a generic river_cruise
 *     if a more specific type exists.
 *
 * Add new entries here whenever new activity categories are introduced
 * in the seller rates DB. A missing entry causes that activity type to
 * fall through to the keyword-overlap fallback, which is safe but less
 * accurate than a typed match.
 */
export const TOUR_ACTIVITY_TYPES = {

  // ── Palawan ─────────────────────────────────────────────────────────────
  underground_river:  ['underground river', 'subterranean river', 'ugr'],
  island_hopping:     ['island hopping', 'island hop'],
  firefly_watching:   ['firefly watching', 'firefly tour', 'firefly', 'fire fly', 'fireflies'],
  city_tour:          [
    'city tour', 'city drive', 'city road trip', 'city sightseeing',
    'heritage tour', 'heritage walk',
  ],
  waterfall_visit:    ['waterfall', 'falls tour', 'falls visit', 'waterfalls'],
  cave_tour:          [
    'cave tour', 'cave adventure', 'cave connection', 'cave exploration',
    'spelunking', 'cavern',
  ],
  mangrove_tour:      ['mangrove tour', 'mangrove paddling', 'mangrove paddle', 'mangrove'],
  lake_lagoon_tour:   ['twin lagoon', 'kayangan lake', 'lagoon tour', 'lake tour', 'seawater lake'],
  honda_bay_tour:     ['honda bay'],

  // ── Snorkeling / Diving ──────────────────────────────────────────────────
  snorkeling:         ['snorkeling tour', 'snorkel tour', 'snorkeling', 'snorkelling', 'snorkel'],
  scuba_diving:       ['scuba diving', 'scuba dive', 'scuba'],
  free_diving:        ['free diving', 'freediving', 'free dive'],

  // ── Wildlife / Marine ────────────────────────────────────────────────────
  whale_watching:     ['whale shark watching', 'whale watching', 'whale shark', 'butanding'],
  dolphin_watching:   ['dolphin watching tour', 'dolphin watching', 'dolphin tour', 'dolphin'],
  tarsier:            ['tarsier sanctuary', 'tarsier watching', 'tarsier'],
  oslob_whale:        ['oslob whale shark', 'oslob'],

  // ── Water Activities ─────────────────────────────────────────────────────
  kayaking:           ['kayaking tour', 'kayak tour', 'kayaking', 'kayak'],
  canyoneering:       ['canyoneering', 'canyoning'],
  cliff_jumping:      ['cliff jumping', 'cliff diving', 'cliff jump'],
  parasailing:        ['parasailing'],
  wakeboarding:       ['wakeboarding', 'wakeboard'],
  river_cruise:       [
    'loboc river cruise', 'river cruise', 'river tour',
    'loboc river', 'floating restaurant',
  ],
  kawasan:            [
    'kawasan falls canyoneering', 'kawasan canyoneering',
    'kawasan falls', 'kawasan',
  ],

  // ── Siargao ──────────────────────────────────────────────────────────────
  surfing:            [
    'surf lesson', 'surfing lesson', 'surfing tour', 'surf tour',
    'surfing class', 'surfing',
  ],

  // ── Bohol ────────────────────────────────────────────────────────────────
  chocolate_hills:    ['chocolate hills', 'chocolate hill'],

  // ── Land Activities ──────────────────────────────────────────────────────
  trekking:           [
    'mountain trekking', 'trekking tour', 'hiking tour', 'mountain trek',
    'mountain climb', 'summit climb', 'trekking', 'hiking',
  ],
  atv_ride:           ['atv ride', 'atv tour', 'atv', 'quad bike ride', 'quad bike'],
  horseback:          ['horseback riding', 'horse ride', 'horseback'],
  zipline:            ['zipline', 'zip line', 'zip-line'],

  // ── Transfers (non-RT) ───────────────────────────────────────────────────
  van_transfer:       ['private van transfer', 'van transfer', 'minivan transfer', 'van hire'],
  tricycle_tour:      ['tricycle tour', 'trike tour', 'tricycle hire', 'tricycle'],
  boat_transfer:      ['speedboat transfer', 'boat transfer', 'ferry transfer', 'boat ride'],
  airport_transfer:   [
    'airport transfer', 'airport pickup', 'airport drop off',
    'airport dropoff', 'terminal transfer', 'port transfer',
  ],

  // ── Food / Entrance ──────────────────────────────────────────────────────
  entrance_fee:       [
    'environmental fee', 'park entrance fee', 'entrance fee',
    'park fee', 'admission fee', 'registration fee',
  ],
  packed_meal:        [
    'packed meal', 'welcome dinner', 'welcome lunch',
    'seafood dinner', 'seafood lunch', 'seafood meal',
    'lunch meal', 'dinner meal',
  ],
  buffet:             ['buffet lunch', 'lunch buffet', 'buffet dinner', 'dinner buffet', 'buffet'],

  // ── Wellness ─────────────────────────────────────────────────────────────
  massage:            [
    'massage session', 'foot massage', 'body massage',
    'spa treatment', 'spa', 'wellness', 'massage',
  ],

  // ── Sightseeing / Beach / Night ──────────────────────────────────────────
  beach_tour:         ['beach tour', 'beach hopping', 'sandbar tour', 'sandbar visit'],
  sightseeing:        ['sightseeing tour', 'scenic tour', 'sightseeing drive', 'sightseeing'],
  night_tour:         ['night tour', 'night market tour', 'night market', 'nightlife tour'],
  cultural_tour:      ['cultural tour', 'historical tour', 'heritage site', 'museum tour'],
};


// ─────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// Intentionally inlined — no imports allowed in this file.
// Keep in sync with their counterparts in inclusionMatcher.js
// and rtPudoMatcher.js when those files are updated.
// ─────────────────────────────────────────────────────────────

// ── Accommodation & RT guards ─────────────────────────────────────────────
// Used to purge accommodation and RT (PUDO) rates from all pools BEFORE
// any tour-activity matching logic runs. This is a hard guarantee that
// tour matching can never return an accommodation or RT rate.

const _ACCOMMODATION_KEYWORDS = [
  'accommodation', 'hotel', 'lodging', 'inn', 'resort', 'room', 'stay',
];

const _RT_PUDO_ACTIVITY_EXACT = [
  'rt (pudo)', 'rt(pudo)', 'rt pudo', 'rt transfer', 'rttransfer',
];

const _isAccommodationActivity = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return _ACCOMMODATION_KEYWORDS.some(kw => lower.includes(kw));
};

const _isRtPudoActivity = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return _RT_PUDO_ACTIVITY_EXACT.some(kw => lower === kw);
};

// ── Destination matching ──────────────────────────────────────────────────
// Mirrors the same logic in rtPudoMatcher.js and inclusionMatcher.js.

const _KNOWN_DESTINATIONS = [
  'puerto princesa', 'el nido', 'coron palawan', 'siargao island',
  'siargao', 'siquijor', 'bohol', 'cebu', 'coron',
];

const _GENERIC_DESTINATION_WORDS = new Set([
  'island', 'islands', 'isle', 'islet',
  'province', 'area', 'region', 'district',
  'city', 'town', 'north', 'south', 'east', 'west', 'central',
  'tour', 'tours', 'beach', 'resort',
  'philippines', 'pilipinas', 'luzon', 'visayas', 'mindanao',
]);

const _PALAWAN_SUBDESTS = ['el nido', 'puerto princesa', 'coron'];

const _DESTINATION_SUBDEST_MAP = {
  'siargao': [
    'general luna', 'cloud 9', 'cloud9', 'dapa', 'pacifico',
    'pilar', 'del carmen', 'burgos',
  ],
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

  // Guard 2: Cross-destination guard
  const pkgMainDest = _KNOWN_DESTINATIONS.find(d => toWordBoundaryRegex(d).test(pkgLower));
  if (pkgMainDest) {
    const rateHasForeignDest = _KNOWN_DESTINATIONS.some(d =>
      d !== pkgMainDest && toWordBoundaryRegex(d).test(rateLower)
    );
    if (rateHasForeignDest) return false;
  }

  // KNOWN_DESTINATIONS precise loop — word-boundary
  for (const dest of _KNOWN_DESTINATIONS) {
    if (toWordBoundaryRegex(dest).test(pkgLower) && toWordBoundaryRegex(dest).test(rateLower))
      return true;
  }

  // Sub-location expansion — word-boundary
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

  // pkgWords fallback — word-boundary, generic words excluded
  const pkgWords = pkgLower
    .split(/\s+/)
    .filter(w => w.length >= 4 && !_GENERIC_DESTINATION_WORDS.has(w));
  return pkgWords.some(w => toWordBoundaryRegex(w).test(rateLower));
};

// ── Duration & qualifier helpers ──────────────────────────────────────────

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

// PRIMARY score: duration + qualifier alignment.
// Mirrors _scoreRate in rtPudoMatcher.js.
const _scoreRate = (rate, pkgDuration, pkgQualifier) => {
  let score = 0;
  const rateDuration = _extractDurationCode(rate.destination || '');
  if (pkgDuration && rateDuration) {
    if (pkgDuration === rateDuration) score += 200;
    else                              score -= 100;
  }
  const rq = _extractPaxQualifierType(rate.destination || '');
  if      (rq.type === 'generic')      { score += 0;   }
  else if (rq.type === 'solo_joiners') { score += 50;  }
  else if (pkgQualifier.type === 'solo'   && rq.type === 'solo')   { score += 100; }
  else if (pkgQualifier.type === 'minpax' && rq.type === 'minpax'
           && rq.count === pkgQualifier.count)                       { score += 100; }
  else                                 { score -= 200; }
  return score;
};

// Final re-examination of a candidate rate against all Stage 1 signals.
// Mirrors _verifyRate in rtPudoMatcher.js.
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

// ── Activity name similarity helpers ──────────────────────────────────────

const _normalizeActivity = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const _NOISE_WORDS = new Set([
  'the', 'and', 'or', 'with', 'for', 'in', 'on', 'at', 'to', 'from',
  'a', 'an', 'by', 'of',
]);

const _getSignificantWords = (normalizedText) =>
  normalizedText
    .split(' ')
    .filter(w => w.length >= 3 && !_NOISE_WORDS.has(w));

/**
 * _extractTourVariantLabel
 * Extracts the variant label from a tour activity name.
 * Returns the lowercase label string, or null if none found.
 *
 * Matches patterns like:
 *   "Island Hopping Tour A"    → "a"
 *   "Island Hopping Tour B"    → "b"
 *   "City Tour Package 1"      → "1"
 *   "Snorkeling Option 2"      → "2"
 *   "Snorkeling Tour"          → null   (no variant label)
 *   "Underground River Tour"   → null
 */
const _extractTourVariantLabel = (text) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  const m = lower.match(/\b(?:tour|package|option|plan)\s+([a-z]|\d{1,2})\b/);
  return m ? m[1] : null;
};

/**
 * _scoreActivityNameMatch
 * TERTIARY score: how closely the seller rate's activity name matches
 * the inclusion string. Applied ON TOP of _scoreRate (duration + qualifier).
 *
 * Scoring table:
 *   +300 — exact normalized match
 *   +150 — both have tour variant labels AND the labels match  (e.g. both "Tour A")
 *   -150 — both have tour variant labels AND the labels differ ("Tour A" vs "Tour B")
 *   +200 — keyword coverage ≥ 90%
 *   +100 — keyword coverage ≥ 70%
 *   +50  — keyword coverage ≥ 50%
 *   +20  — keyword coverage ≥ 30%
 *     0  — no meaningful overlap
 *
 * "Coverage" = max(rateRecall, incRecall) where:
 *   rateRecall = how many of the rate's keywords appear in the inclusion
 *   incRecall  = how many of the inclusion's keywords appear in the rate
 * Taking the max prevents short rate names from always scoring 100%.
 */
const _scoreActivityNameMatch = (inclusion, rateActivity) => {
  if (!rateActivity) return 0;

  const normInc  = _normalizeActivity(inclusion);
  const normRate = _normalizeActivity(rateActivity);

  // Exact normalized match
  if (normInc === normRate) return 300;

  // Tour variant label — discriminates "Tour A" from "Tour B"
  const incVariant  = _extractTourVariantLabel(inclusion);
  const rateVariant = _extractTourVariantLabel(rateActivity);

  if (incVariant !== null && rateVariant !== null) {
    return incVariant === rateVariant ? 150 : -150;
  }

  // Keyword overlap scoring
  const incWords  = _getSignificantWords(normInc);
  const rateWords = _getSignificantWords(normRate);

  if (!incWords.length || !rateWords.length) return 0;

  const matchCount  = rateWords.filter(w => incWords.includes(w)).length;
  const rateRecall  = matchCount / rateWords.length;
  const incRecall   = incWords.length > 0 ? matchCount / incWords.length : 0;
  const maxCoverage = Math.max(rateRecall, incRecall);

  if (maxCoverage >= 0.90) return 200;
  if (maxCoverage >= 0.70) return 100;
  if (maxCoverage >= 0.50) return  50;
  if (maxCoverage >= 0.30) return  20;
  return 0;
};


// ─────────────────────────────────────────────────────────────
// CLASSIFIERS  (exported — used by inclusionMatcher.js)
// ─────────────────────────────────────────────────────────────

/**
 * getTourActivityType
 * Classifies a text string into an activity type key from TOUR_ACTIVITY_TYPES.
 * Returns the type key (e.g. 'island_hopping'), or null if unrecognized.
 *
 * Matching: case-insensitive substring against each keyword phrase in the
 * array. Within each type's array, longer phrases are checked first to
 * prevent a short keyword from matching before a more specific phrase.
 *
 * Used on BOTH:
 *   - inclusion strings (to determine what type of activity is requested)
 *   - rate.activity strings (to filter the pool to same-type rates)
 *
 * Examples:
 *   "Island Hopping Tour A"                  → 'island_hopping'
 *   "Firefly Watching Tour"                  → 'firefly_watching'
 *   "Puerto Princesa Underground River"      → 'underground_river'
 *   "Island Hopping Tour A"  (rate.activity) → 'island_hopping'   ← same type ✅
 *   "Snorkeling Tour"        (rate.activity) → 'snorkeling'        ← different ❌
 *   "Unknown Activity XYZ"                   → null
 */
export const getTourActivityType = (text) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [typeKey, keywords] of Object.entries(TOUR_ACTIVITY_TYPES)) {
    if (keywords.some(kw => lower.includes(kw))) return typeKey;
  }
  return null;
};


// ─────────────────────────────────────────────────────────────
// FINDER  (exported — called by matchInclusionsWithPrices)
// ─────────────────────────────────────────────────────────────

/**
 * findTourActivityRate
 * Finds the best seller rate for a tour / activity inclusion.
 *
 * Matching rules:
 *   - Accommodation and RT (PUDO) rates are ALWAYS excluded from all pools.
 *   - Inclusion is classified into an activity type via getTourActivityType().
 *   - If type is recognized:
 *       Only rates of the same activity type are candidates.
 *       Score = duration score + qualifier score + activity name score.
 *       Walk sorted list, take first that passes _verifyRate().
 *       If none pass → return best-scored (price always shown).
 *       If no same-type candidates → return null (UI shows price = 0).
 *   - If type is null (unrecognized activity):
 *       All general-pool rates are candidates, filtered by keyword overlap
 *       ≥ 50% threshold. Same score + verify pipeline applies.
 *       Returns null if no rate clears the threshold.
 *
 * Pool priority:
 *   1. strictPool      (destination + duration + qualifier filtered)
 *   2. destinationPool (destination-only fallback)
 *
 * @param {object[]} strictPool      — Stage 1 filtered pool (all 3 signals)
 * @param {object[]} destinationPool — destination-only fallback pool
 * @param {object}   signals         — { destination, duration, qualifier }
 * @param {string}   inclusion       — inclusion string to match
 *
 * @returns {object|null} best matched seller rate, or null if no match found
 */
export const findTourActivityRate = (strictPool, destinationPool, signals, inclusion) => {

  // Always exclude accommodation and RT (PUDO) rates from both pools
  const toGeneralPool = (pool) => pool.filter(
    (rate) => !_isAccommodationActivity(rate.activity) && !_isRtPudoActivity(rate.activity)
  );

  const generalStrict = toGeneralPool(strictPool);
  const generalDest   = toGeneralPool(destinationPool);

  const inclusionType = getTourActivityType(inclusion);

  // ── TYPE-BASED MATCHING (primary path) ────────────────────────────────────
  // Restrict candidates to rates of the SAME activity type as the inclusion.
  // This prevents cross-type matches completely.
  if (inclusionType !== null) {
    const sameTypeRates = (pool) =>
      pool.filter((rate) => getTourActivityType(rate.activity) === inclusionType);

    let candidates = sameTypeRates(generalStrict);

    // Fallback: strictPool had no same-type rate → try destinationPool
    if (candidates.length === 0) {
      candidates = sameTypeRates(generalDest);
    }

    // No same-type rate exists at all for this destination → noMatch
    if (candidates.length === 0) return null;

    // Score: duration + qualifier (primary) + activity name similarity (tertiary)
    const scored = candidates
      .map((rate) => ({
        rate,
        score:
          _scoreRate(rate, signals.duration, signals.qualifier) +
          _scoreActivityNameMatch(inclusion, rate.activity),
      }))
      .sort((a, b) =>
        b.score !== a.score
          ? b.score - a.score
          : (a.rate.sellingPrice || 0) - (b.rate.sellingPrice || 0)
      );

    // Stage 3: walk and re-verify — take first that passes all Stage 1 checks
    for (const { rate } of scored) {
      if (_verifyRate(rate, signals)) return rate;
    }

    // No candidate passed re-verification → return best-scored so price is shown
    return scored[0].rate;
  }


  // ── KEYWORD FALLBACK (for unrecognized activity types) ────────────────────
  // Only reached when getTourActivityType() returned null.
  // Uses keyword overlap between the inclusion and rate.activity as the filter.
  // More conservative than type-based matching: requires >= 50% keyword overlap
  // to prevent completely unrelated rates from being returned.

  const _keywordOverlap = (incText, rateActivityText) => {
    const normInc  = _normalizeActivity(incText);
    const normRate = _normalizeActivity(rateActivityText);
    const incWords  = _getSignificantWords(normInc);
    const rateWords = _getSignificantWords(normRate);
    if (!incWords.length || !rateWords.length) return 0;
    const hits = rateWords.filter((w) => incWords.includes(w)).length;
    return hits / rateWords.length;
  };

  const MIN_OVERLAP = 0.5; // 50% of the rate's keywords must appear in the inclusion

  let fallbackCandidates = generalStrict.filter(
    (rate) => _keywordOverlap(inclusion, rate.activity) >= MIN_OVERLAP
  );

  if (fallbackCandidates.length === 0) {
    fallbackCandidates = generalDest.filter(
      (rate) => _keywordOverlap(inclusion, rate.activity) >= MIN_OVERLAP
    );
  }

  // No rate clears the minimum overlap threshold → noMatch
  if (fallbackCandidates.length === 0) return null;

  const fallbackScored = fallbackCandidates
    .map((rate) => ({
      rate,
      score:
        _scoreRate(rate, signals.duration, signals.qualifier) +
        _scoreActivityNameMatch(inclusion, rate.activity),
    }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : (a.rate.sellingPrice || 0) - (b.rate.sellingPrice || 0)
    );

  // Stage 3: walk and re-verify
  for (const { rate } of fallbackScored) {
    if (_verifyRate(rate, signals)) return rate;
  }

  // No candidate passed re-verification → return best-scored
  return fallbackScored[0].rate;
};