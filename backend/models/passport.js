const mongoose = require('mongoose');

const passportSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['New Application', 'Renewal', 'Lost/Damaged']
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  processingTime: {
    type: String,
    default: '10-15 business days'
  },
  requirements: [{
    type: String
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

module.exports = mongoose.model('Passport', passportSchema);