// models/transferBookingOrder.js
// ─────────────────────────────────────────────────────────────────────────────
// Customer booking record for a transfer (one-way OR roundtrip).
//
// Key design rule to prevent frontend/backend mismatch:
//   • One Way  → arrivalTime is required; departureTime & dropoffLocation are null
//   • Roundtrip → arrivalTime + departureTime are required; dropoffLocation is required
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const TransferBookingOrderSchema = new mongoose.Schema(
  {
    // ── Link to Transfer listing ────────────────────────────────────────────
    transferId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer', default: null },
    activityName: { type: String, required: true },
    bookingType:  { type: String, default: 'transfer' },
    destination:  { type: String, default: '' },
    category:     { type: String, default: '' },
    onboardingSentAt: { type: Date, default: null },

    // ── Trip Type ───────────────────────────────────────────────────────────
    transferType: {
      type:     String,
      enum:     ['oneway', 'roundtrip'],
      required: true,
      default:  'oneway',
    },

    // ── Schedule ────────────────────────────────────────────────────────────
    travelDate:    { type: String, required: true },              // "YYYY-MM-DD"

    // One Way  → arrivalTime filled, departureTime null
    // Roundtrip → both filled
    arrivalTime:   { type: String, default: '' },                 // "HH:MM"
    departureTime: { type: String, default: '' },                 // "HH:MM" — roundtrip only

    // ── Locations ───────────────────────────────────────────────────────────
    pickupLocation:  { type: String, default: '' },

    // One Way  → always null (no return pickup)
    // Roundtrip → required
    dropoffLocation: { type: String, default: '' },

    // ── Contact Details ─────────────────────────────────────────────────────
    fullName:       { type: String, required: true },
    email:          { type: String, required: true },
    phone:          { type: String, default: '' },
    message:        { type: String, default: '' },
    specialRequests:{ type: String, default: '' },

    // ── Passengers & Pricing ────────────────────────────────────────────────
    passengerCount: { type: Number, default: 1 },
    oneWayPrice:    { type: Number, default: 0 },
    roundtripPrice: { type: Number, default: 0 },
    sellingPrice:   { type: Number, default: 0 },    // price of chosen type
    totalAmount:    { type: Number, default: 0 },

    // ── Payment ─────────────────────────────────────────────────────────────
    currency:             { type: String, default: 'PHP' },
    paymentType:          { type: String, enum: ['full', 'partial'], default: 'full' },
    initialPaymentAmount: { type: Number, default: 0 },
    remainingBalance:     { type: Number, default: 0 },
    paymentStatus:        { type: String, enum: ['pending', 'paid', 'partial', 'failed', 'refunded'], default: 'pending' },

    // ── Status ──────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'confirmed', 'partial_paid', 'cancelled', 'completed'],
      default: 'pending',
    },

    promoCode:      { type: String, default: null },
    supplierName:   { type: String, default: '' },
    pax:            { type: String, default: '' },
  },
  {
    timestamps:  true,
    collection:  'transferbookingorders',
  }
);

// ── Validation: enforce field rules based on transferType ──────────────────
TransferBookingOrderSchema.pre('save', function (next) {
  if (this.transferType === 'oneway') {
    // Enforce: no departure time and no dropoff for one-way
    this.departureTime   = '';
    this.dropoffLocation = '';
  }

  if (this.transferType === 'roundtrip') {
    // Enforce: both times and dropoff must be present for roundtrip
    if (!this.arrivalTime) {
      return next(new Error('arrivalTime is required for roundtrip bookings.'));
    }
    if (!this.departureTime) {
      return next(new Error('departureTime is required for roundtrip bookings.'));
    }
  }

  next();
});

// ── Indexes ──────────────────────────────────────────────────────────────────
TransferBookingOrderSchema.index({ transferId: 1 });
TransferBookingOrderSchema.index({ email: 1 });
TransferBookingOrderSchema.index({ status: 1 });
TransferBookingOrderSchema.index({ travelDate: 1 });
TransferBookingOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TransferBookingOrder', TransferBookingOrderSchema);