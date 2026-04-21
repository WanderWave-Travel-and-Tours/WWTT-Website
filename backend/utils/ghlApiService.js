const axios = require('axios');

const GHL_API_BASE_URL = 'https://rest.gohighlevel.com/v1';

// Create or update contact in GHL
const createOrUpdateContact = async (email, fullName, tags = []) => {
  try {
    const response = await axios.post(
      `${GHL_API_BASE_URL}/contacts/`,
      {
        email,
        name: fullName,
        tags,
        source: 'WanderWave Website'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, contact: response.data.contact };
  } catch (error) {
    console.error('GHL API Error:', error.response?.data || error.message);
    return { success: false, error };
  }
};

// Send email via GHL
const sendGHLEmail = async (contactId, templateId, customFields = {}) => {
  try {
    const response = await axios.post(
      `${GHL_API_BASE_URL}/contacts/${contactId}/campaigns/${templateId}`,
      customFields,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('GHL Email Error:', error.response?.data || error.message);
    return { success: false, error };
  }
};

// Create GHL Invoice from template
const createGHLInvoice = async (contactId, bookingData) => {
  try {
    const response = await axios.post(
      'https://services.leadconnectorhq.com/payments/invoices',
      {
        altId: process.env.GHL_LOCATION_ID,
        altType: 'location',
        contactId: contactId,
        templateId: '69e6f259fd3294862c7e566b',
        items: [{
          name: bookingData.serviceName,
          qty: bookingData.paxCount || 1,
          price: bookingData.totalAmount
        }],
        dueDate: bookingData.dueDate // 3 days before travel date
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_ACCESS_TOKEN}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, invoice: response.data };
  } catch (error) {
    console.error('❌ GHL Invoice Error:', error.response?.data || error.message);
    return { success: false, error };
  }
};

module.exports = {
  createOrUpdateContact,
  sendGHLEmail,
  createGHLInvoice // ✅ Added export
};