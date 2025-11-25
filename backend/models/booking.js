const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  packageName: { type: String, required: true },

  startDate: { type: String, required: true },   
  endDate:   { type: String, required: true },  
  duration:  { type: String, required: true },  

  pax: {
    adult: { type: Number, required: true, min: 1 }
  },

  totalAmount: { type: Number, required: true },

  fullName: { type: String, required: true },
  email:    { type: String, required: true },
  message:  { type: String },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending'
  },

  paymentId:        { type: String },
  paymentLinkId:    { type: String },
  referenceNumber:  { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Booking = mongoose.model('Booking', bookingSchema, 'bookings');

module.exports = Booking;