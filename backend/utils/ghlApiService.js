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

module.exports = {
  createOrUpdateContact,
  sendGHLEmail
};