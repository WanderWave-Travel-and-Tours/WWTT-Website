const axios = require('axios');
const Inquiry = require('../models/inquiry');
const Payment = require('../models/payment');
const Booking = require('../models/booking');
const TourBooking = require('../models/tourBooking'); // ✅ FIX: needed for tour payment lookup
const TransferBooking = require('../models/transferBooking'); // ✅ needed for transfer payment lookup
const CustomizedBooking = require('../models/Customizedbooking'); // ✅ needed for customized booking payment lookup
const { createGHLInvoice } = require('../utils/ghlApiService'); // ✅ Import for GHL Invoice

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API = 'https://api.paymongo.com/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://wanderwaveph.com';

// ✅ FIX: ADD COLON BEFORE BASE64 ENCODING
const authHeader = Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64');

const createInquiryCheckoutSession = async (req, res) => {
  res.locals.skipEncrypt = true;
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
  res.locals.skipEncrypt = true;
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
    // ✅ FIX: Check Booking (packages), TourBooking, TransferBooking, and CustomizedBooking collections
    // ✅ populate('packageId') para makuha ang inclusions, destination, image, etc.
    let booking = await Booking.findById(bookingId).populate('packageId');
    if (!booking) {
      console.log('Not found in Booking collection, trying TourBooking...');
      booking = await TourBooking.findById(bookingId).populate('packageId');
    }
    if (!booking) {
      console.log('Not found in TourBooking collection, trying TransferBooking...');
      booking = await TransferBooking.findById(bookingId); // ✅ FIX: TransferBooking has no packageId field
    }
    if (!booking) {
      console.log('Not found in TransferBooking collection, trying CustomizedBooking...');
      booking = await CustomizedBooking.findById(bookingId); // ✅ CustomizedBooking has no packageId field
    }
    if (!booking) {
      console.error('Booking not found in database (checked Booking, TourBooking, TransferBooking, and CustomizedBooking)');
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

    // 🔐 SECURITY: Validate the client-supplied paymentAmount. It may never exceed the
    // server-computed booking.totalAmount (no overcharge) and must be positive. The
    // booking total itself is already computed server-side at creation, so the only
    // remaining client influence here is the partial-deposit size, which we clamp.
    const serverTotal = Math.max(0, Number(booking.totalAmount) || 0);
    let amountToPay = paymentAmount != null ? parseFloat(paymentAmount) : serverTotal;

    if (!Number.isFinite(amountToPay) || amountToPay <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }
    if (amountToPay > serverTotal) {
      amountToPay = serverTotal; // never charge more than the authoritative total
    }

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
                // ✅ CustomizedBooking uses 'destination' instead of 'packageName'
                description: `${booking.packageName || booking.destination || 'Custom Trip'} - ${paymentDescription}`,
                name: booking.packageName || booking.destination || 'Custom Trip',
                quantity: 1
              }
            ],
            payment_method_types: paymentMethods,
            reference_number: bookingId,
            send_email_receipt: true,
            show_description: true,
            // ✅ CustomizedBooking uses 'fullName' directly (same field name, safe)
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

// ✅ UPDATED: Balance payment now uses Checkout Session (consistent with initial payment)
const createBalanceCheckoutSession = async (req, res) => {
  res.locals.skipEncrypt = true;
  try {
    console.log('=======================================');
    console.log('BALANCE PAYMENT CHECKOUT SESSION START');
    console.log('=======================================');

    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: bookingId'
      });
    }

    const booking = await Booking.findById(bookingId).populate('packageId');

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

    // 🔐 SECURITY: The balance amount is taken from the server-stored remainingBalance,
    // NOT from the request body. The webhook clears the entire balance regardless of the
    // amount actually charged, so trusting a client-supplied amount would let a customer
    // pay ₱1 to wipe out a ₱50,000 balance. remainingBalance is the single source of truth.
    const amount = Math.max(0, Number(booking.remainingBalance) || 0);

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No outstanding balance to pay for this booking'
      });
    }

    const amountInCentavos = Math.round(amount * 100);

    console.log('Balance Payment Details:', {
      bookingId,
      balanceAmount: amount,
      amountInCentavos
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
                name: `Balance Payment - ${booking.packageName}`,
                description: `Remaining balance for booking ${booking._id}`,
                quantity: 1
              }
            ],
            payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay', 'dob', 'dob_ubp', 'qrph'],
            reference_number: booking._id.toString(),
            send_email_receipt: true,
            show_description: true,
            description: `Balance Payment for ${booking.fullName}`,
            success_url: `${FRONTEND_URL}/payment-success?booking_id=${booking._id}&paymentType=balance`,
            cancel_url: `${FRONTEND_URL}/dashboard`,
            metadata: {
              booking_id:           booking._id.toString(),
              payment_type:         'balance',
              is_balance_payment:   'true',
              remaining_balance:    String(booking.remainingBalance),
              customer_name:        booking.fullName,
              customer_email:       booking.email,
              package:              booking.packageName,
              total_amount:         String(booking.totalAmount),
              initial_payment:      String(booking.initialPaymentAmount),
              start_date:           booking.startDate,
              end_date:             booking.endDate,
            }
          }
        }
      }
    };

    const response = await axios.request(checkoutOptions);
    const checkoutSession = response.data.data;

    console.log('Balance Checkout Session Created:', {
      sessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.attributes.checkout_url
    });

    // ✅ Save the balance checkout session ID to the booking
    booking.balancePaymentId = checkoutSession.id;
    await booking.save();

    console.log('Booking updated with balance checkout session ID');
    console.log('=======================================');

    return res.json({
      success: true,
      checkoutUrl: checkoutSession.attributes.checkout_url,
      checkoutSessionId: checkoutSession.id,
      amount: amount,
      message: 'Balance checkout session created successfully'
    });

  } catch (error) {
    console.error('Balance Checkout Session Error:', error.message);

    if (error.response) {
      console.error('PayMongo API Error:', error.response.data);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create balance checkout session',
      error: error.response?.data?.errors || error.message
    });
  }
};

module.exports = { 
    createInquiryCheckoutSession, 
    createBookingPaymentIntent,  // ✅ Updated export name
    createBalanceCheckoutSession // ✅ Updated: uses Checkout Session instead of Payment Link
};