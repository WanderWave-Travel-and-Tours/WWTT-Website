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
    // New field para ma-track organic vs ads
    campaignType: {
      type: String,
      enum: ['organic', 'ads'],
      lowercase: true,
      trim: true,
      // optional lang — old visits will have null/undefined
    },
  },
  {
    timestamps: true, // createdAt = exact timestamp of each visit
  }
);

// Index for fast queries (per platform + campaign type)
siteVisitSchema.index({ platform: 1, campaignType: 1, createdAt: -1 });

module.exports = mongoose.model('SiteVisit', siteVisitSchema);