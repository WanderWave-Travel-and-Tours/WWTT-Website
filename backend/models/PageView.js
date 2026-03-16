const mongoose = require('mongoose');

// ===================================================================
// PAGE VIEW MODEL
// Tracks every visit to key frontend pages
// pages: 'packages' | 'booking' | 'flights' | 'services'
// ===================================================================
const pageViewSchema = new mongoose.Schema(
  {
    // Which page was visited
    page: {
      type: String,
      required: true,
      enum: ['packages', 'booking', 'flights', 'services'],
      index: true,
    },

    // Full path e.g. '/packages', '/booking/abc123'
    path: {
      type: String,
      required: true,
    },

    // Human-readable label e.g. 'Booking Page: Siargao 3D2N'
    label: {
      type: String,
      default: '',
    },

    // Only set for booking page views
    packageId: {
      type: String,
      default: null,
      index: true,
    },

    packageName: {
      type: String,
      default: null,
    },
  },
  {
    // createdAt is our timestamp — we query by this for daily stats
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for fast time-range queries in the stats endpoint
pageViewSchema.index({ createdAt: -1 });
pageViewSchema.index({ page: 1, createdAt: -1 });

module.exports = mongoose.model('PageView', pageViewSchema);
