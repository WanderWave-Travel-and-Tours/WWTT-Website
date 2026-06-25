const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PageView, BookingCount } = require('../models/PageView');
const Booking = require('../models/booking');
const auth = require('../middleware/auth');
const { telemetryLimiter } = require('../middleware/rateLimiters');

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
  return {
    visitorId: crypto.createHash('sha256').update(ip).digest('hex'),
    ipAddress: ip,
  };
}

// ===================================================================
// HELPER — determines the journey stage based on page/path/label.
// ===================================================================
function determineStage(page, path, label, packageId) {
  if (page === 'booking' || path?.includes('booking') || label?.toLowerCase().includes('book')) {
    return packageId ? 'consideration' : 'intent';
  }
  if (packageId || path?.includes('/package') || path?.includes('/tour')) {
    return 'consideration';
  }
  if (page === 'packages' || page === 'tours') {
    return 'interest';
  }
  if (page === 'flights' || page === 'services' || page === 'transfers') {
    return 'awareness';
  }
  return 'awareness';
}

// ===================================================================
// POST /api/page-views
// Records EVERY page visit as its own document — full history logging.
// Deduplication is at the SESSION level: same visitor + same page
// within the same session is counted only once (prevents rapid
// refresh spam), but a new session always creates a new record.
//
// Body: { page, path, label?, packageId?, packageName?,
//         visitorIp?, sessionId, email? }
// ===================================================================
router.post('/', telemetryLimiter, async (req, res) => {
  try {
    const { page, path, label, packageId, packageName, sessionId, email } = req.body;

    if (!page || !path) {
      return res.status(400).json({
        status: 'error',
        message: 'page and path are required',
      });
    }

    const validPages = ['packages', 'booking', 'flights', 'services', 'tours', 'transfers', 'tour-booking'];
    if (!validPages.includes(page)) {
      return res.status(400).json({
        status: 'error',
        message: `page must be one of: ${validPages.join(', ')}`,
      });
    }

    const { visitorId, ipAddress } = getVisitorId(req);

    // ── Session-level dedup ──────────────────────────────────────────
    // Same visitor + same page + same session → skip (prevents double-log
    // on React strict mode double-render or rapid revisit within same tab).
    // FIX: Return the existing viewId so the frontend can still send stop
    // signals (sendBeacon on tab close / visibilitychange).
    if (sessionId) {
      const existingInSession = await PageView.findOne({
        visitorId,
        page,
        sessionId,
      }).select('_id').lean();

      if (existingInSession) {
        console.log(`👁️  Session-duplicate skipped: [${page}] visitor already counted this session`);
        return res.status(200).json({
          status: 'ok',
          message: 'Already recorded in this session',
          unique: false,
          viewId: existingInSession._id.toString(),
        });
      }
    }

    // ── Clear stoppedHere on all previous records for this visitor ───
    // When they navigate to a new page, unmark the old "last page".
    // The new record will be unmarked by default (stoppedHere: false).
    await PageView.updateMany(
      { visitorId, stoppedHere: true },
      { $set: { stoppedHere: false } }
    );

    const stage = determineStage(page, path, label, packageId);

    const view = new PageView({
      page,
      path,
      label:       label       || '',
      packageId:   packageId   || null,
      packageName: packageName || null,
      visitorId,
      ipAddress,
      stage,
      sessionId:   sessionId   || null,
      email:       email       || null,
      stoppedHere: false,  // will be set true on tab close
    });

    await view.save();

    console.log(`📊 Page view recorded: [${page}] ${path} | Stage: ${stage} | Visitor: ${visitorId.slice(0, 8)}…`);

    return res.status(201).json({
      status: 'ok',
      message: 'Page view recorded',
      unique: true,
      viewId: view._id.toString(),
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
// PATCH /api/page-views/:id/stop
// Called from the frontend on beforeunload / visibilitychange (hidden).
// Marks the specific view record as the last page the visitor was on.
// Also records time spent on page if provided.
//
// Body: { timeOnPageSeconds? }
// ===================================================================
// sendBeacon (tab-close) uses POST; manual fetch fallback uses PATCH — accept both
router.route('/:id/stop').patch(telemetryLimiter, stopView).post(telemetryLimiter, stopView);
async function stopView(req, res) {
  try {
    const { id } = req.params;
    const { timeOnPageSeconds } = req.body;

    const update = {
      stoppedHere: true,
      stoppedAt:   new Date(),
    };

    if (typeof timeOnPageSeconds === 'number' && timeOnPageSeconds >= 0) {
      update.timeOnPageSeconds = Math.round(timeOnPageSeconds);
    }

    const view = await PageView.findByIdAndUpdate(id, { $set: update }, { new: true });

    if (!view) {
      return res.status(404).json({ status: 'error', message: 'View record not found' });
    }

    console.log(`🛑 Visitor stopped at [${view.page}] — ${view.path} | Time: ${update.timeOnPageSeconds ?? '?'}s`);

    return res.status(200).json({ status: 'ok', message: 'Stop recorded' });
  } catch (err) {
    console.error('❌ Error recording stop:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to record stop',
      error: err.message,
    });
  }
}

// ===================================================================
// PATCH /api/page-views/:id/resume
// Called when a visitor returns to the tab (visibilitychange → visible).
// Clears stoppedHere/stoppedAt so the visitor shows as active again.
// ===================================================================
// sendBeacon uses POST; fetch uses PATCH — accept both
router.route('/:id/resume').patch(telemetryLimiter, resumeView).post(telemetryLimiter, resumeView);
async function resumeView(req, res) {
  try {
    const { id } = req.params;

    const view = await PageView.findByIdAndUpdate(
      id,
      { $set: { stoppedHere: false, stoppedAt: null } },
      { new: true }
    );

    if (!view) {
      return res.status(404).json({ status: 'error', message: 'View record not found' });
    }

    console.log(`▶️  Visitor resumed at [${view.page}] — ${view.path}`);

    return res.status(200).json({ status: 'ok', message: 'Resume recorded' });
  } catch (err) {
    console.error('❌ Error recording resume:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to record resume',
      error: err.message,
    });
  }
}

// ===================================================================
// GET /api/page-views/stats
// Returns aggregated page view + booking count stats for the dashboard.
// recentViews now includes visitorId + email so VisitorJourney can
// group records into per-visitor histories.
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
          _id:       '$packageName',
          views:     { $sum: 1 },
          packageId: { $first: '$packageId' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id:       0,
          packageName: '$_id',
          packageId:   1,
          views:       1,
        },
      },
    ]);

    // ── Recent page views ────────────────────────────────────────────
    // NOW includes visitorId + email so VisitorJourney can group by
    // visitor and reconstruct each person's full page history.
    // stoppedHere / stoppedAt so the frontend can show "last page" badge.
    const recentViews = await PageView.find()
      .sort({ createdAt: -1 })
      .limit(5000)
      .select(
        'page path label packageName packageId createdAt stage ' +
        'visitorId email sessionId stoppedHere stoppedAt timeOnPageSeconds'
      )
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

    // ── Unique visitors per journey stage ────────────────────────────
    const stageStats = await PageView.aggregate([
      {
        $group: {
          _id:            '$stage',
          uniqueVisitors: { $addToSet: '$visitorId' },
        },
      },
      {
        $project: {
          stage:          '$_id',
          _id:            0,
          uniqueVisitors: { $size: '$uniqueVisitors' },
        },
      },
      { $sort: { uniqueVisitors: -1 } },
    ]);

    // ── Visitor journey summary ──────────────────────────────────────
    // Groups all views by visitorId so the dashboard can show a
    // "per visitor" breakdown: total pages, last page, highest stage.
    const visitorSummaries = await PageView.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id:         '$visitorId',
          email:       { $first: '$email' },
          totalPages:  { $sum: 1 },
          lastPage:    { $first: '$page' },
          lastPath:    { $first: '$path' },
          lastSeen:    { $first: '$createdAt' },
          firstSeen:   { $last:  '$createdAt' },
          stoppedHere: { $first: '$stoppedHere' },
          stoppedAt:   { $first: '$stoppedAt' },
          stages:      { $addToSet: '$stage' },
        },
      },
      { $sort: { lastSeen: -1 } },
      { $limit: 500 },
    ]);

    // ── Active session count ─────────────────────────────────────────
    // Counts distinct sessionIds with any page view activity in the last
    // 10 minutes. This correctly counts multiple open browser tabs from
    // the same device as separate active sessions (unlike visitorId which
    // is IP-based and collapses all tabs into one).
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeSessionIds = await PageView.distinct('sessionId', {
      createdAt:  { $gte: tenMinsAgo },
      sessionId:  { $ne: null },
      stoppedHere: false,
    });
    const activeSessionCount = activeSessionIds.length;

    // ── Booking data (ground truth from Booking model) ───────────────
    const activeBookingFilter = { isArchive: { $ne: 'Yes' } };

    const totalBookingCounts = await Booking.countDocuments(activeBookingFilter);

    const topBookedPackages = await Booking.aggregate([
      { $match: { ...activeBookingFilter, packageName: { $ne: null } } },
      {
        $group: {
          _id:          '$packageName',
          bookingCounts: { $sum: 1 },
          packageId:    { $first: '$packageId' },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { bookingCounts: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id:           0,
          packageName:   '$_id',
          packageId:     1,
          bookingCounts: 1,
          totalRevenue:  1,
        },
      },
    ]);

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
        recentViews,           // ← now has visitorId, email, stoppedHere, stoppedAt
        dailyBreakdown,
        stageStats,
        visitorSummaries,      // ← pre-aggregated per-visitor summary
        activeSessionCount,    // ← NEW: number of distinct sessions active in last 10 min
        // Booking count fields
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
// Protected: admin only (returns raw IP addresses and visitor data)
// ===================================================================
router.get('/', auth, async (req, res) => {
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
// GET /api/page-views/visitor/:visitorId
// Returns the FULL page history for a single visitor.
// Protected: admin only (returns full journey history per visitor)
// ===================================================================
router.get('/visitor/:visitorId', auth, async (req, res) => {
  try {
    const { visitorId } = req.params;

    const views = await PageView.find({ visitorId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: 'ok',
      count: views.length,
      data: views,
    });
  } catch (err) {
    console.error('❌ Error fetching visitor history:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch visitor history',
      error: err.message,
    });
  }
});

// ===================================================================
// POST /api/page-views/booking-count
// Records a confirmed booking from BookingFormModal.
// Body: { packageId?, packageName?, paxCount?, paymentType?, totalAmount? }
// ===================================================================
router.post('/booking-count', telemetryLimiter, async (req, res) => {
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
// Protected: admin only
// ===================================================================
router.delete('/booking-counts/reset', auth, async (req, res) => {
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