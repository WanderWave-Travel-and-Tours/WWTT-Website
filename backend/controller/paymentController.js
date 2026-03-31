const axios = require('axios');
const Inquiry = require('../models/inquiry');
const Payment = require('../models/payment');
const Booking = require('../models/booking');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API = 'https://api.paymongo.com/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://wanderwaveph.com';

// ✅ FIX: ADD COLON BEFORE BASE64 ENCODING
const authHeader = Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64');

const createInquiryCheckoutSession = async (req, res) => {
  try {
    console.log('=== INQUIRY PAYMENT START ===');
    console.log('Request Body:', req.body);
    
    const { inquiryId } = req.body;
    
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      console.error('Inquiry not found:', inquiryId);
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    console.log('Inquiry found:', {
      id: inquiry._id,
      service: inquiry.serviceName,
      price: inquiry.estimatedPrice
    });

    if (!inquiry.estimatedPrice || inquiry.estimatedPrice <= 0) {
       console.error('Invalid price:', inquiry.estimatedPrice);
       return res.status(400).json({ success: false, message: 'Invalid price amount' });
    }

    const amountInCentavos = Math.round(inquiry.estimatedPrice * 100);
    
    console.log('Amount in centavos:', amountInCentavos);
    console.log('Frontend URL:', FRONTEND_URL);

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
            payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay', 'dob', 'dob_ubp', 'qrph'],
            reference_number: inquiry._id.toString(),
            send_email_receipt: true,
            show_description: true,
            description: `Inquiry Ref: ${inquiry._id}`,
            success_url: `${FRONTEND_URL}/dashboard?success=true&inquiryId=${inquiry._id}`,
            cancel_url: `${FRONTEND_URL}/dashboard`
          }
        }
      }
    };

    console.log('Calling PayMongo API...');
    const response = await axios.request(options);
    const checkoutSessionId = response.data.data.id;

    console.log('PayMongo session created:', checkoutSessionId);

    await Payment.create({
      inquiryId: inquiry._id,
      transactionId: checkoutSessionId,
      amount: inquiry.estimatedPrice,
      serviceName: inquiry.serviceName,
      customerName: inquiry.fullName,
      customerEmail: inquiry.email,
      status: 'PENDING'
    });
    
    console.log('Payment record created in database');
    console.log('=== INQUIRY PAYMENT SUCCESS ===');

    res.json({
      success: true,
      checkoutUrl: response.data.data.attributes.checkout_url
    });

  } catch (error) {
    console.error('=== INQUIRY PAYMENT ERROR ===');
    console.error('Error message:', error.message);
    console.error('PayMongo response:', error.response?.data || 'No response data');
    console.error('Error stack:', error.stack);
    
    if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Payment creation failed',
          error: error.response?.data || error.message
        });
    }
  }
};

const createBookingPaymentIntent = async (req, res) => {
  console.log('🚀 createBookingPaymentIntent - START');

  const bookingData = req.body;

  // Basic validation
  if (!bookingData.packageName || !bookingData.email || !bookingData.totalAmount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: packageName, email, totalAmount'
    });
  }

  try {
    // ====================== 1. CREATE BOOKING FIRST (PENDING) ======================
    const newBooking = new Booking({
      ...bookingData,
      status: 'pending',                          // ← Important!
      initialPaymentAmount: bookingData.initialPaymentAmount || bookingData.totalAmount,
      remainingBalance: bookingData.paymentType === 'partial' 
        ? (bookingData.totalAmount - (bookingData.initialPaymentAmount || 0)) 
        : 0,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newBooking.save();

    console.log(`✅ BOOKING CREATED SUCCESSFULLY (PENDING) - ID: ${newBooking._id}`);

    // ====================== 2. CREATE PAYMONGO CHECKOUT SESSION ======================
    const checkoutPayload = {
      data: {
        attributes: {
          line_items: [{
            name: bookingData.packageName,
            quantity: 1,
            amount: Math.round(bookingData.totalAmount * 100), // PayMongo uses cents
            currency: bookingData.currency || 'PHP'
          }],
          payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
          success_url: `https://wanderwaveph.onrender.com/payment-success?bookingId=${newBooking._id}`,
          cancel_url: `https://wanderwaveph.onrender.com/booking`,
          metadata: {
            bookingId: newBooking._id.toString(),
            paymentType: bookingData.paymentType || 'full'
          }
        }
      }
    };

    const paymongoResponse = await axios.post(
      'https://api.paymongo.com/v1/checkout_sessions',
      checkoutPayload,
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const checkoutUrl = paymongoResponse.data.data.attributes.checkout_url;

    res.json({
      success: true,
      checkoutUrl: checkoutUrl,
      bookingId: newBooking._id.toString()
    });

  } catch (error) {
    console.error('❌ Create Intent Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment session',
      error: error.message
    });
  }
};

// ✅ Keep Payment Link option for balance payments (hindi ko ginalaw)
const createBalancePaymentLink = async (req, res) => {
  try {
    console.log('=======================================');
    console.log('BALANCE PAYMENT LINK REQUEST');
    console.log('=======================================');

    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: bookingId and amount'
      });
    }

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.paymentType !== 'partial') {
      return res.status(400).json({
        success: false,
        message: 'This booking was paid in full'
      });
    }

    if (booking.isFullyPaid && booking.isFullyPaid()) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already fully paid'
      });
    }

    if (booking.balancePaymentLinkId) {
      console.warn('Balance payment link already exists');
      return res.status(400).json({
        success: false,
        message: 'Balance payment link already exists',
        existingLinkId: booking.balancePaymentLinkId
      });
    }

    const amountInCentavos = Math.round(amount * 100);

    console.log('Balance Payment Details:', {
      bookingId: bookingId,
      balanceAmount: amount,
      amountInCentavos: amountInCentavos
    });

    const paymentLinkResponse = await axios.post(
      `${PAYMONGO_API}/links`,
      {
        data: {
          attributes: {
            amount: amountInCentavos,
            description: `${booking.packageName} - Remaining Balance - ${booking.fullName}`,
            remarks: `Balance Payment for ${booking.fullName}`,
            metadata: {
              booking_id: bookingId,
              customer_name: booking.fullName,
              customer_email: booking.email,
              package: booking.packageName,
              payment_amount: amount,
              payment_type: 'balance',
              is_balance_payment: true,
              total_amount: booking.totalAmount,
              initial_payment: booking.initialPaymentAmount
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
    
    console.log('Balance Payment Link Created:', {
      linkId: paymentLink.id,
      checkoutUrl: paymentLink.attributes.checkout_url
    });

    booking.balancePaymentLinkId = paymentLink.id;
    await booking.save();

    console.log('Booking updated with balance payment link');
    console.log('=======================================');

    return res.json({
      success: true,
      checkoutUrl: paymentLink.attributes.checkout_url,
      paymentLinkId: paymentLink.id,
      amount: amount,
      message: 'Balance payment link created successfully'
    });

  } catch (error) {
    console.error('Balance Payment Link Error:', error.message);
    
    if (error.response) {
      console.error('PayMongo API Error:', error.response.data);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create balance payment link',
      error: error.response?.data?.errors || error.message
    });
  }
};

module.exports = { 
    createInquiryCheckoutSession, 
    createBookingPaymentIntent,  
    createBalancePaymentLink 
};