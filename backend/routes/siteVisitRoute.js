const express = require('express');
const router = express.Router();
const SiteVisit = require('../models/siteVisit');
const { redactBody } = require('../utils/safeLog');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/site-visits/log-visit
// Body: {
//   platform: 'facebook' | 'instagram' | 'tiktok' | 'direct' | 'other',
//   campaignType?: 'organic' | 'ads',   ← optional
//   fullPath?: string,                  ← optional (e.g. '/facebook-organic')
//   referrer?: string,                  ← optional (document.referrer)
// }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/log-visit', async (req, res) => {
  try {
    // ✅ FIX: Always log incoming payload for easy Render Logs debugging
    console.log('📥 Site Visit Payload Received:', redactBody(req.body));

    const { platform, campaignType, fullPath, referrer } = req.body || {};

    if (!platform) {
      return res.status(400).json({ status: 'error', message: 'platform is required' });
    }

    const VALID_PLATFORMS = ['facebook', 'instagram', 'tiktok', 'direct', 'other'];
    const normalizedPlatform = String(platform).toLowerCase().trim();

    if (!VALID_PLATFORMS.includes(normalizedPlatform)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`,
      });
    }

    // Normalize campaignType — silently ignore invalid values instead of rejecting
    let normalizedCampaignType = null;
    if (campaignType) {
      const ct = String(campaignType).toLowerCase().trim();
      if (['organic', 'ads'].includes(ct)) {
        normalizedCampaignType = ct;
      }
    }

    const visit = new SiteVisit({
      platform: normalizedPlatform,
      campaignType: normalizedCampaignType,
      fullPath: fullPath || null,
      referrer: referrer || null,
    });

    await visit.save();

    console.log(`✅ Visit logged → platform: ${normalizedPlatform} | campaignType: ${normalizedCampaignType || 'none'} | path: ${fullPath || 'N/A'}`);

    // ✅ Fast response — important for keepalive + quick redirects
    res.status(201).json({ status: 'ok', message: 'Visit logged' });
  } catch (error) {
    console.error('❌ Error logging visit:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/site-visits/stats
// Query params: ?start=YYYY-MM-DD&end=YYYY-MM-DD (optional date filter)
// Returns per-platform totals + organic/ads breakdown + recent visits
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

    // Aggregate with platform + campaignType breakdown
    const platformCounts = await SiteVisit.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            platform: '$platform',
            campaignType: { $ifNull: ['$campaignType', null] },
          },
          count: { $sum: 1 },
          lastVisit: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Total per platform (backward compatible)
    const countMap = { facebook: 0, instagram: 0, tiktok: 0, direct: 0, other: 0 };
    platformCounts.forEach(({ _id, count }) => {
      const plat = _id.platform;
      if (plat in countMap) {
        countMap[plat] += count;
      }
    });

    const totalVisits = Object.values(countMap).reduce((a, b) => a + b, 0);

    // Last 500 raw visits
    const recentVisits = await SiteVisit.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      status: 'ok',
      data: {
        totalVisits,
        byPlatform: countMap,
        platformRows: platformCounts, // detailed: platform + campaignType breakdown
        recentVisits,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching site visit stats:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;