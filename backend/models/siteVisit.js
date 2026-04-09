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
  },
  {
    timestamps: true, // createdAt = exact timestamp of each visit
  }
);

// Index for fast per-platform aggregation queries
siteVisitSchema.index({ platform: 1, createdAt: -1 });

module.exports = mongoose.model('SiteVisit', siteVisitSchema);
