const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: false
  },
  serviceName: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  message: {
    type: String,
    required: true
  },
  
  visaCountry: {
    type: String,
    default: null
  },
  visaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visa',
    default: null
  },

  psaDocument: {
    type: String,
    default: null
  },
  psaId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PSA',
    default: null
  },

  inquiryType: { 
    type: String, 
    enum: ['GENERAL', 'VISA', 'PSA', 'FLIGHT_BOOKING'], 
    default: 'GENERAL' 
  },

  flightDetails: {
    origin: String,
    destination: String,
    departureDate: String,
    arrivalDate: String,
    airline: String,
    flightNumber: String,
    cabinClass: String,
    duration: String,
    stops: Number
  },

  passengers: [{
    firstName: String,
    lastName: String,
    nationality: String,
    age: Number,
    type: { String },
    email: String,     
    contactNumber: String
  }],

  status: {
    type: String,
    enum: ['PENDING', 'CONTACTED', 'IN_PROGRESS', 'PAYMENT_PENDING', 'PAID', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  remarks: {
    type: String,
    default: ''
  },
  evidenceUrl: {
    type: String,
    default: '' 
  },
  evidenceName: {
    type: String,
    default: ''
  },
  
  estimatedPrice: {
    type: Number,
    default: 0
  },
  
  adminNotes: {
    type: String,
    default: ''
  },
  
  contactedAt: {
    type: Date,
    default: null
  },
  contactedBy: {
    type: String,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

inquirySchema.index({ email: 1, createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ serviceName: 1, createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);