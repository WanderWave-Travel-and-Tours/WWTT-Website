const express = require('express');
const router = express.Router();
const axios = require('axios');
const Booking = require('../models/booking');
const Inquiry = require('../models/inquiry');
const paymentController = require('../controller/paymentController');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
// ✅ FIX: ADD COLON BEFORE BASE64 ENCODING
const authHeader = Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64');

// ✅ Routes
router.post('/create-inquiry-checkout', paymentController.createInquiryCheckoutSession);
router.post('/create-intent', paymentController.createBookingPaymentIntent); // ✅ Updated to use checkout session
router.post('/create-balance-intent', paymentController.createBalancePaymentLink);

router.post('/webhook', async (req, res) => {
  // AGAD na mag-reply para hindi mag-timeout
  res.status(200).json({ received: true });

  // Background processing
  processWebhookInBackground(req.body).catch(err => {
    console.error('Webhook background error:', err);
  });
});

const processWebhookInBackground = async (body) => {
  try {
    const eventType = body?.data?.attributes?.type;
    console.log('🔔 Webhook Background Processing:', eventType);

    if (eventType === 'checkout_session.payment.paid') {
      const session = body.data.attributes.data;
      const metadata = session.attributes.metadata || {};

      let rawBookingData = null;
      try {
        if (metadata.rawBookingData) {
          rawBookingData = JSON.parse(metadata.rawBookingData);
        }
      } catch (e) {
        console.error('Failed to parse rawBookingData', e);
        return;
      }

      if (!rawBookingData) return;

      const newBooking = new Booking({
        ...rawBookingData,
        checkoutSessionId: session.id,
        referenceNumber: session.attributes.reference_number || `WW-${Date.now()}`,
        initialPaymentPaid: true,
        initialPaymentPaidAt: new Date(),
        paidAt: new Date(),
        status: rawBookingData.paymentType === 'full' ? 'confirmed' : 'partial_paid',
      });

      await newBooking.save();
      console.log(`✅ BOOKING CREATED FROM WEBHOOK! ID: ${newBooking._id}`);
    }
  } catch (error) {
    console.error('Webhook processing failed:', error);
  }
};

// ✅ Verify checkout session
router.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const response = await axios.get(`https://api.paymongo.com/v1/checkout_sessions/${sessionId}`, {
        headers: { 'Authorization': `Basic ${authHeader}` }
    });
    res.json({ success: true, session: response.data.data });
  } catch (error) {
    console.error('Session Verification Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Session verification failed' });
  }
});

// ✅ Verify payment link (for balance payments)
router.get('/verify-link/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const response = await axios.get(`https://api.paymongo.com/v1/links/${linkId}`, {
        headers: { 'Authorization': `Basic ${authHeader}` }
    });
    res.json({ success: true, link: response.data.data });
  } catch (error) {
    console.error('Link Verification Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Link verification failed' });
  }
});

module.exports = router;