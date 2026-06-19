// routes/customizedBookingRoute.js
// ─────────────────────────────────────────────────────────────────────────────
// REST endpoints for the CustomizedBooking model.
//
// Mount in app.js:
//   const customizedBookingRoute = require('./routes/customizedBookingRoute');
//   app.use('/api/customized-bookings', customizedBookingRoute);
// ─────────────────────────────────────────────────────────────────────────────
const express          = require('express');
const router           = express.Router();
const CustomizedBooking = require('../models/Customizedbooking'); // ✅ FIXED: was './models/...' (wrong path for a file inside routes/)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const parseNum = (v, fallback = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
};

// Build & validate the services payload sent from the frontend
function buildServices(body) {
  const tours     = Array.isArray(body.tours)     ? body.tours     : [];
  const transfers = Array.isArray(body.transfers) ? body.transfers : [];

  const builtTours = tours.map(t => {
    const price    = parseNum(t.price);
    const paxCount = parseInt(t.paxCount) || 1;
    return {
      tourId:        t.tourId        || null,
      title:         t.title         || '',
      destination:   t.destination   || '',
      duration:      t.duration      || '',
      category:      t.category      || '',
      imageUrl:      t.imageUrl      || null,
      price,
      sellerPrice:   parseNum(t.sellerPrice),
      paxCount,
      subtotal:      price * paxCount,
      scheduledDate: t.scheduledDate || '',
    };
  });

  const builtTransfers = transfers.map(tr => {
    const selectedPrice  = parseNum(tr.selectedPrice);
    const passengerCount = parseInt(tr.passengerCount) || 1;
    return {
      transferId:      tr.transferId      || null,
      title:           tr.title           || '',
      category:        tr.category        || '',
      imageUrl:        tr.imageUrl        || null,
      transferType:    tr.transferType    === 'roundtrip' ? 'roundtrip' : 'oneway',
      oneWayPrice:     parseNum(tr.oneWayPrice),
      roundtripPrice:  parseNum(tr.roundtripPrice),
      selectedPrice,
      subtotal:        selectedPrice * passengerCount,
      travelDate:      tr.travelDate      || '',
      returnDate:      tr.returnDate      || '',
      arrivalTime:     tr.arrivalTime     || '',
      departureTime:   tr.departureTime   || '',
      pickupLocation:  tr.pickupLocation  || '',
      dropoffLocation: tr.dropoffLocation || '',
      message:         tr.message         || '',
      passengerCount,
    };
  });

  return { builtTours, builtTransfers };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/customized-bookings
// Create a new customized booking (submitted from Step 4 of the wizard).
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  console.log('\n🟡 [POST /api/customized-bookings] New customized booking');

  try {
    // Parse if the body was sent as a JSON string (FormData fallback)
    let body = req.body;
    if (typeof body.bookingData === 'string') {
      try { body = JSON.parse(body.bookingData); } catch (_) {}
    }

    // ── Required field validation ───────────────────────────────────────────
    if (!body.destination) return res.status(400).json({ success: false, message: 'destination is required.' });
    if (!body.fullName)    return res.status(400).json({ success: false, message: 'fullName is required.' });
    if (!body.email)       return res.status(400).json({ success: false, message: 'email is required.' });

    const { builtTours, builtTransfers } = buildServices(body);

    // Boundary guard: reject negative or zero prices on individual items
    for (const t of builtTours) {
      if (t.price < 0 || t.paxCount <= 0) {
        return res.status(400).json({ success: false, message: 'Tour price and paxCount must be positive values.' });
      }
    }
    for (const tr of builtTransfers) {
      if (tr.selectedPrice < 0 || tr.passengerCount <= 0) {
        return res.status(400).json({ success: false, message: 'Transfer price and passengerCount must be positive values.' });
      }
    }

    const toursTotal     = builtTours.reduce((s, t) => s + t.subtotal, 0);
    const transfersTotal = builtTransfers.reduce((s, t) => s + t.subtotal, 0);
    // Always compute totalAmount server-side — never trust the client-provided value
    const totalAmount    = toursTotal + transfersTotal;

    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Booking must have at least one service with a valid price.' });
    }

    const paymentType = body.paymentType === 'partial' ? 'partial' : 'full';
    const initialPaymentAmount = paymentType === 'partial'
      ? Math.ceil(totalAmount * 0.5)
      : totalAmount;

    if (initialPaymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'initialPaymentAmount must be a positive value.' });
    }

    const remainingBalance = paymentType === 'partial'
      ? totalAmount - initialPaymentAmount
      : 0;

    const booking = new CustomizedBooking({
      destination: body.destination,
      fullName:    body.fullName,
      email:       body.email,
      phone:       body.phone       || '',
      travelDate:  body.travelDate  || '',
      returnDate:  body.returnDate  || '',
      paxCount:    parseInt(body.paxCount) || 1,
      message:     body.message     || '',

      tours:     builtTours,
      transfers: builtTransfers,

      toursTotal,
      transfersTotal,
      totalAmount,

      currency:             body.currency || 'PHP',
      paymentType,
      initialPaymentAmount,
      remainingBalance,

      promoCode: body.promoCode || null,
      notes:     body.notes     || '',
      createdByType: body.createdByType || 'customer',
    });

    await booking.save();
    console.log(`✅ Customized booking saved: ${booking._id} | ref: ${booking.referenceNumber}`);

    return res.status(201).json({
      success:         true,
      message:         'Customized booking created successfully.',
      bookingId:       booking._id,
      referenceNumber: booking.referenceNumber,
      data:            booking,
    });

  } catch (err) {
    console.error('❌ Customized booking creation error:', err);
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${msgs}` });
    }
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/customized-bookings
// List all customized bookings (admin).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { email, status, destination, page = 1, limit = 50 } = req.query;
    const filter = { isArchive: { $ne: 'Yes' } };
    if (email)       filter.email       = { $regex: email, $options: 'i' };
    if (status)      filter.status      = status;
    if (destination) filter.destination = { $regex: destination, $options: 'i' };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await CustomizedBooking.countDocuments(filter);
    const data  = await CustomizedBooking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    return res.status(200).json({
      success: true,
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / parseInt(limit)),
      data,
    });
  } catch (err) {
    console.error('❌ Fetch customized bookings error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/customized-bookings/archived
// ✅ NEW: List all archived customized bookings (isArchive === 'Yes').
// ─────────────────────────────────────────────────────────────────────────────
router.get('/archived', async (req, res) => {
  try {
    const data = await CustomizedBooking.find({ isArchive: 'Yes' })
      .sort({ updatedAt: -1 })
      .select('-__v');

    return res.status(200).json({
      success: true,
      total: data.length,
      data,
    });
  } catch (err) {
    console.error('❌ Fetch archived customized bookings error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/customized-bookings/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const booking = await CustomizedBooking.findById(req.params.id).select('-__v');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    return res.status(200).json({ success: true, data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/customized-bookings/:id
// Full update — used by EditCustomBooking admin page.
// Accepts all top-level fields plus tours[] and transfers[] arrays.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  console.log(`\n🟡 [PATCH /api/customized-bookings/${req.params.id}] Updating booking`);

  try {
    const booking = await CustomizedBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const body = req.body;

    // ── Basic Info ──────────────────────────────────────────────────────────
    if (body.destination !== undefined) booking.destination = body.destination;
    if (body.fullName    !== undefined) booking.fullName    = body.fullName;
    if (body.email       !== undefined) booking.email       = body.email;
    if (body.phone       !== undefined) booking.phone       = body.phone;
    if (body.travelDate  !== undefined) booking.travelDate  = body.travelDate;
    if (body.returnDate  !== undefined) booking.returnDate  = body.returnDate;
    if (body.paxCount    !== undefined) booking.paxCount    = parseInt(body.paxCount) || 1;
    if (body.message     !== undefined) booking.message     = body.message;
    if (body.notes       !== undefined) booking.notes       = body.notes;
    if (body.promoCode   !== undefined) booking.promoCode   = body.promoCode || null;

    // ── Services ────────────────────────────────────────────────────────────
    if (Array.isArray(body.tours)) {
      const { builtTours } = buildServices({ tours: body.tours, transfers: [] });
      booking.tours = builtTours;
    }
    if (Array.isArray(body.transfers)) {
      const { builtTransfers } = buildServices({ tours: [], transfers: body.transfers });
      booking.transfers = builtTransfers;
    }

    // ── Pricing ─────────────────────────────────────────────────────────────
    if (body.toursTotal     !== undefined) booking.toursTotal     = parseNum(body.toursTotal);
    if (body.transfersTotal !== undefined) booking.transfersTotal = parseNum(body.transfersTotal);
    if (body.totalAmount    !== undefined) booking.totalAmount    = parseNum(body.totalAmount);

    // ── Payment ─────────────────────────────────────────────────────────────
    const allowedPaymentStatus = ['pending', 'paid', 'partial', 'failed', 'refunded'];
    const allowedPaymentType   = ['full', 'partial'];

    if (body.currency             !== undefined) booking.currency             = body.currency;
    if (body.paymentType          !== undefined && allowedPaymentType.includes(body.paymentType))
      booking.paymentType = body.paymentType;
    if (body.initialPaymentAmount !== undefined) booking.initialPaymentAmount = parseNum(body.initialPaymentAmount);
    if (body.remainingBalance     !== undefined) booking.remainingBalance     = parseNum(body.remainingBalance);
    if (body.paymentStatus        !== undefined && allowedPaymentStatus.includes(body.paymentStatus))
      booking.paymentStatus = body.paymentStatus;

    // ── Status ───────────────────────────────────────────────────────────────
    const allowedStatus = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (body.status !== undefined && allowedStatus.includes(body.status))
      booking.status = body.status;

    await booking.save();
    console.log(`✅ Customized booking updated: ${booking._id}`);
    return res.status(200).json({ success: true, message: 'Booking updated successfully.', data: booking });

  } catch (err) {
    console.error('❌ Update customized booking error:', err);
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${msgs}` });
    }
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/customized-bookings/:id/status
// Update booking status and/or payment status.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const booking = await CustomizedBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const allowedStatus  = ['pending', 'confirmed', 'cancelled', 'completed'];
    const allowedPayment = ['pending', 'paid', 'partial', 'failed', 'refunded'];

    if (status        && !allowedStatus.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    if (paymentStatus && !allowedPayment.includes(paymentStatus))
      return res.status(400).json({ success: false, message: `Invalid paymentStatus: ${paymentStatus}` });

    if (status)        booking.status        = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    await booking.save();
    console.log(`✅ Customized booking ${booking._id}: status → ${booking.status}`);
    return res.status(200).json({ success: true, message: 'Status updated.', data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/customized-bookings/:id/archive
// Soft-delete (archive) a booking.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/archive', async (req, res) => {
  try {
    const booking = await CustomizedBooking.findByIdAndUpdate(
      req.params.id,
      { isArchive: 'Yes' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    return res.status(200).json({ success: true, message: 'Booking archived.', data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/customized-bookings/:id/unarchive
// Restore a previously archived booking back to the active list.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/unarchive', async (req, res) => {
  try {
    const booking = await CustomizedBooking.findByIdAndUpdate(
      req.params.id,
      { isArchive: 'No' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    console.log(`✅ Customized booking ${booking._id} unarchived.`);
    return res.status(200).json({ success: true, message: 'Booking unarchived.', data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/customized-bookings/:id
// Hard delete (admin only).
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const booking = await CustomizedBooking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    console.log(`🗑️ Customized booking deleted: ${req.params.id}`);
    return res.status(200).json({ success: true, message: 'Booking deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;