export const RT_PUDO_INCLUSION_KEYWORDS = [
  'roundtrip', 'round trip', 'round-trip',
  'airfare', 'air fare',
  'flight', 'airline', 'air ticket', 'plane ticket',
  'return flight', 'return ticket',
  'pudo', 'rt airfare', 'rt flight', 'rt ticket', 'rt transfer',
  'rt transport',
];

export const RT_PUDO_ACTIVITY_EXACT = [
  'rt (pudo)', 'rt(pudo)', 'rt pudo',
  'rt transfer', 'rttransfer',
  'rt transport',
];

const _KNOWN_DESTINATIONS = [
  'puerto princesa', 'el nido', 'coron palawan', 'siargao island',
  'siargao', 'siquijor', 'bohol', 'cebu', 'coron',
  'boracay',
  'batanes',

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

  const pkgSubDest  = _PALAWAN_SUBDESTS.find(s => toWordBoundaryRegex(s).test(pkgLower));
  const rateSubDest = _PALAWAN_SUBDESTS.find(s => toWordBoundaryRegex(s).test(rateLower));
  if (pkgSubDest && rateSubDest && pkgSubDest !== rateSubDest) return false;

  const pkgMainDest = _KNOWN_DESTINATIONS.find(d => toWordBoundaryRegex(d).test(pkgLower));
  if (pkgMainDest) {
    const rateHasForeignDest = _KNOWN_DESTINATIONS.some(d =>
      d !== pkgMainDest && toWordBoundaryRegex(d).test(rateLower)
    );
    if (rateHasForeignDest) return false;
  }

  for (const dest of _KNOWN_DESTINATIONS) {
    if (toWordBoundaryRegex(dest).test(pkgLower) && toWordBoundaryRegex(dest).test(rateLower))
      return true;
  }

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

  const pkgWords = pkgLower
    .split(/\s+/)
    .filter(w => w.length >= 4 && !_GENERIC_DESTINATION_WORDS.has(w));
  return pkgWords.some(w => toWordBoundaryRegex(w).test(rateLower));
};

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

const COMPLIMENTARY_RT_PATTERNS = [
  'complimentary', 'complimentary roundtrip', 'complimentary round trip',
  'complimentary transfer', 'free roundtrip', 'free round trip', 'free transfer',
  'roundtrip transfers during', 'round trip transfers during',
];

export const isRoundtripInclusion = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (COMPLIMENTARY_RT_PATTERNS.some(p => lower.includes(p))) return false;
  if (RT_PUDO_INCLUSION_KEYWORDS.some(kw => lower.includes(kw))) return true;
  if (/\brt\b/.test(lower)) return true;
  return false;
};

export const isRtPudoActivity = (text) => {
  if (!text) return false;

  const lower = text.toLowerCase().trim().replace(/\s+/g, ' ');
  return RT_PUDO_ACTIVITY_EXACT.some(kw => lower === kw);
};

export const findRtPudoRate = (strictPool, destinationPool, signals) => {

  let candidates = strictPool.filter(rate => isRtPudoActivity(rate.activity));

  if (candidates.length === 0) {
    candidates = destinationPool.filter(rate => isRtPudoActivity(rate.activity));
  }

  if (candidates.length === 0) return null;

  const scored = candidates
    .map(rate => ({ rate, score: _scoreRate(rate, signals.duration, signals.qualifier) }))
    .sort((a, b) => b.score - a.score);

  for (const { rate } of scored) {
    if (_verifyRate(rate, signals)) return rate;
  }

  return scored[0].rate;
};