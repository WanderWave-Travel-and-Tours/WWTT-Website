// models/Location.js
// ─────────────────────────────────────────────────────────────────────────────
// Stores all unique pickup / dropoff strings that appear in any booking type
// (transfers, hotels, tours, etc.).
//
// Documents are never inserted manually — they are auto-created by
// syncLocations() every time a booking is confirmed.
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    // ── The raw name as entered by the customer ─────────────────────────────
    name: {
      type:     String,
      required: true,
      trim:     true,
    },

    // ── Lowercase, whitespace-collapsed key used for deduplication ──────────
    // e.g. "Mactan Airport " and "mactan airport" both become "mactan airport"
    normalizedName: {
      type:     String,
      required: true,
      unique:   true,   // ← the upsert key
      trim:     true,
    },

    // ── Tags that describe where this location appears ──────────────────────
    // Allows filtering: "show me only pickup spots used in transfers"
    usedIn: {
      type:    [String],
      default: [],
      // e.g. ['transfer', 'hotel', 'tour']
    },

    // ── Usage stats — drives the autocomplete ranking ───────────────────────
    usageCount: {
      type:    Number,
      default: 1,
      min:     0,
    },

    lastUsed: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'locations',
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
LocationSchema.index({ normalizedName: 1 }, { unique: true });
LocationSchema.index({ usageCount: -1 });
LocationSchema.index({ lastUsed: -1 });
LocationSchema.index({ usedIn: 1 });

// ── Helper: normalise a raw string for dedup comparisons ────────────────────
LocationSchema.statics.normalize = function (raw) {
  return (raw || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

delete mongoose.connection.models['Location'];
delete mongoose.models['Location'];

module.exports = mongoose.model('Location', LocationSchema);
