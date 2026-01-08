const mongoose = require('mongoose');

const DraftSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  module: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ✅ UNIQUE INDEX: One draft per user per module
DraftSchema.index({ userId: 1, module: 1 }, { unique: true });

module.exports = mongoose.model('Draft', DraftSchema);