// cbf/utils.js — shared helpers & constants for CustomizedBookingForm

export const API_BASE = 'https://wanderwaveph.onrender.com';

export const NIGHT_SURCHARGE_AMOUNT = 500;

export const STEPS = [
  { id: 1, label: 'Basic Info',  icon: null }, // icons injected by consumer
  { id: 2, label: 'Services',    icon: null },
  { id: 3, label: 'Details',     icon: null },
  { id: 4, label: 'Summary',     icon: null },
];

/** Format number as Philippine Peso string */
export const fmt = (n) =>
  Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Format YYYY-MM-DD to "Mon D, YYYY" */
export const fmtDate = (d) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`;
};

/**
 * Pick the right price for a transfer based on pax count + type.
 * Falls back to flat prices if no paxPricing tiers are defined.
 */
export const getTransferPrice = (transfer, paxCount, type) => {
  const pax = parseInt(paxCount) || 1;
  if (Array.isArray(transfer.paxPricing) && transfer.paxPricing.length > 0) {
    const sorted = [...transfer.paxPricing].sort((a, b) => (a.minPax || 0) - (b.minPax || 0));
    const tier   = sorted.find(p => pax >= (p.minPax || 1) && pax <= (p.maxPax ?? Infinity));
    const used   = tier || sorted[sorted.length - 1];
    return type === 'roundtrip'
      ? (used.roundtripPrice || used.oneWayPrice || 0)
      : (used.oneWayPrice || 0);
  }
  return type === 'roundtrip' ? (transfer.roundtripPrice || 0) : (transfer.oneWayPrice || 0);
};

/**
 * Returns true if timeStr (HH:MM) falls between 12:00 AM and 5:00 AM (inclusive).
 * These hours incur a late-night surcharge.
 */
export const isNightHour = (timeStr) => {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0) <= 300; // 0:00–5:00 AM → 0–300 min
};
