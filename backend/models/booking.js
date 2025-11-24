const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  packageName: { type: String, required: true },
  date: { type: String, required: true },  
  pax: { type: Object, required: true }, 
  totalAmount: { type: Number, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema, 'bookings'); 

module.exports = Booking;