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

// ✅ Routes
router.post('/create-inquiry-checkout', paymentController.createInquiryCheckoutSession);
router.post('/create-intent', paymentController.createBookingPaymentIntent); // ✅ Updated to use checkout session
router.post('/create-balance-intent', paymentController.createBalancePaymentLink);

// ✅ UPDATED WEBHOOK - Handle both checkout sessions and payment links
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body.data;
    console.log('=======================================');
    console.log('WEBHOOK RECEIVED');
    console.log('Event Type:', event.attributes.type);
    console.log('=======================================');

    // ✅ Handle Checkout Session Payment Success
    if (event.attributes.type === 'checkout_session.payment.paid') {
      const session = event.attributes.data;
      const metadata = session.attributes.payments?.[0]?.attributes?.metadata || session.attributes.metadata;
      const referenceNumber = session.attributes.reference_number;
      
      console.log('Checkout Session Payment Paid');
      console.log('Reference Number:', referenceNumber);
      console.log('Metadata:', metadata);

      // Check if this is a booking payment
      const booking = await Booking.findById(referenceNumber);
      
      if (booking) {
        console.log('Booking found for checkout session');
        console.log('✅ Booking found:', booking._id, '| Email:', booking.email);
        
        const paymentType = metadata?.payment_type || 'full';
        const isInitialPayment = metadata?.is_initial_payment === true || metadata?.is_initial_payment === 'true';

        if (paymentType === 'partial' && isInitialPayment) {
          // Partial payment - mark as confirmed but not fully paid
          booking.status = 'confirmed';
          booking.initialPaymentPaid = true;
          booking.initialPaymentPaidAt = new Date();
        } else {
          // Full payment
          booking.status = 'confirmed';
          booking.fullyPaid = true;
          booking.fullyPaidAt = new Date();
        }

        booking.paidAt = new Date();
        booking.updatedAt = new Date();

        // ✅ NEW: Reset abandoned booking tracking — payment was received, no more follow-ups needed
        booking.abandonedAt = null;
        booking.followUpCount = 0;
        
        await booking.save();
        
        console.log('Booking updated successfully via webhook');

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
          // Huwag iblock ang webhook kahit mag-fail ang GHL email
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

      console.log('No booking or inquiry found for reference:', referenceNumber);
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