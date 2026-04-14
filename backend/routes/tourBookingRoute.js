// routes/tourBookingRoute.js
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const TourBooking = require('../models/tourBooking');

// ── Multer setup (same pattern as bookingRoute) ──────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file,  cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// ── Helper: parse bookingData from multipart form ────────────────────────────
function parseBookingData(req) {
  if (req.body.bookingData) {
    try   { return JSON.parse(req.body.bookingData); }
    catch { return req.body; }
  }
  return req.body;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tour-bookings
// Create a new tour booking (multipart/form-data so file uploads work)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', upload.any(), async (req, res) => {
  try {
    const data = parseBookingData(req);

    // Parse JSON strings that may arrive as strings
    if (typeof data.passengers === 'string') {
      try { data.passengers = JSON.parse(data.passengers); } catch (_) {}
    }
    if (typeof data.flightDetails === 'string') {
      try { data.flightDetails = JSON.parse(data.flightDetails); } catch (_) {}
    }
    if (typeof data.pax === 'string') {
      try { data.pax = JSON.parse(data.pax); } catch (_) {}
    }

    // Attach uploaded files to the correct passenger
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const match = file.fieldname.match(/^(idFile|passportFile)_(\d+)$/);
        if (match) {
          const field = match[1];          // 'idFile' or 'passportFile'
          const idx   = parseInt(match[2], 10);
          if (!data.passengers) data.passengers = [];
          if (!data.passengers[idx]) data.passengers[idx] = {};
          data.passengers[idx][field] = file.filename;
        }
      });
    }

    if (!data.tourId && !data.packageId) {
      return res.status(400).json({ success: false, message: 'tourId is required.' });
    }
    if (!data.packageName) {
      return res.status(400).json({ success: false, message: 'packageName (tour name) is required.' });
    }

    const tourBooking = new TourBooking({
      tourId:          data.tourId    || data.packageId,
      packageId:       data.packageId || data.tourId,
      packageName:     data.packageName,
      bookingType:     'tour',
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

    await tourBooking.save();

    console.log('✅ Tour booking created:', tourBooking._id, '|', tourBooking.packageName);

    res.status(201).json({
      success:   true,
      message:   'Tour booking created successfully.',
      bookingId: tourBooking._id,
      booking:   tourBooking,
    });

  } catch (err) {
    console.error('❌ Tour booking creation error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tour-bookings
// Get all tour bookings (admin use)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, email, tourId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (email)  filter.email  = { $regex: email, $options: 'i' };
    if (tourId) filter.tourId = tourId;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await TourBooking.countDocuments(filter);
    const bookings = await TourBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    res.status(200).json({
      success: true,
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / parseInt(limit)),
      data:    bookings,
    });
  } catch (err) {
    console.error('❌ Fetch tour bookings error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tour-bookings/archived
// Get all archived tour bookings
// ⚠️ IMPORTANT: This route MUST be defined BEFORE /:id to avoid Express
//    treating the string "archived" as a MongoDB ObjectId parameter.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/archived', async (req, res) => {
  try {
    const archivedBookings = await TourBooking.find({ isArchive: 'Yes' })
      .sort({ archivedAt: -1 });

    res.status(200).json({
      success: true,
      count: archivedBookings.length,
      data: archivedBookings,
    });
  } catch (err) {
    console.error('❌ Error fetching archived tour bookings:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tour-bookings/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const booking = await TourBooking.findById(req.params.id).select('-__v');
    if (!booking) return res.status(404).json({ success: false, message: 'Tour booking not found.' });
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tour-bookings/:id/status
// Update booking status (confirm / cancel / complete)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed    = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const booking = await TourBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Tour booking not found.' });

    const prev = booking.status;
    booking.status    = status;
    booking.updatedAt = new Date();
    if (status === 'confirmed' && !booking.paidAt) booking.paidAt = new Date();
    if (status === 'cancelled') booking.cancelledAt = new Date();

    await booking.save();
    console.log(`✅ Tour booking ${booking._id} status: ${prev} → ${status}`);
    res.status(200).json({ success: true, message: `Booking ${status}.`, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tour-bookings/:id/payment
// Update payment info (called by PayMongo webhook / payment flow)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus, paymentIntentId, checkoutUrl, paidAt } = req.body;

    const booking = await TourBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Tour booking not found.' });

    if (paymentStatus)   booking.paymentStatus   = paymentStatus;
    if (paymentIntentId) booking.paymentIntentId  = paymentIntentId;
    if (checkoutUrl)     booking.checkoutUrl      = checkoutUrl;
    if (paidAt)          booking.paidAt           = new Date(paidAt);
    booking.updatedAt = new Date();

    await booking.save();
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tour-bookings/:id  (admin only — hard delete)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const booking = await TourBooking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Tour booking not found.' });
    console.log('🗑️ Tour booking deleted:', req.params.id);
    res.status(200).json({ success: true, message: 'Tour booking deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ====================== ARCHIVE ROUTES FOR TOUR BOOKINGS ======================

// ARCHIVE A TOUR BOOKING
router.put('/archive/:id', async (req, res) => {
  try {
    const booking = await TourBooking.findByIdAndUpdate(
      req.params.id,
      {
        isArchive: 'Yes',
        archivedAt: new Date(),
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Tour booking not found' });
    }

    console.log(`📦 Tour booking archived: ${booking._id}`);
    res.status(200).json({
      success: true,
      message: 'Tour booking moved to archive successfully',
      data: booking,
    });
  } catch (err) {
    console.error('❌ Error archiving tour booking:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// RESTORE TOUR BOOKING FROM ARCHIVE
router.put('/restore/:id', async (req, res) => {
  try {
    const booking = await TourBooking.findByIdAndUpdate(
      req.params.id,
      {
        isArchive: 'No',
        archivedAt: null,
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Tour booking not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Tour booking restored successfully',
      data: booking,
    });
  } catch (err) {
    console.error('❌ Error restoring tour booking:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================================

module.exports = router;