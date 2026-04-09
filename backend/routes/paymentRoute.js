const express = require('express');
const router = express.Router();
const axios = require('axios');
const Booking = require('../models/booking');
const Inquiry = require('../models/inquiry');
const paymentController = require('../controller/paymentController');

// 🔥 IMPORT GHL SERVICE
const { sendBookingConfirmationToGHL } = require('../utils/ghlService');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
// ✅ FIX: ADD COLON BEFORE BASE64 ENCODING
const authHeader = Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64');

// ✅ Helper: Notify GHL that payment is confirmed — updates Payment Status to "Paid"
// This allows the GHL abandoned booking workflow If/Else condition to evaluate correctly
// and removes the contact from the follow-up sequence automatically.
const notifyGHLPaymentConfirmed = async (email, bookingId) => {
  const GHL_PAYMENT_CONFIRMED_URL = process.env.GHL_ABANDONED_BOOKING_WEBHOOK_URL;
  if (!GHL_PAYMENT_CONFIRMED_URL) return;
  try {
    await axios.post(GHL_PAYMENT_CONFIRMED_URL, {
      type: 'PAYMENT_CONFIRMED',
      event: 'payment_completed',
      bookingId: bookingId ? bookingId.toString() : '',
      email: email || '',
      paymentStatus: 'Paid', // ✅ GHL will map this to the Payment Status custom field
      timestamp: new Date().toISOString(),
      source: 'WanderWave PayMongo Webhook',
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000,
    });
    console.log('✅ GHL notified: Payment Status updated to Paid for', email);
  } catch (err) {
    console.error('⚠️ Failed to notify GHL of payment confirmation (non-fatal):', err.message);
  }
};

// ✅ Routes
router.post('/create-inquiry-checkout', paymentController.createInquiryCheckoutSession);
router.post('/create-intent', paymentController.createBookingPaymentIntent); // ✅ Updated to use checkout session
router.post('/create-balance-intent', paymentController.createBalancePaymentLink);

// ✅ UPDATED WEBHOOK - Handle both checkout sessions and payment links
router.post('/webhook', async (req, res) => {
  try {
    // ✅ FIX: Parse raw body if it's a Buffer (when express.raw() middleware is used)
    let body = req.body;
    if (Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString('utf8'));
      } catch (parseErr) {
        console.error('❌ Failed to parse webhook raw body:', parseErr.message);
        return res.status(400).json({ received: false, error: 'Invalid JSON body' });
      }
    }

    const event = body.data;

    if (!event || !event.attributes) {
      console.error('❌ Webhook: Missing event data or attributes');
      return res.status(400).json({ received: false, error: 'Invalid webhook payload' });
    }

    console.log('=======================================');
    console.log('WEBHOOK RECEIVED');
    console.log('Event Type:', event.attributes.type);
    console.log('=======================================');

    // ✅ Handle Checkout Session Payment Success
    if (event.attributes.type === 'checkout_session.payment.paid') {
      const session = event.attributes.data;
      const metadata = session.attributes.payments?.[0]?.attributes?.metadata || session.attributes.metadata;
      const referenceNumber = session.attributes.reference_number;
      const checkoutSessionId = session.id;
      
      console.log('Checkout Session Payment Paid');
      console.log('Reference Number:', referenceNumber);
      console.log('Checkout Session ID:', checkoutSessionId);
      console.log('Metadata:', metadata);

      // ✅ IMPROVED LOOKUP — Priority order na mas reliable
      // Priority 1: checkoutSessionId (pinaka-reliable, direct match sa booking document)
      // Priority 2: metadata.booking_id (MongoDB _id na explicitly nasa metadata)
      // Priority 3: referenceNumber (last resort — madalas hindi ito ang MongoDB _id)
      let booking = null;

      if (checkoutSessionId) {
        booking = await Booking.findOne({ checkoutSessionId: checkoutSessionId });
        if (booking) console.log('✅ Booking found via checkoutSessionId:', booking._id);
      }

      if (!booking && metadata?.booking_id) {
        try {
          booking = await Booking.findById(metadata.booking_id);
          if (booking) console.log('✅ Booking found via metadata.booking_id:', booking._id);
        } catch (metaErr) {
          console.warn('⚠️ metadata.booking_id lookup failed:', metaErr.message);
        }
      }

      if (!booking && referenceNumber) {
        try {
          booking = await Booking.findById(referenceNumber);
          if (booking) console.log('✅ Booking found via referenceNumber:', booking._id);
        } catch (idErr) {
          console.warn('⚠️ findById with referenceNumber failed (non-fatal):', idErr.message);
        }
      }

      if (!booking) {
        console.error('❌ No booking found — checkoutSessionId:', checkoutSessionId, '| ref:', referenceNumber, '| metadata.booking_id:', metadata?.booking_id);
      }
      
      if (booking) {
        console.log('Booking found for checkout session');

        const metadata = session.attributes.payments?.[0]?.attributes?.metadata
                      || session.attributes.metadata
                      || {};

        const paymentType = metadata?.payment_type || 'full';
        const isInitialPayment = metadata?.is_initial_payment === true
                              || metadata?.is_initial_payment === 'true'
                              || metadata?.is_initial_payment === 1;

        console.log('🔍 Payment metadata:', { paymentType, isInitialPayment });

        if (paymentType === 'partial' && isInitialPayment) {
          booking.status = 'partial_paid';
          booking.initialPaymentPaid = true;
          booking.initialPaymentPaidAt = new Date();
          console.log('✅ Updated to PARTIAL_PAID');
        } else {
          booking.status = 'confirmed';
          booking.fullyPaid = true;
          booking.fullyPaidAt = new Date();
          booking.initialPaymentPaid = true;
          booking.initialPaymentPaidAt = new Date();
          console.log('✅ Updated to CONFIRMED (Full Payment)');
        }

        booking.paidAt = new Date();
        booking.updatedAt = new Date();

        // ✅ Reset abandoned booking tracking — payment was received, no more follow-ups needed
        booking.abandonedAt = null;
        booking.followUpCount = 0;

        await booking.save();

        console.log(`✅ FINAL STATUS: ${booking.status} for booking ${booking._id}`);

        // ✅ Notify GHL that payment is confirmed
        notifyGHLPaymentConfirmed(booking.email, booking._id).catch(() => {});

        // 🔥 AUTOMATIC ONBOARDING KIT EMAIL VIA GHL
        try {
          await sendBookingConfirmationToGHL(
            booking.email,
            booking.fullName || `${booking.passengers?.[0]?.firstName || ''} ${booking.passengers?.[0]?.lastName || ''}`.trim(),
            booking.packageName,
            booking.totalAmount,
            booking.startDate,
            booking.endDate,
            booking.passengers?.length || booking.pax?.adult || 1
          );
        } catch (ghlError) {
          console.error('⚠️ GHL Onboarding Kit failed (checkout session):', ghlError.message);
        }

        return res.json({ received: true, bookingConfirmed: true, onboardingKitSent: true });
      }

      // Check if this is an inquiry payment
      const inquiry = await Inquiry.findById(referenceNumber);
      
      if (inquiry) {
        console.log('Inquiry found for checkout session');
        
        inquiry.status = 'PAID';
        inquiry.paymentConfirmedAt = new Date();
        inquiry.updatedAt = new Date();
        
        await inquiry.save();
        
        console.log('Inquiry updated successfully via webhook');
        return res.json({ received: true, inquiryPaid: true });
      }

      console.log('⚠️ No booking or inquiry found for reference:', referenceNumber, '| sessionId:', checkoutSessionId);
      return res.json({ received: true, notFound: true });
    }

    // ✅ Handle Payment Link Payment Success (for balance payments)
    if (event.attributes.type === 'link.payment.paid') {
      const payment = event.attributes.data;
      const metadata = payment.attributes.data.attributes.metadata;
      const bookingId = metadata.booking_id;

      console.log('Payment Link Payment Paid');
      console.log('Booking ID:', bookingId);
      console.log('Is Balance Payment:', metadata.is_balance_payment);

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        console.error('Booking not found for payment link');
        return res.status(404).json({ received: true, error: 'Booking not found' });
      }

      if (metadata.is_balance_payment === true || metadata.is_balance_payment === 'true') {
        // This is a balance payment
        booking.status = 'confirmed';
        booking.balancePaymentPaid = true;
        booking.balancePaymentPaidAt = new Date();
        booking.fullyPaid = true;
        booking.fullyPaidAt = new Date();
      } else {
        // Regular payment link (if any)
        booking.status = 'confirmed';
        booking.paidAt = new Date();
      }

      booking.updatedAt = new Date();

      // ✅ NEW: Reset abandoned booking tracking — payment was received, no more follow-ups needed
      booking.abandonedAt = null;
      booking.followUpCount = 0;
      await booking.save();

      console.log('Balance payment confirmed via webhook');

      // ✅ FIXED: Notify GHL that payment is confirmed — stops the abandoned booking follow-up workflow
      notifyGHLPaymentConfirmed(booking.email, booking._id).catch(() => {});

      // 🔥 AUTOMATIC ONBOARDING KIT EMAIL VIA GHL (Balance Payment)
      try {
        await sendBookingConfirmationToGHL(
          booking.email,
          booking.fullName || `${booking.passengers?.[0]?.firstName || ''} ${booking.passengers?.[0]?.lastName || ''}`.trim(),
          booking.packageName,
          booking.totalAmount,
          booking.startDate,
          booking.endDate,
          booking.passengers?.length || booking.pax?.adult || 1
        );
      } catch (ghlError) {
        console.error('⚠️ GHL Onboarding Kit failed (balance payment):', ghlError.message);
        // Huwag iblock ang webhook kahit mag-fail ang GHL email
      }

      return res.json({ received: true, balancePaymentConfirmed: true, onboardingKitSent: true });
    }

    // ✅ Other event types
    console.log('Unhandled event type:', event.attributes.type);
    res.json({ received: true });

  } catch (error) {
    console.error('=======================================');
    console.error('WEBHOOK ERROR');
    console.error('=======================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ received: true, error: 'Webhook processing failed' });
  }
});

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

// ✅ SAFETY NET: Manually confirm booking by checkout session ID
// Called by the frontend if the webhook didn't fire in time.
// Verifies the session status directly with PayMongo before updating.
router.post('/confirm-by-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 1. Verify with PayMongo that the session is actually paid
    const pmResponse = await axios.get(`https://api.paymongo.com/v1/checkout_sessions/${sessionId}`, {
      headers: { 'Authorization': `Basic ${authHeader}` }
    });

    const session = pmResponse.data.data;
    const sessionStatus = session.attributes.payment_intent?.attributes?.status
      || session.attributes.status;

    console.log('📋 Manual confirm — session status from PayMongo:', sessionStatus);

    // Only confirm if PayMongo says it's paid
    const isPaid = sessionStatus === 'succeeded' || sessionStatus === 'paid'
      || session.attributes.payments?.some(p => p.attributes?.status === 'paid');

    if (!isPaid) {
      return res.json({ success: false, message: 'Payment not yet confirmed by PayMongo', status: sessionStatus });
    }

    // 2. Find the booking — same priority order as webhook
    // Priority 1: checkoutSessionId
    let booking = await Booking.findOne({ checkoutSessionId: sessionId });
    if (booking) console.log('✅ Manual confirm — found via checkoutSessionId:', booking._id);

    // Priority 2: metadata.booking_id
    if (!booking) {
      const metaBookingId = session.attributes.payments?.[0]?.attributes?.metadata?.booking_id
        || session.attributes.metadata?.booking_id;
      if (metaBookingId) {
        try {
          booking = await Booking.findById(metaBookingId);
          if (booking) console.log('✅ Manual confirm — found via metadata.booking_id:', booking._id);
        } catch (_) {}
      }
    }

    // Priority 3: reference_number (last resort)
    if (!booking) {
      const refNumber = session.attributes.reference_number;
      if (refNumber) {
        try { booking = await Booking.findById(refNumber); } catch (_) {}
        if (booking) console.log('✅ Manual confirm — found via referenceNumber:', booking._id);
      }
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found for this session' });
    }

    // 3. Only update if still pending (idempotent)
    if (booking.status !== 'pending') {
      return res.json({ success: true, message: 'Booking already confirmed', status: booking.status });
    }

    const metadata = session.attributes.payments?.[0]?.attributes?.metadata
                  || session.attributes.metadata
                  || {};

    const paymentType = metadata?.payment_type || 'full';
    const isInitialPayment = metadata?.is_initial_payment === true
                          || metadata?.is_initial_payment === 'true'
                          || metadata?.is_initial_payment === 1;

    console.log('🔍 Payment metadata:', { paymentType, isInitialPayment });

    if (paymentType === 'partial' && isInitialPayment) {
      booking.status = 'partial_paid';
      booking.initialPaymentPaid = true;
      booking.initialPaymentPaidAt = new Date();
      console.log('✅ Updated to PARTIAL_PAID');
    } else {
      booking.status = 'confirmed';
      booking.fullyPaid = true;
      booking.fullyPaidAt = new Date();
      booking.initialPaymentPaid = true;
      booking.initialPaymentPaidAt = new Date();
      console.log('✅ Updated to CONFIRMED (Full Payment)');
    }

    booking.paidAt = new Date();
    booking.updatedAt = new Date();
    booking.abandonedAt = null;
    booking.followUpCount = 0;

    await booking.save();

    console.log(`✅ FINAL STATUS: ${booking.status} for booking ${booking._id}`);

    // Notify GHL (non-fatal)
    notifyGHLPaymentConfirmed(booking.email, booking._id).catch(() => {});

    return res.json({ success: true, message: 'Booking confirmed', bookingId: booking._id, status: booking.status });

  } catch (error) {
    console.error('❌ Manual confirm error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Manual confirm failed', error: error.message });
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