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
  
  // ID Document (for domestic flights)
  idDocument: {
    filename: String,
    originalName: String,
    path: String,
    size: Number
  },
  
  // Passport Document (for international flights)
  passportDocument: {
    filename: String,
    originalName: String,
    path: String,
    size: Number
  }
}, { _id: false });

// NEW PRICE SCHEMA (for flightDetails.price)
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

  // NEW: Hotel/Room Details
  selectedRoomType: { type: String },
  hotelName: { type: String },
  numberOfRooms: { type: Number },

  // Package total (without airfare)
  packageTotal: { type: Number },

  // Airfare details (if booking includes flight)
  includesAirfare: { type: Boolean, default: false },
  flightDetails: {
    airline: String,
    flightNumber: String,
    route: String,
    departureTime: String,
    arrivalTime: String,
    // CRITICAL FIX: Changed from Number to Object/Schema
    price: flightPriceSchema, 
    formatted: String,
    isInternational: Boolean
  },
  airfareTotal: { type: Number, default: 0 },

  totalAmount: { type: Number, required: true },

  // Primary contact info (from Passenger 1)
  fullName: { type: String, required: true },
  email:    { type: String, required: true },
  message:  { type: String },

  // Array of all passengers with complete details
  passengers: { type: [passengerSchema], required: true, validate: {
    validator: v => Array.isArray(v) && v.length > 0,
    message: 'A booking must contain at least one passenger.'
  }},

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending'
  },

  paymentId:        { type: String },
  paymentLinkId:    { type: String },
  referenceNumber:  { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  paidAt: { type: Date },
  cancelledAt: { type: Date }
});

bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Booking = mongoose.model('Booking', bookingSchema, 'bookings');

module.exports = Booking;