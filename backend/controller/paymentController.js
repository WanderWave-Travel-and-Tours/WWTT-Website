const axios = require('axios');
const Inquiry = require('../models/inquiry');
const Payment = require('../models/payment');
const Booking = require('../models/booking');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API = 'https://api.paymongo.com/v1';

const authHeader = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');

// ==========================================
// FUNCTION 1: FOR INQUIRIES (Visa, Cenomar, PSA)
// ==========================================
const createInquiryCheckoutSession = async (req, res) => {
  try {
    const { inquiryId } = req.body;
    
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    if (!inquiry.estimatedPrice || inquiry.estimatedPrice <= 0) {
       return res.status(400).json({ success: false, message: 'Invalid price amount' });
    }

    const amountInCentavos = Math.round(inquiry.estimatedPrice * 100);

    const options = {
      method: 'POST',
      url: `${PAYMONGO_API}/checkout_sessions`,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Basic ${authHeader}`
      },
      data: {
        data: {
          attributes: {
            line_items: [
              {
                currency: 'PHP',
                amount: amountInCentavos,
                description: `Payment for: ${inquiry.serviceName}`,
                name: 'WanderWave Services',
                quantity: 1
              }
            ],
            payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
            reference_number: inquiry._id.toString(),
            send_email_receipt: true,
            show_description: true,
            description: `Inquiry Ref: ${inquiry._id}`,
            success_url: `http://localhost:5173/dashboard?success=true&inquiryId=${inquiry._id}`,
            cancel_url: `http://localhost:5173/dashboard`
          }
        }
      }
    };

    const response = await axios.request(options);
    const checkoutSessionId = response.data.data.id;

    await Payment.create({
      inquiryId: inquiry._id,
      transactionId: checkoutSessionId,
      amount: inquiry.estimatedPrice,
      serviceName: inquiry.serviceName,
      customerName: inquiry.fullName,
      customerEmail: inquiry.email,
      status: 'PENDING'
    });
    
    console.log(`✅ PayMongo Session Created: ${checkoutSessionId} for Inquiry: ${inquiry._id}`);

    res.json({
      success: true,
      checkoutUrl: response.data.data.attributes.checkout_url
    });

  } catch (error) {
    console.error('PayMongo Inquiry Error:', error.response?.data || error.message);
    if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Payment creation failed' });
    }
  }
};

// ==========================================
// FUNCTION 2: FOR BOOKINGS (Travel Packages)
// 🔥 FIXED VERSION - Expects bookingId to already exist
// ==========================================
const createBookingPaymentLink = async (req, res) => {
  try {
    console.log('═══════════════════════════════════════');
    console.log('📥 PAYMENT CONTROLLER RECEIVED REQUEST');
    console.log('═══════════════════════════════════════');
    console.log('Request Body:', req.body);
    console.log('Request Headers:', req.headers);
    console.log('Body Keys:', Object.keys(req.body));
    console.log('BookingId Value:', req.body.bookingId);
    console.log('BookingId Type:', typeof req.body.bookingId);

    const { bookingId } = req.body;

    if (!bookingId) {
      console.error('❌ Missing bookingId in request body');
      console.error('Received body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Missing required field: bookingId',
        receivedBody: req.body,
        debug: {
          bodyKeys: Object.keys(req.body),
          bodyValues: Object.values(req.body)
        }
      });
    }

    console.log('✅ BookingId received:', bookingId);

    // Find the existing booking
    console.log('🔍 Searching for booking in database...');
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      console.error('❌ Booking not found in database');
      console.error('Searched for ID:', bookingId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        searchedId: bookingId
      });
    }

    console.log('✅ Booking found:', {
      id: booking._id,
      packageName: booking.packageName,
      totalAmount: booking.totalAmount,
      status: booking.status
    });

    // Check for duplicate payment link
    if (booking.paymentLinkId) {
      console.warn('⚠️ Payment link already exists');
      return res.status(400).json({
        success: false,
        message: 'Payment link already exists for this booking',
        existingLinkId: booking.paymentLinkId
      });
    }

    // Convert to centavos
    const amountInCentavos = Math.round(booking.totalAmount * 100);

    console.log('💰 Payment Details:', {
      totalAmount: booking.totalAmount,
      amountInCentavos: amountInCentavos,
      currency: 'PHP'
    });

    console.log('📡 Calling PayMongo API...');

    // Create PayMongo Payment Link
    const paymentLinkResponse = await axios.post(
      `${PAYMONGO_API}/links`,
      {
        data: {
          attributes: {
            amount: amountInCentavos,
            description: `${booking.packageName} - ${booking.fullName}`,
            remarks: `Booking for ${booking.fullName}`,
            metadata: {
              booking_id: bookingId,
              customer_name: booking.fullName,
              customer_email: booking.email,
              package: booking.packageName,
              total_amount: booking.totalAmount,
              includes_airfare: booking.includesAirfare || false
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
    
    console.log('✅ PayMongo Response:', {
      linkId: paymentLink.id,
      checkoutUrl: paymentLink.attributes.checkout_url,
      referenceNumber: paymentLink.attributes.reference_number
    });

    // Update booking with payment details
    booking.paymentLinkId = paymentLink.id;
    booking.referenceNumber = paymentLink.attributes.reference_number;
    await booking.save();

    console.log('✅ Booking updated with payment details');
    console.log('═══════════════════════════════════════');
    console.log('✅ PAYMENT LINK CREATED SUCCESSFULLY');
    console.log('═══════════════════════════════════════');

    return res.json({
      success: true,
      checkoutUrl: paymentLink.attributes.checkout_url,
      paymentLinkId: paymentLink.id,
      referenceNumber: paymentLink.attributes.reference_number,
      bookingId: bookingId,
      message: 'Payment link created successfully'
    });

  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ PAYMENT CONTROLLER ERROR');
    console.error('═══════════════════════════════════════');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    
    if (error.response) {
      console.error('PayMongo API Error:');
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create payment link',
      error: error.response?.data?.errors || error.message,
      details: error.response?.data,
      debug: {
        errorType: error.name,
        errorMessage: error.message
      }
    });
  }
};

module.exports = { 
    createInquiryCheckoutSession, 
    createBookingPaymentLink 
};