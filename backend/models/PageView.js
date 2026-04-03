const mongoose = require('mongoose');

// ===================================================================
// PAGE VIEW MODEL
// Tracks every visit to key frontend pages
// pages: 'packages' | 'booking' | 'flights' | 'services' | 'tours'
// ===================================================================
const pageViewSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
      enum: ['packages', 'booking', 'flights', 'services', 'tours'],
      index: true,
    },
    path: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: '',
    },
    packageId: {
      type: String,
      default: null,
      index: true,
    },
    packageName: {
      type: String,
      default: null,
    },
    // ── Unique visitor tracking ──────────────────────────────────────
    // visitorId = SHA-256 hash of the client's real IP address.
    // Sent from the frontend via ipify, used to deduplicate views.
    // A visitor is counted ONCE per page — permanently (no time window).
    visitorId: {
      type: String,
      required: true,
      index: true,
    },

    // ── Journey Stage for GHL Pipeline ────────────────────────────────
    stage: {
      type: String,
      enum: ['awareness', 'interest', 'consideration', 'intent', 'conversion'],
      default: 'awareness',
      index: true,
    },

    // Optional but useful
    sessionId: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

pageViewSchema.index({ createdAt: -1 });
pageViewSchema.index({ page: 1, createdAt: -1 });
// Main unique check — permanent per visitorId + page
pageViewSchema.index({ visitorId: 1, page: 1 });
pageViewSchema.index({ page: 1, stage: 1, createdAt: -1 });
pageViewSchema.index({ visitorId: 1, stage: 1 });

const PageView = mongoose.model('PageView', pageViewSchema);

// ===================================================================
// BOOKING COUNT MODEL  (merged here — same file, same deploy)
// Tracks every confirmed booking from BookingFormModal.
// Used to compute View-to-Book rate:
//   Rate = BookingCount / bookingPageViews x 100
// ===================================================================
const bookingCountSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true,
    },
    packageId: {
      type: String,
      default: null,
      index: true,
    },
    packageName: {
      type: String,
      default: null,
      index: true,
    },
    paxCount: {
      type: Number,
      default: 1,
    },
    paymentType: {
      type: String,
      enum: ['full', 'partial', 'unknown'],
      default: 'unknown',
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

bookingCountSchema.index({ createdAt: -1 });
bookingCountSchema.index({ packageName: 1, createdAt: -1 });

const BookingCount = mongoose.model('BookingCount', bookingCountSchema);

module.exports = { PageView, BookingCount };