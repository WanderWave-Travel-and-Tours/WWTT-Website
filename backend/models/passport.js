const mongoose = require('mongoose');

const passportSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
    default: 'Passport Appointment'
  },
  description: {
    type: String,
    default: 'Book your Philippine Passport Appointment'
  },
  price: {
    type: Number,
    required: true,
    default: 1500
  },
  icon: {
    type: String,
    default: '🛂'
  },
  
  // Primary Requirements Section
  requirements: [{
    title: {
      type: String,
      default: 'Primary Requirements'
    },
    items: [{
      type: String,
      required: true
    }]
  }],
  
  // Additional Documents Section (Special Cases)
  additionalDocuments: [{
    title: {
      type: String,
      default: 'Special Cases'
    },
    items: [{
      type: String,
      required: true
    }]
  }],
  
  // Steps and Process
  stepsProcess: [{
    type: String,
    required: true
  }],
  
  // Processing Types Available
  processingTypes: [{
    type: {
      type: String,
      enum: ['REGULAR', 'EXPEDITE'],
      default: 'REGULAR'
    },
    price: {
      type: Number,
      required: true
    },
    processingTime: {
      type: String, // e.g., "10-15 working days"
      required: true
    }
  }],
  
  // Application Types Supported
  applicationTypes: {
    type: [String],
    enum: ['NEW', 'RENEWAL', 'LOST', 'DAMAGED'],
    default: ['NEW', 'RENEWAL', 'LOST', 'DAMAGED']
  },
  
  // DFA Locations Available
  dfaLocations: [{
    name: String,
    address: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  isActive: {
    type: Boolean,
    default: true
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

// Index for faster queries
passportSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Passport', passportSchema);