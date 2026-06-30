// routes/tourBookingRoute.js
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const axios      = require('axios');
const TourBooking = require('../models/tourBooking');
const Package     = require('../models/package');
const Tour        = require('../models/tour');
const authMiddleware = require('../middleware/auth');
const { sendTourBookingToGHL } = require('../utils/ghlService');

// ── Multer setup ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file,  cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// ── Helper ────────────────────────────────────────────────────────────────────
function parseBookingData(req) {
  if (req.body.bookingData) {
    try   { return JSON.parse(req.body.bookingData); }
    catch { return req.body; }
  }
  return req.body;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tour-bookings
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', upload.any(), async (req, res) => {
  console.log('\n🟡 [POST /api/tour-bookings] New booking request received');
  console.log('   Content-Type:', req.headers['content-type']);
  console.log('   Raw body keys:', Object.keys(req.body));
  console.log('   Files received:', req.files?.length || 0);

  try {
    const data = parseBookingData(req);
    console.log('   Parsed data:', JSON.stringify(data, null, 2));

    if (typeof data.passengers === 'string') {
      try { data.passengers = JSON.parse(data.passengers); } catch (_) {}
    }
    if (typeof data.flightDetails === 'string') {
      try { data.flightDetails = JSON.parse(data.flightDetails); } catch (_) {}
    }
    if (typeof data.pax === 'string') {
      try { data.pax = JSON.parse(data.pax); } catch (_) {}
    }

    console.log('   tourId:', data.tourId || 'NOT PROVIDED (walk-in)');
    console.log('   packageId:', data.packageId || 'NOT PROVIDED (walk-in)');
    console.log('   packageName:', data.packageName || 'MISSING ⚠️');

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const match = file.fieldname.match(/^(idFile|passportFile)_(\d+)$/);
        if (match) {
          const field = match[1];
          const idx   = parseInt(match[2], 10);
          if (!data.passengers) data.passengers = [];
          if (!data.passengers[idx]) data.passengers[idx] = {};
          data.passengers[idx][field] = file.filename;
        }
      });
    }

    if (!data.packageName) {
      console.log('   ❌ Validation failed: packageName is missing');
      return res.status(400).json({ success: false, message: 'packageName is required.' });
    }

    const isManual = !data.tourId && !data.packageId;
    const bookingSource = data.bookingSource || (isManual ? 'walkin' : 'online');
    console.log(`   Booking type: ${bookingSource} | isManual: ${isManual}`);

    // ===== BOUNDARY CHECKS — Issue #2: Negative Value Injection =====
    const _paxT = data.pax || {};
    const tourTotalPax =
      (Number(_paxT.adult) || 0) +
      (Number(_paxT.children) || 0) +
      (Number(_paxT.infants) || 0);

    if (tourTotalPax <= 0) {
      return res.status(400).json({ success: false, message: 'Booking must include at least one passenger.' });
    }

    if (data.paymentType === 'partial') {
      const _tia = parseFloat(data.initialPaymentAmount);
      if (!_tia || _tia <= 0) {
        return res.status(400).json({ success: false, message: 'initialPaymentAmount must be greater than zero.' });
      }
    }

    // ===== SERVER-SIDE PRICE COMPUTATION — Issue #1: Price Manipulation =====
    // Tour listings live in the `Tour` collection (served via /api/tours/all),
    // so resolve the catalog price from the Tour model — NOT the Package model
    // (different collection). The frontend sends the Tour _id as both tourId and
    // packageId, so accept either.
    const catalogTourId = data.tourId || data.packageId;
    if (catalogTourId) {
      const pkg = await Tour.findById(catalogTourId);
      if (!pkg) {
        return res.status(400).json({ success: false, message: 'Tour not found.' });
      }

      let serverPerPaxPrice;
      if (tourTotalPax === 1 && pkg.soloPaxPrice != null) {
        serverPerPaxPrice = pkg.soloPaxPrice;
      } else if (tourTotalPax > 1 && pkg.multiplePaxPrice != null) {
        serverPerPaxPrice = pkg.multiplePaxPrice;
      } else {
        serverPerPaxPrice = pkg.price;
      }

      const serverPackageTotal = serverPerPaxPrice * tourTotalPax;
      const discountAmount     = Math.max(0, parseFloat(data.discountAmount) || 0);
      const airfareTotal       = Math.max(0, parseFloat(data.airfareTotal) || 0);
      const computedTotal      = serverPackageTotal + airfareTotal - discountAmount;

      if (computedTotal <= 0) {
        return res.status(400).json({ success: false, message: 'Computed booking total must be greater than zero.' });
      }

      data.sellerPrice          = pkg.sellerPrice;
      data.markup               = pkg.markup;
      data.price                = serverPerPaxPrice;
      data.destination          = pkg.destination || data.destination || '';
      data.category             = pkg.category    || data.category    || '';
      data.packagePrice         = serverPerPaxPrice;
      data.originalPackagePrice = serverPerPaxPrice;
      data.packageTotal         = serverPackageTotal;
      data.finalPackageTotal    = serverPackageTotal - discountAmount;
      data.airfareTotal         = airfareTotal;
      data.discountAmount       = discountAmount;
      data.totalAmount          = computedTotal;

      if (data.paymentType === 'partial') {
        const _tia = parseFloat(data.initialPaymentAmount);
        if (_tia >= computedTotal) {
          return res.status(400).json({ success: false, message: 'initialPaymentAmount must be less than totalAmount for partial payment.' });
        }
        data.remainingBalance = computedTotal - _tia;
      } else {
        data.initialPaymentAmount = computedTotal;
        data.remainingBalance     = 0;
      }

      console.log(`   ✅ Server-computed price — perPax: ${serverPerPaxPrice}, total: ${computedTotal}`);
    } else {
      // Walk-in — admin-supplied total; enforce non-negative boundary.
      const clientTotal = parseFloat(data.totalAmount);
      if (!clientTotal || clientTotal <= 0) {
        return res.status(400).json({ success: false, message: 'totalAmount must be greater than zero.' });
      }
      if (data.paymentType === 'partial') {
        const _tia = parseFloat(data.initialPaymentAmount);
        if (!_tia || _tia <= 0 || _tia >= clientTotal) {
          return res.status(400).json({ success: false, message: 'initialPaymentAmount must be between zero and totalAmount.' });
        }
        data.remainingBalance = clientTotal - _tia;
      }
    }

    const tourBooking = new TourBooking({
      tourId:          data.tourId    || null,
      packageId:       data.packageId || null,
      packageName:     data.packageName,
      bookingType:     'tour',
      destination:     data.destination || '',
      category:        data.category    || '',
      isManual,
      bookingSource,
      startDate:       data.startDate,
      endDate:         data.endDate,
      duration:        data.duration,
      pax:             data.pax || { adult: 1, children: 0, infants: 0 },
      fullName:        data.fullName,
      email:           data.email,
      message:         data.message || '',
      primaryContact:  data.primaryContact || null,
      packagePrice:    data.packagePrice       || 0,
      packageTotal:    data.packageTotal       || 0,
      discountAmount:  data.discountAmount     || 0,
      finalPackageTotal: data.finalPackageTotal || 0,
      airfareTotal:    data.airfareTotal       || 0,
      totalAmount:     data.totalAmount        || 0,
      sellerPrice:     data.sellerPrice        || 0,
      markup:          data.markup             || 0,
      price:           data.price              || data.packagePrice || 0,
      originalPackagePrice: data.originalPackagePrice || 0,
      appliedMarkup:   data.appliedMarkup      || 0,
      paymentType:     data.paymentType        || 'full',
      initialPaymentAmount: data.initialPaymentAmount || data.totalAmount || 0,
      remainingBalance: data.remainingBalance  || 0,
      promoCode:       data.promoCode          || null,
      promoId:         data.promoId            || null,
      includesAirfare: data.includesAirfare    || false,
      flightDetails:   data.flightDetails      || null,
      passengers:      data.passengers         || [],
      timerExpiredAtBooking: data.timerExpiredAtBooking || false,
      priceType:       data.priceType          || 'discounted',
      isCustomized:    data.isCustomized       || false,
      customizedInclusions: data.customizedInclusions || [],
      createdByType:   data.createdByType      || 'user',
      createdByEmail:  data.createdByEmail     || null,
      status: 'pending',
    });

    console.log('   Saving tour booking to DB...');
    await tourBooking.save();
    console.log(`   ✅ Saved! ID: ${tourBooking._id} | Package: ${tourBooking.packageName} | Source: ${bookingSource}`);

    // Fire the booking automation webhook — fire-and-forget, never blocks the response
    sendTourBookingToGHL(tourBooking).catch((err) =>
      console.error('⚠️ GHL tour booking webhook failed (non-fatal):', err.message)
    );

    res.status(201).json({
      success:   true,
      message:   'Tour booking created successfully.',
      bookingId: tourBooking._id,
      booking:   tourBooking,
    });

  } catch (err) {
    console.error('   ❌ Tour booking creation error:', err.name, err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      console.error('   Validation details:', messages);
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tour-bookings
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  console.log('\n🔵 [GET /api/tour-bookings] Fetching all tour bookings');
  console.log('   Query params:', req.query);
  try {
    const { status, email, tourId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (email)  filter.email  = { $regex: email, $options: 'i' };
    if (tourId) filter.tourId = tourId;

    console.log('   Filter:', JSON.stringify(filter));

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await TourBooking.countDocuments(filter);
    const bookings = await TourBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    console.log(`   ✅ Found ${bookings.length} bookings (total: ${total})`);

    res.status(200).json({
      success: true,
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / parseInt(limit)),
      data:    bookings,
    });
  } catch (err) {
    console.error('   ❌ Fetch tour bookings error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tour-bookings/archived
// ⚠️ MUST be defined BEFORE /:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/archived', authMiddleware, async (req, res) => {
  console.log('\n🔵 [GET /api/tour-bookings/archived] Fetching archived bookings');
  try {
    const archivedBookings = await TourBooking.find({ isArchive: 'Yes' })
      .sort({ archivedAt: -1 });

    console.log(`   ✅ Found ${archivedBookings.length} archived bookings`);
    res.status(200).json({
      success: true,
      count: archivedBookings.length,
      data: archivedBookings,
    });
  } catch (err) {
    console.error('   ❌ Error fetching archived tour bookings:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/tour-bookings/archive/:id
// ⚠️ MUST be defined BEFORE /:id to avoid "archive" being treated as an ObjectId
// ─────────────────────────────────────────────────────────────────────────────
router.put('/archive/:id', authMiddleware, async (req, res) => {
  console.log(`\n🟠 [PUT /api/tour-bookings/archive/${req.params.id}] Archiving booking`);
  try {
    const booking = await TourBooking.findByIdAndUpdate(
      req.params.id,
      { isArchive: 'Yes', archivedAt: new Date() },
      { new: true }
    );

    if (!booking) {
      console.log('   ❌ Booking not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Tour booking not found' });
    }

    console.log(`   ✅ Archived: ${booking._id}`);
    res.status(200).json({
      success: true,
      message: 'Tour booking moved to archive successfully',
      data: booking,
    });
  } catch (err) {
    console.error('   ❌ Error archiving tour booking:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/tour-bookings/restore/:id
// ⚠️ MUST be defined BEFORE /:id
// ─────────────────────────────────────────────────────────────────────────────
router.put('/restore/:id', authMiddleware, async (req, res) => {
  console.log(`\n🟠 [PUT /api/tour-bookings/restore/${req.params.id}] Restoring booking`);
  try {
    const booking = await TourBooking.findByIdAndUpdate(
      req.params.id,
      { isArchive: 'No', archivedAt: null },
      { new: true }
    );

    if (!booking) {
      console.log('   ❌ Booking not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Tour booking not found' });
    }

    console.log(`   ✅ Restored: ${booking._id}`);
    res.status(200).json({
      success: true,
      message: 'Tour booking restored successfully',
      data: booking,
    });
  } catch (err) {
    console.error('   ❌ Error restoring tour booking:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tour-bookings/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  console.log(`\n🔵 [GET /api/tour-bookings/${req.params.id}] Fetching single booking`);
  try {
    const booking = await TourBooking.findById(req.params.id).select('-__v');
    if (!booking) {
      console.log('   ❌ Not found');
      return res.status(404).json({ success: false, message: 'Tour booking not found.' });
    }
    console.log(`   ✅ Found: ${booking.packageName} | status: ${booking.status}`);
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    console.error('   ❌ Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tour-bookings/:id/status
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', authMiddleware, async (req, res) => {
  console.log(`\n🟡 [PATCH /api/tour-bookings/${req.params.id}/status] Status update`);
  console.log('   Requested status:', req.body.status);
  try {
    const { status } = req.body;
    const allowed    = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      console.log('   ❌ Invalid status:', status);
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const booking = await TourBooking.findById(req.params.id);
    if (!booking) {
      console.log('   ❌ Booking not found');
      return res.status(404).json({ success: false, message: 'Tour booking not found.' });
    }

    const prev = booking.status;
    booking.status    = status;
    booking.updatedAt = new Date();
    if (status === 'confirmed' && !booking.paidAt) booking.paidAt = new Date();
    if (status === 'cancelled') booking.cancelledAt = new Date();

    await booking.save();
    console.log(`   ✅ Status updated: ${prev} → ${status}`);
    res.status(200).json({ success: true, message: `Booking ${status}.`, data: booking });
  } catch (err) {
    console.error('   ❌ Status update error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tour-bookings/:id/payment
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/payment', authMiddleware, async (req, res) => {
  console.log(`\n🟡 [PATCH /api/tour-bookings/${req.params.id}/payment] Payment update`);
  console.log('   Payload:', req.body);
  try {
    const { paymentStatus, paymentIntentId, checkoutUrl, paidAt } = req.body;

    const booking = await TourBooking.findById(req.params.id);
    if (!booking) {
      console.log('   ❌ Booking not found');
      return res.status(404).json({ success: false, message: 'Tour booking not found.' });
    }

    if (paymentStatus)   booking.paymentStatus   = paymentStatus;
    if (paymentIntentId) booking.paymentIntentId  = paymentIntentId;
    if (checkoutUrl)     booking.checkoutUrl      = checkoutUrl;
    if (paidAt)          booking.paidAt           = new Date(paidAt);
    booking.updatedAt = new Date();

    await booking.save();
    console.log(`   ✅ Payment info updated for booking: ${booking._id}`);
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    console.error('   ❌ Payment update error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tour-bookings/:id  (admin full edit — from EditTourBooking)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', authMiddleware, async (req, res) => {
  console.log(`\n🟡 [PATCH /api/tour-bookings/${req.params.id}] Full booking update`);
  console.log('   Payload keys:', Object.keys(req.body));
  try {
    const booking = await TourBooking.findById(req.params.id);
    if (!booking) {
      console.log('   ❌ Booking not found');
      return res.status(404).json({ success: false, message: 'Tour booking not found.' });
    }

    const d = req.body;

    // ── Tour reference ────────────────────────────────────────────────
    if (d.packageName   !== undefined) booking.packageName   = d.packageName;
    if (d.destination   !== undefined) booking.destination   = d.destination;
    if (d.duration      !== undefined) booking.duration      = d.duration;
    if (d.bookingSource !== undefined) booking.bookingSource = d.bookingSource;
    if (d.createdByType !== undefined) booking.createdByType = d.createdByType;

    // ── Dates ─────────────────────────────────────────────────────────
    if (d.startDate !== undefined) booking.startDate = d.startDate || null;
    if (d.endDate   !== undefined) booking.endDate   = d.endDate   || null;

    // ── PAX ───────────────────────────────────────────────────────────
    if (d.pax !== undefined) {
      booking.pax = {
        adult:    d.pax.adult    ?? booking.pax?.adult    ?? 1,
        children: d.pax.children ?? booking.pax?.children ?? 0,
        infants:  d.pax.infants  ?? booking.pax?.infants  ?? 0,
      };
    }

    // ── Contact ───────────────────────────────────────────────────────
    if (d.fullName !== undefined) booking.fullName = d.fullName;
    if (d.email    !== undefined) booking.email    = d.email;
    if (d.message  !== undefined) booking.message  = d.message;

    // ── Pricing ───────────────────────────────────────────────────────
    if (d.packagePrice   !== undefined) booking.packagePrice   = d.packagePrice;
    if (d.discountAmount !== undefined) booking.discountAmount = d.discountAmount;
    if (d.airfareTotal   !== undefined) booking.airfareTotal   = d.airfareTotal;
    if (d.totalAmount    !== undefined) booking.totalAmount    = d.totalAmount;
    if (d.sellerPrice    !== undefined) booking.sellerPrice    = d.sellerPrice;
    if (d.markup         !== undefined) booking.markup         = d.markup;

    // ── Airfare ───────────────────────────────────────────────────────
    if (d.includesAirfare !== undefined) booking.includesAirfare = d.includesAirfare;

    // ── Payment ───────────────────────────────────────────────────────
    if (d.paymentType          !== undefined) booking.paymentType          = d.paymentType;
    if (d.initialPaymentAmount !== undefined) booking.initialPaymentAmount = d.initialPaymentAmount;
    if (d.remainingBalance     !== undefined) booking.remainingBalance     = d.remainingBalance;
    if (d.paymentStatus        !== undefined) booking.paymentStatus        = d.paymentStatus;

    // ── Status ────────────────────────────────────────────────────────
    if (d.status !== undefined) {
      const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!allowed.includes(d.status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
      }
      if (d.status === 'cancelled' && booking.status !== 'cancelled') booking.cancelledAt = new Date();
      booking.status = d.status;
    }

    booking.updatedAt = new Date();

    await booking.save();
    console.log(`   ✅ Booking updated: ${booking._id} | Package: ${booking.packageName}`);
    res.status(200).json({ success: true, message: 'Tour booking updated successfully.', data: booking });
  } catch (err) {
    console.error('   ❌ Full update error:', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tour-bookings/:id  (admin only — hard delete)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  console.log(`\n🔴 [DELETE /api/tour-bookings/${req.params.id}] Deleting booking`);
  try {
    const booking = await TourBooking.findByIdAndDelete(req.params.id);
    if (!booking) {
      console.log('   ❌ Booking not found');
      return res.status(404).json({ success: false, message: 'Tour booking not found.' });
    }
    console.log(`   ✅ Deleted: ${req.params.id}`);
    res.status(200).json({ success: true, message: 'Tour booking deleted.' });
  } catch (err) {
    console.error('   ❌ Delete error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// POST /abandoned — ABANDONED BOOKING + GHL WEBHOOK (Tour version)
// ============================================
router.post('/abandoned', async (req, res) => {
  try {
    const {
      existingBookingId,
      checkoutUrl,
      email,
      fullName,
      packageName,
      totalAmount,
      startDate,
      endDate,
      pax,
      paymentType,
    } = req.body;

    if (!existingBookingId) {
      return res.status(400).json({ success: false, message: 'existingBookingId is required.' });
    }

    const targetBooking = await TourBooking.findByIdAndUpdate(
      existingBookingId,
      { $set: { abandonedAt: new Date(), followUpCount: 0, lastFollowUpAt: null } },
      { new: true }
    );

    if (!targetBooking) {
      return res.status(404).json({ success: false, message: 'Tour booking not found.' });
    }

    const GHL_ABANDONED_WEBHOOK_URL = process.env.GHL_ABANDONED_BOOKING_WEBHOOK_URL;

    if (GHL_ABANDONED_WEBHOOK_URL) {
      const nameParts = (fullName || targetBooking.fullName || "").trim().split(" ");
      const firstName = nameParts[0] || "Guest";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";

      const ghlPayload = {
        type: 'ABANDONED_BOOKING',
        event: 'booking_form_submitted',
        bookingId: targetBooking._id.toString(),
        first_name: firstName,
        last_name: lastName,
        email: email || targetBooking.email || "",
        phone: targetBooking.phone || "",
        packageName: packageName || targetBooking.packageName,
        totalAmount: totalAmount || targetBooking.totalAmount,
        startDate: startDate || targetBooking.startDate,
        endDate: endDate || targetBooking.endDate,
        pax: pax || targetBooking.pax?.adult || 1,
        paymentLink: checkoutUrl || '',
        paymentType: paymentType || (targetBooking.paymentType === 'partial' ? 'Partial Payment' : 'Full Payment'),
        timestamp: new Date().toISOString(),
        source: 'WanderWave Tour Booking Form',
      };

      await axios.post(GHL_ABANDONED_WEBHOOK_URL, ghlPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }).catch(err => console.error('⚠️ GHL abandoned webhook failed:', err.message));

      console.log('✅ GHL abandoned webhook fired for tour booking:', targetBooking._id);
    }

    res.status(200).json({
      success: true,
      message: 'Tour abandoned booking tracked and GHL notified.',
      bookingId: targetBooking._id,
    });

  } catch (error) {
    console.error('❌ Tour abandoned booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;