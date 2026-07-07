const mongoose = require('mongoose');

// ✅ Itinerary schema — mirrors package.js ItineraryItemSchema
const itineraryItemSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  activities: [{ type: String }]
}, { _id: false });

const passengerSchema = new mongoose.Schema({
  passengerNumber: { type: Number, required: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  email: { type: String, default: null },
  phone: { type: String, default: '' },
  dateOfBirth: { type: String, default: '' },
  age: { type: Number, default: 0 },
  gender: { type: String, default: '' },
  address: { type: String, default: '' },
  nationality: { type: String, default: 'Filipino' },
  
  idDocument: {
    filename: String,
    originalName: String,
    path: String,
    size: Number
  },
  
  passportDocument: {
    filename: String,
    originalName: String,
    path: String,
    size: Number
  }
}, { _id: false });

const flightPriceSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  originalAmount: { type: Number },
  markupApplied: { type: Number },
  formatted: { type: String },
  perPerson: { type: Number },
  totalPassengers: { type: Number }
}, { _id: false });

const customInclusionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  supplierRate: { type: Number },
  markup: { type: Number },
  markupType: { type: String, enum: ['percentage', 'fixed'] },
  supplier: { type: String },
  destination: { type: String },
  pax: { type: String },
  notes: { type: String },
  isOriginal: { type: Boolean, default: false },
  isChecked: { type: Boolean, default: true },
  source: { type: String, enum: ['package', 'seller-rate'], required: true },
  sellerRateId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerRate' }
}, { _id: false });

// ── Add-On: Tour ─────────────────────────────────────────────────────────────
const addOnTourSchema = new mongoose.Schema({
  tourId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', default: null },
  title:       { type: String, default: '' },
  destination: { type: String, default: '' },
  duration:    { type: String, default: '' },
  category:    { type: String, default: '' },
  image:       { type: String, default: null },
  price:       { type: Number, default: 0 },   // per-person rate
  sellerPrice: { type: Number, default: 0 },
  paxCount:    { type: Number, default: 1 },
  subtotal:    { type: Number, default: 0 },   // price × paxCount
}, { _id: false });

// ── Add-On: Transfer ─────────────────────────────────────────────────────────
const addOnTransferSchema = new mongoose.Schema({
  transferId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer', default: null },
  title:           { type: String, default: '' },
  category:        { type: String, default: '' },
  imageUrl:        { type: String, default: null },

  // Pricing
  transferType:    { type: String, enum: ['oneway', 'roundtrip'], default: 'oneway' },
  oneWayPrice:     { type: Number, default: 0 },
  roundtripPrice:  { type: Number, default: 0 },
  selectedPrice:   { type: Number, default: 0 },   // price of chosen type
  subtotal:        { type: Number, default: 0 },

  // Pre-filled from booking context
  travelDate:      { type: String, default: '' },  // YYYY-MM-DD
  returnDate:      { type: String, default: '' },  // YYYY-MM-DD — roundtrip only
  destination:     { type: String, default: '' },
  passengerCount:  { type: Number, default: 1 },
  fullName:        { type: String, default: '' },
  email:           { type: String, default: '' },

  // Collected from Transfer Details Modal
  arrivalTime:     { type: String, default: '' },  // HH:MM
  departureTime:   { type: String, default: '' },  // HH:MM — roundtrip only
  pickupLocation:  { type: String, default: '' },
  dropoffLocation: { type: String, default: '' },  // roundtrip only
  message:         { type: String, default: '' },
}, { _id: false });

// ── Add-Ons wrapper ───────────────────────────────────────────────────────────
const addOnsSchema = new mongoose.Schema({
  tours:      { type: [addOnTourSchema],     default: [] },
  transfers:  { type: [addOnTransferSchema], default: [] },
  addOnsTotal:{ type: Number,                default: 0 },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  packageName: { type: String, required: true },

  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'packages' },
  sellerPrice: { type: Number, required: true },
  markup: { type: Number, required: true },
  price: { type: Number, required: true }, 
  timerExpiredAtBooking: { type: Boolean, default: false },
  priceType: { 
    type: String, 
    enum: ['discounted', 'markup'],
    default: 'discounted'
  },
  originalPackagePrice: { type: Number },
  appliedMarkup: { type: Number, default: 0 },
  startDate: { type: String, required: true },   
  endDate:   { type: String, required: true },  
  duration:  { type: String, required: true },  

  pax: {
    adult: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0 },
    infants: { type: Number, default: 0 },
  },

  selectedRoomType: { type: String },
  hotelName: { type: String },
  numberOfRooms: { type: Number },

  packageTotal: { type: Number },

  isCustomized: { type: Boolean, default: false },
  customizedInclusions: [customInclusionSchema],
  customizationAdditionalPrice: { type: Number, default: 0 },
  originalInclusions: [String],

  // ✅ Itinerary — snapshotted from package at time of booking (day-by-day breakdown)
  itinerary: { type: [itineraryItemSchema], default: [] },

  includesAirfare: { type: Boolean, default: false },
  flightDetails: {
    airline: String,
    flightNumber: String,
    route: String,
    departureTime: String,
    arrivalTime: String,
    price: flightPriceSchema, 
    formatted: String,
    isInternational: Boolean
  },
  airfareTotal: { type: Number, default: 0 },

  // ── Add-Ons (tours + transfers selected during booking Step 3) ────────────
  addOns: { type: addOnsSchema, default: () => ({ tours: [], transfers: [], addOnsTotal: 0 }) },

  totalAmount: { type: Number, required: true },

  paymentType: { 
    type: String, 
    enum: ['full', 'partial'], 
    default: 'full' 
  },
  initialPaymentAmount: { type: Number, required: true },
  remainingBalance: { type: Number, default: 0 },
  balancePaidAmount: { type: Number, default: 0 },
  balancePaidAt: { type: Date },
  
  // ✅ EXISTING Payment Link fields (keep for backward compatibility and balance payments)
  initialPaymentId: { type: String },
  balancePaymentId: { type: String },
  initialPaymentLinkId: { type: String },
  balancePaymentLinkId: { type: String },
  paymentId: { type: String },
  paymentLinkId: { type: String },

  // ✅ NEW: Checkout Session fields (for initial payments)
  checkoutSessionId: { type: String },
  initialPaymentPaid: { type: Boolean, default: false },
  initialPaymentPaidAt: { type: Date },
  balancePaymentPaid: { type: Boolean, default: false },
  balancePaymentPaidAt: { type: Date },

  fullName: { type: String, required: true },
  email:    { type: String, required: true },
  message:  { type: String },

  // ✅ Proof/reference image uploaded by the customer during booking (Cloudinary).
  // Legacy singular field — kept so older bookings (saved before proofImages existed) still read back correctly.
  proofImage: {
    filename: String,
    originalName: String,
    path: String,
    size: Number
  },

  // ✅ Proof/reference images — capped at one per passenger. Same shape as
  // passengers[].idDocument / passportDocument so it surfaces alongside them
  // in the booking's submitted-documents query.
  proofImages: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number
  }],

  passengers: { type: [passengerSchema], required: true, validate: {
    validator: v => Array.isArray(v) && v.length > 0,
    message: 'A booking must contain at least one passenger.'
  }},

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled', 'partial_paid', 'fully_paid', 'abandoned'],
    default: 'pending'
  },
createdByType: { 
  type: String, 
  enum: ['user', 'sales'], 
  default: 'user' 
},

// ✅ BAGONG FIELD — email ng admin/sales na gumawa ng booking
createdByEmail: { 
  type: String, 
  default: null 
},
  referenceNumber:  { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  paidAt: { type: Date },
  cancelledAt: { type: Date },

  isArchive: { type: String, default: 'No' },

  promoCode: { type: String, default: null },
  promoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promo', default: null },
  discountAmount: { type: Number, default: 0 },
  finalPackageTotal: { type: Number, required: true },

  // Walk-in appointment fields
  isWalkin: { type: Boolean, default: false },
  appointmentDate: { type: String },
  appointmentTime: { type: String },

  // ✅ NEW: Abandoned booking tracking fields (for GHL follow-up automation)
  abandonedAt: { type: Date, default: null },
  followUpCount: { type: Number, default: 0 },
  lastFollowUpAt: { type: Date, default: null },
  ghlAbandonedId: { type: String, default: null }, // GHL contact/workflow ID for tracking
});

bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  if (!this.referenceNumber) {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.referenceNumber = `PKG-${ts}-${rand}`;
  }

  next();
});

bookingSchema.virtual('computedRemainingBalance').get(function() {
  if (this.paymentType === 'partial') {
    return this.totalAmount - this.initialPaymentAmount - this.balancePaidAmount;
  }
  return 0;
});

// ✅ UPDATED: Enhanced isFullyPaid to check checkout session payments too
bookingSchema.methods.isFullyPaid = function() {
  if (this.paymentType === 'full') {
    // Check both old status and new checkout session payment flag
    return this.status === 'confirmed' 
      || this.status === 'fully_paid' 
      || this.initialPaymentPaid === true;
  }
  
  // For partial payments, check both old and new tracking
  const totalPaid = this.initialPaymentAmount + this.balancePaidAmount;
  const paidViaCheckout = this.initialPaymentPaid && this.balancePaymentPaid;
  
  return totalPaid >= this.totalAmount || paidViaCheckout;
};

bookingSchema.methods.getPaymentStatusDescription = function() {
  if (this.paymentType === 'full') {
    if (this.status === 'confirmed' || this.status === 'fully_paid' || this.initialPaymentPaid) {
      return 'Paid in Full';
    }
    return 'Pending Payment';
  }
  
  if (this.isFullyPaid()) {
    return 'Fully Paid';
  }
  
  if ((this.initialPaymentAmount > 0 || this.initialPaymentPaid) && this.balancePaidAmount === 0) {
    return `Partial Paid (₱${this.remainingBalance.toLocaleString()} remaining)`;
  }
  
  return 'Pending Payment';
};

bookingSchema.methods.getCustomizationSummary = function() {
  if (!this.isCustomized) {
    return null;
  }

  const checkedInclusions = this.customizedInclusions.filter(inc => inc.isChecked);
  const addedInclusions = checkedInclusions.filter(inc => !inc.isOriginal);
  const removedOriginal = this.originalInclusions?.length 
    ? this.originalInclusions.filter(orig => 
        !checkedInclusions.some(checked => checked.name === orig)
      )
    : [];

  return {
    totalInclusions: checkedInclusions.length,
    addedCount: addedInclusions.length,
    removedCount: removedOriginal.length,
    additionalCost: this.customizationAdditionalPrice,
    addedItems: addedInclusions.map(inc => ({
      name: inc.name,
      price: inc.price,
      supplier: inc.supplier
    })),
    removedItems: removedOriginal
  };
};

const Booking = mongoose.model('Booking', bookingSchema, 'bookings');

module.exports = Booking;