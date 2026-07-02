// ─────────────────────────────────────────────────────────────────────────────
//  Booking Utilities — pure, stateless helpers
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

export const normaliseStr = (str) =>
  (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');

export const RESTRICTED_DESTINATIONS = ['sagada', 'baguio', 'la union', 'launion', 'bolinao', 'ilocos'];

/**
 * Detects the package type from a package object.
 * Returns a plain object (no setState); the caller is responsible for
 * applying the results to state.
 */
export const detectPackageTypeInfo = (pkg) => {
  if (!pkg) return { isSoloPkg: false, isMinTwoPkg: false, isSoloJoinersPkg: false, initialPax: 2 };

  const nameLower = (pkg.title || '').toLowerCase();

  const titleIsSoloJoiners =
    /solo\s*\/\s*joiners?\b/i.test(nameLower) ||
    /\bsolo\s+joiners?\b/i.test(nameLower)    ||
    /\bjoiners?\b/i.test(nameLower);

  const titleIsSolo    = !titleIsSoloJoiners && /\bsolo\b/i.test(nameLower);
  const titleIsMinTwo  = /min\s*of\s*2|min\.?\s*2|minimum\s*2|min 2 pax/i.test(nameLower);

  const isSoloJoinersPkg= titleIsSoloJoiners || pkg.tourType === 'joiners' || pkg.tourType === 'Solo/Joiners';
  const isSoloPkg       = !isSoloJoinersPkg && (titleIsSolo || pkg.pax === 1);
  const isMinTwoPkg     = titleIsMinTwo || (pkg.tourType === 'private' && pkg.pax === 2);

  let initialPax = 2;
  if (isSoloPkg)        initialPax = 1;
  else if (isMinTwoPkg) initialPax = 2;
  else if (isSoloJoinersPkg) initialPax = 1;

  return { isSoloPkg, isMinTwoPkg, isSoloJoinersPkg, initialPax };
};

export const isAllowedBookingDay = (dateStr, selectedPackage, isRestrictedDestination) => {
  if (!isRestrictedDestination || !dateStr) return true;
  const date     = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const nights   = getDurationNights(selectedPackage?.duration || '');
  const days     = getDurationDays(selectedPackage?.duration   || '');
  if (days === 3 && nights === 2) return dayOfWeek === 5; // Friday only
  if (days === 2 && nights === 1) return dayOfWeek === 6; // Saturday only
  return true;
};

export const getAllowedDayLabel = (selectedPackage) => {
  if (!selectedPackage) return null;
  const nights = getDurationNights(selectedPackage.duration);
  const days   = getDurationDays(selectedPackage.duration);
  if (days === 3 && nights === 2) return 'Fridays only (3D2N)';
  if (days === 2 && nights === 1) return 'Saturdays only (2D1N)';
  return null;
};

export const EMPTY_PASSENGER = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
  age: '', gender: '', address: '', nationality: 'Filipino',
  idFile: null, idFileName: '',
  passportFile: null, passportFileName: '',
};

// Local packages require a valid ID; international packages require ID + Passport.
export const isInternationalPackage = (pkg) =>
  (pkg?.category || '').toLowerCase().startsWith('internation');

// Same destination allowlist as the customer-facing PackageCustomizer —
// seller rates only exist (and are only reliably matchable) for these spots.
const CUSTOMIZABLE_DESTINATIONS = [
  'siargao', 'siquijor', 'bohol', 'cebu',
  'el nido', 'coron', 'palawan', 'puerto princesa',
];

export const isCustomizableDestination = (destination) => {
  const dest = (destination || '').toLowerCase().trim();
  return CUSTOMIZABLE_DESTINATIONS.some(d => dest.includes(d));
};
