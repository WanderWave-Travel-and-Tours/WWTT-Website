const mongoose = require('mongoose');

const psaSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  documentType: {
    type: String,
    required: true,
    enum: ['Birth Certificate', 'Marriage Certificate', 'Death Certificate', 'CENOMAR']
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
    default: '3-5 business days'
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

module.exports = mongoose.model('PSA', psaSchema);