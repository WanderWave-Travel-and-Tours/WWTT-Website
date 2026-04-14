// models/tourBooking.js
const mongoose = require('mongoose');

const PassengerSchema = new mongoose.Schema({
  passengerNumber: { type: Number, default: 1 },
  firstName:       { type: String, default: '' },
  lastName:        { type: String, default: '' },
  email:           { type: String, default: '' },
  phone:           { type: String, default: '' },
  dateOfBirth:     { type: String, default: '' },
  age:             { type: mongoose.Schema.Types.Mixed, default: '' },
  gender:          { type: String, default: '' },
  address:         { type: String, default: '' },
  nationality:     { type: String, default: 'Filipino' },
  idFile:          { type: String, default: null },   // uploaded filename
  passportFile:    { type: String, default: null },   // uploaded filename
}, { _id: false });

const FlightDetailsSchema = new mongoose.Schema({
  airline:         { type: String, default: '' },
  flightNumber:    { type: String, default: 'N/A' },
  departure:       { type: mongoose.Schema.Types.Mixed, default: null },
  arrival:         { type: mongoose.Schema.Types.Mixed, default: null },
  duration:        { type: mongoose.Schema.Types.Mixed, default: null },
  stops:           { type: Number, default: 0 },
  price:           { type: Number, default: 0 },
  isInternational: { type: Boolean, default: false },
}, { _id: false });

const TourBookingSchema = new mongoose.Schema({
  // ── Tour reference ─────────────────────────────────────────────────
  tourId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  packageId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' }, // alias kept for compat
  packageName:     { type: String, required: true },
  bookingType:     { type: String, default: 'tour' },

  // ── Dates & Duration ──────────────────────────────────────────────
  startDate:       { type: String },
  endDate:         { type: String },
  duration:        { type: String },

  // ── PAX ───────────────────────────────────────────────────────────
  pax: {
    adult:    { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    infants:  { type: Number, default: 0 },
  },

  // ── Primary contact ───────────────────────────────────────────────
  fullName:  { type: String },
  email:     { type: String },
  message:   { type: String, default: '' },
  primaryContact: {
    fullName: { type: String },
    email:    { type: String },
  },

  // ── Pricing ───────────────────────────────────────────────────────
  packagePrice:       { type: Number, default: 0 },
  packageTotal:       { type: Number, default: 0 },
  discountAmount:     { type: Number, default: 0 },
  finalPackageTotal:  { type: Number, default: 0 },
  airfareTotal:       { type: Number, default: 0 },
  totalAmount:        { type: Number, default: 0 },
  sellerPrice:        { type: Number, default: 0 },
  markup:             { type: Number, default: 0 },
  price:              { type: Number, default: 0 },
  originalPackagePrice: { type: Number, default: 0 },
  appliedMarkup:      { type: Number, default: 0 },

  // ── Payment ───────────────────────────────────────────────────────
  paymentType:           { type: String, enum: ['full', 'partial'], default: 'full' },
  initialPaymentAmount:  { type: Number, default: 0 },
  remainingBalance:      { type: Number, default: 0 },
  paymentStatus:         { type: String, default: 'pending' },
  paidAt:                { type: Date, default: null },
  paymentIntentId:       { type: String, default: null },
  checkoutUrl:           { type: String, default: null },
  // ✅ FIX: Added for PayMongo webhook lookup and confirm-by-booking flow
  checkoutSessionId:     { type: String, default: null },
  referenceNumber:       { type: String, default: null },
  fullyPaid:             { type: Boolean, default: false },
  fullyPaidAt:           { type: Date, default: null },
  initialPaymentPaid:    { type: Boolean, default: false },
  initialPaymentPaidAt:  { type: Date, default: null },
  abandonedAt:           { type: Date, default: null },
  followUpCount:         { type: Number, default: 0 },

  // ── Promo ─────────────────────────────────────────────────────────
  promoCode:  { type: String, default: null },
  promoId:    { type: mongoose.Schema.Types.Mixed, default: null },

  // ── Airfare ───────────────────────────────────────────────────────
  includesAirfare: { type: Boolean, default: false },
  flightDetails:   { type: FlightDetailsSchema, default: null },

  // ── Passengers ────────────────────────────────────────────────────
  passengers: { type: [PassengerSchema], default: [] },

  // ── Timer/price flags ─────────────────────────────────────────────
  timerExpiredAtBooking: { type: Boolean, default: false },
  priceType:             { type: String, default: 'discounted' },
  isCustomized:          { type: Boolean, default: false },
  customizedInclusions:  { type: [String], default: [] },

  // ── Status ────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },

  // ── ARCHIVE FIELDS (exact copy from hotel model) ──────────────────
  isArchive: {
    type: String,
    enum: ['No', 'Yes'],
    default: 'No'
  },
  archivedAt: {
    type: Date,
    default: null
  },
  // ─────────────────────────────────────────────────────────────────

  // ── Timestamps ────────────────────────────────────────────────────
  cancelledAt: { type: Date, default: null },
  updatedAt:   { type: Date, default: null },
}, {
  timestamps: true,
  collection: 'tourbookings',
});

// Indexes for common queries
TourBookingSchema.index({ tourId: 1, status: 1 });
TourBookingSchema.index({ email: 1 });
TourBookingSchema.index({ createdAt: -1 });
TourBookingSchema.index({ checkoutSessionId: 1 }); // ✅ FIX: needed for webhook lookup

module.exports = mongoose.model('TourBooking', TourBookingSchema);