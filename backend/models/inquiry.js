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
  contactNumber: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
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

  cenomarDocument: {
    type: String,
    default: null
  },
  cenomarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cenomar',
    default: null
  },

  inquiryType: { 
    type: String, 
    enum: ['GENERAL', 'VISA', 'PSA', 'FLIGHT_BOOKING', 'PASSPORT', 'CENOMAR'], 
    default: 'GENERAL' 
  },

  passportDetails: {
    appointmentDate: String,
    appointmentTime: String,
    applicationType: { 
      type: String, 
      enum: ['NEW', 'RENEWAL', 'LOST', 'DAMAGED'],
      default: 'NEW'
    },
    processingType: {
      type: String,
      enum: ['REGULAR', 'EXPEDITE'],
      default: 'REGULAR'
    },
    dfaLocation: String,
    hasMarriageCertificate: { type: Boolean, default: false },
    hasBirthCertificate: { type: Boolean, default: false },
    hasValidId: { type: Boolean, default: false },
    specialCase: String
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
    type: String,
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