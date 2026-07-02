// routes/transferBookingOrderRoute.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles customer bookings for transfers.
// Mount this in app.js as:
//   const transferBookingOrderRoute = require('./routes/transferBookingOrderRoute');
//   app.use('/api/transfer-bookings', transferBookingOrderRoute);
// ─────────────────────────────────────────────────────────────────────────────
const express              = require('express');
const router               = express.Router();
const TransferBookingOrder = require('../models/transferBookingOrder');
const Transfer             = require('../models/transfer');
const authMiddleware       = require('../middleware/auth');
const verifyAdminOrUser    = require('../middleware/verifyAdminOrUser');
const { sendTransferBookingToGHL } = require('../utils/ghlService');
const { syncLocations }            = require('../utils/syncLocations');       // ← ADD
const { validatePrimaryPassengerAge } = require('../utils/ageUtils');


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/transfer-bookings
// Create a new customer transfer booking.
//
// One Way  → requires: arrivalTime, pickupLocation
//            ignores (sets to ''): departureTime, returnDate, dropoffLocation
// Roundtrip → requires: arrivalTime, departureTime, returnDate, pickupLocation, dropoffLocation
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      transferId,
      activityName,
      bookingType,
      destination,
      category,
      transferType,     // 'oneway' | 'roundtrip'
      travelDate,
      returnDate,       // only for roundtrip
      arrivalTime,
      departureTime,    // only for roundtrip
      pickupLocation,
      dropoffLocation,  // only for roundtrip
      specialRequests,
      fullName,
      email,
      phone,
      dateOfBirth,
      message,
      passengerCount,
      oneWayPrice,
      roundtripPrice,
      sellingPrice,
      totalAmount,
      currency,
      paymentType,
      initialPaymentAmount,
      remainingBalance,
      promoCode,
      supplierName,
      pax,
      createdByType,    // 'sales' | 'customer'
    } = req.body;

    // ── Basic validation ────────────────────────────────────────────────────
    if (!activityName) return res.status(400).json({ success: false, message: 'activityName is required.' });
    if (!fullName)     return res.status(400).json({ success: false, message: 'fullName is required.' });
    if (!email)        return res.status(400).json({ success: false, message: 'email is required.' });
    if (!travelDate)   return res.status(400).json({ success: false, message: 'travelDate is required.' });

    const ageError = validatePrimaryPassengerAge(dateOfBirth);
    if (ageError) {
      return res.status(400).json({ success: false, message: ageError });
    }

    const type = transferType === 'roundtrip' ? 'roundtrip' : 'oneway';

    // ── Trip-type-specific validation ───────────────────────────────────────
    if (type === 'roundtrip') {
      if (!arrivalTime)   return res.status(400).json({ success: false, message: 'arrivalTime is required for roundtrip bookings.' });
      if (!departureTime) return res.status(400).json({ success: false, message: 'departureTime is required for roundtrip bookings.' });
      if (!returnDate)    return res.status(400).json({ success: false, message: 'returnDate is required for roundtrip bookings.' });
    }

    // 🔐 SECURITY: Server-side price resolution (anti price-manipulation).
    // Customer bookings must reference a catalog transferId; the price is taken
    // from the Transfer listing and ALL client-supplied price fields are ignored.
    // Sales/admin bookings (createdByType === 'sales') may supply a manual price
    // but it is still validated as a positive number.
    const isSales = createdByType === 'sales';
    const paxQty = Math.max(1, parseInt(passengerCount) || 1);

    let resolvedOneWay    = parseFloat(oneWayPrice)    || 0;
    let resolvedRoundtrip = parseFloat(roundtripPrice) || 0;
    let resolvedSelling;
    let resolvedTotal;

    if (!isSales) {
      // Customer path — price MUST come from the catalog.
      if (!transferId) {
        return res.status(400).json({ success: false, message: 'transferId is required.' });
      }
      const dbTransfer = await Transfer.findById(transferId).lean();
      if (!dbTransfer) {
        return res.status(400).json({ success: false, message: 'Transfer listing not found.' });
      }
      resolvedOneWay    = parseFloat(dbTransfer.oneWayPrice)    || 0;
      resolvedRoundtrip = parseFloat(dbTransfer.roundtripPrice) || 0;
      resolvedSelling   = type === 'roundtrip' ? resolvedRoundtrip : resolvedOneWay;
      resolvedTotal     = resolvedSelling * paxQty;

      if (resolvedTotal <= 0) {
        return res.status(400).json({ success: false, message: 'Selected transfer has no valid price for this trip type.' });
      }
    } else {
      // Sales path — admin-supplied total, but enforce non-negative boundary.
      resolvedSelling = parseFloat(sellingPrice) || (type === 'roundtrip' ? resolvedRoundtrip : resolvedOneWay);
      resolvedTotal   = parseFloat(totalAmount) || (resolvedSelling * paxQty);
      if (resolvedTotal <= 0) {
        return res.status(400).json({ success: false, message: 'totalAmount must be greater than zero.' });
      }
    }

    // Compute payment split server-side from the authoritative total.
    const resolvedPaymentType = paymentType === 'partial' ? 'partial' : 'full';
    let resolvedInitial = resolvedTotal;
    let resolvedRemaining = 0;
    if (resolvedPaymentType === 'partial') {
      const clientInitial = parseFloat(initialPaymentAmount) || 0;
      // Clamp the deposit to (0, total). Fall back to 50% if the client value is invalid.
      resolvedInitial = (clientInitial > 0 && clientInitial < resolvedTotal)
        ? clientInitial
        : Math.ceil(resolvedTotal * 0.5);
      resolvedRemaining = resolvedTotal - resolvedInitial;
    }

    // ── Build document with clean field separation ───────────────────────────
    const booking = new TransferBookingOrder({
      transferId:      transferId || null,
      activityName,
      bookingType:     bookingType || 'transfer',
      destination:     destination || '',
      category:        category    || '',
      transferType:    type,
      travelDate,

      // Roundtrip: save returnDate. One-way: always empty.
      returnDate:      type === 'roundtrip' ? (returnDate || '') : '',

      // One-way: arrivalTime only. Roundtrip: both.
      arrivalTime:     arrivalTime   || '',
      departureTime:   type === 'roundtrip' ? (departureTime || '') : '',

      pickupLocation:  pickupLocation  || '',
      // One-way: no dropoff. Roundtrip: use provided value.
      dropoffLocation: type === 'roundtrip' ? (dropoffLocation || '') : '',

      specialRequests: specialRequests || '',
      fullName,
      email,
      phone:           phone       || '',
      dateOfBirth:     dateOfBirth || '',
      message:         message || '',
      passengerCount:  paxQty,

      oneWayPrice:    resolvedOneWay,
      roundtripPrice: resolvedRoundtrip,
      sellingPrice:   resolvedSelling,
      totalAmount:    resolvedTotal,

      currency:             currency             || 'PHP',
      paymentType:          resolvedPaymentType,
      initialPaymentAmount: resolvedInitial,
      remainingBalance:     resolvedRemaining,

      promoCode:    promoCode    || null,
      supplierName: supplierName || '',
      pax:          pax          || '',

      // 'sales' if from admin modal, 'customer' if from public booking page
      createdByType: createdByType === 'sales' ? 'sales' : 'customer',

      // New bookings are never archived by default
      isArchive: 'No',
    });

await booking.save();
 
console.log(`✅ Transfer booking created: ${booking._id} | …`);
 
// Auto-sync locations — fire-and-forget, never blocks the booking response
syncLocations({                                                                // ← ADD
  pickup:  booking.pickupLocation,                                            // ← ADD
  dropoff: booking.dropoffLocation,                                           // ← ADD
  source:  'transfer',                                                        // ← ADD
}).catch((err) =>                                                              // ← ADD
  console.warn('⚠️ syncLocations failed (non-fatal):', err.message)          // ← ADD
);                                                                             // ← ADD
 
sendTransferBookingToGHL(booking).catch((err) =>
  console.error('⚠️ GHL transfer booking webhook failed (non-fatal):', err.message)
);

    return res.status(201).json({
      success:   true,
      message:   'Transfer booking created successfully.',
      bookingId: booking._id,
      data:      booking,
    });

  } catch (err) {
    console.error('❌ Transfer booking creation error:', err);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transfer-bookings
// List all transfer bookings (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', verifyAdminOrUser, async (req, res) => {
  try {
    const { email, status, transferType, createdByType, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status)        filter.status        = status;
    if (transferType)  filter.transferType  = transferType;
    if (createdByType) filter.createdByType = createdByType;

    // Customers may only ever see their own bookings — ignore any email
    // filter they pass and pin it to the authenticated account's email.
    if (req.authType === 'user') {
      filter.email = req.user.email;
    } else if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await TransferBookingOrder.countDocuments(filter);
    const data  = await TransferBookingOrder.find(filter)
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
    console.error('❌ Fetch transfer bookings error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transfer-bookings/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const booking = await TransferBookingOrder.findById(req.params.id).select('-__v');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    return res.status(200).json({ success: true, data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/transfer-bookings/:id
// Dual-purpose handler:
//   1. Quick field update — isArchive / status / paymentStatus only (dashboard toggles)
//   2. Full edit update  — all fields sent by EditTransferBooking page
//
// Distinguisher: if the body contains any of the "full edit" fields (activityName,
// fullName, email, travelDate, transferType, …) the full-edit path runs and
// updates every provided field. Otherwise the lightweight toggle path runs.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await TransferBookingOrder.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // ── Detect which path to take ──────────────────────────────────────────
    const FULL_EDIT_FIELDS = [
      'activityName', 'fullName', 'email', 'travelDate', 'transferType',
      'pickupLocation', 'oneWayPrice', 'roundtripPrice', 'sellingPrice',
      'totalAmount', 'passengerCount',
    ];
    const isFullEdit = FULL_EDIT_FIELDS.some((f) => req.body[f] !== undefined);

    if (isFullEdit) {
      // ── FULL EDIT (from EditTransferBooking page) ────────────────────────
      const {
        activityName,
        destination,
        category,
        supplierName,
        promoCode,
        pax,
        transferType,
        travelDate,
        returnDate,
        arrivalTime,
        departureTime,
        pickupLocation,
        dropoffLocation,
        fullName,
        email,
        phone,
        message,
        specialRequests,
        passengerCount,
        oneWayPrice,
        roundtripPrice,
        sellingPrice,
        totalAmount,
        currency,
        paymentType,
        initialPaymentAmount,
        remainingBalance,
        paymentStatus,
        status,
      } = req.body;

      const type = transferType === 'roundtrip' ? 'roundtrip' : 'oneway';

      // Roundtrip validation
      if (type === 'roundtrip') {
        if (!arrivalTime)   return res.status(400).json({ success: false, message: 'arrivalTime is required for roundtrip bookings.' });
        if (!departureTime) return res.status(400).json({ success: false, message: 'departureTime is required for roundtrip bookings.' });
        if (!returnDate)    return res.status(400).json({ success: false, message: 'returnDate is required for roundtrip bookings.' });
      }

      if (activityName  !== undefined) booking.activityName  = activityName;
      if (destination   !== undefined) booking.destination   = destination   || '';
      if (category      !== undefined) booking.category      = category      || '';
      if (supplierName  !== undefined) booking.supplierName  = supplierName  || '';
      if (promoCode     !== undefined) booking.promoCode     = promoCode     || null;
      if (pax           !== undefined) booking.pax           = pax           || '';
      if (travelDate    !== undefined) booking.travelDate    = travelDate;
      if (fullName      !== undefined) booking.fullName      = fullName;
      if (email         !== undefined) booking.email         = email;
      if (phone         !== undefined) booking.phone         = phone         || '';
      if (message       !== undefined) booking.message       = message       || '';
      if (specialRequests !== undefined) booking.specialRequests = specialRequests || '';

      if (passengerCount    !== undefined) booking.passengerCount    = parseInt(passengerCount)    || 1;
      if (oneWayPrice       !== undefined) booking.oneWayPrice       = parseFloat(oneWayPrice)       || 0;
      if (roundtripPrice    !== undefined) booking.roundtripPrice    = parseFloat(roundtripPrice)    || 0;
      if (sellingPrice      !== undefined) booking.sellingPrice      = parseFloat(sellingPrice)      || 0;
      if (totalAmount       !== undefined) booking.totalAmount       = parseFloat(totalAmount)       || 0;
      if (initialPaymentAmount !== undefined) booking.initialPaymentAmount = parseFloat(initialPaymentAmount) || 0;
      if (remainingBalance  !== undefined) booking.remainingBalance  = parseFloat(remainingBalance)  || 0;

      if (currency      !== undefined) booking.currency      = currency      || 'PHP';
      if (paymentType   !== undefined) booking.paymentType   = paymentType   || 'full';
      if (paymentStatus !== undefined) booking.paymentStatus = paymentStatus || 'pending';
      if (status        !== undefined) booking.status        = status        || 'pending';

      // Transfer-type-specific fields — enforce clean separation
      booking.transferType    = type;
      booking.arrivalTime     = arrivalTime     || '';
      booking.departureTime   = type === 'roundtrip' ? (departureTime  || '') : '';
      booking.returnDate      = type === 'roundtrip' ? (returnDate     || '') : '';
      booking.pickupLocation  = pickupLocation  || '';
      booking.dropoffLocation = type === 'roundtrip' ? (dropoffLocation || '') : '';

      await booking.save();

      console.log(`✅ Transfer booking ${booking._id} fully edited by admin.`);
      return res.status(200).json({ success: true, message: 'Transfer booking updated.', data: booking });

    } else {
      // ── QUICK TOGGLE (dashboard archive / status updates) ────────────────
      const { isArchive, status, paymentStatus } = req.body;

      if (isArchive !== undefined) {
        if (!['Yes', 'No'].includes(isArchive)) {
          return res.status(400).json({ success: false, message: 'isArchive must be "Yes" or "No".' });
        }
        booking.isArchive = isArchive;
      }
      if (status)        booking.status        = status;
      if (paymentStatus) booking.paymentStatus = paymentStatus;

      await booking.save();

      console.log(`✅ Transfer booking ${booking._id} toggled — isArchive: ${booking.isArchive}, status: ${booking.status}`);
      return res.status(200).json({ success: true, message: 'Transfer booking updated.', data: booking });
    }

  } catch (err) {
    console.error('❌ PATCH transfer booking error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/transfer-bookings/:id/status
// Update booking status (confirm, cancel, etc.)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const booking = await TransferBookingOrder.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (status)        booking.status        = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    await booking.save();
    console.log(`✅ Transfer booking ${booking._id} status → ${booking.status}`);
    return res.status(200).json({ success: true, message: 'Booking status updated.', data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/transfer-bookings/archive/:id
// Archive a transfer booking — sets isArchive to 'Yes' so it is hidden
// from the main dashboard (frontend filters out isArchive === 'Yes').
// ─────────────────────────────────────────────────────────────────────────────
router.put('/archive/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await TransferBookingOrder.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    booking.isArchive = 'Yes';
    await booking.save();

    console.log(`📦 Transfer booking ${booking._id} archived.`);
    return res.status(200).json({
      success: true,
      message: 'Transfer booking archived successfully.',
      data:    booking,
    });
  } catch (err) {
    console.error('❌ Archive transfer booking error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;