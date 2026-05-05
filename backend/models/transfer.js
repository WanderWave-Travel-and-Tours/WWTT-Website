// models/transfer.js
// ─────────────────────────────────────────────────────────────────────────────
// Transfer LISTING model — stores vehicles/routes offered by WanderWave.
// Separate from TransferBookingOrder (customer reservations).
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const TransferSchema = new mongoose.Schema(
  {
    // ── Display ─────────────────────────────────────────────────────────────
    title:              { type: String, required: true, trim: true },
    packageDestination: { type: String, default: null, trim: true },
    category:           { type: String, default: 'Local Transfer', trim: true },
    pax:                { type: Number, default: null },

    // ── Image ───────────────────────────────────────────────────────────────
    imageUrl:      { type: String, default: null },
    imagePublicId: { type: String, default: null },

    // ── One-Way Pricing ─────────────────────────────────────────────────────
    oneWaySupplierRate: { type: Number, default: 0 },
    oneWayMarkupValue:  { type: Number, default: 0 },
    oneWayMarkupType:   { type: String, default: 'peso', enum: ['peso', 'percent'] },
    oneWayPrice:        { type: Number, default: 0 },

    // ── Roundtrip Pricing ───────────────────────────────────────────────────
    roundtripSupplierRate: { type: Number, default: 0 },
    roundtripMarkupValue:  { type: Number, default: 0 },
    roundtripMarkupType:   { type: String, default: 'peso', enum: ['peso', 'percent'] },
    roundtripPrice:        { type: Number, default: 0 },

    // ── Visibility ──────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },

    // ── Archive ─────────────────────────────────────────────────────────────
    isArchive: { type: String, enum: ['Yes', 'No'], default: 'No' },
  },
  {
    timestamps: true,
    collection: 'transfers',
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
TransferSchema.index({ isActive: 1 });
TransferSchema.index({ isArchive: 1 });
TransferSchema.index({ category: 1 });
TransferSchema.index({ packageDestination: 1 });
TransferSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transfer', TransferSchema);