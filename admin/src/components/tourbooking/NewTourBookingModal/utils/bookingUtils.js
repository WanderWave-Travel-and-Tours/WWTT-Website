// ─────────────────────────────────────────────────────────────────────────────
//  Tour Booking Utilities — pure, stateless helpers
//  Ported from the sales package booking's bookingUtils.js so tour bookings
//  share the same day-restriction and customization-eligibility rules.
// ─────────────────────────────────────────────────────────────────────────────

export const getDurationDays = (durationStr) => {
  if (!durationStr) return 1;
  const match = durationStr.match(/(\d+)D/i);
  return match ? parseInt(match[1]) : 1;
};

export const getDurationNights = (durationStr) => {
  if (!durationStr) return 0;
  const match = durationStr.match(/(\d+)N/i);
  if (match) return parseInt(match[1]);
  return getDurationDays(durationStr) - 1;
};

export const RESTRICTED_DESTINATIONS = ['sagada', 'baguio', 'la union', 'launion', 'bolinao', 'ilocos'];

/**
 * Detects the tour type from a tour object (mirrors detectPackageTypeInfo).
 * Returns a plain object (no setState); the caller is responsible for
 * applying the results to state.
 */
export const detectTourTypeInfo = (tour) => {
  if (!tour) return { isSoloJoinersPkg: false };

  const nameLower = (tour.title || '').toLowerCase();

  const titleIsSoloJoiners =
    /solo\s*\/\s*joiners?\b/i.test(nameLower) ||
    /\bsolo\s+joiners?\b/i.test(nameLower)    ||
    /\bjoiners?\b/i.test(nameLower);

  const isSoloJoinersPkg = titleIsSoloJoiners || tour.tourType === 'joiners' || tour.tourType === 'Solo/Joiners';

  return { isSoloJoinersPkg };
};

export const isAllowedBookingDay = (dateStr, selectedTour, isRestrictedDestination) => {
  if (!isRestrictedDestination || !dateStr) return true;
  const date     = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const nights   = getDurationNights(selectedTour?.duration || '');
  const days     = getDurationDays(selectedTour?.duration   || '');
  if (days === 3 && nights === 2) return dayOfWeek === 5; // Friday only
  if (days === 2 && nights === 1) return dayOfWeek === 6; // Saturday only
  return true;
};

export const getAllowedDayLabel = (selectedTour) => {
  if (!selectedTour) return null;
  const nights = getDurationNights(selectedTour.duration);
  const days   = getDurationDays(selectedTour.duration);
  if (days === 3 && nights === 2) return 'Fridays only (3D2N)';
  if (days === 2 && nights === 1) return 'Saturdays only (2D1N)';
  return null;
};

// Same destination allowlist as the sales package booking's PackageCustomizer —
// seller rates only exist (and are only reliably matchable) for these spots.
const CUSTOMIZABLE_DESTINATIONS = [
  'siargao', 'siquijor', 'bohol', 'cebu',
  'el nido', 'coron', 'palawan', 'puerto princesa',
];

export const isCustomizableDestination = (destination) => {
  const dest = (destination || '').toLowerCase().trim();
  return CUSTOMIZABLE_DESTINATIONS.some(d => dest.includes(d));
};
