const Inquiry = require('../models/inquiry');
const Service = require('../models/service');
const User = require('../models/user');
const Payment = require('../models/payment'); 
const { sendNewUserToGHL, sendInquiryToGHL } = require('../utils/ghlService');

const generateTempPassword = () => {
  const numbers = Math.floor(100000 + Math.random() * 900000); 
  const specialChars = '!@#$%^&*';
  const randomSpecialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  return `Wander_${numbers}${randomSpecialChar}`;
};

const createInquiry = async (req, res) => {
  try {
    let { 
      serviceId, 
      serviceName, 
      fullName, 
      email, 
      contactNumber,
      address,       
      message,
      visaCountry,
      visaId,
      psaDocument, 
      psaId,
      estimatedPrice,
      inquiryType,   
      flightDetails, 
      passengers,
      cenomarId,
      cenomarDocument,
      passportDetails    
    } = req.body;

    console.log('📥 Received inquiry/booking:', { serviceName, fullName, inquiryType });

    // Auto-generate message for FLIGHT_BOOKING
    if (!message && inquiryType === 'FLIGHT_BOOKING') {
      const origin = flightDetails?.origin || 'Unknown';
      const dest = flightDetails?.destination || 'Unknown';
      const date = flightDetails?.departureDate || '';
      message = `Flight Booking Request: ${origin} ➜ ${dest} on ${date}`;
    }

    // Auto-generate message for PASSPORT
    if (!message && inquiryType === 'PASSPORT') {
      const appType = passportDetails?.applicationType || 'NEW';
      const procType = passportDetails?.processingType || 'REGULAR';
      message = `Passport Appointment Request: ${appType} Application (${procType} Processing)`;
    }

    console.log('📥 Received inquiry request:', { serviceName, fullName, email });

    if (!serviceName || !fullName || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    let existingUser = await User.findOne({ email });
    let isNewUser = false;
    let tempPassword = null;

    if (!existingUser) {
      isNewUser = true;
      tempPassword = generateTempPassword();
      const baseUsername = email.split('@')[0].toLowerCase();
      
      try {
        existingUser = await User.create({
          fullName, email, username: `${baseUsername}${Date.now()}`, password: tempPassword
        });
        await sendNewUserToGHL(email, fullName, tempPassword, serviceName);
      } catch (e) { console.error('User/GHL Create Error', e); }

    } else {
      try { await sendInquiryToGHL(email, fullName, serviceName, message); } 
      catch (e) { console.error('GHL Inquiry Error', e); }
    }

    const inquiry = await Inquiry.create({
      serviceId: serviceId || null,
      serviceName,
      fullName,
      email,
      contactNumber,
      address,
      message,
      visaCountry: visaCountry || null,
      visaId: visaId || null,
      psaDocument: psaDocument || null, 
      psaId: psaId || null,
      inquiryType: inquiryType || 'GENERAL',
      flightDetails: flightDetails || {},
      passengers: passengers || [],
      passportDetails: passportDetails || {},
      cenomarDocument: cenomarDocument || null, 
      cenomarId: cenomarId || null,
      estimatedPrice: estimatedPrice || 0
    });

    res.status(201).json({ success: true, message: 'Inquiry submitted', isNewUser, data: inquiry });

  } catch (error) {
    console.error('❌ Create inquiry error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, data: inquiries });
  } catch (error) { res.status(500).json({ success: false }); }
};

const getInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('serviceId visaId cenomarId');
    if (!inquiry) return res.status(404).json({ success: false });
    res.json({ success: true, data: inquiry });
  } catch (error) { res.status(500).json({ success: false }); }
};

const updateInquiryStatus = async (req, res) => {
  try {
    const { status, adminNotes, contactedBy, remarks } = req.body;
    const evidenceFile = req.file; 
    
    const updateData = { status, adminNotes, updatedAt: Date.now() };
    if (remarks) updateData.remarks = remarks;
    if (evidenceFile) {
        updateData.evidenceUrl = `/uploads/${evidenceFile.filename}`;
        updateData.evidenceName = evidenceFile.originalname;
    }
    if (status === 'CONTACTED') {
        updateData.contactedAt = Date.now();
        updateData.contactedBy = contactedBy;
    }

    const updated = await Inquiry.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false }); }
};

const deleteInquiry = async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
};

const getInquiriesByEmail = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ email: req.params.email }).sort({ createdAt: -1 });
    res.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (error) { res.status(500).json({ success: false }); }
};

const getInquiryStats = async (req, res) => {
  try {
    const count = await Inquiry.countDocuments();
    res.json({ success: true, data: { total: count } });
  } catch (error) { res.status(500).json({ success: false }); }
};

// 💰 UPDATED: MARK AS PAID FUNCTION
const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params; 

    console.log(`💰 Payment Update Requested for Inquiry: ${id}`);

    // 1. Update Inquiry Status
    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      { 
        status: 'PAID', 
        updatedAt: Date.now() 
      },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    // 2. Update Payment Status (Safety Check: Upsert logic)
    const paymentRecord = await Payment.findOne({ inquiryId: id });

    if (paymentRecord) {
        paymentRecord.status = 'PAID';
        paymentRecord.paidAt = Date.now();
        await paymentRecord.save();
        console.log('✅ Existing Payment Record Updated to PAID');
    } else {
        console.log('⚠️ No pending payment found. Creating PAID record as fallback.');
        await Payment.create({
            inquiryId: id,
            transactionId: `manual_verified_${Date.now()}`,
            amount: inquiry.estimatedPrice,
            serviceName: inquiry.serviceName,
            customerName: inquiry.fullName,
            customerEmail: inquiry.email,
            status: 'PAID',
            paidAt: Date.now()
        });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: inquiry
    });

  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating payment status'
    });
  }
};

module.exports = {
  createInquiry,
  getAllInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiriesByEmail,
  getInquiryStats,
  markAsPaid
};