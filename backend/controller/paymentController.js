const axios = require('axios');
const Inquiry = require('../models/inquiry');
const Payment = require('../models/payment');
const Booking = require('../models/booking');
const TourBooking = require('../models/tourBooking'); // ✅ FIX: needed for tour payment lookup
const TransferBooking = require('../models/transferBooking'); // ✅ needed for transfer payment lookup
const { createGHLInvoice } = require('../utils/ghlApiService'); // ✅ Import for GHL Invoice

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

    // 🔥 GHL INVOICE TRIGGER: Fire-and-forget after PayMongo session is created
    if (inquiry.ghlContactId) {
      createGHLInvoice(inquiry.ghlContactId, {
        serviceName: inquiry.serviceName,
        paxCount: inquiry.paxCount,
        totalAmount: inquiry.estimatedPrice,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      }).catch(err => console.log('GHL Invoice background error skipped:', err.message));
    }

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
const createBookingPaymentIntent = async (req, res) => {
  try {
    console.log('=======================================');
    console.log('BOOKING PAYMENT CHECKOUT SESSION START');
    console.log('=======================================');
    console.log('Request Body:', req.body);

    const { bookingId, paymentType, paymentAmount, method } = req.body;

    if (!bookingId) {
      console.error('Missing bookingId in request body');
      return res.status(400).json({
        success: false,
        message: 'Missing required field: bookingId'
      });
    }

    console.log('BookingId received:', bookingId);
    console.log('Payment Type:', paymentType || 'full');
    console.log('Payment Amount:', paymentAmount);
    console.log('Payment Method:', method);

    console.log('Searching for booking in database...');
    // ✅ FIX: Check Booking (packages), TourBooking, and TransferBooking collections
    // ✅ populate('packageId') para makuha ang inclusions, destination, image, etc.
    let booking = await Booking.findById(bookingId).populate('packageId');
    if (!booking) {
      console.log('Not found in Booking collection, trying TourBooking...');
      booking = await TourBooking.findById(bookingId).populate('packageId');
    }
    if (!booking) {
      console.log('Not found in TourBooking collection, trying TransferBooking...');
      booking = await TransferBooking.findById(bookingId).populate('packageId');
    }
    if (!booking) {
      console.error('Booking not found in database (checked both Booking and TourBooking)');
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        searchedId: bookingId
      });
    }

    console.log('Booking found:', {
      id: booking._id,
      packageName: booking.packageName,
      totalAmount: booking.totalAmount,
      status: booking.status
    });

    const amountToPay = paymentAmount || booking.totalAmount;
    const amountInCentavos = Math.round(amountToPay * 100);
    
    const isPartial = paymentType === 'partial';
    const paymentDescription = isPartial 
      ? `Initial Payment (${paymentType === 'partial' && booking.includesAirfare ? '85%' : '50%'})`
      : 'Full Payment';

    console.log('Payment Details:', {
      paymentType: paymentType || 'full',
      amountToPay: amountToPay,
      amountInCentavos: amountInCentavos,
      totalAmount: booking.totalAmount,
      description: paymentDescription
    });

    // ✅ Determine which payment methods to enable based on user selection
    let paymentMethods = ['card', 'gcash', 'paymaya', 'grab_pay', 'dob', 'dob_ubp', 'qrph'];
    
    // If user selected specific method, prioritize it (optional - you can keep all methods available)
    if (method) {
      console.log('User selected payment method:', method);
    }

    console.log('Creating Checkout Session...');

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
                description: `${booking.packageName} - ${paymentDescription}`,
                name: booking.packageName,
                quantity: 1
              }
            ],
            payment_method_types: paymentMethods,
            reference_number: bookingId,
            send_email_receipt: true,
            show_description: true,
            description: `${paymentDescription} for ${booking.fullName}`,
            // ✅ IMPORTANT: Use booking_id (with underscore) to match existing success page
            success_url: `${FRONTEND_URL}/payment-success?booking_id=${bookingId}&paymentType=${paymentType || 'full'}`,
            cancel_url: `${FRONTEND_URL}/packages`,
            metadata: {
              // ─── Booking Identity ─────────────────────────────────────
              booking_id:     bookingId,
              booking_status: booking.status || 'pending',

              // ─── Customer Info ────────────────────────────────────────
              customer_name:  booking.fullName,
              customer_email: booking.email,
              customer_phone: booking.phone || booking.contactNumber || '',

              // ─── Package Info ─────────────────────────────────────────
              package:       booking.packageName,
              destination:   booking.packageId?.destination || '',
              duration:      booking.packageId?.duration    || booking.duration || '',
              tour_type:     booking.packageId?.tourType    || '',
              package_image: booking.packageId?.image       || '',

              // ─── Travel Dates ─────────────────────────────────────────
              start_date:   booking.startDate,
              end_date:     booking.endDate,
              travel_dates: `${booking.startDate} to ${booking.endDate}`,

              // ─── Pax Breakdown ────────────────────────────────────────
              pax_adult:   String(booking.pax?.adult    || 1),
              pax_child:   String(booking.pax?.children || 0),
              pax_infant:  String(booking.pax?.infants  || 0),
              pax_senior:  String(booking.pax?.senior   || 0),
              pax_total:   String(
                             (booking.pax?.adult    || 1) +
                             (booking.pax?.children || 0) +
                             (booking.pax?.infants  || 0) +
                             (booking.pax?.senior   || 0)
                           ),

              // ─── Payment Info ─────────────────────────────────────────
              total_amount:       String(booking.totalAmount),
              payment_amount:     String(amountToPay),
              payment_type:       paymentType || 'full',
              is_initial_payment: String(isPartial),
              includes_airfare:   String(booking.includesAirfare || false),
              remaining_balance:  String(booking.remainingBalance || 0),

              // ─── Add-ons / Room ───────────────────────────────────────
              selected_room_type: booking.selectedRoomType  || '',
              hotel_name:         booking.hotelName         || '',
              number_of_rooms:    String(booking.numberOfRooms || ''),

              // ─── Promo ────────────────────────────────────────────────
              promo_code:     booking.promoCode         || '',
              promo_discount: String(booking.discountAmount || 0),

              // ─── Notes ────────────────────────────────────────────────
              booking_notes: booking.message || '',

              // ─── Inclusions — one field per item (inclusion_1, inclusion_2, ...) ─
              // Source: packageId.inclusions (populated), schema: [String]
              ...(() => {
                const raw = booking.packageId?.inclusions || [];
                const result = {};
                raw.forEach((item, i) => {
                  if (typeof item === 'string' && item.trim()) {
                    result[`inclusion_${i + 1}`] = item.trim();
                  }
                });
                result['inclusions_count'] = String(raw.filter(i => typeof i === 'string' && i.trim()).length);
                return result;
              })(),

              // ─── Itinerary — one field per day (itinerary_1, itinerary_2, ...) ─
              // Source: booking.itinerary (snapshotted), schema: [{ day, title, activities: [String] }]
              ...(() => {
                const raw = booking.itinerary || [];
                const result = {};
                raw.forEach((day, i) => {
                  const label = day.day   ? `Day ${day.day}` : `Day ${i + 1}`;
                  const title = day.title || '';
                  const acts  = Array.isArray(day.activities) && day.activities.length > 0
                    ? day.activities.join(' | ')
                    : '';
                  const full = [label + (title ? ': ' + title : ''), acts].filter(Boolean).join(' — ');
                  result[`itinerary_${i + 1}`] = full.length > 500 ? full.substring(0, 497) + '...' : full;
                });
                result['itinerary_count'] = String(raw.length);
                return result;
              })(),
            }
          }
        }
      }
    };

    const response = await axios.request(checkoutOptions);
    const checkoutSession = response.data.data;
    
    console.log('PayMongo Checkout Session Created:', {
      sessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.attributes.checkout_url,
      referenceNumber: checkoutSession.attributes.reference_number
    });

    // ✅ Update booking with checkout session details
    booking.checkoutSessionId = checkoutSession.id;
    booking.referenceNumber = checkoutSession.attributes.reference_number;
    booking.paymentType = paymentType || 'full';
    booking.initialPaymentAmount = amountToPay;

    // ✅ UPDATED: Always compute remainingBalance regardless of paymentType
    // This is the source of truth used later to determine confirmed vs partial_paid
    const newRemainingBalance = booking.totalAmount - amountToPay;
    booking.remainingBalance = Math.max(0, newRemainingBalance);

    console.log('Remaining Balance Computed:', {
      totalAmount: booking.totalAmount,
      amountToPay: amountToPay,
      remainingBalance: booking.remainingBalance
    });
    
    await booking.save();

    console.log('Booking updated with checkout session details');
    console.log('=======================================');
    console.log('CHECKOUT SESSION CREATED SUCCESSFULLY');
    console.log('=======================================');

    return res.json({
      success: true,
      checkoutUrl: checkoutSession.attributes.checkout_url,
      checkoutSessionId: checkoutSession.id,
      referenceNumber: checkoutSession.attributes.reference_number,
      bookingId: bookingId,
      paymentType: paymentType || 'full',
      paymentAmount: amountToPay,
      message: 'Checkout session created successfully'
    });

  } catch (error) {
    console.error('=======================================');
    console.error('BOOKING CHECKOUT SESSION ERROR');
    console.error('=======================================');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    
    if (error.response) {
      console.error('PayMongo API Error:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.response?.data?.errors || error.message
    });
  }
};

// ✅ Keep Payment Link option for balance payments
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
            description: `Payment for ${booking.packageName} - ${booking.fullName} (${booking.startDate} - ${booking.endDate})`,
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
    createBookingPaymentIntent,  // ✅ Updated export name
    createBalancePaymentLink 
};