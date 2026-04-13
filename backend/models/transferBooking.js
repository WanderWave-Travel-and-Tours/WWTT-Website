// models/transferBooking.js
const mongoose = require('mongoose');

const TransferBookingSchema = new mongoose.Schema({
  // ── Transfer reference ──────────────────────────────────────────────────────
  transferId:      { type: mongoose.Schema.Types.Mixed, default: null }, // seller-rate _id
  activityName:    { type: String, required: true },   // e.g. "Siargao Airport Transfer"
  bookingType:     { type: String, default: 'transfer' },
  supplierName:    { type: String, default: '' },
  destination:     { type: String, default: '' },
  pax:             { type: String, default: '' },       // e.g. "1-2", "3-4"

  // ── Travel date ────────────────────────────────────────────────────────────
  travelDate:      { type: String, default: '' },
  pickupTime:      { type: String, default: '' },
  pickupLocation:  { type: String, default: '' },
  dropoffLocation: { type: String, default: '' },
  specialRequests: { type: String, default: '' },

  // ── Primary contact ────────────────────────────────────────────────────────
  fullName:        { type: String, required: true },
  email:           { type: String, required: true },
  phone:           { type: String, default: '' },
  message:         { type: String, default: '' },

  // ── Passengers ────────────────────────────────────────────────────────────
  passengerCount:  { type: Number, default: 1 },

  // ── Pricing ───────────────────────────────────────────────────────────────
  sellingPrice:    { type: Number, default: 0 },  // base per-unit price from seller rate
  totalAmount:     { type: Number, default: 0 },
  currency:        { type: String, default: 'PHP' },

  // ── Payment ───────────────────────────────────────────────────────────────
  paymentType:           { type: String, enum: ['full', 'partial'], default: 'full' },
  initialPaymentAmount:  { type: Number, default: 0 },
  remainingBalance:      { type: Number, default: 0 },
  paymentStatus:         { type: String, default: 'pending' },
  paidAt:                { type: Date, default: null },
  checkoutSessionId:     { type: String, default: null },
  referenceNumber:       { type: String, default: null },
  checkoutUrl:           { type: String, default: null },
  fullyPaid:             { type: Boolean, default: false },
  fullyPaidAt:           { type: Date, default: null },
  initialPaymentPaid:    { type: Boolean, default: false },
  initialPaymentPaidAt:  { type: Date, default: null },
  abandonedAt:           { type: Date, default: null },
  followUpCount:         { type: Number, default: 0 },

  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'partial_paid'],
    default: 'pending',
  },

  // ── Timestamps ────────────────────────────────────────────────────────────
  cancelledAt: { type: Date, default: null },
  updatedAt:   { type: Date, default: null },
}, {
  timestamps: true,
  collection: 'transferbookings',
});

// Indexes for common queries
TransferBookingSchema.index({ email: 1 });
TransferBookingSchema.index({ createdAt: -1 });
TransferBookingSchema.index({ status: 1 });
TransferBookingSchema.index({ checkoutSessionId: 1 }); // needed for webhook lookup

module.exports = mongoose.model('TransferBooking', TransferBookingSchema);
