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
  // Customer Information
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
  
  // Additional Details (for VISA inquiries)
  visaCountry: {
    type: String,
    default: null
  },
  visaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visa',
    default: null
  },

  // 👇 DAGDAG MO ITO: Additional Details (for PSA inquiries)
  psaDocument: {
    type: String, // Dito papasok yung "Birth Certificate", "Cenomar", etc.
    default: null
  },
  psaId: {
    type: mongoose.Schema.Types.ObjectId, // Optional: kung gusto mo naka-link din sa PSA collection
    ref: 'PSA',
    default: null
  },
  // 👆 END NG DAGDAG
  
  // Status Tracking
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
  
  // Price Information
  estimatedPrice: {
    type: Number,
    default: 0
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    default: ''
  },
  
  // Contact Tracking
  contactedAt: {
    type: Date,
    default: null
  },
  contactedBy: {
    type: String,
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
inquirySchema.index({ email: 1, createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ serviceName: 1, createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);