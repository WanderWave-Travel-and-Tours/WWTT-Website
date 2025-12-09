const axios = require('axios');
const Inquiry = require('../models/inquiry');
const Payment = require('../models/payment');
const Booking = require('../models/booking');
const PackageModel = require('../models/package');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API = 'https://api.paymongo.com/v1';

const authHeader = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');

// ==========================================
// FUNCTION 1: FOR INQUIRIES (Visa, Cenomar, PSA)
// Saves to: Inquiry Collection & Payment Collection
// ==========================================
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

    // Convert to centavos (PHP 100.00 = 10000 centavos)
    const amountInCentavos = Math.round(inquiry.estimatedPrice * 100);

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
            payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
            reference_number: inquiry._id.toString(),
            send_email_receipt: true,
            show_description: true,
            description: `Inquiry Ref: ${inquiry._id}`,
            
            // 👇 CRITICAL FIX: Redirect to Dashboard with success flag & Inquiry ID
            // Ito ang magtri-trigger sa Frontend na tawagin ang "markAsPaid" endpoint
            success_url: `http://localhost:5173/dashboard?success=true&inquiryId=${inquiry._id}`,
            
            cancel_url: `http://localhost:5173/dashboard`
          }
        }
      }
    };

    const response = await axios.request(options);
    const checkoutSessionId = response.data.data.id;

    // Create Initial Payment Record (Status: PENDING)
    await Payment.create({
      inquiryId: inquiry._id,
      transactionId: checkoutSessionId,
      amount: inquiry.estimatedPrice,
      serviceName: inquiry.serviceName,
      customerName: inquiry.fullName,
      customerEmail: inquiry.email,
      status: 'PENDING'
    });
    
    console.log(`✅ PayMongo Session Created: ${checkoutSessionId} for Inquiry: ${inquiry._id}`);

    res.json({
      success: true,
      checkoutUrl: response.data.data.attributes.checkout_url
    });

  } catch (error) {
    console.error('PayMongo Inquiry Error:', error.response?.data || error.message);
    if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Payment creation failed' });
    }
  }
};

// ==========================================
// FUNCTION 2: FOR BOOKINGS (Travel Packages)
// Saves to: Booking Collection
// ==========================================
const createBookingPaymentLink = async (req, res) => {
  try {
    const { amount, description, bookingData } = req.body;

    if (!amount || !bookingData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount or bookingData'
      });
    }

    const package = await PackageModel.findOne({ title: bookingData.packageName });
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    const newBooking = new Booking({
      packageName: bookingData.packageName,
      packageId: package._id,           
      sellerPrice: package.sellerPrice,
      markup: package.markup,           
      price: package.price,            
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      duration: bookingData.duration,
      pax: bookingData.pax,
      totalAmount: bookingData.totalAmount,
      fullName: bookingData.fullName,
      email: bookingData.email,
      message: bookingData.message,
      status: 'pending'
    });

    await newBooking.save();
    const bookingId = newBooking._id.toString();

    // Create PayMongo Link
    const paymentLinkResponse = await axios.post(
      `${PAYMONGO_API}/links`,
      {
        data: {
          attributes: {
            amount: amount,
            description: description,
            remarks: `Booking for ${bookingData.fullName}`,
            metadata: {
              booking_id: bookingId,
              customer_name: bookingData.fullName,
              customer_email: bookingData.email,
              package: bookingData.packageName,
              total_amount: bookingData.totalAmount
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
    
    newBooking.paymentLinkId = paymentLink.id;
    newBooking.referenceNumber = paymentLink.attributes.reference_number;
    await newBooking.save();

    return res.json({
      success: true,
      checkoutUrl: paymentLink.attributes.checkout_url,
      paymentLinkId: paymentLink.id,
      referenceNumber: paymentLink.attributes.reference_number,
      bookingId: bookingId,
      message: 'Redirecting to PayMongo checkout'
    });

  } catch (error) {
    console.error('❌ Booking Payment Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking or payment link',
      error: error.response?.data?.errors || error.message
    });
  }
};

module.exports = { 
    createInquiryCheckoutSession, 
    createBookingPaymentLink 
};