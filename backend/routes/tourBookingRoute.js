// routes/tourBookingRoute.js
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const TourBooking = require('../models/tourBooking');

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

    const tourBooking = new TourBooking({
      tourId:          data.tourId    || null,
      packageId:       data.packageId || null,
      packageName:     data.packageName,
      bookingType:     'tour',
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
      status: 'pending',
    });

    console.log('   Saving tour booking to DB...');
    await tourBooking.save();
    console.log(`   ✅ Saved! ID: ${tourBooking._id} | Package: ${tourBooking.packageName} | Source: ${bookingSource}`);

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
router.get('/', async (req, res) => {
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
router.get('/archived', async (req, res) => {
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
router.put('/archive/:id', async (req, res) => {
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
router.put('/restore/:id', async (req, res) => {
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
router.patch('/:id/status', async (req, res) => {
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
router.patch('/:id/payment', async (req, res) => {
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
// DELETE /api/tour-bookings/:id  (admin only — hard delete)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
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

module.exports = router;