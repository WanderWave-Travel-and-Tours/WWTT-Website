const express = require('express');
const router = express.Router();
const axios = require('axios');
const Booking = require('../models/booking');
const TourBooking = require('../models/tourBooking'); // ✅ FIX: needed for tour payment webhook
const TransferBooking = require('../models/transferBooking'); // ✅ needed for transfer payment webhook
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

// ✅ Helper: Determine booking status based on remaining balance
// This is the source of truth — remainingBalance <= 0 means fully paid
// regardless of whether paymentType is 'partial' or 'full'
const resolveBookingStatus = (booking, paymentType, isInitialPayment) => {
  const remainingBalance = booking.remainingBalance || 0;

  if (remainingBalance <= 0) {
    // Walang balance na natitira — confirmed agad kahit partial ang payment type
    return 'confirmed';
  } else if (paymentType === 'partial' && isInitialPayment) {
    // May balance pa at partial payment ito — partial_paid
    return 'partial_paid';
  } else {
    // Full payment or default
    return 'confirmed';
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

      // ✅ FIX: Helper to search Booking, TourBooking, and TransferBooking collections
      // Chains .populate('packageId') at the query level for reliable population
      const findBooking = async (findFn) => {
        const populatingFindFn = (Model) => {
          const query = findFn(Model);
          // Chain .populate() before awaiting so Mongoose resolves it in one round-trip
          if (query && typeof query.populate === 'function') {
            return query.populate('packageId');
          }
          return query;
        };
        let result = await populatingFindFn(Booking);
        if (!result) result = await populatingFindFn(TourBooking);
        if (!result) result = await populatingFindFn(TransferBooking);
        return result;
      };

      if (checkoutSessionId) {
        booking = await findBooking(Model => Model.findOne({ checkoutSessionId }));
        if (booking) console.log('✅ Booking found via checkoutSessionId:', booking._id);
      }

      if (!booking && metadata?.booking_id) {
        try {
          booking = await findBooking(Model => Model.findById(metadata.booking_id));
          if (booking) console.log('✅ Booking found via metadata.booking_id:', booking._id);
        } catch (metaErr) {
          console.warn('⚠️ metadata.booking_id lookup failed:', metaErr.message);
        }
      }

      if (!booking && referenceNumber) {
        try {
          booking = await findBooking(Model => Model.findById(referenceNumber));
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

        // ✅ Capture populated packageData BEFORE booking.save() —
        // .save() reverts populated refs back to raw ObjectId.
        // Check for .title (a real Package field) to confirm it's truly populated and not just an ObjectId.
        const packageData = (booking.packageId && booking.packageId.title)
          ? booking.packageId
          : null;
        console.log('📦 packageId raw:', booking.packageId);
        console.log('📦 packageData resolved:', packageData ? `id=${packageData._id} title=${packageData.title} image=${packageData.image}` : 'NULL — packageId missing or not populated');

        const metadata = session.attributes.payments?.[0]?.attributes?.metadata
                      || session.attributes.metadata
                      || {};

        const paymentType = metadata?.payment_type || 'full';
        const isInitialPayment = metadata?.is_initial_payment === true
                              || metadata?.is_initial_payment === 'true'
                              || metadata?.is_initial_payment === 1;

        console.log('🔍 Payment metadata:', { paymentType, isInitialPayment });

        // ✅ UPDATED: Base status on remaining balance, not just payment type
        const newStatus = resolveBookingStatus(booking, paymentType, isInitialPayment);
        booking.status = newStatus;

        if (newStatus === 'confirmed') {
          booking.fullyPaid = true;
          booking.fullyPaidAt = new Date();
          booking.initialPaymentPaid = true;
          booking.initialPaymentPaidAt = new Date();
          console.log('✅ Updated to CONFIRMED (remainingBalance <= 0 or full payment)');
        } else {
          // partial_paid
          booking.initialPaymentPaid = true;
          booking.initialPaymentPaidAt = new Date();
          console.log('✅ Updated to PARTIAL_PAID (remaining balance:', booking.remainingBalance, ')');
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
            booking.passengers?.length || booking.pax?.adult || 1,
            packageData,  // ✅ Pre-saved populated package object
            booking       // ✅ Full booking document for complete details
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

      // ✅ Populate packageId and capture BEFORE booking.save() —
      // calling .save() reverts populated refs back to ObjectId, losing the package details
      if (booking.packageId) {
        await booking.populate('packageId');
      }
      const packageData = (booking.packageId && booking.packageId.title)
        ? booking.packageId
        : null;
      console.log('📦 packageId raw:', booking.packageId);
      console.log('📦 packageData resolved:', packageData ? `id=${packageData._id} title=${packageData.title} image=${packageData.image}` : 'NULL — packageId missing or not populated');

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
          booking.passengers?.length || booking.pax?.adult || 1,
          packageData,  // ✅ Pre-saved populated package object
          booking       // ✅ Full booking document for complete details
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

    // ✅ UPDATED: Base status on remaining balance, not just payment type
    const newStatus = resolveBookingStatus(booking, paymentType, isInitialPayment);
    booking.status = newStatus;

    if (newStatus === 'confirmed') {
      booking.fullyPaid = true;
      booking.fullyPaidAt = new Date();
      booking.initialPaymentPaid = true;
      booking.initialPaymentPaidAt = new Date();
      console.log('✅ Updated to CONFIRMED (remainingBalance <= 0 or full payment)');
    } else {
      // partial_paid
      booking.initialPaymentPaid = true;
      booking.initialPaymentPaidAt = new Date();
      console.log('✅ Updated to PARTIAL_PAID (remaining balance:', booking.remainingBalance, ')');
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

// ✅ SAFETY NET 2: Confirm by Booking ID
// Called by PaymentSuccess.jsx on page load using booking_id from the success URL.
// Looks up the booking's stored checkoutSessionId, verifies with PayMongo, then updates status.
// This is the PRIMARY fallback when the webhook doesn't fire — guaranteed to work.
router.post('/confirm-by-booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log('📋 Confirm-by-booking request for:', bookingId);

    // 1. Find the booking — ✅ FIX: check Booking, TourBooking, and TransferBooking
    let booking = null;
    try {
      booking = await Booking.findById(bookingId);
      if (!booking) booking = await TourBooking.findById(bookingId);
      if (!booking) booking = await TransferBooking.findById(bookingId);
    } catch (idErr) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Already confirmed — idempotent, safe to call multiple times
    if (booking.status === 'confirmed' || booking.status === 'partial_paid') {
      console.log('✅ Booking already updated:', booking.status);
      return res.json({ success: true, message: 'Booking already updated', status: booking.status });
    }

    if (!booking.checkoutSessionId) {
      return res.status(400).json({ success: false, message: 'No checkout session found for this booking' });
    }

    // 2. Verify payment status directly with PayMongo
    const pmResponse = await axios.get(`https://api.paymongo.com/v1/checkout_sessions/${booking.checkoutSessionId}`, {
      headers: { 'Authorization': `Basic ${authHeader}` }
    });

    const session = pmResponse.data.data;
    const sessionStatus = session.attributes.payment_intent?.attributes?.status
      || session.attributes.status;

    console.log('📋 Confirm-by-booking — PayMongo session status:', sessionStatus);

    const isPaid = sessionStatus === 'succeeded' || sessionStatus === 'paid'
      || session.attributes.payments?.some(p => p.attributes?.status === 'paid');

    if (!isPaid) {
      return res.json({ success: false, message: 'Payment not yet confirmed by PayMongo', status: sessionStatus });
    }

    // 3. Same status logic as webhook and confirm-by-session
    const metadata = session.attributes.payments?.[0]?.attributes?.metadata
                  || session.attributes.metadata
                  || {};

    const paymentType = metadata?.payment_type || booking.paymentType || 'full';
    const isInitialPayment = metadata?.is_initial_payment === true
                          || metadata?.is_initial_payment === 'true'
                          || metadata?.is_initial_payment === 1;

    console.log('🔍 Payment metadata (confirm-by-booking):', { paymentType, isInitialPayment });

    // ✅ UPDATED: Base status on remaining balance, not just payment type
    const newStatus = resolveBookingStatus(booking, paymentType, isInitialPayment);
    booking.status = newStatus;

    if (newStatus === 'confirmed') {
      booking.fullyPaid = true;
      booking.fullyPaidAt = new Date();
      booking.initialPaymentPaid = true;
      booking.initialPaymentPaidAt = new Date();
      console.log('✅ Updated to CONFIRMED (remainingBalance <= 0 or full payment)');
    } else {
      // partial_paid
      booking.initialPaymentPaid = true;
      booking.initialPaymentPaidAt = new Date();
      console.log('✅ Updated to PARTIAL_PAID (remaining balance:', booking.remainingBalance, ')');
    }

    booking.paidAt = new Date();
    booking.updatedAt = new Date();
    booking.abandonedAt = null;
    booking.followUpCount = 0;

    await booking.save();

    console.log(`✅ FINAL STATUS: ${booking.status} for booking ${booking._id}`);

    // Notify GHL (non-fatal)
    notifyGHLPaymentConfirmed(booking.email, booking._id).catch(() => {});

    return res.json({
      success: true,
      message: 'Booking confirmed',
      bookingId: booking._id,
      status: booking.status
    });

  } catch (error) {
    console.error('❌ Confirm-by-booking error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Confirm-by-booking failed', error: error.message });
  }
});


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