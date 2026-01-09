const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  destination: { 
    type: String, 
    required: true,
    trim: true 
  },
  duration: { 
    type: String, 
    required: true,
    trim: true 
  },
  category: { 
    type: String, 
    enum: ['Local', 'International', 'International Tour'], 
    default: 'Local' 
  },
  sellerPrice: { 
    type: Number, 
    required: true,
    min: 0 
  },
  markup: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  }, 
  inclusions: { 
    type: [String], 
    default: [] 
  },
  itinerary: {
    type: [{
      day: { type: Number, required: true },
      title: { type: String, required: true },
      activities: { type: [String], default: [] }
    }],
    default: []
  },
  // ✅ NEW: Tour Type Fields
  tourType: { 
    type: String, 
    enum: ['private', 'joiners'], 
    default: 'private' 
  },
  minPax: { 
    type: Number, 
    default: null,
    validate: {
      validator: function(value) {
        // Only validate if tourType is joiners
        if (this.tourType === 'joiners') {
          return value != null && value >= 1;
        }
        return true; // No validation for private tours
      },
      message: 'Minimum pax is required for joiner tours and must be at least 1'
    }
  },
  image: { 
    type: String, 
    required: true 
  },
  isArchive: { 
    type: String, 
    enum: ['Yes', 'No'], 
    default: 'No' 
  }
}, { 
  timestamps: true 
});

// Virtual for formatted price
tourSchema.virtual('formattedPrice').get(function() {
  return `₱${this.price.toLocaleString()}`;
});

// Method to calculate price
tourSchema.methods.calculatePrice = function() {
  this.price = this.sellerPrice + this.markup;
  return this.price;
};

// Pre-save middleware to ensure price is calculated and clear minPax for private tours
tourSchema.pre('save', function(next) {
  if (this.isModified('sellerPrice') || this.isModified('markup')) {
    this.price = this.sellerPrice + this.markup;
  }
  
  // Clear minPax if tour type is private
  if (this.tourType === 'private') {
    this.minPax = null;
  }
  
  next();
});

module.exports = mongoose.model('Tour', tourSchema);