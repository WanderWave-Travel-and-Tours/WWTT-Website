const express = require('express');
const router = express.Router();
const SiteVisit = require('../models/siteVisit');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/log-visit
// Body: { 
//   platform: 'facebook' | 'instagram' | 'tiktok' | 'direct' | 'other',
//   campaignType?: 'organic' | 'ads'     ← new optional field
// }
// Example:
//   { "platform": "facebook", "campaignType": "organic" }
//   { "platform": "tiktok", "campaignType": "ads" }
//   { "platform": "direct" }   ← walang campaignType
// ─────────────────────────────────────────────────────────────────────────────
router.post('/log-visit', async (req, res) => {
  try {
    const { platform, campaignType } = req.body;

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

    // Handle campaignType (organic / ads)
    let normalizedCampaignType = null;
    if (campaignType !== undefined && campaignType !== null) {
      normalizedCampaignType = String(campaignType).toLowerCase().trim();
      const VALID_TYPES = ['organic', 'ads'];
      if (!VALID_TYPES.includes(normalizedCampaignType)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid campaignType. Must be one of: ${VALID_TYPES.join(', ')}`,
        });
      }
    }

    const visitData = { platform: normalized };
    if (normalizedCampaignType) {
      visitData.campaignType = normalizedCampaignType;
    }

    const visit = new SiteVisit(visitData);
    await visit.save();

    console.log(`✅ Visit logged — platform: ${normalized}, campaignType: ${normalizedCampaignType || 'none'}`);
    res.status(201).json({ status: 'ok', message: 'Visit logged', data: visit });
  } catch (error) {
    console.error('❌ Error logging visit:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/site-visits/stats
// Returns per-platform click counts + recent visits
// Ngayon mas detailed na ang platformRows (may organic at ads breakdown)
// byPlatform ay total pa rin per platform (backward compatible)
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

    // Aggregate with campaignType (new)
    const platformCounts = await SiteVisit.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            platform: '$platform',
            campaignType: { $ifNull: ['$campaignType', null] }, // null = legacy data
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

    // Last 500 raw visits (may campaignType na)
    const recentVisits = await SiteVisit.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      status: 'ok',
      data: {
        totalVisits,
        byPlatform: countMap,
        platformRows: platformCounts,   // ← mas detailed na (platform + campaignType)
        recentVisits,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching site visit stats:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;