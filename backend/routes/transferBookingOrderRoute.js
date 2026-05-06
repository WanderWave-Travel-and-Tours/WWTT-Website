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

    const type = transferType === 'roundtrip' ? 'roundtrip' : 'oneway';

    // ── Trip-type-specific validation ───────────────────────────────────────
    if (type === 'roundtrip') {
      if (!arrivalTime)   return res.status(400).json({ success: false, message: 'arrivalTime is required for roundtrip bookings.' });
      if (!departureTime) return res.status(400).json({ success: false, message: 'departureTime is required for roundtrip bookings.' });
      if (!returnDate)    return res.status(400).json({ success: false, message: 'returnDate is required for roundtrip bookings.' });
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
      phone:           phone   || '',
      message:         message || '',
      passengerCount:  parseInt(passengerCount) || 1,

      oneWayPrice:    parseFloat(oneWayPrice)    || 0,
      roundtripPrice: parseFloat(roundtripPrice) || 0,
      sellingPrice:   parseFloat(sellingPrice)   || 0,
      totalAmount:    parseFloat(totalAmount)    || 0,

      currency:             currency             || 'PHP',
      paymentType:          paymentType          || 'full',
      initialPaymentAmount: parseFloat(initialPaymentAmount) || 0,
      remainingBalance:     parseFloat(remainingBalance)     || 0,

      promoCode:    promoCode    || null,
      supplierName: supplierName || '',
      pax:          pax          || '',

      // 'sales' if from admin modal, 'customer' if from public booking page
      createdByType: createdByType === 'sales' ? 'sales' : 'customer',
    });

    await booking.save();

    console.log(`✅ Transfer booking created: ${booking._id} | ${type} | ${activityName} | by: ${booking.createdByType}`);

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
router.get('/', async (req, res) => {
  try {
    const { email, status, transferType, createdByType, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (email)         filter.email         = { $regex: email, $options: 'i' };
    if (status)        filter.status        = status;
    if (transferType)  filter.transferType  = transferType;
    if (createdByType) filter.createdByType = createdByType;

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
// PATCH /api/transfer-bookings/:id/status
// Update booking status (confirm, cancel, etc.)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
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

module.exports = router;