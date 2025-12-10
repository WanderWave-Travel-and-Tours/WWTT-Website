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

// --- NEW FUNCTION: Create Inquiry with Multi-File Uploads ---
const createInquiryWithUploads = async (req, res) => {
    try {
        console.log("📥 Received Application Upload");
        console.log("Body:", req.body);
        console.log("Files:", req.files ? req.files.length : 0);

        const {
            serviceName, 
            inquiryType,
            fullName,
            email,
            contactNumber,
            message,
            visaCountry,
            estimatedPrice
        } = req.body;

        if (!email || !fullName) {
            return res.status(400).json({ success: false, message: 'Email and Name are required' });
        }

        // 1. Process Files
        const uploadedDocs = (req.files || []).map(file => ({
            fileName: `${file.fieldname} - ${file.originalname}`, 
            fileUrl: `/uploads/documents/${file.filename}`,
            uploadedAt: Date.now()
        }));

        // 2. Check or Create User
        let existingUser = await User.findOne({ email });
        
        if (!existingUser) {
             try {
                const baseUsername = email.split('@')[0].toLowerCase();
                const tempPassword = generateTempPassword();
                existingUser = await User.create({
                    fullName, email, username: `${baseUsername}${Date.now()}`, password: tempPassword
                });
             } catch(e) { console.error("User creation error", e); }
        }

        // 3. Create Inquiry Record
        const newInquiry = await Inquiry.create({
            serviceName: serviceName || 'Visa Application', 
            inquiryType: inquiryType || 'VISA',
            fullName,
            email,
            contactNumber,
            message: message,
            visaCountry: visaCountry || 'Japan',
            estimatedPrice: estimatedPrice || 0,
            status: 'PENDING',
            deliveredDocuments: uploadedDocs 
        });

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: newInquiry
        });

    } catch (error) {
        console.error('❌ Application Upload Error:', error);
        res.status(500).json({ success: false, message: 'Server error processing application' });
    }
};

const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const getInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('serviceId visaId psaId cenomarId');
    if (!inquiry) return res.status(404).json({ success: false });
    res.json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false });
  }
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
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const deleteInquiry = async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const getInquiriesByEmail = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ email: req.params.email }).sort({ createdAt: -1 });
    res.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const getInquiryStats = async (req, res) => {
  try {
    const count = await Inquiry.countDocuments();
    res.json({ success: true, data: { total: count } });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

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

    const paymentRecord = await Payment.findOne({ inquiryId: id });

    if (paymentRecord) {
      paymentRecord.status = 'PAID';
      paymentRecord.paidAt = Date.now();
      await paymentRecord.save();
    } else {
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
    res.status(500).json({
      success: false,
      message: 'Server error updating payment status'
    });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminName } = req.body;

    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      {
        status: 'CONFIRMED',
        paymentConfirmedAt: Date.now(),
        paymentConfirmedBy: adminName || 'Admin',
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: inquiry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deliverDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadedDocs = files.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/documents/${file.filename}`,
      uploadedAt: Date.now()
    }));

    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      {
        status: 'COMPLETED',
        deliveredDocuments: uploadedDocs,
        documentsDeliveredAt: Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.json({
      success: true,
      message: 'Documents delivered successfully',
      data: inquiry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createInquiry,
  createInquiryWithUploads, 
  getAllInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiriesByEmail,
  getInquiryStats,
  markAsPaid,
  confirmPayment,
  deliverDocuments
};