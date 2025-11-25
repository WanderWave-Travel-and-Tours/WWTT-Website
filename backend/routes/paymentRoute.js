const express = require('express');
const router = express.Router();
const axios = require('axios');
const Booking = require('../models/booking'); 

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API = 'https://api.paymongo.com/v1';

const authHeader = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');

router.post('/create-intent', async (req, res) => {
  try {
    const { amount, description, bookingData } = req.body;

    console.log('📝 Creating booking and payment link:', { amount, description });

    if (!amount || !bookingData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount or bookingData'
      });
    }

    const newBooking = new Booking({
      packageName: bookingData.packageName,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      duration: bookingData.duration,
      pax: bookingData.pax,
      totalAmount: bookingData.totalAmount,
      fullName: bookingData.fullName,
      email: bookingData.email,
      message: bookingData.message,
      status: 'pending',
      createdAt: new Date()
    });

    await newBooking.save();
    const bookingId = newBooking._id;

    console.log('✅ Booking created (pending):', bookingId);

    const paymentLinkResponse = await axios.post(
      `${PAYMONGO_API}/links`,
      {
        data: {
          attributes: {
            amount: amount,
            description: description,
            remarks: `Booking for ${bookingData.fullName}`,
            redirect: {
              success: `http://localhost:3000/payment-success?booking_id=${bookingId}`, 
              failed: `http://localhost:3000/payment-failed`
            },
            metadata: {
              booking_id: bookingId,
              customer_name: bookingData.fullName,
              customer_email: bookingData.email,
              package: bookingData.packageName,
              travel_dates: `${bookingData.startDate} - ${bookingData.endDate}`,
              duration: bookingData.duration,
              pax: bookingData.pax.adult,
              total_amount: bookingData.totalAmount
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentLink = paymentLinkResponse.data.data;
    console.log('✅ Payment link created:', paymentLink.id);
    console.log('🔗 Checkout URL:', paymentLink.attributes.checkout_url);

    return res.json({
      success: true,
      checkoutUrl: paymentLink.attributes.checkout_url,
      paymentLinkId: paymentLink.id,
      referenceNumber: paymentLink.attributes.reference_number,
      bookingId: bookingId,
      message: 'Redirecting to PayMongo checkout'
    });

  } catch (error) {
    console.error('❌ PayMongo or Booking Error:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create booking or payment link',
      error: error.response?.data?.errors || error.message
    });
  }
});

// routes/paymentRoute.js → palitan mo lang yung /webhook part

router.post('/webhook', async (req, res) => {
  try {
    const event = req.body.data;
    console.log('Webhook received:', event.attributes.type);

    if (event.attributes.type === 'link.payment.paid') {
      const payment = event.attributes.data;
      const link = payment.attributes.line_items?.[0]?.link || payment.attributes.source?.link; 
      const metadata = payment.attributes.metadata;
      const bookingId = metadata.booking_id;

      console.log('Payment PAID! Updating booking:', bookingId);

      const updatedBooking = await Booking.findById(
        bookingId,
        {
          status: 'confirmed',
          paymentId: payment.id,                          
          paymentLinkId: payment.attributes.link_id || link?.id,
          referenceNumber: payment.attributes.reference_number, 
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedBooking) {
        console.error('Booking not found:', bookingId);
      } else {
        console.log('Booking CONFIRMED & REFERENCE SAVED:', {
          bookingId,
          referenceNumber: updatedBooking.referenceNumber,
          paymentId: updatedBooking.paymentId
        });
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.get('/verify/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;

    const response = await axios.get(
      `${PAYMONGO_API}/links/${linkId}`,
      {
        headers: {
          'Authorization': `Basic ${authHeader}`
        }
      }
    );

    const link = response.data.data;
    
    res.json({
      success: true,
      status: link.attributes.status,
      payments: link.attributes.payments,
      link: link
    });

  } catch (error) {
    console.error('❌ Verification Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Payment routes are working!',
    paymongo_configured: !!process.env.PAYMONGO_SECRET_KEY,
    paymongo_key_preview: process.env.PAYMONGO_SECRET_KEY ? 
      `${process.env.PAYMONGO_SECRET_KEY.substring(0, 10)}...` : 'NOT SET'
  });
});

module.exports = router;