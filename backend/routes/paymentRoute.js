const express = require('express');
const router = express.Router();
const axios = require('axios');
const Booking = require('../models/booking');
const PackageModel = require('../models/package'); 
const paymentController = require('../controller/paymentController');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API = 'https://api.paymongo.com/v1';

const authHeader = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');

router.post('/create-inquiry-checkout', paymentController.createInquiryCheckoutSession);

router.post('/create-intent', async (req, res) => {
  try {
    const { amount, description, bookingData } = req.body;

    if (!amount || !bookingData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount or bookingData'
      });
    }

    const package = await PackageModel.findOne({ title: bookingData.packageName });
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    console.log('📦 Package found:', {
      name: package.title,
      sellerPrice: package.sellerPrice,
      markup: package.markup,
      price: package.price
    });

    const newBooking = new Booking({
      packageName: bookingData.packageName,
      packageId: package._id,           
      sellerPrice: package.sellerPrice,
      markup: package.markup,           
      price: package.price,            
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      duration: bookingData.duration,
      pax: bookingData.pax,
      totalAmount: bookingData.totalAmount,
      fullName: bookingData.fullName,
      email: bookingData.email,
      message: bookingData.message,
      status: 'pending'
    });

    await newBooking.save();
    const bookingId = newBooking._id.toString();

    console.log('✅ Booking created (pending) with pricing:', bookingId);

    const paymentLinkResponse = await axios.post(
      `${PAYMONGO_API}/links`,
      {
        data: {
          attributes: {
            amount: amount,
            description: description,
            remarks: `Booking for ${bookingData.fullName}`,
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
    
    newBooking.paymentLinkId = paymentLink.id;
    newBooking.referenceNumber = paymentLink.attributes.reference_number;
    await newBooking.save();

    console.log('✅ Payment link created:', paymentLink.id);
    console.log('📋 Reference Number:', paymentLink.attributes.reference_number);

    return res.json({
      success: true,
      checkoutUrl: paymentLink.attributes.checkout_url,
      paymentLinkId: paymentLink.id,
      referenceNumber: paymentLink.attributes.reference_number,
      bookingId: bookingId,
      message: 'Redirecting to PayMongo checkout'
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create booking or payment link',
      error: error.response?.data?.errors || error.message
    });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const event = req.body.data;

    if (event.attributes.type === 'link.payment.paid') {
      const payment = event.attributes.data;
      const metadata = payment.attributes.data.attributes.metadata;
      const bookingId = metadata.booking_id;

      console.log('💰 Payment PAID! Booking ID:', bookingId);

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
        console.error('❌ Booking not found:', bookingId);
        return res.status(404).json({ 
          received: true, 
          error: 'Booking not found' 
        });
      }

      console.log('✅ Booking CONFIRMED:', updatedBooking._id);

      return res.json({ 
        received: true,
        bookingConfirmed: true,
        bookingId: updatedBooking._id
      });
    }

    res.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).json({ 
      received: true, 
      error: 'Webhook processing failed' 
    });
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
      referenceNumber: link.attributes.reference_number,
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