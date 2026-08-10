const Inquiry = require('../models/inquiry');
const Service = require('../models/service');
const User = require('../models/user');
const Payment = require('../models/payment');
const CENOMAR = require('../models/cenomar');
const Visa = require('../models/visa');
const PSA = require('../models/psa');
const ActivityLog = require('../models/ActivityLog'); // ✅ ACTIVITY LOG IMPORT
const { sendNewUserToGHL, sendInquiryToGHL } = require('../utils/ghlService');
const { redactBody } = require('../utils/safeLog');
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

// 🔐 SECURITY: Resolve the authoritative price for catalog-based services directly from
// the database, ignoring whatever the client claims in estimatedPrice. Visa / PSA /
// CENOMAR / Service all have fixed catalog prices keyed by their reference id, so a
// customer can no longer submit estimatedPrice:1 and pay ₱1. Flight bookings and general
// inquiries have no fixed catalog price (the figure is a live quote), so those fall back
// to the client estimate — there is no DB record to recompute them from.
const resolveAuthoritativeInquiryPrice = async ({ serviceId, visaId, psaId, cenomarId, serviceName, cenomarDocument }) => {
  try {
    if (visaId) {
      const v = await Visa.findById(visaId).lean();
      if (v && v.price != null) { const n = parseFloat(v.price); if (n > 0) return n; }
    }
    if (psaId) {
      const p = await PSA.findById(psaId).lean();
      if (p && p.price != null) { const n = parseFloat(p.price); if (n > 0) return n; }
    }
    if (cenomarId) {
      const c = await CENOMAR.findById(cenomarId).lean();
      if (c && c.price != null) { const n = parseFloat(c.price); if (n > 0) return n; }
    }
    if (serviceId) {
      const s = await Service.findById(serviceId).lean();
      if (s && s.price != null) { const n = parseFloat(s.price); if (n > 0) return n; }
    }
    // Name-based fallback (CENOMAR / PSA document-type matching)
    const byName = await findCorrectPrice(serviceName, cenomarDocument);
    if (byName && byName > 0) return byName;
  } catch (error) {
    console.error('❌ resolveAuthoritativeInquiryPrice error:', error.message);
  }
  return null;
};

const createInquiry = async (req, res) => {
  try {
    console.log('🔥 RAW REQUEST BODY:', JSON.stringify(redactBody(req.body), null, 2));
 
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
 
    // --- [START] SERVER-SIDE AUTHORITATIVE PRICE (anti price-manipulation) ---
    // Never trust the client estimatedPrice for catalog services. If a reference id
    // resolves to a DB-backed price, that value wins and any client figure is discarded.
    let finalPrice = parseFloat(estimatedPrice) || 0;

    const authoritativePrice = await resolveAuthoritativeInquiryPrice({
        serviceId, visaId, psaId, cenomarId, serviceName, cenomarDocument
    });

    if (authoritativePrice != null && authoritativePrice > 0) {
        if (authoritativePrice !== finalPrice) {
            console.warn(`⚠️ Inquiry price override — client sent ₱${finalPrice}, server authoritative ₱${authoritativePrice}`);
        }
        finalPrice = authoritativePrice;
    } else if (finalPrice === 0) {
        console.log("⚠️ Price is 0 and no catalog match. Attempting name-based auto-fix...");
        finalPrice = await findCorrectPrice(serviceName, cenomarDocument);
        console.log(`✅ Price Auto-Fixed to: ${finalPrice}`);
    }
    // --- [END] SERVER-SIDE AUTHORITATIVE PRICE ---
 
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
    const inquiry = await Inquiry.findById(req.params.id).populate('serviceId visaId cenomarId');
    
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    
    console.log("🔍 RAW INQUIRY FROM DB:", inquiry.passengers);
    console.log("🔍 Type:", typeof inquiry.passengers);
    
    // Convert to plain object
    const responseData = inquiry.toObject();
    
    // 🔥 ENSURE PASSENGERS IS ALWAYS AN ARRAY
    let cleanedPassengers = [];
    
    try {
      let passengersData = responseData.passengers;
      
      // If it's a string, parse it
      if (typeof passengersData === 'string') {
        console.log("⚠️ Passengers is stored as string, parsing...");
        passengersData = JSON.parse(passengersData);
        
        // Check if still string (double-stringified)
        if (typeof passengersData === 'string') {
          console.log("⚠️ Double-stringified detected, parsing again...");
          passengersData = JSON.parse(passengersData);
        }
      }
      
      // Validate and clean
      if (Array.isArray(passengersData)) {
        cleanedPassengers = passengersData
          .map(p => {
            if (typeof p === 'string') {
              try {
                p = JSON.parse(p);
              } catch (e) {
                return null;
              }
            }
            
            if (p && typeof p === 'object') {
              return {
                firstName: String(p.firstName || '').trim(),
                lastName: String(p.lastName || '').trim(),
                nationality: String(p.nationality || 'Filipino').trim(),
                age: p.age ? parseInt(p.age) : 0,
                email: String(p.email || '').trim(),
                contactNumber: String(p.contactNumber || '').trim(),
                type: String(p.type || 'Adult').trim()
              };
            }
            return null;
          })
          .filter(p => p !== null);
      }
    } catch (e) {
      console.error("❌ Error parsing passengers in getInquiry:", e);
    }
    
    // Ensure at least one default passenger
    if (cleanedPassengers.length === 0) {
      cleanedPassengers = [{
        firstName: "",
        lastName: "",
        nationality: "Filipino",
        age: 0,
        email: "",
        contactNumber: "",
        type: "Adult"
      }];
    }
    
    responseData.passengers = cleanedPassengers;
    
    console.log("✅ CLEANED PASSENGERS BEING SENT:", responseData.passengers);
    
    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error("❌ GET INQUIRY ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
const updateInquiry = async (req, res) => {
  try {
    const { id } = req.params; 
    const existingInquiry = await Inquiry.findById(id);
    
    if (!existingInquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    console.log("📋 EXISTING INQUIRY:", {
      passengers: existingInquiry.passengers,
      passengersType: typeof existingInquiry.passengers,
      isArray: Array.isArray(existingInquiry.passengers)
    });
    
    console.log("🔥 INCOMING DATA:", {
      passengers: req.body.passengers,
      passengersType: typeof req.body.passengers
    });

    const changes = [];

    // Parse existingFiles safely
    let remainingFilesList = [];
    if (req.body.existingFiles) {
      try {
        remainingFilesList = JSON.parse(req.body.existingFiles);
      } catch (e) {
        console.error("Error parsing existingFiles:", e);
        remainingFilesList = [];
      }
    }

    // 🔥🔥🔥 CRITICAL FIX: PARSE PASSENGERS PROPERLY 🔥🔥🔥
    let updatedPassengers = [];
    
    if (req.body.passengers !== undefined && req.body.passengers !== null) {
      try {
        let passengersData = req.body.passengers;
        
        console.log("📋 Raw passengers received:", passengersData);
        console.log("📋 Type:", typeof passengersData);
        
        // Parse if string
        if (typeof passengersData === 'string' && passengersData.trim() !== '') {
          try {
            // Clean string before parsing
            const cleanedString = passengersData
              .replace(/\n/g, '')
              .replace(/\r/g, '')
              .replace(/\t/g, '')
              .trim();
            
            console.log("🧹 Cleaned string:", cleanedString);
            passengersData = JSON.parse(cleanedString);
            console.log("✅ After parse:", passengersData);
          } catch (parseError) {
            console.error("❌ Parse error:", parseError.message);
            throw new Error(`Failed to parse passengers JSON: ${parseError.message}`);
          }
        }
        
        // Ensure we have an array
        if (!Array.isArray(passengersData)) {
          console.error("❌ Passengers is not an array after parsing");
          passengersData = [];
        }
        
        // Process and validate each passenger
        updatedPassengers = passengersData
          .map((p, idx) => {
            console.log(`Processing passenger ${idx}:`, p);
            
            // Skip if not an object
            if (!p || typeof p !== 'object') {
              console.warn(`Skipping passenger ${idx}: not an object`);
              return null;
            }
            
            // Must have at least firstName or lastName
            const firstName = String(p.firstName || '').trim();
            const lastName = String(p.lastName || '').trim();
            
            if (!firstName && !lastName) {
              console.warn(`Skipping passenger ${idx}: no name provided`);
              return null;
            }
            
            // Build clean passenger object matching schema
            const cleanPassenger = {
              firstName: firstName,
              lastName: lastName,
              nationality: String(p.nationality || 'Filipino').trim(),
              age: p.age ? parseInt(p.age) : 0,
              email: String(p.email || '').trim(),
              contactNumber: String(p.contactNumber || '').trim(),
              type: (() => {
                const rawType = String(p.type || 'Adult').toLowerCase();
                if (rawType.includes('child')) return 'Child';
                if (rawType.includes('infant')) return 'Infant';
                return 'Adult'; // catches "Adult", "Adult (Primary)", etc.
              })()
            };
            
            console.log(`✅ Cleaned passenger ${idx}:`, cleanPassenger);
            return cleanPassenger;
          })
          .filter(p => p !== null);
        
        console.log("✅ Final passengers array:", updatedPassengers);
        
        if (updatedPassengers.length > 0) {
          changes.push(`Updated ${updatedPassengers.length} passenger(s)`);
        }
      } catch (e) {
        console.error("❌ Error processing passengers:", e);
        return res.status(400).json({ 
          success: false, 
          message: `Invalid passengers data: ${e.message}` 
        });
      }
    } else {
      // Keep existing passengers if none provided
      console.log("ℹ️ No passengers in request, keeping existing");
      updatedPassengers = existingInquiry.passengers || [];
    }

    // Ensure at least one passenger for flight bookings
    if (req.body.inquiryType === 'FLIGHT_BOOKING' && updatedPassengers.length === 0) {
      updatedPassengers = [{
        firstName: "",
        lastName: "",
        nationality: "Filipino",
        age: 0,
        email: "",
        contactNumber: "",
        type: "Adult"
      }];
    }

   // === BUILD UPDATE DATA — preserve all existing fields, only overwrite what's sent ===
const updateData = {
  fullName: req.body.fullName || existingInquiry.fullName,
  email: req.body.email || existingInquiry.email,
  contactNumber: req.body.contactNumber !== undefined ? req.body.contactNumber : existingInquiry.contactNumber,
  estimatedPrice: req.body.estimatedPrice !== undefined ? (parseFloat(req.body.estimatedPrice) || existingInquiry.estimatedPrice || 0) : existingInquiry.estimatedPrice,
  message: req.body.message || existingInquiry.message,
  // Preserve all fields not touched by this update
  serviceName: existingInquiry.serviceName,
  inquiryType: existingInquiry.inquiryType,
  address: existingInquiry.address,
  visaCountry: existingInquiry.visaCountry,
  visaId: existingInquiry.visaId,
  psaDocument: existingInquiry.psaDocument,
  psaId: existingInquiry.psaId,
  cenomarDocument: existingInquiry.cenomarDocument,
  cenomarId: existingInquiry.cenomarId,
  travelDate: existingInquiry.travelDate,
  lengthOfStay: existingInquiry.lengthOfStay,
  passportDetails: existingInquiry.passportDetails,
  status: existingInquiry.status,
  isArchive: existingInquiry.isArchive,
  remarks: existingInquiry.remarks,
  evidenceUrl: existingInquiry.evidenceUrl,
  evidenceName: existingInquiry.evidenceName,
  adminNotes: existingInquiry.adminNotes,
  contactedAt: existingInquiry.contactedAt,
  contactedBy: existingInquiry.contactedBy,
  paymentConfirmedAt: existingInquiry.paymentConfirmedAt,
  paymentConfirmedBy: existingInquiry.paymentConfirmedBy,
  deliveredDocuments: existingInquiry.deliveredDocuments,
  documentsDeliveredAt: existingInquiry.documentsDeliveredAt,
  updatedAt: Date.now()
};

// 🔥 FLIGHT DETAILS — deep-merge so no existing sub-fields are lost
if (req.body.flightDetails) {
  try {
    let incomingFlight = req.body.flightDetails;

    // Parse if it's a string (galing sa FormData)
    if (typeof incomingFlight === 'string') {
      incomingFlight = JSON.parse(incomingFlight);
    }

    console.log("📥 Incoming flightDetails from frontend:", incomingFlight);

    const existingFlight = existingInquiry.flightDetails || {};

    // Round-trip: deep-merge each leg with existing data
    if (incomingFlight.type === 'round-trip' || incomingFlight.outbound) {
      const existingOutbound = existingFlight.outbound || {};
      const existingReturn = existingFlight.return || {};
      const incomingOutbound = incomingFlight.outbound || {};
      const incomingReturn = incomingFlight.return || {};

      updateData.flightDetails = {
        type: "round-trip",
        outbound: {
          origin: incomingOutbound.origin ?? existingOutbound.origin ?? "",
          destination: incomingOutbound.destination ?? existingOutbound.destination ?? "",
          departureDate: incomingOutbound.departureDate ?? existingOutbound.departureDate ?? "",
          arrivalDate: incomingOutbound.arrivalDate ?? existingOutbound.arrivalDate ?? "",
          airline: incomingOutbound.airline ?? existingOutbound.airline ?? "",
          flightNumber: incomingOutbound.flightNumber ?? existingOutbound.flightNumber ?? "",
          duration: incomingOutbound.duration ?? existingOutbound.duration ?? "",
          stops: incomingOutbound.stops ?? existingOutbound.stops ?? 0,
          price: parseFloat(incomingOutbound.price ?? existingOutbound.price) || 0
        },
        return: {
          origin: incomingReturn.origin ?? existingReturn.origin ?? "",
          destination: incomingReturn.destination ?? existingReturn.destination ?? "",
          departureDate: incomingReturn.departureDate ?? existingReturn.departureDate ?? "",
          arrivalDate: incomingReturn.arrivalDate ?? existingReturn.arrivalDate ?? "",
          airline: incomingReturn.airline ?? existingReturn.airline ?? "",
          flightNumber: incomingReturn.flightNumber ?? existingReturn.flightNumber ?? "",
          duration: incomingReturn.duration ?? existingReturn.duration ?? "",
          stops: incomingReturn.stops ?? existingReturn.stops ?? 0,
          price: parseFloat(incomingReturn.price ?? existingReturn.price) || 0
        },
        totalAmount: parseFloat(incomingFlight.totalAmount) ||
                     (parseFloat(incomingOutbound.price || existingOutbound.price || 0) +
                      parseFloat(incomingReturn.price || existingReturn.price || 0)),
        cabinClass: incomingFlight.cabinClass || existingFlight.cabinClass || "Economy"
      };
    }
    // One-way: merge with existing
    else {
      updateData.flightDetails = {
        type: incomingFlight.type || existingFlight.type || "one-way",
        origin: incomingFlight.origin ?? existingFlight.origin ?? "",
        destination: incomingFlight.destination ?? existingFlight.destination ?? "",
        departureDate: incomingFlight.departureDate ?? existingFlight.departureDate ?? "",
        arrivalDate: incomingFlight.arrivalDate ?? existingFlight.arrivalDate ?? "",
        airline: incomingFlight.airline ?? existingFlight.airline ?? "",
        flightNumber: incomingFlight.flightNumber ?? existingFlight.flightNumber ?? "",
        duration: incomingFlight.duration ?? existingFlight.duration ?? "",
        stops: incomingFlight.stops ?? existingFlight.stops ?? 0,
        cabinClass: incomingFlight.cabinClass || existingFlight.cabinClass || "Economy"
      };
    }

    console.log("✅ FlightDetails successfully saved as:", updateData.flightDetails);
  } catch (e) {
    console.error("❌ Error parsing flightDetails:", e);
    updateData.flightDetails = existingInquiry.flightDetails; // fallback to existing
  }
} else {
  // No flightDetails sent — keep existing completely
  updateData.flightDetails = existingInquiry.flightDetails;
}


// 🔥 USE THE ALREADY-CLEANED updatedPassengers (processed above) — DO NOT re-parse
updateData.passengers = updatedPassengers;

    // 🔥 UPDATE DATABASE - Let Mongoose handle the schema validation
    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true // Enable validators to ensure schema compliance
      }
    );

    if (!updatedInquiry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Failed to update inquiry' 
      });
    }

    console.log("✅ INQUIRY UPDATED SUCCESSFULLY");
    console.log("📦 Saved passengers:", updatedInquiry.passengers);

    // Activity Log
    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            const getModuleFromInquiryType = (inquiryType, serviceName) => {
                const typeMapping = {
                    'FLIGHT_BOOKING': 'Flight Booking',
                    'VISA': 'Visa Application',
                    'PASSPORT': 'Passport',
                    'PSA': 'PSA Documents',
                    'CENOMAR': 'CENOMAR',
                    'GENERAL': 'General Inquiries'
                };
                return typeMapping[inquiryType] || 'General Inquiries';
            };
            
            const ActivityLog = require('../models/ActivityLog');
            const specificModule = getModuleFromInquiryType(
                updatedInquiry.inquiryType || 'GENERAL',
                updatedInquiry.serviceName
            );
            
            await ActivityLog.create({
                action: 'UPDATE',
                module: specificModule,
                user: userEmail,
                userId: adminId || null,
                description: `Updated ${specificModule.toLowerCase()}: ${updatedInquiry.fullName}`,
                severity: 'INFO',
                details: {
                    recordTitle: `${specificModule} - ${updatedInquiry.fullName}`,
                    recordId: id,
                    method: 'PUT',
                    changes: changes,
                    inquiryType: updatedInquiry.inquiryType,
                    passengersCount: updatedInquiry.passengers.length,
                    docCount: updatedInquiry.deliveredDocuments.length
                }
            });
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }

    res.json({ success: true, data: updatedInquiry });
  } catch (error) {
    console.error('❌ UPDATE ERROR:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error updating inquiry'
    });
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
    console.error('❌ Status Update Error:', error);
    res.status(500).json({ success: false, message: error.message });
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