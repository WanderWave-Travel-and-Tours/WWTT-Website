const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PageView, BookingCount } = require('../models/PageView');
const Booking = require('../models/booking');

// ===================================================================
// HELPER — generates a stable visitorId from the client's real IP.
// Priority: (1) visitorIp sent in request body (from ipify on frontend)
//           (2) x-forwarded-for header (proxy/load balancer)
//           (3) socket remote address (fallback)
// ===================================================================
function getVisitorId(req) {
  const ip =
    req.body?.visitorIp ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// ===================================================================
// HELPER — determines the journey stage based on page/path/label.
// Used for GHL pipeline automation.
// ===================================================================
function determineStage(page, path, label, packageId) {
  if (page === 'booking' || path?.includes('booking') || label?.toLowerCase().includes('book')) {
    return 'intent';
  }
  if (packageId || path?.includes('/package') || path?.includes('/tour')) {
    return 'consideration';
  }
  if (page === 'packages' || page === 'tours' || page === 'flights') {
    return 'interest';
  }
  if (page === 'services') {
    return 'interest';
  }
  return 'awareness';
}

// ===================================================================
// POST /api/page-views
// Records a single UNIQUE page view per visitor IP — permanently.
// Once an IP has viewed a specific page, it will never count again
// for that exact page, even after many days or weeks.
// Called silently from the frontend.
// Body: { page, path, label, packageId?, packageName?, visitorIp?, sessionId?, email? }
// ===================================================================
router.post('/', async (req, res) => {
  try {
    const { page, path, label, packageId, packageName, sessionId, email } = req.body;

    if (!page || !path) {
      return res.status(400).json({
        status: 'error',
        message: 'page and path are required',
      });
    }

    const validPages = ['packages', 'booking', 'flights', 'services', 'tours'];
    if (!validPages.includes(page)) {
      return res.status(400).json({
        status: 'error',
        message: `page must be one of: ${validPages.join(', ')}`,
      });
    }

    // ── Permanent unique-view deduplication ──────────────────────────
    // Same visitor IP on the same page is NEVER counted again,
    // regardless of how much time has passed.
    const visitorId = getVisitorId(req);

    const alreadyViewed = await PageView.exists({
      visitorId,
      page,
    });

    if (alreadyViewed) {
      console.log(`👁️  Duplicate view skipped (permanent): [${page}] ${path} — visitor already counted`);
      return res.status(200).json({
        status: 'ok',
        message: 'Page view already recorded for this visitor',
        unique: false,
      });
    }

    // Determine journey stage for GHL pipeline
    const stage = determineStage(page, path, label, packageId);

    const view = new PageView({
      page,
      path,
      label: label || '',
      packageId: packageId || null,
      packageName: packageName || null,
      visitorId,
      stage,
      sessionId: sessionId || null,
      email: email || null,
    });

    await view.save();

    console.log(`📊 Unique page view recorded (permanent): [${page}] ${path} | Stage: ${stage}`);

    return res.status(201).json({
      status: 'ok',
      message: 'Page view recorded',
      unique: true,
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
// Returns aggregated page view + booking count stats for the dashboard.
// Both datasets are returned in one response to avoid a second fetch.
// ===================================================================
router.get('/stats', async (req, res) => {
  try {
    // ── Page view totals per page ────────────────────────────────────
    const totalViews        = await PageView.countDocuments();
    const packagesPageViews = await PageView.countDocuments({ page: 'packages' });
    const bookingPageViews  = await PageView.countDocuments({ page: 'booking' });
    const flightsPageViews  = await PageView.countDocuments({ page: 'flights' });
    const servicesPageViews = await PageView.countDocuments({ page: 'services' });
    const toursPageViews    = await PageView.countDocuments({ page: 'tours' });

    // ── Top viewed packages (booking page views only) ────────────────
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

    // ── Recent 5000 page views (dashboard date-range filtering) ──────
    const recentViews = await PageView.find()
      .sort({ createdAt: -1 })
      .limit(5000)
      .select('page path label packageName packageId createdAt stage')
      .lean();

    // ── Daily page view breakdown — last 30 days ─────────────────────
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

    // ── Unique visitors per journey stage (for GHL pipeline insight) ─
    const stageStats = await PageView.aggregate([
      { $group: { _id: '$stage', uniqueVisitors: { $addToSet: '$visitorId' } } },
      { $project: { stage: '$_id', _id: 0, uniqueVisitors: { $size: '$uniqueVisitors' } } },
      { $sort: { uniqueVisitors: -1 } },
    ]);

    // ── Booking totals — sourced directly from the Booking model ────
    // We no longer use the BookingCount collection here because it can
    // hold stale / null-bookingId records that inflate the count.
    // Ground truth is the actual Booking documents (isArchive !== 'Yes').
    const activeBookingFilter = { isArchive: { $ne: 'Yes' } };

    const totalBookingCounts = await Booking.countDocuments(activeBookingFilter);

    // ── Top booked packages (from actual Booking records) ────────────
    const topBookedPackages = await Booking.aggregate([
      { $match: { ...activeBookingFilter, packageName: { $ne: null } } },
      {
        $group: {
          _id: '$packageName',
          bookingCounts: { $sum: 1 },
          packageId:     { $first: '$packageId' },
          totalRevenue:  { $sum: '$totalAmount' },
        },
      },
      { $sort: { bookingCounts: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          packageName:   '$_id',
          packageId:     1,
          bookingCounts: 1,
          totalRevenue:  1,
        },
      },
    ]);

    // ── Recent 5000 bookings for frontend date-range filtering ───────
    // Field names kept identical to the old BookingCount shape so
    // Reporting.jsx needs zero changes.
    const recentBookingCounts = await Booking.find(activeBookingFilter)
      .sort({ createdAt: -1 })
      .limit(5000)
      .select('packageName packageId pax paymentType totalAmount createdAt')
      .lean();

    return res.status(200).json({
      status: 'ok',
      data: {
        // Page view fields
        totalViews,
        packagesPageViews,
        bookingPageViews,
        flightsPageViews,
        servicesPageViews,
        toursPageViews,
        topViewedPackages,
        recentViews,
        dailyBreakdown,
        stageStats,
        // Booking count fields (same response, no extra fetch needed)
        totalBookingCounts,
        topBookedPackages,
        recentBookingCounts,
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

// ===================================================================
// POST /api/page-views/booking-count
// Records a confirmed booking from BookingFormModal.
// Merged here so no separate route file or extra deploy is needed.
// Body: { packageId?, packageName?, paxCount?, paymentType?, totalAmount? }
// ===================================================================
router.post('/booking-count', async (req, res) => {
  try {
    const { packageId, packageName, paxCount, paymentType, totalAmount, bookingId } = req.body;

    const count = new BookingCount({
      bookingId:   bookingId   ? bookingId : null,
      packageId:   packageId   || null,
      packageName: packageName || null,
      paxCount:    paxCount    || 1,
      paymentType: paymentType || 'unknown',
      totalAmount: totalAmount || 0,
    });

    await count.save();

    console.log(`📋 Booking count recorded: ${packageName} (${paymentType})`);

    return res.status(201).json({
      status: 'ok',
      message: 'Booking count recorded',
    });
  } catch (err) {
    console.error('❌ Error recording booking count:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to record booking count',
      error: err.message,
    });
  }
});

// ===================================================================
// DELETE /api/page-views/booking-counts/reset
// Resets the View-to-Book Rate by wiping ALL BookingCount records.
// PageView records are NOT affected — page view stats stay intact.
// ===================================================================
router.delete('/booking-counts/reset', async (req, res) => {
  try {
    const result = await BookingCount.deleteMany({});

    console.log(`🔄 View-to-Book Rate reset: ${result.deletedCount} booking count(s) deleted`);

    return res.status(200).json({
      status: 'ok',
      message: `View-to-Book Rate reset. ${result.deletedCount} booking count record(s) cleared.`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('❌ Error resetting booking counts:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reset booking counts',
      error: err.message,
    });
  }
});

// ===================================================================
// GET /api/page-views/booking-counts
// Raw booking count list — optional ?packageName=xxx&limit=100
// ===================================================================
router.get('/booking-counts', async (req, res) => {
  try {
    const { packageName, limit = 100 } = req.query;
    const filter = packageName ? { packageName } : {};

    const counts = await BookingCount.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return res.status(200).json({
      status: 'ok',
      count: counts.length,
      data: counts,
    });
  } catch (err) {
    console.error('❌ Error fetching booking counts:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch booking counts',
      error: err.message,
    });
  }
});

module.exports = router;