const express = require('express');
const router = express.Router();
const PageView = require('../models/PageView');

// ===================================================================
// POST /api/page-views
// Records a single page view. Called silently from the frontend.
// Body: { page, path, label, packageId?, packageName? }
// ===================================================================
router.post('/', async (req, res) => {
  try {
    const { page, path, label, packageId, packageName } = req.body;

    if (!page || !path) {
      return res.status(400).json({
        status: 'error',
        message: 'page and path are required',
      });
    }

    const validPages = ['packages', 'booking', 'flights', 'services'];
    if (!validPages.includes(page)) {
      return res.status(400).json({
        status: 'error',
        message: `page must be one of: ${validPages.join(', ')}`,
      });
    }

    const view = new PageView({
      page,
      path,
      label: label || '',
      packageId: packageId || null,
      packageName: packageName || null,
    });

    await view.save();

    console.log(`📊 Page view recorded: [${page}] ${path}`);

    return res.status(201).json({
      status: 'ok',
      message: 'Page view recorded',
    });
  } catch (err) {
    console.error('❌ Error recording page view:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to record page view',
      error: err.message,
    });
  }
});

// ===================================================================
// GET /api/page-views/stats
// Returns aggregated stats used by the dashboard RevenueAnalytics widget
// ===================================================================
router.get('/stats', async (req, res) => {
  try {
    // ── Totals per page ─────────────────────────────────────────────
    const totalViews         = await PageView.countDocuments();
    const packagesPageViews  = await PageView.countDocuments({ page: 'packages' });
    const bookingPageViews   = await PageView.countDocuments({ page: 'booking' });
    const flightsPageViews   = await PageView.countDocuments({ page: 'flights' });
    const servicesPageViews  = await PageView.countDocuments({ page: 'services' });

    // ── Top viewed packages (booking page only) ──────────────────────
    const topViewedPackages = await PageView.aggregate([
      { $match: { page: 'booking', packageName: { $ne: null } } },
      {
        $group: {
          _id: '$packageName',
          views: { $sum: 1 },
          packageId: { $first: '$packageId' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          packageName: '$_id',
          packageId: 1,
          views: 1,
        },
      },
    ]);

    // ── Recent 500 views (used by dashboard to build daily chart) ───
    const recentViews = await PageView.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .select('page path label packageName createdAt')
      .lean();

    // ── Daily breakdown — last 30 days ──────────────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyBreakdown = await PageView.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
            day:   { $dayOfMonth: '$createdAt' },
          },
          views: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    return res.status(200).json({
      status: 'ok',
      data: {
        totalViews,
        packagesPageViews,
        bookingPageViews,
        flightsPageViews,
        servicesPageViews,
        topViewedPackages,
        recentViews,
        dailyBreakdown,
      },
    });
  } catch (err) {
    console.error('❌ Error fetching page view stats:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch page view stats',
      error: err.message,
    });
  }
});

// ===================================================================
// GET /api/page-views
// Raw list — optional ?page=booking&limit=100 filter
// ===================================================================
router.get('/', async (req, res) => {
  try {
    const { page, limit = 100 } = req.query;
    const filter = page ? { page } : {};

    const views = await PageView.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return res.status(200).json({
      status: 'ok',
      count: views.length,
      data: views,
    });
  } catch (err) {
    console.error('❌ Error fetching page views:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch page views',
      error: err.message,
    });
  }
});

module.exports = router;
