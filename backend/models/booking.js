const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  passengerNumber: { type: Number, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  nationality: { type: String, required: true },
  
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

const bookingSchema = new mongoose.Schema({
  packageName: { type: String, required: true },

  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'packages' },
  sellerPrice: { type: Number, required: true },
  markup: { type: Number, required: true },
  price: { type: Number, required: true }, 

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

  totalAmount: { type: Number, required: true },

  paymentType: { 
    type: String, 
    enum: ['full', 'partial'], 
    default: 'full' 
  },
  initialPaymentAmount: { type: Number, required: true },  // Amount paid initially (50% or 85% or 100%)
  remainingBalance: { type: Number, default: 0 },           // Balance to be paid later
  balancePaidAmount: { type: Number, default: 0 },          // Amount paid for remaining balance
  balancePaidAt: { type: Date },                            // When remaining balance was paid
  
  initialPaymentId: { type: String },                       // First payment transaction ID
  balancePaymentId: { type: String },                       // Second payment transaction ID
  initialPaymentLinkId: { type: String },                   // First payment link ID
  balancePaymentLinkId: { type: String },                   // Second payment link ID (for remaining balance)

  fullName: { type: String, required: true },
  email:    { type: String, required: true },
  message:  { type: String },

  passengers: { type: [passengerSchema], required: true, validate: {
    validator: v => Array.isArray(v) && v.length > 0,
    message: 'A booking must contain at least one passenger.'
  }},

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled', 'partial_paid', 'fully_paid'],
    default: 'pending'
  },

  paymentId:        { type: String },   // Legacy - kept for backwards compatibility
  paymentLinkId:    { type: String },   // Legacy - kept for backwards compatibility
  referenceNumber:  { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  paidAt: { type: Date },
  cancelledAt: { type: Date },

  isArchive: { type: String, default: 'No' },

  promoCode: { type: String, default: null },
  promoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promo', default: null },
  discountAmount: { type: Number, default: 0 },
  finalPackageTotal: { type: Number, required: true }
});

bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

bookingSchema.virtual('computedRemainingBalance').get(function() {
  if (this.paymentType === 'partial') {
    return this.totalAmount - this.initialPaymentAmount - this.balancePaidAmount;
  }
  return 0;
});

bookingSchema.methods.isFullyPaid = function() {
  if (this.paymentType === 'full') {
    return this.status === 'confirmed' || this.status === 'fully_paid';
  }
  
  const totalPaid = this.initialPaymentAmount + this.balancePaidAmount;
  return totalPaid >= this.totalAmount;
};

bookingSchema.methods.getPaymentStatusDescription = function() {
  if (this.paymentType === 'full') {
    if (this.status === 'confirmed' || this.status === 'fully_paid') {
      return 'Paid in Full';
    }
    return 'Pending Payment';
  }
  
  if (this.isFullyPaid()) {
    return 'Fully Paid';
  }
  
  if (this.initialPaymentAmount > 0 && this.balancePaidAmount === 0) {
    return `Partial Paid (₱${this.remainingBalance.toLocaleString()} remaining)`;
  }
  
  return 'Pending Payment';
};

const Booking = mongoose.model('Booking', bookingSchema, 'bookings');

module.exports = Booking;