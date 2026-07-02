const axios = require('axios');
// ✅ Idagdag ito: I-import ang Destination model
const Destination = require('../models/destination');

const GHL_WEBHOOK_URL = process.env.GHL_NEW_USER_WEBHOOK_URL;

// ─── Destination webhook URL ───────────────────────────────────────────────
// Add GHL_DESTINATION_WEBHOOK_URL to your .env file and paste this URL there.
const GHL_DESTINATION_WEBHOOK_URL =
    process.env.GHL_DESTINATION_WEBHOOK_URL ||
    'https://services.leadconnectorhq.com/hooks/yTzQYPFRZAWXGWiXtIt2/webhook-trigger/59049139-9453-4291-88bf-f2cb8ea80926';

const sendToGHLWebhook = async (webhookUrl, data) => {
  try {
    console.log('🚀 Attempting to send to GHL...');
    console.log('📍 Webhook URL:', webhookUrl);
    console.log('📦 Payload:', JSON.stringify(data, null, 2));

    if (!webhookUrl) {
      console.error('❌ Webhook URL is not defined!');
      return { 
        success: false, 
        error: 'Webhook URL is not configured in environment variables' 
      };
    }

    const cleanUrl = webhookUrl.trim();

    const response = await axios.post(cleanUrl, data, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ GHL Response Status:', response.status);
    console.log('✅ GHL Response Data:', response.data);
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('❌ GHL Webhook Error Details:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    console.error('Full URL used:', webhookUrl);
    
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

const sendNewUserToGHL = async (email, fullName, tempPassword, serviceName) => {
  const firstName = fullName.split(' ')[0] || '';
  const lastName = fullName.split(' ').slice(1).join(' ') || '';

  const data = {
    type: 'NEW_USER',
    email: email,
    fullName: fullName,
    name: fullName,
    first_name: firstName,
    last_name: lastName,
    password: tempPassword,
    tempPassword: tempPassword,
    service: serviceName,
    serviceName: serviceName,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    source: 'WanderWave',
    event: 'new_user_registration'
  };

  console.log('📤 Sending NEW_USER to GHL:');
  console.log(JSON.stringify(data, null, 2));
  
  const result = await sendToGHLWebhook(GHL_WEBHOOK_URL, data);
  
  if (!result.success) {
    console.error('❌ Failed to send to GHL:', result.error);
  }
  
  return result;
};

const sendInquiryToGHL = async (email, fullName, serviceName, message) => {
  const firstName = fullName.split(' ')[0] || '';
  const lastName = fullName.split(' ').slice(1).join(' ') || '';

  const data = {
    type: 'INQUIRY_CONFIRMATION',
    email: email,
    fullName: fullName,
    name: fullName,
    first_name: firstName,
    last_name: lastName,
    service: serviceName,
    serviceName: serviceName,
    typeOfBooking: 'Inquiry',
    bookingTypeLabel: 'Inquiry',
    bookingName: serviceName,
    message: message,
    inquiry_message: message,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    source: 'WanderWave',
    event: 'inquiry_submission'
  };

  console.log('📤 Sending INQUIRY to GHL:');
  console.log(JSON.stringify(data, null, 2));
  
  return await sendToGHLWebhook(GHL_WEBHOOK_URL, data);
};

// ✅ Helper: Format inclusions array into a readable string
const formatInclusions = (inclusions) => {
  if (!inclusions || !Array.isArray(inclusions) || inclusions.length === 0) return '';
  return inclusions
    .map((item, index) => {
      if (typeof item === 'string') return `${index + 1}. ${item}`;
      if (typeof item === 'object') return `${index + 1}. ${item.name || item.text || item.title || JSON.stringify(item)}`;
      return `${index + 1}. ${item}`;
    })
    .join('\n');
};

// ✅ Helper: Format itinerary array into a readable string
const formatItinerary = (itinerary) => {
  if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) return '';
  return itinerary
    .map((day) => {
      if (typeof day === 'string') return day;
      if (typeof day === 'object') {
        const dayLabel = day.day ? `Day ${day.day}` : '';
        const title = day.title || day.name || '';
        const header = [dayLabel, title].filter(Boolean).join(': ');

        let activities = '';
        if (Array.isArray(day.activities)) {
          activities = day.activities
            .map((act) => {
              if (typeof act === 'string') return `  • ${act}`;
              if (typeof act === 'object') return `  • ${act.time ? act.time + ' — ' : ''}${act.description || act.name || act.text || JSON.stringify(act)}`;
              return `  • ${act}`;
            })
            .join('\n');
        } else if (typeof day.activities === 'string') {
          activities = `  ${day.activities}`;
        } else if (day.description) {
          activities = `  ${day.description}`;
        }

        return [header, activities].filter(Boolean).join('\n');
      }
      return String(day);
    })
    .join('\n\n');
};

const sendBookingConfirmationToGHL = async (
  email,
  fullName,
  packageName,
  totalAmount,
  startDate,
  endDate,
  passengerCount,
  packageData,
  bookingData
) => {
  const firstName = fullName.split(' ')[0] || '';
  const lastName = fullName.split(' ').slice(1).join(' ') || '';

  const checkedCustomizedInclusions = Array.isArray(bookingData?.customizedInclusions)
    ? bookingData.customizedInclusions.filter(inc => inc.isChecked !== false)
    : null;

  const inclusions  = (checkedCustomizedInclusions && checkedCustomizedInclusions.length > 0)
    ? checkedCustomizedInclusions
    : (packageData?.inclusions || bookingData?.inclusions || []);
  const itinerary   = packageData?.itinerary   || bookingData?.itinerary   || [];
  const hotels      = packageData?.hotels      || bookingData?.hotels      || [];
  const exclusions  = packageData?.exclusions  || bookingData?.exclusions  || [];
  const highlights  = packageData?.highlights  || bookingData?.highlights  || [];

  const inclusionsFormatted  = formatInclusions(inclusions);
  const itineraryFormatted   = formatItinerary(itinerary);

  const booking = bookingData || {};

  const paxAdult    = booking.pax?.adult    || passengerCount || 1;
  const paxChild    = booking.pax?.child    || 0;
  const paxInfant   = booking.pax?.infant   || 0;
  const paxSenior   = booking.pax?.senior   || 0;
  const paxTotal    = paxAdult + paxChild + paxInfant + paxSenior;

  const passengersFormatted = Array.isArray(booking.passengers) && booking.passengers.length > 0
    ? booking.passengers
        .map((p, i) => `Passenger ${i + 1}: ${p.firstName || ''} ${p.lastName || ''}`.trim())
        .join('\n')
    : '';

  const paymentType         = booking.paymentType === 'partial' ? 'Partial Payment' : 'Full Payment';
  const initialPaymentAmount = booking.initialPaymentAmount || totalAmount;
  const remainingBalance    = booking.remainingBalance || 0;
  const includesAirfare     = booking.includesAirfare ? 'Yes' : 'No';

  const selectedRoomType    = booking.selectedRoomType || '';
  const hotelName           = booking.hotelName || packageData?.defaultHotel || '';
  const numberOfRooms       = booking.numberOfRooms || '';
  const promoCode           = booking.promoCode || '';
  const promoDiscount       = booking.promoDiscount || 0;

  // ============================================================
  // ✅ NEW: Fetch Destination Data for Personalization
  // ============================================================
  const destName = packageData?.destination || booking.destination || '';
  let destinationPayload = {};

  if (destName) {
    try {
      // Hanapin ang destination sa DB na nag-match sa pangalan (case-insensitive)
      const destRecord = await Destination.findOne({
        name: { $regex: `^${destName.trim()}$`, $options: 'i' },
        isArchive: 'No'
      });

      if (destRecord) {
        // Gamitin ang built-in method na ginawa mo sa destination.js model
        // para makuha ang destination_greeting, tip1-5, at emergency_number
        destinationPayload = destRecord.toWebhookPayload();
        console.log(`✅ Destination data attached for Onboarding Kit: ${destName}`);
      }
    } catch (err) {
      console.error('⚠️ Failed to fetch destination data for webhook:', err.message);
      // Itutuloy pa rin ang webhook kahit mag-fail ito
    }
  }
  // ============================================================

  const data = {
    type: 'BOOKING_CONFIRMATION',
    bookingTypeLabel: 'Booking Confirmation',
    event: 'booking_confirmation',
    source: 'WanderWave',
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),

    email:      email,
    fullName:   fullName,
    name:       fullName,
    first_name: firstName,
    last_name:  lastName,
    phone:      booking.phone || booking.contactNumber || '',

    packageName:        packageName,
    package_name:       packageName,
    service:            packageName,
    serviceName:        packageName,
    bookingName:        packageName,
    package_image_url:  packageData?.image || '',
    package_destination: destName,
    package_duration:   packageData?.duration     || booking.duration    || '',

    // ✅ I-spread ang destination data sa payload
    ...destinationPayload,

    package_category:   packageData?.category     || '',
    package_tour_type:  packageData?.tourType     || booking.tourType    || '',
    package_min_pax:    packageData?.minPax       || '',

    package_inclusions:      inclusionsFormatted,
    package_inclusions_raw:  JSON.stringify(inclusions),

    package_itinerary:      itineraryFormatted,
    package_itinerary_raw:  JSON.stringify(itinerary),

    package_exclusions:  Array.isArray(exclusions) ? exclusions.join('\n') : exclusions,
    package_highlights:  Array.isArray(highlights) ? highlights.join('\n') : highlights,
    package_hotels:      JSON.stringify(hotels),

    startDate:     startDate,
    start_date:    startDate,
    travel_start:  startDate,
    endDate:       endDate,
    end_date:      endDate,
    travel_end:    endDate,
    travel_dates:  `${startDate} to ${endDate}`,

    passengerCount:  passengerCount,
    passenger_count: passengerCount,
    passengers:      passengerCount,
    pax:             passengerCount,
    pax_adult:       paxAdult,
    pax_child:       paxChild,
    pax_infant:      paxInfant,
    pax_senior:      paxSenior,
    pax_total:       paxTotal,
    passengers_list: passengersFormatted,

    totalAmount:             `₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    totalAmountFormatted:    `₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    total_amount:            totalAmount,
    amount:                  totalAmount,
    payment_type:            paymentType,
    initial_payment_amount:  initialPaymentAmount,
    remaining_balance:       remainingBalance,
    includes_airfare:        includesAirfare,

    selected_room_type:  selectedRoomType,
    hotel_name:          hotelName,
    number_of_rooms:     numberOfRooms,

    promo_code:     promoCode,
    promo_discount: promoDiscount,

    bookingId:    booking._id ? booking._id.toString() : '',
    booking_id:   booking._id ? booking._id.toString() : '',
    status:         booking.status || 'pending',
    booking_status: booking.status || 'pending',
    bookingDate:  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    booking_date: new Date().toISOString(),
    booking_notes: booking.notes || booking.specialRequests || '',
  };

  console.log('📤 Sending BOOKING_CONFIRMATION to GHL:');
  console.log(JSON.stringify(data, null, 2));

  const result = await sendToGHLWebhook(GHL_WEBHOOK_URL, data);
  
  if (!result.success) {
    console.error('❌ Failed to send booking confirmation to GHL:', result.error);
  }
  
  return result;
};

// ============================================================
// ✅ NEW: Send destination personalization data to GHL
//
// Triggered every time admin saves (creates or updates) a destination
// in the Campaigns page. GHL automation receives this payload and
// stores the destination fields as custom values — which are then
// available in the "while you're traveling" email template.
//
// Payload shape sent to GHL:
// {
//   type:                    "DESTINATION_UPDATE",
//   event:                   "destination_saved",
//   source:                  "WanderWave",
//   destination:             "Palawan",
//   destination_greeting:    "Enjoy the crystal-clear waters...",
//   destination_tip1:        "Bring reef-safe sunscreen",
//   destination_tip2:        "...",
//   destination_tip3:        "...",
//   destination_tip4:        "...",
//   destination_tip5:        "...",
//   emergency_number:        "911 (Philippines)",
//   timestamp:               "2026-04-24T..."
// }
// ============================================================
const sendDestinationToGHL = async (destination) => {
    // destination.toWebhookPayload() returns the standard shape from the model:
    // { destination, destination_greeting, destination_tip1..5, emergency_number }
    const destinationPayload = destination.toWebhookPayload();

    const data = {
        type:      'DESTINATION_UPDATE',
        event:     'destination_saved',
        source:    'WanderWave',
        timestamp: new Date().toISOString(),
        ...destinationPayload,
    };

    console.log('📤 Sending DESTINATION_UPDATE to GHL:');
    console.log(JSON.stringify(data, null, 2));

    const result = await sendToGHLWebhook(GHL_DESTINATION_WEBHOOK_URL, data);

    if (!result.success) {
        console.error('❌ Failed to send destination to GHL:', result.error);
    } else {
        console.log(`✅ Destination "${destination.name}" synced to GHL successfully.`);
    }

    return result;
};

// ============================================================
// ✅ Shared "booking automation" webhook
//
// This is the single GHL automation (a.k.a. the "inquiry automation")
// that fires for EVERY booking type: transfer, tour, and customized.
// All three booking flows post to this same workflow trigger URL so the
// automation handles every new booking uniformly.
//
// Webhook URL: https://services.leadconnectorhq.com/hooks/yTzQYPFRZAWXGWiXtIt2/webhook-trigger/fd8ffa44-1198-4891-999b-de2062a79176
// ============================================================
const GHL_BOOKING_WEBHOOK_URL =
  process.env.GHL_BOOKING_WEBHOOK_URL ||
  process.env.GHL_TRANSFER_BOOKING_WEBHOOK_URL ||
  'https://services.leadconnectorhq.com/hooks/yTzQYPFRZAWXGWiXtIt2/webhook-trigger/fd8ffa44-1198-4891-999b-de2062a79176';

// Backward-compat alias — transfer booking previously used this name.
const GHL_TRANSFER_BOOKING_WEBHOOK_URL = GHL_BOOKING_WEBHOOK_URL;

const sendTransferBookingToGHL = async (booking, overrides = {}) => {
  const fullName   = booking.fullName || '';
  const firstName  = fullName.split(' ')[0] || '';
  const lastName   = fullName.split(' ').slice(1).join(' ') || '';

  const data = {
    // ── Meta ──────────────────────────────────────────────────
    type:      'TRANSFER_BOOKING',
    bookingTypeLabel: 'Transfer Booking',
    event:     'transfer_booking_created',
    source:    'WanderWave',
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),

    // ── Booking identity ──────────────────────────────────────
    bookingId:        booking._id ? booking._id.toString() : '',
    booking_id:       booking._id ? booking._id.toString() : '',
    referenceNumber:  booking.referenceNumber || '',
    reference_number: booking.referenceNumber || '',
    bookingType:      booking.bookingType     || 'transfer',
    createdByType:    booking.createdByType   || 'customer',
    status:           booking.status          || 'pending',
    paymentStatus:    booking.paymentStatus   || 'pending',
    isArchive:        booking.isArchive       || 'No',
    booking_created_at: booking.createdAt ? new Date(booking.createdAt).toISOString() : '',

    // ── Transfer listing ──────────────────────────────────────
    transferId:      booking.transferId ? booking.transferId.toString() : '',
    activityName:    booking.activityName    || '',
    transferName:    booking.activityName    || '',
    transfer_name:   booking.activityName    || '',
    serviceName:     booking.activityName    || '',
    service:         booking.activityName    || '',
    bookingName:     booking.activityName    || '',
    destination:     booking.destination     || '',
    category:        booking.category        || '',
    supplierName:    booking.supplierName    || '',
    supplier:        booking.supplierName    || '',

    // ── Trip type ─────────────────────────────────────────────
    transferType:    booking.transferType    || 'oneway',
    transfer_type:   booking.transferType    || 'oneway',

    // ── Schedule ─────────────────────────────────────────────
    travelDate:      booking.travelDate      || '',
    travel_date:     booking.travelDate      || '',
    returnDate:      booking.returnDate      || '',
    return_date:     booking.returnDate      || '',
    travel_dates:    `${booking.travelDate || ''}${booking.returnDate ? ' to ' + booking.returnDate : ''}`,
    arrivalTime:     booking.arrivalTime     || '',
    arrival_time:    booking.arrivalTime     || '',
    departureTime:   booking.departureTime   || '',
    departure_time:  booking.departureTime   || '',

    // ── Locations ─────────────────────────────────────────────
    pickupLocation:  booking.pickupLocation  || '',
    pickup_location: booking.pickupLocation  || '',
    dropoffLocation: booking.dropoffLocation || '',
    dropoff_location:booking.dropoffLocation || '',
    route:           [booking.pickupLocation, booking.dropoffLocation].filter(Boolean).join(' → '),

    // ── Contact details ───────────────────────────────────────
    fullName,
    name:            fullName,
    first_name:      firstName,
    last_name:       lastName,
    email:           booking.email           || '',
    phone:           booking.phone           || '',
    nationality:     booking.nationality     || '',
    message:         booking.message         || '',
    notes:           booking.notes           || '',
    specialRequests: booking.specialRequests || '',
    special_requests:booking.specialRequests || '',

    // ── Passengers & Pricing ──────────────────────────────────
    passengerCount:  booking.passengerCount  || 1,
    passenger_count: booking.passengerCount  || 1,
    pax:             booking.pax             || String(booking.passengerCount || 1),
    oneWayPrice:     booking.oneWayPrice     || 0,
    one_way_price:   booking.oneWayPrice     || 0,
    roundtripPrice:  booking.roundtripPrice  || 0,
    roundtrip_price: booking.roundtripPrice  || 0,
    sellingPrice:    booking.sellingPrice    || 0,
    selling_price:   booking.sellingPrice    || 0,
    totalAmount:     booking.totalAmount     || 0,
    total_amount:    booking.totalAmount     || 0,
    totalAmountFormatted: `₱${(booking.totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,

    // ── Payment ───────────────────────────────────────────────
    currency:              booking.currency              || 'PHP',
    paymentType:           booking.paymentType           || 'full',
    payment_type:          booking.paymentType           || 'full',
    initialPaymentAmount:  booking.initialPaymentAmount  || 0,
    initial_payment_amount:booking.initialPaymentAmount  || 0,
    remainingBalance:      booking.remainingBalance      || 0,
    remaining_balance:     booking.remainingBalance      || 0,
    payment_confirmed:     false,
    payment_confirmed_at:  '',

    // ── Promo ─────────────────────────────────────────────────
    promoCode:       booking.promoCode       || '',
    promo_code:      booking.promoCode       || '',

    // ── Booking date ──────────────────────────────────────────
    bookingDate:     new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    booking_date:    new Date().toISOString(),

    // ── Caller-supplied overrides (e.g. payment_confirmed: true) ──
    ...overrides,
  };

  console.log('📤 Sending TRANSFER_BOOKING to GHL:');
  console.log(JSON.stringify(data, null, 2));

  const result = await sendToGHLWebhook(GHL_TRANSFER_BOOKING_WEBHOOK_URL, data);

  if (!result.success) {
    console.error('❌ Failed to send transfer booking to GHL:', result.error);
  } else {
    console.log(`✅ Transfer booking "${booking._id}" synced to GHL successfully.`);
  }

  return result;
};

// ============================================================
// ✅ NEW: Send Tour Booking data to GHL
//
// Fires every time a TourBooking is created (online, walk-in, and
// sales/admin bookings). Posts to the shared booking automation webhook.
// ============================================================
const sendTourBookingToGHL = async (booking, overrides = {}) => {
  const b = booking || {};
  const fullName  = b.fullName || b.primaryContact?.fullName || '';
  const firstName = fullName.split(' ')[0] || '';
  const lastName  = fullName.split(' ').slice(1).join(' ') || '';

  const paxAdult    = b.pax?.adult    || 0;
  const paxChild    = b.pax?.children  || 0;
  const paxInfant   = b.pax?.infants   || 0;
  const paxTotal    = paxAdult + paxChild + paxInfant;

  const passengersFormatted = Array.isArray(b.passengers) && b.passengers.length > 0
    ? b.passengers
        .map((p, i) => `Passenger ${i + 1}: ${p.firstName || ''} ${p.lastName || ''}`.trim())
        .join('\n')
    : '';

  const totalAmount = b.totalAmount || 0;

  const data = {
    // ── Meta ──────────────────────────────────────────────────
    type:      'TOUR_BOOKING',
    bookingTypeLabel: 'Tour Booking',
    event:     'tour_booking_created',
    source:    'WanderWave',
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),

    // ── Booking identity ──────────────────────────────────────
    bookingId:        b._id ? b._id.toString() : '',
    booking_id:       b._id ? b._id.toString() : '',
    referenceNumber:  b.referenceNumber || '',
    reference_number: b.referenceNumber || '',
    bookingType:      b.bookingType   || 'tour',
    bookingSource:    b.bookingSource || 'online',
    createdByType:    b.createdByType || 'user',
    status:           b.status        || 'pending',
    paymentStatus:    b.paymentStatus || 'pending',
    isArchive:        b.isArchive     || 'No',
    booking_created_at: b.createdAt ? new Date(b.createdAt).toISOString() : '',

    // ── Tour listing ──────────────────────────────────────────
    tourId:       b.tourId    ? b.tourId.toString()    : '',
    packageId:    b.packageId ? b.packageId.toString() : '',
    packageName:  b.packageName || '',
    package_name: b.packageName || '',
    tourName:     b.packageName || '',
    tour_name:    b.packageName || '',
    service:      b.packageName || '',
    serviceName:  b.packageName || '',
    bookingName:  b.packageName || '',
    destination:  b.destination || '',
    category:     b.category    || '',
    duration:     b.duration    || '',

    // ── Schedule ─────────────────────────────────────────────
    startDate:    b.startDate || '',
    start_date:   b.startDate || '',
    travel_start: b.startDate || '',
    endDate:      b.endDate   || '',
    end_date:     b.endDate   || '',
    travel_end:   b.endDate   || '',
    travel_dates: `${b.startDate || ''}${b.endDate ? ' to ' + b.endDate : ''}`,

    // ── Contact details ───────────────────────────────────────
    fullName,
    name:            fullName,
    first_name:      firstName,
    last_name:       lastName,
    email:           b.email || b.primaryContact?.email || '',
    phone:           b.phone || '',
    nationality:     b.nationality || b.primaryContact?.nationality || '',
    message:         b.message || '',
    notes:           b.notes   || '',
    specialRequests: b.specialRequests || '',
    special_requests:b.specialRequests || '',

    // ── Passengers ────────────────────────────────────────────
    passengerCount:  paxTotal,
    passenger_count: paxTotal,
    pax:             paxTotal,
    pax_adult:       paxAdult,
    pax_child:       paxChild,
    pax_infant:      paxInfant,
    pax_total:       paxTotal,
    passengers_list: passengersFormatted,

    // ── Pricing ───────────────────────────────────────────────
    packagePrice:    b.packagePrice   || 0,
    package_price:   b.packagePrice   || 0,
    discountAmount:  b.discountAmount || 0,
    discount_amount: b.discountAmount || 0,
    airfareTotal:    b.airfareTotal   || 0,
    airfare_total:   b.airfareTotal   || 0,
    includesAirfare: b.includesAirfare ? 'Yes' : 'No',
    includes_airfare:b.includesAirfare ? 'Yes' : 'No',
    totalAmount:     totalAmount,
    total_amount:    totalAmount,
    totalAmountFormatted: `₱${(totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,

    // ── Payment ───────────────────────────────────────────────
    paymentType:            b.paymentType          || 'full',
    payment_type:           b.paymentType          || 'full',
    initialPaymentAmount:   b.initialPaymentAmount || 0,
    initial_payment_amount: b.initialPaymentAmount || 0,
    remainingBalance:       b.remainingBalance      || 0,
    remaining_balance:      b.remainingBalance      || 0,
    payment_confirmed:      false,
    payment_confirmed_at:   '',

    // ── Promo ─────────────────────────────────────────────────
    promoCode:  b.promoCode || '',
    promo_code: b.promoCode || '',

    // ── Booking date ──────────────────────────────────────────
    bookingDate:  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    booking_date: new Date().toISOString(),

    // ── Caller-supplied overrides (e.g. payment_confirmed: true) ──
    ...overrides,
  };

  console.log('📤 Sending TOUR_BOOKING to GHL:');
  console.log(JSON.stringify(data, null, 2));

  const result = await sendToGHLWebhook(GHL_BOOKING_WEBHOOK_URL, data);

  if (!result.success) {
    console.error('❌ Failed to send tour booking to GHL:', result.error);
  } else {
    console.log(`✅ Tour booking "${b._id}" synced to GHL successfully.`);
  }

  return result;
};

// ============================================================
// ✅ NEW: Send Customized Booking data to GHL
//
// Fires every time a CustomizedBooking is created (customer and
// sales/admin). A custom booking bundles multiple tours and/or
// transfers, so we send a readable summary plus the raw arrays.
// Posts to the shared booking automation webhook.
// ============================================================
const sendCustomBookingToGHL = async (booking, overrides = {}) => {
  const b = booking || {};
  const fullName  = b.fullName || '';
  const firstName = fullName.split(' ')[0] || '';
  const lastName  = fullName.split(' ').slice(1).join(' ') || '';

  const tours     = Array.isArray(b.tours)     ? b.tours     : [];
  const transfers = Array.isArray(b.transfers) ? b.transfers : [];

  const toursFormatted = tours
    .map((t, i) => {
      const date = t.scheduledDate ? ` (${t.scheduledDate})` : '';
      return `${i + 1}. ${t.title || 'Tour'}${date} — ${t.paxCount || 1} pax — ₱${(t.subtotal || 0).toLocaleString('en-PH')}`;
    })
    .join('\n');

  const transfersFormatted = transfers
    .map((tr, i) => {
      const route = [tr.pickupLocation, tr.dropoffLocation].filter(Boolean).join(' → ');
      const date  = tr.travelDate ? ` (${tr.travelDate})` : '';
      return `${i + 1}. ${tr.title || 'Transfer'} [${tr.transferType || 'oneway'}]${route ? ' ' + route : ''}${date} — ₱${(tr.subtotal || 0).toLocaleString('en-PH')}`;
    })
    .join('\n');

  const totalAmount = b.totalAmount || 0;

  const data = {
    // ── Meta ──────────────────────────────────────────────────
    type:      'CUSTOM_BOOKING',
    bookingTypeLabel: 'Custom Booking',
    event:     'custom_booking_created',
    source:    'WanderWave',
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),

    // ── Booking identity ──────────────────────────────────────
    bookingId:        b._id ? b._id.toString() : '',
    booking_id:       b._id ? b._id.toString() : '',
    referenceNumber:  b.referenceNumber || '',
    reference_number: b.referenceNumber || '',
    bookingType:      b.bookingType   || 'customized',
    createdByType:    b.createdByType || 'customer',
    status:           b.status        || 'pending',
    paymentStatus:    b.paymentStatus || 'pending',
    isArchive:        b.isArchive     || 'No',
    booking_created_at: b.createdAt ? new Date(b.createdAt).toISOString() : '',

    // ── Trip overview ─────────────────────────────────────────
    destination:  b.destination || '',
    service:      `Custom Trip — ${b.destination || ''}`.trim(),
    serviceName:  `Custom Trip — ${b.destination || ''}`.trim(),
    bookingName:  `Custom Trip — ${b.destination || ''}`.trim(),
    travelDate:   b.travelDate || '',
    travel_date:  b.travelDate || '',
    returnDate:   b.returnDate || '',
    return_date:  b.returnDate || '',
    travel_dates: `${b.travelDate || ''}${b.returnDate ? ' to ' + b.returnDate : ''}`,

    // ── Contact details ───────────────────────────────────────
    fullName,
    name:        fullName,
    first_name:  firstName,
    last_name:   lastName,
    email:       b.email || '',
    phone:       b.phone || '',
    nationality: b.nationality || '',
    birthDate:   b.birthDate   || '',
    birth_date:  b.birthDate   || '',
    message:     b.message || '',
    notes:       b.notes   || '',

    // ── Passengers ────────────────────────────────────────────
    passengerCount:  b.paxCount || 1,
    passenger_count: b.paxCount || 1,
    pax:             b.paxCount || 1,

    // ── Services (summary + raw) ──────────────────────────────
    tours_count:       tours.length,
    transfers_count:   transfers.length,
    tours_summary:     toursFormatted,
    transfers_summary: transfersFormatted,
    tours_raw:         JSON.stringify(tours),
    transfers_raw:     JSON.stringify(transfers),

    // ── Pricing ───────────────────────────────────────────────
    toursTotal:      b.toursTotal     || 0,
    tours_total:     b.toursTotal     || 0,
    transfersTotal:  b.transfersTotal || 0,
    transfers_total: b.transfersTotal || 0,
    totalAmount:     totalAmount,
    total_amount:    totalAmount,
    totalAmountFormatted: `₱${(totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,

    // ── Payment ───────────────────────────────────────────────
    currency:               b.currency             || 'PHP',
    paymentType:            b.paymentType          || 'full',
    payment_type:           b.paymentType          || 'full',
    initialPaymentAmount:   b.initialPaymentAmount || 0,
    initial_payment_amount: b.initialPaymentAmount || 0,
    remainingBalance:       b.remainingBalance      || 0,
    remaining_balance:      b.remainingBalance      || 0,
    payment_confirmed:      false,
    payment_confirmed_at:   '',

    // ── Promo ─────────────────────────────────────────────────
    promoCode:  b.promoCode || '',
    promo_code: b.promoCode || '',

    // ── Booking date ──────────────────────────────────────────
    bookingDate:  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    booking_date: new Date().toISOString(),

    // ── Caller-supplied overrides (e.g. payment_confirmed: true) ──
    ...overrides,
  };

  console.log('📤 Sending CUSTOM_BOOKING to GHL:');
  console.log(JSON.stringify(data, null, 2));

  const result = await sendToGHLWebhook(GHL_BOOKING_WEBHOOK_URL, data);

  if (!result.success) {
    console.error('❌ Failed to send custom booking to GHL:', result.error);
  } else {
    console.log(`✅ Custom booking "${b._id}" synced to GHL successfully.`);
  }

  return result;
};

// ============================================================
// ✅ NEW: Send Package Booking data to GHL (partial payment only)
//
// Fires only for walk-in/sales package bookings paid via partial
// payment — mirrors sendTourBookingToGHL's shape but reads from the
// package Booking model. Posts to the shared booking automation webhook.
// ============================================================
const sendPackageBookingToGHL = async (booking, overrides = {}) => {
  const b = booking || {};
  const fullName  = b.fullName || '';
  const firstName = fullName.split(' ')[0] || '';
  const lastName  = fullName.split(' ').slice(1).join(' ') || '';

  const paxAdult  = b.pax?.adult    || 0;
  const paxChild  = b.pax?.children || 0;
  const paxInfant = b.pax?.infants  || 0;
  const paxTotal  = paxAdult + paxChild + paxInfant;

  const passengersFormatted = Array.isArray(b.passengers) && b.passengers.length > 0
    ? b.passengers
        .map((p, i) => `Passenger ${i + 1}: ${p.firstName || ''} ${p.lastName || ''}`.trim())
        .join('\n')
    : '';

  const totalAmount = b.totalAmount || 0;

  const data = {
    // ── Meta ──────────────────────────────────────────────────
    type:      'PACKAGE_BOOKING',
    bookingTypeLabel: 'Package Booking',
    event:     'package_booking_created',
    source:    'WanderWave',
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),

    // ── Booking identity ──────────────────────────────────────
    bookingId:        b._id ? b._id.toString() : '',
    booking_id:       b._id ? b._id.toString() : '',
    referenceNumber:  b.referenceNumber || '',
    reference_number: b.referenceNumber || '',
    bookingType:      'package',
    createdByType:    b.createdByType || 'sales',
    status:           b.status        || 'pending',
    isArchive:        b.isArchive     || 'No',
    booking_created_at: b.createdAt ? new Date(b.createdAt).toISOString() : '',

    // ── Package listing ─────────────────────────────────────────
    packageId:    b.packageId ? b.packageId.toString() : '',
    packageName:  b.packageName || '',
    package_name: b.packageName || '',
    service:      b.packageName || '',
    serviceName:  b.packageName || '',
    bookingName:  b.packageName || '',
    duration:     b.duration    || '',

    // ── Schedule ─────────────────────────────────────────────
    startDate:    b.startDate || '',
    start_date:   b.startDate || '',
    travel_start: b.startDate || '',
    endDate:      b.endDate   || '',
    end_date:     b.endDate   || '',
    travel_end:   b.endDate   || '',
    travel_dates: `${b.startDate || ''}${b.endDate ? ' to ' + b.endDate : ''}`,

    // ── Contact details ───────────────────────────────────────
    fullName,
    name:            fullName,
    first_name:      firstName,
    last_name:       lastName,
    email:           b.email || '',
    message:         b.message || '',

    // ── Passengers ────────────────────────────────────────────
    passengerCount:  paxTotal,
    passenger_count: paxTotal,
    pax:             paxTotal,
    pax_adult:       paxAdult,
    pax_child:       paxChild,
    pax_infant:      paxInfant,
    pax_total:       paxTotal,
    passengers_list: passengersFormatted,

    // ── Accommodation ─────────────────────────────────────────
    selected_room_type: b.selectedRoomType || '',
    hotel_name:         b.hotelName        || '',
    number_of_rooms:    b.numberOfRooms    || '',

    // ── Pricing ───────────────────────────────────────────────
    packageTotal:    b.packageTotal    || 0,
    package_total:   b.packageTotal    || 0,
    discountAmount:  b.discountAmount  || 0,
    discount_amount: b.discountAmount  || 0,
    airfareTotal:    b.airfareTotal    || 0,
    airfare_total:   b.airfareTotal    || 0,
    includesAirfare: b.includesAirfare ? 'Yes' : 'No',
    includes_airfare:b.includesAirfare ? 'Yes' : 'No',
    totalAmount:     totalAmount,
    total_amount:    totalAmount,
    totalAmountFormatted: `₱${(totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,

    // ── Payment ───────────────────────────────────────────────
    paymentType:            b.paymentType          || 'full',
    payment_type:           b.paymentType          || 'full',
    initialPaymentAmount:   b.initialPaymentAmount || 0,
    initial_payment_amount: b.initialPaymentAmount || 0,
    remainingBalance:       b.remainingBalance      || 0,
    remaining_balance:      b.remainingBalance      || 0,

    // ── Promo ─────────────────────────────────────────────────
    promoCode:  b.promoCode || '',
    promo_code: b.promoCode || '',

    // ── Booking date ──────────────────────────────────────────
    bookingDate:  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    booking_date: new Date().toISOString(),

    // ── Caller-supplied overrides ──────────────────────────────
    ...overrides,
  };

  console.log('📤 Sending PACKAGE_BOOKING to GHL:');
  console.log(JSON.stringify(data, null, 2));

  const result = await sendToGHLWebhook(GHL_BOOKING_WEBHOOK_URL, data);

  if (!result.success) {
    console.error('❌ Failed to send package booking to GHL:', result.error);
  } else {
    console.log(`✅ Package booking "${b._id}" synced to GHL successfully.`);
  }

  return result;
};

module.exports = {
  sendNewUserToGHL,
  sendInquiryToGHL,
  sendBookingConfirmationToGHL,
  sendDestinationToGHL,
  sendTransferBookingToGHL, // ✅ New export
  sendTourBookingToGHL,     // ✅ New export
  sendCustomBookingToGHL,   // ✅ New export
  sendPackageBookingToGHL,  // ✅ New export
};