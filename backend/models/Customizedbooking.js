// models/customizedBooking.js
// ─────────────────────────────────────────────────────────────────────────────
// Stores a customer's fully customized booking built via the
// CustomizedBookingForm (4-step wizard: Info → Services → Service Details → Summary).
//
// Structure:
//   • basicInfo   – destination + contact fields
//   • services    – array of selected tours and/or transfers (with full detail)
//   • totalAmount – computed grand total of all selected services
//   • status      – booking lifecycle state
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

// ── Tour service snapshot ─────────────────────────────────────────────────────
const BookedTourSchema = new mongoose.Schema({
  tourId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', default: null },
  title:         { type: String, required: true },
  destination:   { type: String, default: '' },
  duration:      { type: String, default: '' },
  category:      { type: String, default: '' },
  imageUrl:      { type: String, default: null },
  price:         { type: Number, default: 0 },   // per-person selling price
  sellerPrice:   { type: Number, default: 0 },
  paxCount:      { type: Number, default: 1 },
  subtotal:      { type: Number, default: 0 },   // price × paxCount
  scheduledDate: { type: String, default: '' },  // YYYY-MM-DD — customer-chosen tour date
}, { _id: false });

// ── Transfer service snapshot ─────────────────────────────────────────────────
const BookedTransferSchema = new mongoose.Schema({
  transferId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer', default: null },
  title:           { type: String, required: true },
  category:        { type: String, default: '' },
  imageUrl:        { type: String, default: null },

  transferType:    { type: String, enum: ['oneway', 'roundtrip'], default: 'oneway' },
  oneWayPrice:     { type: Number, default: 0 },
  roundtripPrice:  { type: Number, default: 0 },
  selectedPrice:   { type: Number, default: 0 },
  subtotal:        { type: Number, default: 0 },

  // Schedule fields
  travelDate:      { type: String, default: '' },   // YYYY-MM-DD
  returnDate:      { type: String, default: '' },   // YYYY-MM-DD — roundtrip only
  arrivalTime:     { type: String, default: '' },   // HH:MM
  departureTime:   { type: String, default: '' },   // HH:MM — roundtrip only
  pickupLocation:  { type: String, default: '' },
  dropoffLocation: { type: String, default: '' },   // roundtrip only
  message:         { type: String, default: '' },

  passengerCount:  { type: Number, default: 1 },
}, { _id: false });

// ── Main schema ───────────────────────────────────────────────────────────────
const CustomizedBookingSchema = new mongoose.Schema(
  {
    bookingType:     { type: String, default: 'customized' },
    createdByType:   { type: String, enum: ['customer', 'sales', 'admin'], default: 'customer' },

    // ── Step 1 – Basic Info ─────────────────────────────────────────────────
    destination: { type: String, required: true, trim: true },
    fullName:    { type: String, required: true, trim: true },
    email:       { type: String, required: true, trim: true },
    phone:       { type: String, default: '' },
    travelDate:  { type: String, default: '' },   // YYYY-MM-DD
    returnDate:  { type: String, default: '' },   // YYYY-MM-DD (optional)
    paxCount:    { type: Number, default: 1 },
    message:     { type: String, default: '' },

    // ── Step 2-3 – Services ─────────────────────────────────────────────────
    tours:     { type: [BookedTourSchema],     default: [] },
    transfers: { type: [BookedTransferSchema], default: [] },

    // ── Pricing ─────────────────────────────────────────────────────────────
    toursTotal:     { type: Number, default: 0 },
    transfersTotal: { type: Number, default: 0 },
    totalAmount:    { type: Number, default: 0 },

    // ── Payment ─────────────────────────────────────────────────────────────
    currency:             { type: String, default: 'PHP' },
    paymentType:          { type: String, enum: ['full', 'partial'], default: 'full' },
    initialPaymentAmount: { type: Number, default: 0 },
    remainingBalance:     { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'failed', 'refunded'],
      default: 'pending',
    },

    // ── Status ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },

    referenceNumber: { type: String, default: null },
    promoCode:       { type: String, default: null },
    notes:           { type: String, default: '' },
    isArchive:       { type: String, enum: ['No', 'Yes'], default: 'No' },
  },
  {
    timestamps: true,
    collection: 'customizedbookings',
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
CustomizedBookingSchema.index({ email: 1 });
CustomizedBookingSchema.index({ status: 1 });
CustomizedBookingSchema.index({ destination: 1 });
CustomizedBookingSchema.index({ travelDate: 1 });
CustomizedBookingSchema.index({ createdAt: -1 });

// ── Auto-generate reference number before save ────────────────────────────────
CustomizedBookingSchema.pre('save', function (next) {
  if (!this.referenceNumber) {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.referenceNumber = `CB-${ts}-${rand}`;
  }
  next();
});

// Delete cached model to ensure schema is always fresh during dev
delete mongoose.connection.models['CustomizedBooking'];
delete mongoose.models['CustomizedBooking'];

module.exports = mongoose.model('CustomizedBooking', CustomizedBookingSchema);