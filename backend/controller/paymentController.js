const axios = require('axios');
const Inquiry = require('../models/inquiry');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY; 

const createInquiryCheckoutSession = async (req, res) => {
  try {
    const { inquiryId } = req.body;
    
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    if (!inquiry.estimatedPrice || inquiry.estimatedPrice <= 0) {
       return res.status(400).json({ success: false, message: 'Invalid price amount' });
    }

    const options = {
      method: 'POST',
      url: 'https://api.paymongo.com/v1/checkout_sessions',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString('base64')}`
      },
      data: {
        data: {
          attributes: {
            line_items: [
              {
                currency: 'PHP',
                amount: inquiry.estimatedPrice * 100,
                description: `Visa Assistance: ${inquiry.serviceName} - ${inquiry.visaCountry}`,
                name: inquiry.serviceName,
                quantity: 1
              }
            ],
            payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
            reference_number: inquiry._id.toString(),
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: `Payment for Inquiry #${inquiry._id}`,
            success_url: `http://localhost:5173/payment/success?inquiryId=${inquiry._id}`,
            cancel_url: `http://localhost:5173/dashboard`
          }
        }
      }
    };

    const response = await axios.request(options);
    
    res.json({
      success: true,
      checkoutUrl: response.data.data.attributes.checkout_url
    });

  } catch (error) {
    console.error('PayMongo Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment creation failed' });
  }
};

module.exports = { createInquiryCheckoutSession };