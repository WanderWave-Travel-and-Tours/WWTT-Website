const express = require('express');
const router  = express.Router();
const SiteVisit = require('../models/siteVisit');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/log-visit
// Called by your landing page script when a visitor arrives via a social link.
// Body: { platform: 'facebook' | 'instagram' | 'tiktok' | 'direct' | 'other' }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/log-visit', async (req, res) => {
  try {
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({ status: 'error', message: 'platform is required' });
    }

    const VALID = ['facebook', 'instagram', 'tiktok', 'direct', 'other'];
    const normalized = String(platform).toLowerCase().trim();

    if (!VALID.includes(normalized)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid platform. Must be one of: ${VALID.join(', ')}`,
      });
    }

    const visit = new SiteVisit({ platform: normalized });
    await visit.save();

    console.log(`✅ Visit logged — platform: ${normalized}`);
    res.status(201).json({ status: 'ok', message: 'Visit logged', data: visit });
  } catch (error) {
    console.error('❌ Error logging visit:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/site-visits/stats
// Returns per-platform click counts + recent visits for the Reporting dashboard.
// Optional query params:
//   ?start=2025-01-01   — ISO date string (inclusive)
//   ?end=2025-12-31     — ISO date string (inclusive)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const filter = {};

    if (req.query.start || req.query.end) {
      filter.createdAt = {};
      if (req.query.start) filter.createdAt.$gte = new Date(req.query.start);
      if (req.query.end) {
        const end = new Date(req.query.end);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Aggregate click counts per platform
    const platformCounts = await SiteVisit.aggregate([
      { $match: filter },
      {
        $group: {
          _id:   '$platform',
          count: { $sum: 1 },
          // Keep the most recent visit timestamp per platform
          lastVisit: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Build a flat map for easy frontend consumption
    const countMap = { facebook: 0, instagram: 0, tiktok: 0, direct: 0, other: 0 };
    platformCounts.forEach(({ _id, count }) => {
      if (_id in countMap) countMap[_id] = count;
    });

    const totalVisits = Object.values(countMap).reduce((a, b) => a + b, 0);

    // Last 500 raw visits (for date-range filtering in the frontend)
    const recentVisits = await SiteVisit.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      status: 'ok',
      data: {
        totalVisits,
        byPlatform:   countMap,
        platformRows: platformCounts, // [{_id, count, lastVisit}, …]
        recentVisits,                 // raw rows for client-side date slicing
      },
    });
  } catch (error) {
    console.error('❌ Error fetching site visit stats:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
