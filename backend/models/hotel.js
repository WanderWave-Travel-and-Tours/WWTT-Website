const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true,
    maxlength: [200, 'Hotel name cannot exceed 200 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [300, 'Location cannot exceed 300 characters']
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  city: {
    type: String,
    required: false,
    trim: true
  },
  country: {
    type: String,
    default: 'Philippines',
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: false,
    min: [0, 'Price cannot be negative']
  },
  priceUnit: {
    type: String,
    default: 'per night',
    enum: ['per night', 'per hour', 'per day', 'per week']
  },
  maxCapacity: {
    type: Number,
    default: 4,
    min: [1, 'Max capacity must be at least 1'],
    max: [20, 'Max capacity cannot exceed 20']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: [0, 'Total reviews cannot be negative']
  },
  imagePublicId: {
      type: String,
      default: ''
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String
    },
    caption: {
      type: String
    }
  }],
  mainImage: {
    type: String,
    default: ''
  },
  amenities: {
    wifi: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    pool: { type: Boolean, default: false },
    gym: { type: Boolean, default: false },
    restaurant: { type: Boolean, default: false },
    spa: { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: false },
    roomService: { type: Boolean, default: false },
    laundry: { type: Boolean, default: false },
    bar: { type: Boolean, default: false }
  },
  roomTypes: [{
    type: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    available: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    }
  }],
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  checkInTime: {
    type: String,
    default: '14:00'
  },
  checkOutTime: {
    type: String,
    default: '12:00'
  },
  policies: {
    cancellation: {
      type: String,
      trim: true
    },
    petPolicy: {
      type: String,
      trim: true
    },
    childPolicy: {
      type: String,
      trim: true
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster searches
hotelSchema.index({ name: 'text', location: 'text', description: 'text' });
hotelSchema.index({ city: 1, country: 1 });
hotelSchema.index({ price: 1 });
hotelSchema.index({ rating: -1 });
hotelSchema.index({ featured: -1, rating: -1 });

// Virtual for average amenities count
hotelSchema.virtual('amenitiesCount').get(function() {
  const amenities = this.amenities;
  return Object.values(amenities).filter(Boolean).length;
});

// Method to get amenities list
hotelSchema.methods.getAmenitiesList = function() {
  const amenities = this.amenities;
  return Object.keys(amenities).filter(key => amenities[key]);
};

// Method to calculate required rooms based on number of guests
hotelSchema.methods.calculateRoomsNeeded = function(numberOfGuests) {
  return Math.ceil(numberOfGuests / this.maxCapacity);
};

// Method to calculate total price for a group
hotelSchema.methods.calculateGroupPrice = function(numberOfGuests, numberOfNights = 1) {
  const roomsNeeded = this.calculateRoomsNeeded(numberOfGuests);
  return roomsNeeded * this.price * numberOfNights;
};

module.exports = mongoose.model('Hotel', hotelSchema);