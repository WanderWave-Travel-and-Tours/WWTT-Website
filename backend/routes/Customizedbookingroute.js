// routes/customizedBookingRoute.js
// ─────────────────────────────────────────────────────────────────────────────
// REST endpoints for the CustomizedBooking model.
//
// Mount in app.js:
//   const customizedBookingRoute = require('./routes/customizedBookingRoute');
//   app.use('/api/customized-bookings', customizedBookingRoute);
// ─────────────────────────────────────────────────────────────────────────────
const express           = require('express');
const router            = express.Router();
const { Mutex }         = require('async-mutex');
const CustomizedBooking = require('../models/Customizedbooking');
const Tour              = require('../models/tour');
const Transfer          = require('../models/transfer');
const authMiddleware    = require('../middleware/auth');
const verifyAdminOrUser = require('../middleware/verifyAdminOrUser');
const { sendCustomBookingToGHL } = require('../utils/ghlService');
const { validatePrimaryPassengerAge } = require('../utils/ageUtils');
const { validateEmail, validatePhone, validateNotPastDate } = require('../utils/bookingValidation');

// ─────────────────────────────────────────────────────────────────────────────
// Per-email booking lock — prevents concurrent duplicate submissions from the
// same requester from both passing validation before either write commits.
// ─────────────────────────────────────────────────────────────────────────────
const bookingMutexes = new Map();

function getBookingMutex(key) {
  if (!bookingMutexes.has(key)) {
    bookingMutexes.set(key, new Mutex());
  }
  return bookingMutexes.get(key);
}

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

// 🔐 SECURITY: Catalog-backed builder for CUSTOMER submissions.
// buildServices() trusts the client-supplied per-item price, which lets an attacker
// send { tourId, price: 1, paxCount: 1 } and create a real ₱1 booking (the top-level
// totalAmount is recomputed, but it sums these poisoned subtotals). This version
// resolves every price from the Tour / Transfer catalog using the item id and
// discards whatever price the client sent. Each item MUST carry a valid id.
//
// Returns { builtTours, builtTransfers } on success, or { error } with a message.
async function buildServicesSecure(body) {
  const tours     = Array.isArray(body.tours)     ? body.tours     : [];
  const transfers = Array.isArray(body.transfers) ? body.transfers : [];

  const builtTours = [];
  for (const t of tours) {
    if (!t.tourId) {
      return { error: 'Each tour must reference a valid tourId.' };
    }
    const dbTour = await Tour.findById(t.tourId).lean();
    if (!dbTour) {
      return { error: `Tour not found: ${t.tourId}` };
    }

    const paxCount = parseInt(t.paxCount) || 1;
    if (paxCount <= 0) {
      return { error: 'Tour paxCount must be a positive value.' };
    }

    // Authoritative price straight from the catalog — client price is ignored.
    const price = parseNum(dbTour.price);
    builtTours.push({
      tourId:        dbTour._id.toString(),
      title:         dbTour.title       || t.title       || '',
      destination:   dbTour.destination || t.destination || '',
      duration:      dbTour.duration    || t.duration    || '',
      category:      dbTour.category    || t.category    || '',
      imageUrl:      dbTour.image       || dbTour.imageUrl || t.imageUrl || null,
      price,
      sellerPrice:   parseNum(dbTour.sellerPrice),
      paxCount,
      subtotal:      price * paxCount,
      scheduledDate: t.scheduledDate || '',
    });
  }

  const builtTransfers = [];
  for (const tr of transfers) {
    if (!tr.transferId) {
      return { error: 'Each transfer must reference a valid transferId.' };
    }
    const dbTransfer = await Transfer.findById(tr.transferId).lean();
    if (!dbTransfer) {
      return { error: `Transfer not found: ${tr.transferId}` };
    }

    const passengerCount = parseInt(tr.passengerCount) || 1;
    if (passengerCount <= 0) {
      return { error: 'Transfer passengerCount must be a positive value.' };
    }

    // Authoritative prices straight from the catalog — client prices are ignored.
    const oneWayPrice    = parseNum(dbTransfer.oneWayPrice);
    const roundtripPrice = parseNum(dbTransfer.roundtripPrice);
    const transferType   = tr.transferType === 'roundtrip' ? 'roundtrip' : 'oneway';
    const selectedPrice  = transferType === 'roundtrip' ? roundtripPrice : oneWayPrice;

    builtTransfers.push({
      transferId:      dbTransfer._id.toString(),
      title:           dbTransfer.title    || tr.title    || '',
      category:        dbTransfer.category || tr.category || '',
      imageUrl:        dbTransfer.imageUrl || tr.imageUrl || null,
      transferType,
      oneWayPrice,
      roundtripPrice,
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
    });
  }

  return { builtTours, builtTransfers };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/customized-bookings
// Create a new customized booking (submitted from Step 4 of the wizard).
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  console.log('\n🟡 [POST /api/customized-bookings] New customized booking');

  // Parse early so we can derive the lock key before entering the critical section
  let body = req.body;
  if (typeof body.bookingData === 'string') {
    try { body = JSON.parse(body.bookingData); } catch (_) {}
  }

  if (!body.email) {
    return res.status(400).json({ success: false, message: 'email is required.' });
  }

  // Acquire a per-email mutex so concurrent submissions from the same requester
  // are serialised and cannot both slip past validation before either write commits.
  const mutex = getBookingMutex(body.email.toLowerCase());
  const release = await mutex.acquire();

  try {
    // ── Required field validation ───────────────────────────────────────────
    if (!body.destination) return res.status(400).json({ success: false, message: 'destination is required.' });
    if (!body.fullName)    return res.status(400).json({ success: false, message: 'fullName is required.' });

    const ageError = validatePrimaryPassengerAge(body.birthDate);
    if (ageError) {
      return res.status(400).json({ success: false, message: ageError });
    }

    const emailError = validateEmail(body.email, { label: 'Email' });
    if (emailError) {
      return res.status(400).json({ success: false, message: emailError });
    }
    const phoneError = validatePhone(body.phone, { required: false, label: 'Phone number' });
    if (phoneError) {
      return res.status(400).json({ success: false, message: phoneError });
    }
    const travelDateError = validateNotPastDate(body.travelDate, 'Travel date');
    if (travelDateError) {
      return res.status(400).json({ success: false, message: travelDateError });
    }
    if (body.returnDate && body.travelDate && new Date(body.returnDate) <= new Date(body.travelDate)) {
      return res.status(400).json({ success: false, message: 'returnDate must be after travelDate.' });
    }

    // 🔐 SECURITY: Resolve all item prices from the catalog (Tour/Transfer) by id.
    // The client-supplied per-item price is ignored entirely, closing the ₱1-booking
    // price-manipulation vector. Each item must reference a valid catalog id.
    const built = await buildServicesSecure(body);
    if (built.error) {
      return res.status(400).json({ success: false, message: built.error });
    }
    const { builtTours, builtTransfers } = built;

    if (builtTours.length === 0 && builtTransfers.length === 0) {
      return res.status(400).json({ success: false, message: 'Booking must include at least one tour or transfer.' });
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
      isWalkin: body.createdByType === 'sales' && body.isWalkin === true,
    });

    await booking.save();
    console.log(`✅ Customized booking saved: ${booking._id} | ref: ${booking.referenceNumber}`);

    // Fire the booking automation webhook — fire-and-forget, never blocks the response
    sendCustomBookingToGHL(booking).catch((err) =>
      console.error('⚠️ GHL custom booking webhook failed (non-fatal):', err.message)
    );

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
  } finally {
    release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/customized-bookings
// List all customized bookings (admin).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', verifyAdminOrUser, async (req, res) => {
  try {
    const { email, status, destination, page = 1, limit = 50 } = req.query;
    const filter = { isArchive: { $ne: 'Yes' } };
    if (status)      filter.status      = status;
    if (destination) filter.destination = { $regex: destination, $options: 'i' };

    // Customers may only ever see their own bookings — ignore any email
    // filter they pass and pin it to the authenticated account's email.
    if (req.authType === 'user') {
      filter.email = req.user.email;
    } else if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

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
router.get('/archived', authMiddleware, async (req, res) => {
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
router.patch('/:id', authMiddleware, async (req, res) => {
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
router.patch('/:id/status', authMiddleware, async (req, res) => {
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
router.patch('/:id/archive', authMiddleware, async (req, res) => {
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
router.patch('/:id/unarchive', authMiddleware, async (req, res) => {
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
router.delete('/:id', authMiddleware, async (req, res) => {
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