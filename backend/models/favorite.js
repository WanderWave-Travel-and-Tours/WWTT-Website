// backend/models/favorite.js - COMPLETE CODE
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Added index for better performance
  },
  promo_id: {
    type: String,
    required: true,
    index: true // Added index for better performance
  },
  package_title: {
    type: String,
    default: null
  },
  package_location: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // Added index for sorting
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate favorites and improve query performance
favoriteSchema.index({ user_id: 1, promo_id: 1 }, { unique: true });

// Index for user-specific queries
favoriteSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema);