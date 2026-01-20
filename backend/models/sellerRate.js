// models/sellerRate.js
const mongoose = require('mongoose');

const sellerRateSchema = new mongoose.Schema({
  destination: {
    type: String,
    required: true,
    trim: true
  },
  activity: {
    type: String,
    required: true,
    trim: true
  },
  supplierName: {
    type: String,
    required: true,
    trim: true
  },
  supplierRate: {
    type: Number,
    required: true,
    min: 0
  },
  markup: {
    type: Number,
    required: true,
    min: 0
  },
  markupType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  pax: {
    type: String,
    trim: true
  },
  inclusions: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  // --- BAGONG FIELD GAYA NG SA BLOG MODEL ---
  isArchive: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  // ------------------------------------------
  dateAdded: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
sellerRateSchema.index({ destination: 1, activity: 1 });
sellerRateSchema.index({ supplierName: 1 });
sellerRateSchema.index({ status: 1 });
// Idinagdag na index para sa isArchive para mabilis ang filtering sa SellerRate.jsx
sellerRateSchema.index({ isArchive: 1 }); 

// Calculate selling price before saving (EXISTING LOGIC RETAINED)
sellerRateSchema.pre('save', function(next) {
  if (this.isModified('supplierRate') || this.isModified('markup') || this.isModified('markupType')) {
    if (this.markupType === 'percentage') {
      this.sellingPrice = this.supplierRate + (this.supplierRate * this.markup / 100);
    } else {
      this.sellingPrice = this.supplierRate + this.markup;
    }
  }
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('SellerRate', sellerRateSchema);