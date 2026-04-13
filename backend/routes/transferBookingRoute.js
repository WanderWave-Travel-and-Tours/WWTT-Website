// routes/transferBookingRoute.js
const express        = require('express');
const router         = express.Router();
const TransferBooking = require('../models/transferBooking');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/transfer-bookings
// Create a new transfer booking
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    if (!data.activityName) {
      return res.status(400).json({ success: false, message: 'activityName is required.' });
    }
    if (!data.fullName) {
      return res.status(400).json({ success: false, message: 'fullName is required.' });
    }
    if (!data.email) {
      return res.status(400).json({ success: false, message: 'email is required.' });
    }

    const transferBooking = new TransferBooking({
      transferId:      data.transferId      || null,
      activityName:    data.activityName,
      bookingType:     'transfer',
      supplierName:    data.supplierName    || '',
      destination:     data.destination     || '',
      pax:             data.pax             || '',
      travelDate:      data.travelDate      || '',
      pickupTime:      data.pickupTime      || '',
      pickupLocation:  data.pickupLocation  || '',
      dropoffLocation: data.dropoffLocation || '',
      specialRequests: data.specialRequests || '',
      fullName:        data.fullName,
      email:           data.email,
      phone:           data.phone           || '',
      message:         data.message         || '',
      passengerCount:  data.passengerCount  || 1,
      sellingPrice:    data.sellingPrice    || 0,
      totalAmount:     data.totalAmount     || data.sellingPrice || 0,
      currency:        data.currency        || 'PHP',
      paymentType:     data.paymentType     || 'full',
      initialPaymentAmount: data.initialPaymentAmount || data.totalAmount || 0,
      remainingBalance:     data.remainingBalance     || 0,
      status: 'pending',
    });

    await transferBooking.save();

    console.log('✅ Transfer booking created:', transferBooking._id, '|', transferBooking.activityName);

    res.status(201).json({
      success:   true,
      message:   'Transfer booking created successfully.',
      bookingId: transferBooking._id,
      booking:   transferBooking,
    });

  } catch (err) {
    console.error('❌ Transfer booking creation error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transfer-bookings
// Get all transfer bookings (admin use)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, email, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (email)  filter.email  = { $regex: email, $options: 'i' };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await TransferBooking.countDocuments(filter);
    const bookings = await TransferBooking.find(filter)
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
    console.error('❌ Fetch transfer bookings error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transfer-bookings/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const booking = await TransferBooking.findById(req.params.id).select('-__v');
    if (!booking) return res.status(404).json({ success: false, message: 'Transfer booking not found.' });
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/transfer-bookings/:id/status
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed    = ['pending', 'confirmed', 'cancelled', 'completed', 'partial_paid'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const booking = await TransferBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Transfer booking not found.' });

    const prev = booking.status;
    booking.status    = status;
    booking.updatedAt = new Date();
    if (status === 'confirmed' && !booking.paidAt) booking.paidAt = new Date();
    if (status === 'cancelled') booking.cancelledAt = new Date();

    await booking.save();
    console.log(`✅ Transfer booking ${booking._id} status: ${prev} → ${status}`);
    res.status(200).json({ success: true, message: `Booking ${status}.`, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/transfer-bookings/:id/payment
// Update payment info (called by PayMongo webhook / payment flow)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus, paymentIntentId, checkoutUrl, paidAt } = req.body;

    const booking = await TransferBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Transfer booking not found.' });

    if (paymentStatus)   booking.paymentStatus  = paymentStatus;
    if (paymentIntentId) booking.checkoutSessionId = paymentIntentId;
    if (checkoutUrl)     booking.checkoutUrl    = checkoutUrl;
    if (paidAt)          booking.paidAt         = new Date(paidAt);
    booking.updatedAt = new Date();

    await booking.save();
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/transfer-bookings/:id  (admin only — hard delete)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const booking = await TransferBooking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Transfer booking not found.' });
    console.log('🗑️ Transfer booking deleted:', req.params.id);
    res.status(200).json({ success: true, message: 'Transfer booking deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
