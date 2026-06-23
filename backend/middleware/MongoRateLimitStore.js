const mongoose = require('mongoose');

/**
 * Shared rate-limit counter backed by MongoDB.
 *
 * The default express-rate-limit store keeps counts in process memory, so each
 * server instance counts independently. On a multi-instance host (e.g. Render)
 * that means the effective cap becomes `max × number-of-instances`. Storing the
 * counter in MongoDB makes every instance read/write the SAME counter, so a cap
 * of 5 stays 5 no matter how many instances are running.
 *
 * Implements the express-rate-limit v7/v8 Store interface.
 */

const rateLimitSchema = new mongoose.Schema(
  {
    _id: String,        // the limiter key (usually the client IP)
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false }
);

// TTL index — Mongo removes each counter once its window has elapsed.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimitHit =
  mongoose.models.RateLimitHit || mongoose.model('RateLimitHit', rateLimitSchema);

class MongoRateLimitStore {
  constructor() {
    this.windowMs = 60 * 1000;
  }

  // Called once by express-rate-limit with the limiter's options.
  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const now = Date.now();

    // Fast path: an active (non-expired) window exists → just bump the count atomically.
    const active = await RateLimitHit.findOneAndUpdate(
      { _id: key, expiresAt: { $gt: new Date(now) } },
      { $inc: { count: 1 } },
      { new: true }
    );
    if (active) {
      return { totalHits: active.count, resetTime: active.expiresAt };
    }

    // No active window (missing or expired) → start a fresh one. Matching by _id
    // overwrites any expired doc cleanly, so there is no duplicate-key risk.
    const fresh = await RateLimitHit.findOneAndUpdate(
      { _id: key },
      { $set: { count: 1, expiresAt: new Date(now + this.windowMs) } },
      { upsert: true, new: true }
    );
    return { totalHits: fresh.count, resetTime: fresh.expiresAt };
  }

  async decrement(key) {
    await RateLimitHit.findOneAndUpdate(
      { _id: key, expiresAt: { $gt: new Date() } },
      { $inc: { count: -1 } }
    );
  }

  async resetKey(key) {
    await RateLimitHit.deleteOne({ _id: key });
  }

  async resetAll() {
    await RateLimitHit.deleteMany({});
  }
}

module.exports = MongoRateLimitStore;
