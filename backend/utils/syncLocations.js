// utils/syncLocations.js
// ─────────────────────────────────────────────────────────────────────────────
// Call this after any booking is successfully confirmed/saved.
// It silently upserts each non-empty location string into the locations
// collection so the autocomplete always reflects real booking data.
//
// Usage:
//   const { syncLocations } = require('../utils/syncLocations');
//
//   // In your booking route, after booking.save():
//   syncLocations({ pickup: booking.pickupLocation, dropoff: booking.dropoffLocation, source: 'transfer' });
//
// The call is intentionally fire-and-forget (no await needed) — a sync
// failure should never block the booking response to the customer.
// ─────────────────────────────────────────────────────────────────────────────
const Location = require('../models/Location');

/**
 * Upsert a single location string.
 *
 * @param {string} raw    - The location string as the customer typed it.
 * @param {string} source - Booking type tag, e.g. 'transfer' | 'hotel' | 'tour'
 * @returns {Promise<void>}
 */
async function upsertLocation(raw, source = 'general') {
  const name           = (raw || '').trim();
  const normalizedName = Location.normalize(name);

  // Skip blanks — one-way bookings never have a dropoff
  if (!normalizedName) return;

  await Location.findOneAndUpdate(
    // ── Match condition: the unique normalised key ─────────────────────────
    { normalizedName },

    // ── Update operations ─────────────────────────────────────────────────
    {
      // Only set `name` on INSERT (preserves original casing of first entry)
      $setOnInsert: { name },

      // Always update these fields regardless of insert vs update
      $set:  { lastUsed: new Date() },
      $inc:  { usageCount: 1 },

      // Add the booking-type tag only if it isn't already in the array
      $addToSet: { usedIn: source },
    },

    // ── Options ───────────────────────────────────────────────────────────
    {
      upsert:         true,   // create document if it doesn't exist
      new:            true,   // return the updated document (useful for logging)
      setDefaultsOnInsert: true,
    }
  );
}

/**
 * Sync all location fields from a single booking.
 *
 * @param {object} options
 * @param {string} [options.pickup]   - pickupLocation value
 * @param {string} [options.dropoff]  - dropoffLocation value (roundtrip only)
 * @param {string} [options.source]   - booking type tag (default: 'transfer')
 */
async function syncLocations({ pickup, dropoff, source = 'transfer' } = {}) {
  const tasks = [
    pickup  ? upsertLocation(pickup,  source) : Promise.resolve(),
    dropoff ? upsertLocation(dropoff, source) : Promise.resolve(),
  ];

  // Run both upserts in parallel — DB does the atomic dedup via the unique index
  const results = await Promise.allSettled(tasks);

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const field = i === 0 ? 'pickup' : 'dropoff';
      // Non-fatal: log the warning but let the booking response succeed
      console.warn(`⚠️ syncLocations: failed to upsert ${field} location —`, result.reason?.message);
    }
  });
}

module.exports = { syncLocations, upsertLocation };
