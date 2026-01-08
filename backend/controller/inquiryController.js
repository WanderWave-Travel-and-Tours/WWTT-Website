const Inquiry = require('../models/inquiry');
const Service = require('../models/service');
const User = require('../models/user');
const Payment = require('../models/payment');
const CENOMAR = require('../models/cenomar');
const ActivityLog = require('../models/ActivityLog'); // ✅ ACTIVITY LOG IMPORT
const { sendNewUserToGHL, sendInquiryToGHL } = require('../utils/ghlService');
const mongoose = require('mongoose');

const generateTempPassword = () => {
  const numbers = Math.floor(100000 + Math.random() * 900000);
  const specialChars = '!@#$%^&*';
  const randomSpecialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  return `Wander_${numbers}${randomSpecialChar}`;
};

// 🔥🔥🔥 HELPER: MAP INQUIRY TYPE TO SPECIFIC MODULE NAME 🔥🔥🔥
const getModuleFromInquiryType = (inquiryType, serviceName) => {
    const typeMapping = {
        'FLIGHT_BOOKING': 'Flight Booking',
        'VISA': 'Visa Application',
        'PASSPORT': 'Passport',
        'PSA': 'PSA Documents',
        'CENOMAR': 'CENOMAR',
        'GENERAL': 'General Inquiries'
    };
    
    // Return mapped module or default to General Inquiries
    return typeMapping[inquiryType] || 'General Inquiries';
};

// --- HELPER PARA SA PRICE MATCHING ---
const findCorrectPrice = async (serviceName, cenomarDocument) => {
    try {
        const services = await CENOMAR.find();
        const searchName = (serviceName || cenomarDocument || "").toLowerCase().trim();

        const matchedService = services.find(s => {
            const docType = (s.documentType || "").toLowerCase().trim();
            return (
                docType === searchName || 
                searchName.includes(docType) || 
                docType.includes(searchName)
            );
        });

        if (matchedService) {
            return Number(matchedService.price);
        }
    } catch (error) {
        console.error("Error finding price:", error);
    }
    return 0;
};

const createInquiry = async (req, res) => {
  try {
    console.log('🔥 RAW REQUEST BODY:', JSON.stringify(req.body, null, 2));

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
      passportDetails,
      travelDate,
      lengthOfStay,
      userEmail,  // ✅ FOR ACTIVITY LOG
      adminId     // ✅ FOR ACTIVITY LOG
    } = req.body;

    // --- [START] SMART PRICE FIX FOR FRONTEND SUBMISSIONS ---
    let finalPrice = parseFloat(estimatedPrice) || 0;
    
    if (finalPrice === 0) {
        console.log("⚠️ Price is 0. Attempting to auto-fix based on Service Name...");
        finalPrice = await findCorrectPrice(serviceName, cenomarDocument);
        console.log(`✅ Price Auto-Fixed to: ${finalPrice}`);
    }
    // --- [END] SMART PRICE FIX ---

    console.log('🔍 PASSENGERS TYPE:', typeof passengers);
    console.log('🔍 PASSENGERS IS ARRAY?:', Array.isArray(passengers));
    console.log('🔍 PASSENGERS VALUE:', passengers);

    // Auto-generate message for FLIGHT_BOOKING
    if (!message && inquiryType === 'FLIGHT_BOOKING') {
      const origin = flightDetails?.origin || 'Unknown';
      const dest = flightDetails?.destination || 'Unknown';
      const date = flightDetails?.departureDate || '';
      message = `Flight Booking Request: ${origin} ➜ ${dest} on ${date}`;
    }

    // Auto-generate message for PASSPORT
    if (!message && inquiryType === 'PASSPORT' && passportDetails) {
      const appType = passportDetails.applicationType || '';
      const procType = passportDetails.processingType || '';
      
      if (appType || procType) {
        message = `Passport Appointment Request${appType ? ': ' + appType : ''}${procType ? ' (' + procType + ')' : ''}`;
      } else {
        message = `Passport Appointment Request`;
      }
    }

    if (!serviceName || !fullName || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // ✅ USER CREATION
    let existingUser;
    let isNewUser = false;
    let tempPassword = null;

    try {
      existingUser = await User.findOne({ email });
      
      if (!existingUser) {
        isNewUser = true;
        tempPassword = generateTempPassword();
        const baseUsername = email.split('@')[0].toLowerCase();

        existingUser = await User.create({
          fullName, 
          email, 
          username: `${baseUsername}${Date.now()}`, 
          password: tempPassword
        });
        
        console.log('✅ New user created:', existingUser.email);

        try {
          await sendNewUserToGHL(email, fullName, tempPassword, serviceName);
        } catch (ghlError) {
          console.error('⚠️ GHL New User Error (non-fatal):', ghlError.message);
        }
      } else {
        console.log('✅ Existing user found:', existingUser.email);
        
        try {
          await sendInquiryToGHL(email, fullName, serviceName, message);
        } catch (ghlError) {
          console.error('⚠️ GHL Inquiry Error (non-fatal):', ghlError.message);
        }
      }
    } catch (userError) {
      console.error('❌ User Creation/Lookup Error:', userError);
    }

    const inquiryDoc = {
      _id: new mongoose.Types.ObjectId(),
      serviceId: serviceId || null,
      serviceName: String(serviceName).trim(),
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      contactNumber: String(contactNumber || '').trim(),
      address: String(address || '').trim(),
      message: String(message).trim(),
      visaCountry: visaCountry || null,
      visaId: visaId || null,
      psaDocument: psaDocument || null,
      psaId: psaId || null,
      inquiryType: inquiryType || 'GENERAL',
      estimatedPrice: finalPrice,
      cenomarDocument: cenomarDocument || null,
      cenomarId: cenomarId || null,
      status: 'PENDING',
      isArchive: "No", 
      remarks: '',
      evidenceUrl: '',
      evidenceName: '',
      adminNotes: '',
      contactedAt: null,
      contactedBy: null,
      paymentConfirmedAt: null,
      paymentConfirmedBy: null,
      deliveredDocuments: [],
      documentsDeliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      travelDate: travelDate || flightDetails?.departureDate || null,
      lengthOfStay: lengthOfStay || flightDetails?.duration || null
    };

    if (flightDetails) {
      if (typeof flightDetails === 'string') {
        try {
          inquiryDoc.flightDetails = JSON.parse(flightDetails);
        } catch (e) {
          inquiryDoc.flightDetails = {};
        }
      } else {
        inquiryDoc.flightDetails = flightDetails;
      }
    } else {
      inquiryDoc.flightDetails = {};
    }

    if (passportDetails) {
      if (typeof passportDetails === 'string') {
        try {
          inquiryDoc.passportDetails = JSON.parse(passportDetails);
        } catch (e) {
          inquiryDoc.passportDetails = {};
        }
      } else {
        inquiryDoc.passportDetails = passportDetails || {};
      }
    } else {
      inquiryDoc.passportDetails = {};
    }

    let passengersArray = [];
    if (passengers) {
      if (typeof passengers === 'string') {
        try {
          passengers = JSON.parse(passengers);
        } catch (e) {
          console.error('Failed to parse passengers');
          passengers = [];
        }
      }
      
      if (Array.isArray(passengers)) {
        passengersArray = passengers.map(p => {
          if (typeof p === 'string') {
            try {
              p = JSON.parse(p);
            } catch (e) {
              return null;
            }
          }
          
          return {
            firstName: String(p.firstName || '').trim(),
            lastName: String(p.lastName || '').trim(),
            nationality: String(p.nationality || 'Filipino').trim(),
            age: parseInt(p.age) || 0,
            email: String(p.email || '').trim(),
            contactNumber: String(p.contactNumber || '').trim(),
            type: String(p.type || 'Adult').trim()
          };
        }).filter(p => p !== null);
      }
    }

    inquiryDoc.passengers = passengersArray;
    console.log('💾 Final Document to Insert:', JSON.stringify(inquiryDoc, null, 2));

    const result = await mongoose.connection.db.collection('inquiries').insertOne(inquiryDoc);
    console.log('✅ Inquiry Inserted Successfully:', result.insertedId);

    const createdInquiry = await Inquiry.findById(result.insertedId);

    // 👇👇👇 ACTIVITY LOG START (CREATE INQUIRY) 👇👇👇
    try {
        const activeUser = userEmail || 'System';
        const activeId = adminId || null;
        
        // 🔥 GET SPECIFIC MODULE NAME BASED ON INQUIRY TYPE
        const specificModule = getModuleFromInquiryType(inquiryType, serviceName);

        await ActivityLog.create({
            action: 'CREATE',
            module: specificModule,  // 🔥 USE SPECIFIC MODULE (e.g., "Flight Booking" instead of "Inquiries")
            user: activeUser,
            userId: activeId,
            description: `Created new ${specificModule.toLowerCase()}: ${fullName}`,
            severity: 'SUCCESS',
            details: {
                recordTitle: `${specificModule} - ${fullName}`,
                recordId: result.insertedId.toString(),
                method: 'POST',
                inquiryType: inquiryType,
                serviceName: serviceName,
                clientName: fullName,
                clientEmail: email
            }
        });
        console.log(`✅ Activity Log saved: CREATE ${specificModule}`);
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.status(201).json({ 
      success: true, 
      message: 'Inquiry submitted successfully', 
      isNewUser, 
      data: createdInquiry 
    });

  } catch (error) {
    console.error('❌❌❌ CREATE INQUIRY ERROR:', error);
    console.error('Error Message:', error.message);
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};

const createInquiryWithUploads = async (req, res) => {
    try {
        const {
            serviceName, 
            inquiryType,
            fullName,
            email,
            contactNumber,
            message,
            visaCountry,
            estimatedPrice,
            cenomarDocument,
            userEmail,  // ✅ FOR ACTIVITY LOG
            adminId     // ✅ FOR ACTIVITY LOG
        } = req.body;

        let finalPrice = parseFloat(estimatedPrice) || 0;
    
        if (finalPrice === 0) {
            console.log("⚠️ Uploads Price is 0. Attempting to auto-fix...");
            finalPrice = await findCorrectPrice(serviceName, cenomarDocument);
            console.log(`✅ Uploads Price Auto-Fixed to: ${finalPrice}`);
        }

        if (!email || !fullName) {
            return res.status(400).json({ success: false, message: 'Email and Name are required' });
        }

        const uploadedDocs = (req.files || []).map(file => ({
            fileName: `${file.fieldname} - ${file.originalname}`, 
            fileUrl: `/uploads/documents/${file.filename}`,
            uploadedAt: Date.now()
        }));

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

        const newInquiry = await Inquiry.create({
            serviceName: serviceName || 'Visa Application', 
            inquiryType: inquiryType || 'VISA',
            fullName,
            email,
            contactNumber,
            message: message,
            visaCountry: visaCountry || 'Japan',
            estimatedPrice: finalPrice,
            cenomarDocument: cenomarDocument || serviceName,
            status: 'PENDING',
            isArchive: "No", 
            deliveredDocuments: uploadedDocs,
            uploader: req.body.uploader || 'USER',
            documentCategory: req.body.documentCategory || 'REQUIREMENT'
        });

        // 👇👇👇 ACTIVITY LOG START (CREATE WITH UPLOADS) 👇👇👇
        try {
            const activeUser = userEmail || 'System';
            
            // 🔥 GET SPECIFIC MODULE NAME
            const specificModule = getModuleFromInquiryType(inquiryType || 'GENERAL', serviceName);
            
            await ActivityLog.create({
                action: 'CREATE',
                module: specificModule,  // 🔥 SPECIFIC MODULE
                user: activeUser,
                userId: adminId || null,
                description: `Created ${specificModule.toLowerCase()} with document uploads: ${fullName}`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: `${specificModule} - ${fullName}`,
                    recordId: newInquiry._id.toString(),
                    method: 'POST',
                    filesUploaded: uploadedDocs.length,
                    inquiryType: inquiryType,
                    serviceName: serviceName
                }
            });
            console.log(`✅ Activity Log saved: CREATE ${specificModule} with uploads`);
        } catch (logError) {
            console.error('⚠️ Failed to save activity log:', logError.message);
        }
        // 👆👆👆 ACTIVITY LOG END 👆👆👆

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
    const { isArchive } = req.query; 
    let filter = {};
    
    filter.isArchive = isArchive ? isArchive : "No"; 

    const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).populate('serviceId visaId psaId cenomarId');
    if (!inquiry) return res.status(404).json({ success: false });
    res.json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const updateInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingInquiry = await Inquiry.findById(id);
    if (!existingInquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    let remainingFilesList = [];
    if (req.body.existingFiles) {
      try {
        remainingFilesList = JSON.parse(req.body.existingFiles);
      } catch (e) {
        remainingFilesList = [];
      }
    }

    const updateData = {
      fullName: req.body.fullName,
      email: req.body.email,
      contactNumber: req.body.contactNumber,
      serviceName: req.body.serviceName,
      message: req.body.message, 
      adminRemarks: req.body.message,
      estimatedPrice: parseFloat(req.body.estimatedPrice) || 0,
      updatedAt: Date.now()
    };

    updateData.passportDetails = {
      ...existingInquiry.passportDetails?.toObject(),
      applicationType: req.body.passportDocument || existingInquiry.passportDetails?.applicationType,
      processingType: req.body.serviceName || existingInquiry.passportDetails?.processingType
    };

    const documentMap = new Map();
    
    if (existingInquiry.deliveredDocuments) {
      existingInquiry.deliveredDocuments.forEach(doc => {
        const fieldKey = doc.fileName.split(' - ')[0].trim();
        if (remainingFilesList.includes(fieldKey)) {
          documentMap.set(fieldKey, doc);
        }
      });
    }

    if (req.body.hasExistingEvidence === 'false') {
        updateData.evidenceUrl = '';
        updateData.evidenceName = '';
    } else {
        updateData.evidenceUrl = existingInquiry.evidenceUrl;
        updateData.evidenceName = existingInquiry.evidenceName;
    }

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fieldKey = file.fieldname;
        const fileUrl = `/uploads/documents/${file.filename}`;

        if (fieldKey === 'evidence' || fieldKey === 'requirement' || fieldKey === 'walkInDoc') {
            updateData.evidenceUrl = fileUrl;
            updateData.evidenceName = file.originalname;
        } 
        
        documentMap.set(fieldKey, {
          fileName: `${fieldKey} - ${file.originalname}`, 
          fileUrl: fileUrl,
          uploadedAt: Date.now()
        });
      });
    }

    updateData.deliveredDocuments = Array.from(documentMap.values());

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true }
    );

    // 👇👇👇 ACTIVITY LOG START (UPDATE INQUIRY) 👇👇👇
    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            // 🔥 GET SPECIFIC MODULE NAME
            const specificModule = getModuleFromInquiryType(
                updatedInquiry.inquiryType || 'GENERAL', 
                updatedInquiry.serviceName
            );
            
            await ActivityLog.create({
                action: 'UPDATE',
                module: specificModule,  // 🔥 SPECIFIC MODULE
                user: userEmail,
                userId: adminId || null,
                description: `Updated ${specificModule.toLowerCase()}: ${updatedInquiry.fullName}`,
                severity: 'INFO',
                details: {
                    recordTitle: `${specificModule} - ${updatedInquiry.fullName}`,
                    recordId: id,
                    method: 'PUT',
                    inquiryType: updatedInquiry.inquiryType,
                    serviceName: updatedInquiry.serviceName
                }
            });
            console.log(`✅ Activity Log saved: UPDATE ${specificModule}`);
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.json({ success: true, data: updatedInquiry });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateInquiryStatus = async (req, res) => {
  try {
    const { status, adminNotes, contactedBy, remarks, userEmail, adminId } = req.body;
    const evidenceFile = req.file;
    
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const previousStatus = inquiry.status;
    
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

    // 👇👇👇 ACTIVITY LOG START (UPDATE STATUS) 👇👇👇
    try {
        const activeUser = userEmail || 'System';
        
        // 🔥 GET SPECIFIC MODULE NAME
        const specificModule = getModuleFromInquiryType(
            inquiry.inquiryType || 'GENERAL', 
            inquiry.serviceName
        );
        
        await ActivityLog.create({
            action: 'UPDATE',
            module: specificModule,  // 🔥 SPECIFIC MODULE
            user: activeUser,
            userId: adminId || null,
            description: `Updated ${specificModule.toLowerCase()} status: ${inquiry.fullName} (${previousStatus} → ${status})`,
            severity: status === 'CANCELLED' ? 'WARNING' : 'INFO',
            details: {
                recordTitle: `${specificModule} - ${inquiry.fullName}`,
                recordId: req.params.id,
                method: 'PUT',
                statusChange: `${previousStatus} → ${status}`,
                remarks: remarks || null,
                inquiryType: inquiry.inquiryType
            }
        });
        console.log(`✅ Activity Log saved: UPDATE STATUS ${specificModule}`);
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const inquiryInfo = {
      type: inquiry.inquiryType,
      name: inquiry.fullName,
      id: inquiry._id.toString()
    };

    await Inquiry.findByIdAndDelete(req.params.id);

    // 👇👇👇 ACTIVITY LOG START (DELETE INQUIRY) 👇👇👇
    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            // 🔥 GET SPECIFIC MODULE NAME
            const specificModule = getModuleFromInquiryType(
                inquiryInfo.type, 
                inquiry.serviceName
            );
            
            await ActivityLog.create({
                action: 'DELETE',
                module: specificModule,  // 🔥 SPECIFIC MODULE
                user: userEmail,
                userId: adminId || null,
                description: `Deleted ${specificModule.toLowerCase()}: ${inquiryInfo.name}`,
                severity: 'WARNING',
                details: {
                    recordTitle: `${specificModule} - ${inquiryInfo.name}`,
                    recordId: inquiryInfo.id,
                    method: 'DELETE',
                    inquiryType: inquiryInfo.type
                }
            });
            console.log(`✅ Activity Log saved: DELETE ${specificModule}`);
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

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
    const { userEmail, adminId } = req.body;
    
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

    // 👇👇👇 ACTIVITY LOG START (MARK AS PAID) 👇👇👇
    try {
        if (userEmail) {
            // 🔥 GET SPECIFIC MODULE NAME
            const specificModule = getModuleFromInquiryType(
                inquiry.inquiryType || 'GENERAL', 
                inquiry.serviceName
            );
            
            await ActivityLog.create({
                action: 'UPDATE',
                module: specificModule,  // 🔥 SPECIFIC MODULE
                user: userEmail,
                userId: adminId || null,
                description: `Marked ${specificModule.toLowerCase()} as PAID: ${inquiry.fullName}`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: `${specificModule} - ${inquiry.fullName}`,
                    recordId: id,
                    method: 'PUT',
                    paymentAmount: inquiry.estimatedPrice,
                    inquiryType: inquiry.inquiryType
                }
            });
            console.log(`✅ Activity Log saved: MARK AS PAID ${specificModule}`);
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

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
    const { adminName, userEmail, adminId } = req.body;

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

    // 👇👇👇 ACTIVITY LOG START (CONFIRM PAYMENT) 👇👇👇
    try {
        if (userEmail) {
            // 🔥 GET SPECIFIC MODULE NAME
            const specificModule = getModuleFromInquiryType(
                inquiry.inquiryType || 'GENERAL', 
                inquiry.serviceName
            );
            
            await ActivityLog.create({
                action: 'UPDATE',
                module: specificModule,  // 🔥 SPECIFIC MODULE
                user: userEmail,
                userId: adminId || null,
                description: `Confirmed payment for ${specificModule.toLowerCase()}: ${inquiry.fullName}`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: `${specificModule} - ${inquiry.fullName}`,
                    recordId: id,
                    method: 'PUT',
                    confirmedBy: adminName || 'Admin',
                    inquiryType: inquiry.inquiryType
                }
            });
            console.log(`✅ Activity Log saved: CONFIRM PAYMENT ${specificModule}`);
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

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
    const { userEmail, adminId } = req.body;
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

    // 👇👇👇 ACTIVITY LOG START (DELIVER DOCUMENTS) 👇👇👇
    try {
        if (userEmail) {
            // 🔥 GET SPECIFIC MODULE NAME
            const specificModule = getModuleFromInquiryType(
                inquiry.inquiryType || 'GENERAL', 
                inquiry.serviceName
            );
            
            await ActivityLog.create({
                action: 'UPDATE',
                module: specificModule,  // 🔥 SPECIFIC MODULE
                user: userEmail,
                userId: adminId || null,
                description: `Delivered documents for ${specificModule.toLowerCase()}: ${inquiry.fullName}`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: `${specificModule} - ${inquiry.fullName}`,
                    recordId: id,
                    method: 'PUT',
                    documentsDelivered: uploadedDocs.length,
                    inquiryType: inquiry.inquiryType
                }
            });
            console.log(`✅ Activity Log saved: DELIVER DOCUMENTS ${specificModule}`);
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.json({
      success: true,
      message: 'Documents delivered successfully',
      data: inquiry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getInquiryAnalytics = async (req, res) => {
  try {
    const inquiries = await Inquiry.find();
    const completedInquiries = inquiries.filter(i => i.status === 'COMPLETED');
    const totalRevenue = completedInquiries.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayRevenue = completedInquiries
      .filter(i => {
        const updated = new Date(i.updatedAt);
        return updated >= today && updated < tomorrow;
      })
      .reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const monthRevenue = completedInquiries
      .filter(i => {
        const updated = new Date(i.updatedAt);
        return updated >= startOfMonth && updated <= endOfMonth;
      })
      .reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
    
    const revenueByService = {};
    completedInquiries.forEach(inquiry => {
      const service = inquiry.serviceName || 'Other';
      if (!revenueByService[service]) {
        revenueByService[service] = {
          count: 0,
          revenue: 0
        };
      }
      revenueByService[service].count += 1;
      revenueByService[service].revenue += inquiry.estimatedPrice || 0;
    });
    
    const statusBreakdown = {
      completed: completedInquiries.length,
      pending: inquiries.filter(i => i.status === 'PENDING').length,
      processing: inquiries.filter(i => i.status === 'PROCESSING' || i.status === 'CONTACTED').length,
      paid: inquiries.filter(i => i.status === 'PAID' || i.status === 'CONFIRMED').length,
      cancelled: inquiries.filter(i => i.status === 'CANCELLED').length,
    };
    
    res.json({
      success: true,
      data: {
        totalInquiries: inquiries.length,
        completedCount: completedInquiries.length,
        totalRevenue,
        todayRevenue,
        monthRevenue,
        revenueByService,
        statusBreakdown,
        recentInquiries: inquiries.slice(0, 10)
      }
    });
    
  } catch (error) {
    console.error('Error fetching inquiries analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics', 
      error: error.message 
    });
  }
};

const getInquiriesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const inquiries = await Inquiry.find({
      updatedAt: {
        $gte: start,
        $lte: end
      },
      status: 'COMPLETED'
    });
    
    const totalRevenue = inquiries.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
    
    res.json({
      success: true,
      data: {
        count: inquiries.length,
        totalRevenue,
        inquiries
      }
    });
    
  } catch (error) {
    console.error('Error fetching inquiries by date range:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching inquiries', 
      error: error.message 
    });
  }
};

const toggleArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isArchive, userEmail, adminId } = req.body; 

    if (!['Yes', 'No'].includes(isArchive)) {
      return res.status(400).json({ success: false, message: 'Invalid value for isArchive' });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      { isArchive, updatedAt: Date.now() },
      { new: true }
    );

    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });

    // 👇👇👇 ACTIVITY LOG START (ARCHIVE/RESTORE) 👇👇👇
    try {
        if (userEmail) {
            // 🔥 GET SPECIFIC MODULE NAME
            const specificModule = getModuleFromInquiryType(
                inquiry.inquiryType || 'GENERAL', 
                inquiry.serviceName
            );
            
            await ActivityLog.create({
                action: isArchive === 'Yes' ? 'ARCHIVE' : 'UPDATE',
                module: specificModule,  // 🔥 SPECIFIC MODULE
                user: userEmail,
                userId: adminId || null,
                description: isArchive === 'Yes' 
                    ? `Archived ${specificModule.toLowerCase()}: ${inquiry.fullName}`
                    : `Restored ${specificModule.toLowerCase()}: ${inquiry.fullName}`,
                severity: isArchive === 'Yes' ? 'WARNING' : 'INFO',
                details: {
                    recordTitle: `${specificModule} - ${inquiry.fullName}`,
                    recordId: id,
                    method: 'PUT',
                    archiveStatus: isArchive,
                    inquiryType: inquiry.inquiryType
                }
            });
            console.log(`✅ Activity Log saved: ${isArchive === 'Yes' ? 'ARCHIVE' : 'RESTORE'} ${specificModule}`);
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.json({ success: true, message: `Inquiry archive status set to ${isArchive}`, data: inquiry });
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
  updateInquiry,  
  deleteInquiry,
  getInquiriesByEmail,
  getInquiryStats,
  markAsPaid,
  confirmPayment,
  deliverDocuments,
  getInquiryAnalytics,
  getInquiriesByDateRange,
  toggleArchive
};