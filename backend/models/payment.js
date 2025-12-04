// models/payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Link to the Inquiry
  inquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inquiry',
    required: true
  },
  // PayMongo Reference ID (Checkout Session ID)
  transactionId: {
    type: String,
    required: true
  },
  // Payment Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'PHP'
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    default: 'PayMongo' 
  },
  
  // Analytics Data (Saved directly here for easier reporting)
  serviceName: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  
  // Dates
  createdAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  }
});

module.exports = mongoose.model('Payment', paymentSchema);