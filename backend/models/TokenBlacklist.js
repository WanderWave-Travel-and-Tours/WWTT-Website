const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date,   required: true }
});

// MongoDB TTL index: automatically deletes documents once expiresAt passes
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
