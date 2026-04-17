const mongoose = require('mongoose');

const siteVisitSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ['facebook', 'instagram', 'tiktok', 'direct', 'other'],
      lowercase: true,
      trim: true,
    },
    // Track organic vs ads
    campaignType: {
      type: String,
      enum: ['organic', 'ads'],
      lowercase: true,
      trim: true,
      default: null,
      // optional — old visits will have null/undefined
    },
    // ✅ FIX: Added fullPath and referrer fields (were missing, causing silent save failures)
    fullPath: {
      type: String,
      default: null,
      trim: true,
    },
    referrer: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt = exact timestamp of each visit
  }
);

// Index for fast queries (per platform + campaign type)
siteVisitSchema.index({ platform: 1, campaignType: 1, createdAt: -1 });

module.exports = mongoose.model('SiteVisit', siteVisitSchema);