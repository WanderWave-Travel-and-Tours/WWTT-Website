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
      timeout: 15000 // Increase timeout to 15 seconds
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

const sendBookingConfirmationToGHL = async (
  email,
  fullName,
  packageName,
  totalAmount,
  startDate,
  endDate,
  passengerCount
) => {
  const firstName = fullName.split(' ')[0] || '';
  const lastName = fullName.split(' ').slice(1).join(' ') || '';

  const data = {
    type: 'BOOKING_CONFIRMATION',
    email: email,
    fullName: fullName,
    name: fullName,
    first_name: firstName,
    last_name: lastName,
    packageName: packageName,
    package_name: packageName,
    service: packageName,
    serviceName: packageName,
    totalAmount: `₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    total_amount: totalAmount,
    amount: totalAmount,
    startDate: startDate,
    start_date: startDate,
    travel_start: startDate,
    endDate: endDate,
    end_date: endDate,
    travel_end: endDate,
    passengerCount: passengerCount,
    passenger_count: passengerCount,
    passengers: passengerCount,
    pax: passengerCount,
    bookingDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    booking_date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    source: 'WanderWave',
    event: 'booking_confirmation'
  };
  
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