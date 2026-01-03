const express = require('express');
const router = express.Router();
const axios = require('axios');
const Booking = require('../models/booking');
const paymentController = require('../controller/paymentController');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const authHeader = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');

router.post('/create-inquiry-checkout', paymentController.createInquiryCheckoutSession);
router.post('/create-intent', paymentController.createBookingPaymentLink);
router.post('/create-balance-intent', paymentController.createBalancePaymentLink);

router.post('/webhook', async (req, res) => {
  try {
    const event = req.body.data;

    // Check if the event is a successful payment via Link
    if (event.attributes.type === 'link.payment.paid') {
      const payment = event.attributes.data;
      const metadata = payment.attributes.data.attributes.metadata;
      const bookingId = metadata.booking_id;

      console.log(`🔔 Webhook Received: Payment PAID for Booking ID: ${bookingId}`);

      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'confirmed',
          paymentId: payment.id,
          paidAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedBooking) {
        console.error('❌ Booking not found via Webhook');
        return res.status(404).json({ received: true, error: 'Booking not found' });
      }

      console.log('✅ Booking Confirmed via Webhook');
      return res.json({ received: true, bookingConfirmed: true });
    }

    res.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).json({ received: true, error: 'Webhook processing failed' });
  }
});

router.get('/verify/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const response = await axios.get(`https://api.paymongo.com/v1/links/${linkId}`, {
        headers: { 'Authorization': `Basic ${authHeader}` }
    });
    res.json({ success: true, link: response.data.data });
  } catch (error) {
    console.error('Verification Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

module.exports = router;