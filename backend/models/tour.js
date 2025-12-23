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
  // ADDED: Itinerary field
  itinerary: {
    type: [{
      day: { type: Number, required: true },
      title: { type: String, required: true },
      activities: { type: [String], default: [] }
    }],
    default: []
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

// Pre-save middleware to ensure price is calculated
tourSchema.pre('save', function(next) {
  if (this.isModified('sellerPrice') || this.isModified('markup')) {
    this.price = this.sellerPrice + this.markup;
  }
  next();
});

module.exports = mongoose.model('Tour', tourSchema);