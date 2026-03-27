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

// ✅ UPDATED: Changed from Payment Link to Checkout Session
// ✅ FINAL VERSION - NO BOOKING CREATION UNTIL PAYMENT IS RECEIVED
const createBookingPaymentIntent = async (req, res) => {
  try {
    console.log('=======================================');
    console.log('BOOKING PAYMENT - CHECKOUT SESSION START (NO BOOKING CREATION YET)');
    console.log('=======================================');
    console.log('Full Booking Data Received:', JSON.stringify(req.body, null, 2));   // ← Detailed log

    const bookingData = req.body;
console.log('🔍 FULL REQUEST BODY RECEIVED:', JSON.stringify(bookingData, null, 2));
console.log('🔑 Keys received:', Object.keys(bookingData));
    // ✅ IMPROVED VALIDATION - Mas malinaw kung ano ang kulang
    const missingFields = [];
    if (!bookingData.packageName) missingFields.push('packageName');
    if (!bookingData.totalAmount && bookingData.totalAmount !== 0) missingFields.push('totalAmount');
    if (!bookingData.fullName) missingFields.push('fullName');
    if (!bookingData.email) missingFields.push('email');

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      console.error('🔑 Keys actually received:', Object.keys(bookingData));
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        receivedKeys: Object.keys(bookingData)
      });
    }

    const amountToPay = bookingData.initialPaymentAmount || bookingData.totalAmount;
    const amountInCentavos = Math.round(amountToPay * 100);

    const isPartial = bookingData.paymentType === 'partial';
    const paymentDescription = isPartial ? 'Initial Payment' : 'Full Payment';

    console.log('Payment Details:', {
      paymentType: bookingData.paymentType || 'full',
      amountToPay: amountToPay,
      amountInCentavos: amountInCentavos,
      isPartial: isPartial
    });

    // ✅ CLEAN BOOKING DATA PARA SA WEBHOOK (pinanatili ko ang dati mong version)
    const cleanBookingData = {
      packageName: bookingData.packageName,
      packageId: bookingData.packageId,
      fullName: bookingData.fullName,
      email: bookingData.email,
      totalAmount: bookingData.totalAmount,
      initialPaymentAmount: bookingData.initialPaymentAmount || bookingData.totalAmount,
      paymentType: bookingData.paymentType || 'full',
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      duration: bookingData.duration,
      pax: bookingData.pax,
      passengers: bookingData.passengers || [],
      includesAirfare: bookingData.includesAirfare || false,
      selectedFlight: bookingData.selectedFlight || null,
      selectedRoomType: bookingData.selectedRoomType || null,
      isCustomized: bookingData.isCustomized || false,
      customizationAdditionalPrice: bookingData.customizationAdditionalPrice || 0,
      customizedInclusions: bookingData.customizedInclusions || [],
      price: bookingData.price || bookingData.totalAmount || 0,
      markup: bookingData.markup || 0,
      sellerPrice: bookingData.sellerPrice || bookingData.basePrice || 0,
      finalPackageTotal: bookingData.finalPackageTotal || bookingData.totalAmount || 0,
      packageTotal: bookingData.packageTotal || bookingData.totalAmount || 0,
      timerExpiredAtBooking: bookingData.timerExpiredAtBooking || false,
      promoId: bookingData.promoId || null,
    };

    console.log('🧹 Cleaned bookingData for webhook metadata:', {
      hasSelectedRoomType: !!cleanBookingData.selectedRoomType,
      finalPackageTotal: cleanBookingData.finalPackageTotal,
      price: cleanBookingData.price
    });

    const checkoutOptions = {
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
                description: `${bookingData.packageName} - ${paymentDescription}`,
                name: bookingData.packageName,
                quantity: 1
              }
            ],
            payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay', 'dob', 'dob_ubp', 'qrph'],
            reference_number: `WW-${Date.now()}`,
            send_email_receipt: true,
            show_description: true,
            description: `${paymentDescription} for ${bookingData.fullName}`,
            success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/packages`,
            metadata: {
              rawBookingData: JSON.stringify(cleanBookingData),
              payment_type: bookingData.paymentType || 'full',
              is_initial_payment: true,
              customer_name: bookingData.fullName,
              customer_email: bookingData.email,
              package_name: bookingData.packageName,
              total_amount: bookingData.totalAmount,
              includes_airfare: bookingData.includesAirfare || false
            }
          }
        }
      }
    };

    const response = await axios.request(checkoutOptions);
    const checkoutSession = response.data.data;

    console.log('✅ PayMongo Checkout Session Created Successfully');
    console.log('Session ID:', checkoutSession.id);
    console.log('Checkout URL:', checkoutSession.attributes.checkout_url);

    return res.json({
      success: true,
      checkoutUrl: checkoutSession.attributes.checkout_url,
      checkoutSessionId: checkoutSession.id,
      message: 'Checkout session created - booking will be created only after successful payment'
    });

  } catch (error) {
    console.error('=======================================');
    console.error('BOOKING CHECKOUT SESSION ERROR');
    console.error('=======================================');
    console.error('Error Message:', error.message);
    
    if (error.response) {
      console.error('PayMongo API Error Status:', error.response.status);
      console.error('PayMongo Error Data:', JSON.stringify(error.response.data, null, 2));
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.response?.data?.errors || error.message
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