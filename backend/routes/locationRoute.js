// routes/locationRoute.js
// ─────────────────────────────────────────────────────────────────────────────
// Read-only endpoint.  The frontend LocationSelect fetches suggestions here.
// No POST / PUT / DELETE — locations are written exclusively by syncLocations().
//
// Mount in server.js:
//   const locationRoute = require('./routes/locationRoute');
//   app.use('/api/locations', locationRoute);
// ─────────────────────────────────────────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const Location = require('../models/Location');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/locations
//
// Query params (all optional):
//   q       {string}  — partial match against name (case-insensitive)
//   source  {string}  — filter by booking type tag, e.g. 'transfer'
//   limit   {number}  — max results (default 30, max 100)
//
// Returns an array shaped for react-select:
//   [{ value: "mactan airport", label: "Mactan Airport" }, …]
//
// Sorted by usageCount DESC so the most-booked spots bubble to the top.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { q = '', source, limit = 30 } = req.query;

    const filter = {};

    // Partial text search on the stored name
    if (q.trim()) {
      filter.name = { $regex: q.trim(), $options: 'i' };
    }

    // Optional booking-type filter
    if (source) {
      filter.usedIn = source;
    }

    const cap  = Math.min(parseInt(limit) || 30, 100);
    const docs = await Location.find(filter)
      .sort({ usageCount: -1, lastUsed: -1 })
      .limit(cap)
      .select('name usageCount -_id');

    // Shape into react-select option objects
    const options = docs.map((d) => ({
      value: d.name,
      label: d.name,
    }));

    return res.status(200).json({ success: true, data: options });
  } catch (err) {
    console.error('❌ GET /api/locations error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
