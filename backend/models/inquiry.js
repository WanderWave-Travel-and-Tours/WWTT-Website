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
    default: null
  },
  address: {
    type: String,
    default: null
  },
  message: {
    type: String,
    required: true
  },
  
  // VISA FIELDS
  visaCountry: {
    type: String,
    default: null
  },
  visaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visa',
    default: null
  },

  // PSA FIELDS
  psaDocument: {
    type: String,
    default: null
  },
  psaId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PSA',
    default: null
  },

  // CENOMAR FIELDS
  cenomarDocument: {
    type: String,
    default: null
  },
  cenomarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CENOMAR',
    default: null
  },

  inquiryType: { 
    type: String, 
    enum: ['GENERAL', 'VISA', 'PSA', 'CENOMAR', 'FLIGHT_BOOKING'], 
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
    type: String,
    email: String,     
    contactNumber: String
  }],

  status: {
    type: String,
    enum: [
      'PENDING', 
      'CONTACTED', 
      'IN_PROGRESS', 
      'PAYMENT_PENDING', 
      'PAID',
      'CONFIRMED',
      'PROCESSING',
      'READY',
      'COMPLETED', 
      'CANCELLED'
    ],
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

  // PAYMENT CONFIRMATION FIELDS
  paymentConfirmedAt: {
    type: Date,
    default: null
  },
  paymentConfirmedBy: {
    type: String,
    default: null
  },

  // DOCUMENT DELIVERY FIELDS
  deliveredDocuments: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  documentsDeliveredAt: {
    type: Date,
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