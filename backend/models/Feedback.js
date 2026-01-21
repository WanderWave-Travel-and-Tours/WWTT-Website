const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // Submitter Name (Optional)
  name: {
    type: String,
    trim: true,
    default: 'Anonymous',
    maxlength: [100, 'Name cannot exceed 100 characters']
  },

  // Feedback Category
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['bug', 'suggestion', 'general'],
    default: 'general'
  },

  // Feedback Message
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },

  // Rating (0-5 stars)
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },

  // Screenshot/Image (base64 string)
  screenshot: {
    type: String,
    default: null
  },

  // Technical Data
  technicalData: {
    url: {
      type: String,
      default: ''
    },
    browser: {
      type: String,
      default: ''
    },
    screenSize: {
      type: String,
      default: ''
    },
    timestamp: {
      type: String,
      default: () => new Date().toISOString()
    },
    language: {
      type: String,
      default: ''
    },
    platform: {
      type: String,
      default: ''
    }
  },

  // Status
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved', 'closed'],
    default: 'new'
  },

  // ARCHIVE FLAG (Added to match Testimonials logic)
  isArchive: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },

  // Admin Notes (optional)
  adminNotes: {
    type: String,
    default: ''
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
}, {
  timestamps: true 
});

// Indexes for better query performance
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ isArchive: 1 }); // Indexed for filtering

// Virtual for age
feedbackSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

feedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

feedbackSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;