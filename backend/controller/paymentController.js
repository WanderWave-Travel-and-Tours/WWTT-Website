const axios = require('axios');
const Inquiry = require('../models/inquiry');
const Payment = require('../models/payment');
const Booking = require('../models/booking');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API = 'https://api.paymongo.com/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://wanderwaveph.com';

// ✅ FIX: ADD COLON BEFORE BASE64 ENCODING
const authHeader = Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64');

// ==================== VERSION MARKER ====================
console.log('🚀 PAYMENT CONTROLLER v2026-04-01-FINAL-DUAL-v3 - DUAL FLOW ACTIVE (BookingFormModal + bookingId)');
// ========================================================

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
  console.log('🚀 createBookingPaymentIntent - START (v2026-04-01-FINAL-DUAL-v3)');
  console.log('Body keys received:', Object.keys(req.body));

  const body = req.body;

  try {
    let booking;

    // === CASE 1: May bookingId (galing sa BookingRightForm) ===
    if (body.bookingId) {
      console.log(`📦 Using existing bookingId: ${body.bookingId}`);
      booking = await Booking.findById(body.bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: `Booking not found for id: ${body.bookingId}`
        });
      }

      if (body.paymentType) booking.paymentType = body.paymentType;
      if (body.paymentAmount) {
        booking.initialPaymentAmount = body.paymentAmount;
        booking.remainingBalance = body.paymentType === 'partial'
          ? (booking.totalAmount - body.paymentAmount)
          : 0;
      }
      await booking.save();

    // === CASE 2: Walang bookingId → BookingFormModal (ITO ANG GINAGAMIT NG MODAL) ===
    } else {
      console.log('📋 No bookingId detected → Creating NEW booking from BookingFormModal full data');
      console.log('Package Name:', body.packageName);
      console.log('Email:', body.email);
      console.log('Total Amount:', body.totalAmount);

      if (!body.packageName || !body.email || !body.totalAmount) {
        console.log('❌ Missing required fields in modal data:', Object.keys(body));
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: packageName, email, totalAmount'
        });
      }

      booking = new Booking({
        ...body,
        status: 'pending',
        initialPaymentAmount: body.initialPaymentAmount || body.totalAmount,
        remainingBalance: body.paymentType === 'partial'
          ? (body.totalAmount - (body.initialPaymentAmount || 0))
          : 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await booking.save();
      console.log(`✅ NEW BOOKING CREATED FROM MODAL - ID: ${booking._id}`);
    }

    // ====================== PAYMONGO CHECKOUT SESSION ======================
    const amountToPay = booking.initialPaymentAmount || booking.totalAmount;
    const isPartial = booking.paymentType === 'partial';
    const paymentDescription = isPartial ? 'Initial Payment' : 'Full Payment';

    const checkoutPayload = {
      data: {
        attributes: {
          line_items: [{
            name: booking.packageName,
            quantity: 1,
            amount: Math.round(amountToPay * 100),
            currency: 'PHP'
          }],
          payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
          success_url: `https://wanderwaveph.onrender.com/payment-success?bookingId=${booking._id}`,
          cancel_url: `https://wanderwaveph.onrender.com/booking`,
          description: `${paymentDescription} for ${booking.fullName}`,
          metadata: {
            bookingId: booking._id.toString(),
            paymentType: booking.paymentType || 'full'
          }
        }
      }
    };

    const response = await axios.post(
      'https://api.paymongo.com/v1/checkout_sessions',
      checkoutPayload,
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const checkoutUrl = response.data.data.attributes.checkout_url;

    res.json({
      success: true,
      checkoutUrl: checkoutUrl,
      bookingId: booking._id.toString()
    });

  } catch (error) {
    console.error('❌ Create Intent Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
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