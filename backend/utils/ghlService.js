const axios = require('axios');

const GHL_WEBHOOK_URL = process.env.GHL_NEW_USER_WEBHOOK_URL;

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
// Handles both plain strings and objects with a 'name' or 'text' field
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
// Handles day-by-day objects with day, title, activities/description fields
const formatItinerary = (itinerary) => {
  if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) return '';
  return itinerary
    .map((day) => {
      if (typeof day === 'string') return day;
      if (typeof day === 'object') {
        const dayLabel = day.day ? `Day ${day.day}` : '';
        const title = day.title || day.name || '';
        const header = [dayLabel, title].filter(Boolean).join(': ');

        // Activities can be an array or a string
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
  packageData,   // ✅ Populated Package document (or null)
  bookingData    // ✅ NEW: Full booking document for complete details
) => {
  const firstName = fullName.split(' ')[0] || '';
  const lastName = fullName.split(' ').slice(1).join(' ') || '';

  // ─── Package fields ───────────────────────────────────────────────────────
  const inclusions  = packageData?.inclusions  || bookingData?.inclusions  || [];
  const itinerary   = packageData?.itinerary   || bookingData?.itinerary   || [];
  const hotels      = packageData?.hotels      || bookingData?.hotels      || [];
  const exclusions  = packageData?.exclusions  || bookingData?.exclusions  || [];
  const highlights  = packageData?.highlights  || bookingData?.highlights  || [];

  const inclusionsFormatted  = formatInclusions(inclusions);
  const itineraryFormatted   = formatItinerary(itinerary);

  // ─── Booking fields ───────────────────────────────────────────────────────
  const booking = bookingData || {};

  // Passenger / pax details
  const paxAdult    = booking.pax?.adult    || passengerCount || 1;
  const paxChild    = booking.pax?.child    || 0;
  const paxInfant   = booking.pax?.infant   || 0;
  const paxSenior   = booking.pax?.senior   || 0;
  const paxTotal    = paxAdult + paxChild + paxInfant + paxSenior;

  // Passengers array (individual names, contact info, etc.)
  const passengersFormatted = Array.isArray(booking.passengers) && booking.passengers.length > 0
    ? booking.passengers
        .map((p, i) => `Passenger ${i + 1}: ${p.firstName || ''} ${p.lastName || ''}`.trim())
        .join('\n')
    : '';

  // Payment details
  const paymentType         = booking.paymentType === 'partial' ? 'Partial Payment' : 'Full Payment';
  const initialPaymentAmount = booking.initialPaymentAmount || totalAmount;
  const remainingBalance    = booking.remainingBalance || 0;
  const includesAirfare     = booking.includesAirfare ? 'Yes' : 'No';

  // Add-ons / customizations
  const selectedRoomType    = booking.selectedRoomType || '';
  const hotelName           = booking.hotelName || packageData?.defaultHotel || '';
  const numberOfRooms       = booking.numberOfRooms || '';
  const promoCode           = booking.promoCode || '';
  const promoDiscount       = booking.promoDiscount || 0;

  const data = {
    type: 'BOOKING_CONFIRMATION',
    event: 'booking_confirmation',
    source: 'WanderWave',
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),

    // ─── Contact Info ───────────────────────────────────────────────────────
    email:      email,
    fullName:   fullName,
    name:       fullName,
    first_name: firstName,
    last_name:  lastName,
    phone:      booking.phone || booking.contactNumber || '',

    // ─── Package Info ───────────────────────────────────────────────────────
    packageName:        packageName,
    package_name:       packageName,
    service:            packageName,
    serviceName:        packageName,
    package_image_url:  packageData?.image || '',
    package_destination: packageData?.destination || booking.destination || '',
    package_duration:   packageData?.duration     || booking.duration    || '',
    package_category:   packageData?.category     || '',
    package_tour_type:  packageData?.tourType     || booking.tourType    || '',
    package_min_pax:    packageData?.minPax       || '',

    // ─── Inclusions (full array + formatted string) ─────────────────────────
    // Use package_inclusions_list for GHL custom fields that accept multi-line text
    package_inclusions:      inclusionsFormatted,        // human-readable, line-separated
    package_inclusions_raw:  JSON.stringify(inclusions), // raw array for advanced GHL workflows

    // ─── Itinerary (full array + formatted string) ──────────────────────────
    package_itinerary:      itineraryFormatted,           // human-readable, day-by-day
    package_itinerary_raw:  JSON.stringify(itinerary),    // raw array for advanced GHL workflows

    // ─── Exclusions & Highlights ─────────────────────────────────────────────
    package_exclusions:  Array.isArray(exclusions) ? exclusions.join('\n') : exclusions,
    package_highlights:  Array.isArray(highlights) ? highlights.join('\n') : highlights,

    // ─── Hotels ──────────────────────────────────────────────────────────────
    package_hotels:      JSON.stringify(hotels),

    // ─── Travel Dates ───────────────────────────────────────────────────────
    startDate:     startDate,
    start_date:    startDate,
    travel_start:  startDate,
    endDate:       endDate,
    end_date:      endDate,
    travel_end:    endDate,
    travel_dates:  `${startDate} to ${endDate}`,

    // ─── Pax / Passenger Breakdown ──────────────────────────────────────────
    passengerCount:  passengerCount,
    passenger_count: passengerCount,
    passengers:      passengerCount,
    pax:             passengerCount,
    pax_adult:       paxAdult,
    pax_child:       paxChild,
    pax_infant:      paxInfant,
    pax_senior:      paxSenior,
    pax_total:       paxTotal,
    passengers_list: passengersFormatted,  // e.g. "Passenger 1: Juan Dela Cruz\nPassenger 2: ..."

    // ─── Payment Info ────────────────────────────────────────────────────────
    totalAmount:             `₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    total_amount:            totalAmount,
    amount:                  totalAmount,
    payment_type:            paymentType,
    initial_payment_amount:  initialPaymentAmount,
    remaining_balance:       remainingBalance,
    includes_airfare:        includesAirfare,

    // ─── Add-ons / Room Selection ─────────────────────────────────────────────
    selected_room_type:  selectedRoomType,
    hotel_name:          hotelName,
    number_of_rooms:     numberOfRooms,

    // ─── Promo ────────────────────────────────────────────────────────────────
    promo_code:     promoCode,
    promo_discount: promoDiscount,

    // ─── Booking Meta ─────────────────────────────────────────────────────────
    bookingId:    booking._id ? booking._id.toString() : '',
    booking_id:   booking._id ? booking._id.toString() : '',
    booking_status: booking.status || '',
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


module.exports = {
  sendNewUserToGHL,
  sendInquiryToGHL,
  sendBookingConfirmationToGHL  
};