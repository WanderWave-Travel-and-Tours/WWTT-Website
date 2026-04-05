const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // ✅ Added for GHL webhook calls
const Booking = require('../models/booking');
const User = require('../models/user');
const Promo = require('../models/promo');
const Package = require('../models/package');
const ActivityLog = require('../models/ActivityLog');
const { BookingCount } = require('../models/PageView');
const { sendNewUserToGHL, sendBookingConfirmationToGHL } = require('../utils/ghlService');
 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = file.fieldname.includes('passport') 
      ? './uploads/passports/' 
      : './uploads/ids/';
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/jpg', 'application/pdf',
    'image/gif', 'image/webp', 'image/tiff' 
  ];
  
  const isImage = file.mimetype.startsWith('image/');

  if (allowedMimeTypes.includes(file.mimetype) || isImage) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, WEBP, and PDF are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const generateTempPassword = () => {
  const numbers = Math.floor(100000 + Math.random() * 900000);
  const specialChars = '!@#$%^&*';
  const randomSpecialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  return `Wander_${numbers}${randomSpecialChar}`;
};

router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const bookings = await Booking.find({ email: email })
      .populate('packageId')
      .sort({ createdAt: -1 })
      .lean();

    // ── Destination fallback (mirrors /active route) ──────────────────────
    // For bookings where packageId is null or has no destination (e.g. the
    // package existed at booking time but packageId wasn't stored, or was
    // later deleted), we do a secondary lookup by packageName title so the
    // frontend always has a destination to work with.
    const missingNames = [...new Set(
      bookings
        .filter(b => !b.packageId?.destination && b.packageName)
        .map(b => b.packageName)
    )];

    let fallbackMap = {};
    if (missingNames.length > 0) {
      const fallbackPkgs = await Package.find(
        { title: { $in: missingNames } },
        'title destination inclusions tourType minPax duration'
      ).lean();
      fallbackPkgs.forEach(p => { fallbackMap[p.title] = p; });
    }

    // Attach destination + package data to each booking that needs it
    const enriched = bookings.map(b => {
      if (b.packageId?.destination) return b; // already populated — no change
      const fallbackPkg = fallbackMap[b.packageName];
      if (!fallbackPkg) return b;
      return {
        ...b,
        // Inject a synthetic populated packageId so the frontend
        // can read .packageId.destination without any special casing
        packageId: {
          _id:         fallbackPkg._id,
          title:       fallbackPkg.title,
          destination: fallbackPkg.destination,
          inclusions:  fallbackPkg.inclusions || [],
          tourType:    fallbackPkg.tourType,
          minPax:      fallbackPkg.minPax,
          duration:    fallbackPkg.duration,
        },
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    console.error('❌ Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings'
    });
  }
});


router.get('/stats/summary', async (req, res) => {
  try {
    const bookings = await Booking.find();

    const stats = {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      withAirfare: bookings.filter(b => b.includesAirfare).length,
      revenue: bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

router.get('/init-archive', async (req, res) => {
    try {
        const result = await Booking.updateMany(
            { isArchive: { $exists: false } },
            { $set: { isArchive: 'No' } }
        );
        res.status(200).json({ 
            status: 'ok', 
            message: `Success! ${result.modifiedCount} booking documents updated to isArchive: 'No'.` 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});



router.get('/active', async (req, res) => {
    try {
        const bookings = await Booking.find({ isArchive: 'No' })
            .populate('packageId', 'destination title')
            .sort({ createdAt: -1 })
            .lean();

        // Collect packageNames that still have no destination (packageId was null/missing)
        const missingNames = [...new Set(
            bookings
                .filter(b => !b.packageId?.destination && b.packageName)
                .map(b => b.packageName)
        )];

        // Fallback: look up packages by title to fill in destination
        let fallbackMap = {};
        if (missingNames.length > 0) {
            const fallbackPkgs = await Package.find(
                { title: { $in: missingNames } },
                'title destination'
            ).lean();
            fallbackPkgs.forEach(p => { fallbackMap[p.title] = p.destination; });
        }

        // Attach destination to each booking
        const enriched = bookings.map(b => ({
            ...b,
            destination: b.packageId?.destination
                || fallbackMap[b.packageName]
                || null
        }));

        res.json({
            success: true,
            count: enriched.length,
            bookings: enriched
        });
    } catch (error) {
        console.error('Error fetching active bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active bookings'
        });
    }
});

router.get('/archived', async (req, res) => {
    try {
        const archived = await Booking.find({ isArchive: 'Yes' }).sort({ createdAt: -1 });
        res.json({
            success: true,
            count: archived.length,
            bookings: archived
        });
    } catch (error) {
        console.error('Error fetching archived bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch archived bookings'
        });
    }
});

router.post('/:id/archive', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ status: "error", message: "Booking not found" });

        const newStatus = booking.isArchive === 'Yes' ? 'No' : 'Yes';
        booking.isArchive = newStatus;
        await booking.save();

        // ── Sync View-to-Book Rate ────────────────────────────────────
        // Archiving → remove its BookingCount so the rate goes down
        // Restoring → re-create it so the rate reflects reality again
        try {
            if (newStatus === 'Yes') {
                // Delete the BookingCount tied to this booking
                const deleted = await BookingCount.deleteOne({ bookingId: booking._id });
                console.log(`📊 BookingCount removed on archive (deleted: ${deleted.deletedCount})`);
            } else {
                // Re-create the BookingCount on restore (avoid duplicates)
                const exists = await BookingCount.findOne({ bookingId: booking._id });
                if (!exists) {
                    const totalPax = (booking.pax?.adult || 0) + (booking.pax?.children || 0) + (booking.pax?.infants || 0);
                    await BookingCount.create({
                        bookingId:   booking._id,
                        packageId:   booking.packageId   || null,
                        packageName: booking.packageName || null,
                        paxCount:    totalPax || 1,
                        paymentType: booking.paymentType || 'unknown',
                        totalAmount: booking.totalAmount || 0,
                    });
                    console.log(`📊 BookingCount restored for booking: ${booking.packageName}`);
                }
            }
        } catch (syncErr) {
            // Non-fatal — archive still succeeds even if BookingCount sync fails
            console.error('⚠️ BookingCount sync failed (non-fatal):', syncErr.message);
        }
        // ─────────────────────────────────────────────────────────────

        // 👇👇👇 ACTIVITY LOG START (ARCHIVE/RESTORE) 👇👇👇
        try {
            const { userEmail, adminId } = req.body;
            if (userEmail) {
                await ActivityLog.create({
                    action: newStatus === 'Yes' ? 'ARCHIVE' : 'UPDATE',
                    module: 'Bookings',
                    user: userEmail,
                    userId: adminId || null,
                    description: newStatus === 'Yes' 
                        ? `Archived booking: ${booking.packageName} (${booking.fullName})`
                        : `Restored booking: ${booking.packageName} (${booking.fullName})`,
                    severity: newStatus === 'Yes' ? 'WARNING' : 'INFO',
                    details: {
                        recordTitle: `${booking.packageName} - ${booking.fullName}`,
                        recordId: booking._id.toString(),
                        method: 'POST',
                        archiveStatus: newStatus
                    }
                });
                console.log('✅ Activity Log saved for Archive/Restore Booking');
            }
        } catch (logError) {
            console.error('⚠️ Failed to save activity log:', logError.message);
        }
        // 👆👆👆 ACTIVITY LOG END 👆👆👆

        res.json({ 
            status: "ok", 
            message: `Booking archive status updated to ${newStatus}`, 
            isArchive: newStatus 
        });
    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
});

router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('packageId')
      .populate('promoId')
      .populate({
        path: 'customizedInclusions.sellerRateId',
        model: 'SellerRate'
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Add customization summary if customized
    const response = booking.toObject();
    if (booking.isCustomized) {
      response.customizationSummary = booking.getCustomizationSummary();
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ 
      message: 'Error fetching booking', 
      error: error.message 
    });
  }
});

router.post('/', upload.any(), async (req, res) => {
  try {
    let bookingData;
    
    if (!req.body.bookingData) {
      console.error('❌ No bookingData field found in request!');
      return res.status(400).json({
        success: false,
        message: 'No booking data provided',
        hint: 'The bookingData field is missing from the request'
      });
    }

    try {
        bookingData = JSON.parse(req.body.bookingData);
    } catch (error) {
        console.error('❌ Failed to parse bookingData:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid booking data format',
          error: error.message
        });
    }

// ✅ PRICE VALIDATION - Verify submitted price matches expected price
if (bookingData.packageId) {
  try {
    const pkg = await Package.findById(bookingData.packageId);
    
    if (pkg) {
      const basePrice = pkg.price;
      const markupPrice = Math.round(basePrice * 1.10);
      const submittedPrice = bookingData.price;
      
      console.log('🔍 ===== BACKEND PRICE VALIDATION =====');
      console.log('Package Base Price:', basePrice);
      console.log('Markup Price (10%):', markupPrice);
      console.log('Submitted Price:', submittedPrice);
      console.log('Timer Expired:', bookingData.timerExpiredAtBooking);
      console.log('Price Type:', bookingData.priceType);
      console.log('Is Customized:', bookingData.isCustomized);
      console.log('====================================');
      
      // Validate that submitted price is reasonable
      // Allow flexibility for customization and room upgrades
      const isValidPrice = 
        Math.abs(submittedPrice - basePrice) < 100 ||  // Close to base price
        Math.abs(submittedPrice - markupPrice) < 100 || // Close to markup price
        bookingData.isCustomized; // Allow any price if customized
      
      if (!isValidPrice) {
        console.warn('⚠️ Price validation warning:', {
          expected: `${basePrice} (discounted) or ${markupPrice} (markup)`,
          received: submittedPrice,
          difference: Math.abs(submittedPrice - basePrice)
        });
        // Note: We log a warning but don't fail the booking
        // This allows room upgrades and customization to work
      } else {
        console.log('✅ Price validation passed');
      }
    }
  } catch (priceValidationError) {
    console.error('⚠️ Price validation error (non-fatal):', priceValidationError);
    // Don't fail the booking due to validation error
  }
}

    // Promo validation
    if (bookingData.promoId) {
      console.log('🎟️ Validating promo code...');
      try {
        const promo = await Promo.findById(bookingData.promoId);
        
        if (!promo) {
          req.files?.forEach(file => {
            try { fs.unlinkSync(file.path); } catch (e) {}
          });
          return res.status(400).json({
            success: false,
            message: 'Promo code not found'
          });
        }

        if (!promo.isActive || promo.isArchive === 'Yes') {
          req.files?.forEach(file => {
            try { fs.unlinkSync(file.path); } catch (e) {}
          });
          return res.status(400).json({
            success: false,
            message: 'This promo code is no longer active'
          });
        }

        const today = new Date();
        if (today > new Date(promo.validUntil)) {
          req.files?.forEach(file => {
            try { fs.unlinkSync(file.path); } catch (e) {}
          });
          return res.status(400).json({
            success: false,
            message: 'This promo code has expired'
          });
        }

        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
          req.files?.forEach(file => {
            try { fs.unlinkSync(file.path); } catch (e) {}
          });
          return res.status(400).json({
            success: false,
            message: 'This promo code has reached its usage limit and is no longer available'
          });
        }

        console.log(`✅ Promo code validated: ${promo.code} (${promo.usedCount}/${promo.usageLimit || '∞'} used)`);
      } catch (promoError) {
        console.error('❌ Promo validation error:', promoError);
        req.files?.forEach(file => {
          try { fs.unlinkSync(file.path); } catch (e) {}
        });
        return res.status(500).json({
          success: false,
          message: 'Failed to validate promo code',
          error: promoError.message
        });
      }
    }

    // ✅ HANDLE WALK-IN BOOKINGS (NO PASSENGER VALIDATION)
    let passengers = [];
    
    if (bookingData.isWalkin) {
      console.log('🏢 Processing walk-in booking - skipping passenger validation');
      
      // Create a placeholder passenger from primary contact
      passengers = [{
        passengerNumber: 1,
        firstName: bookingData.fullName?.split(' ')[0] || 'Walk-in',
        lastName: bookingData.fullName?.split(' ').slice(1).join(' ') || 'Customer',
        email: bookingData.email || 'walkin@placeholder.com',
        phone: bookingData.primaryContact?.phone || '0000000000',
        dateOfBirth: '2000-01-01',
        age: 0,
        gender: 'Not Specified',
        address: bookingData.primaryContact?.address || 'Walk-in',
        nationality: 'Filipino'
      }];
      
      console.log(`✅ Walk-in placeholder passenger created`);
    } else {
      // ✅ REGULAR BOOKING - COMPLETE PASSENGER PROCESSING LOGIC
      const rawPassengers = bookingData.passengers || []; 
      const totalExpectedPassengers = bookingData.pax?.adult || 1;

      if (rawPassengers.length === 0) {
          console.error(`❌ Embedded passenger array is empty for regular booking.`);
          req.files?.forEach(file => {
            try { fs.unlinkSync(file.path); } catch (e) {}
          });
          return res.status(400).json({
            success: false,
            message: 'No passenger data provided. Regular bookings require complete passenger information.'
          });
      }

      console.log(`📋 Processing ${rawPassengers.length} passengers for regular booking...`);

      for (let index = 0; index < rawPassengers.length; index++) {
        const passengerData = rawPassengers[index];
          // Validate required fields for regular bookings
          if (!passengerData.firstName || !passengerData.lastName || 
              !passengerData.email || !passengerData.phone || 
              !passengerData.dateOfBirth) {
              req.files?.forEach(file => { try { fs.unlinkSync(file.path); } catch (e) {} });
              return res.status(400).json({
                success: false,
                message: `Passenger ${index + 1} is missing required fields (firstName, lastName, email, phone, or dateOfBirth). Please complete all passenger details.`
              });
          }

          // Build passenger object
          const passenger = {
              passengerNumber: passengerData.passengerNumber || index + 1,
              firstName: passengerData.firstName,
              lastName: passengerData.lastName,
              email: passengerData.email,
              phone: passengerData.phone,
              dateOfBirth: passengerData.dateOfBirth,
              age: parseInt(passengerData.age) || 0,
              gender: passengerData.gender || '',
              address: passengerData.address || '',
              nationality: passengerData.nationality || 'Filipino'
          };

          // Handle file uploads
          const idFile = req.files ? req.files.find(f => f.fieldname === `idFile_${index}`) : null;
          const passportFile = req.files ? req.files.find(f => f.fieldname === `passportFile_${index}`) : null;

          if (idFile) {
            passenger.idDocument = {
              filename: idFile.filename,
              originalName: idFile.originalname,
              path: idFile.path,
              size: idFile.size
            };
            console.log(`  📄 ID uploaded for passenger ${index + 1}: ${idFile.originalname}`);
          }

          if (passportFile) {
            passenger.passportDocument = {
              filename: passportFile.filename,
              originalName: passportFile.originalname,
              path: passportFile.path,
              size: passportFile.size
            };
            console.log(`  📄 Passport uploaded for passenger ${index + 1}: ${passportFile.originalname}`);
          }

          // ✅ ADD PASSENGER TO ARRAY
          passengers.push(passenger);
      }

      // ✅ STRICT VALIDATION: Only for regular bookings (non-walk-in)
      if (passengers.length !== totalExpectedPassengers) {
          req.files?.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (e) {}
          });
          console.error(`❌ Invalid passenger count for regular booking: ${passengers.length} found, ${totalExpectedPassengers} expected`);
          return res.status(400).json({
            success: false,
            message: `Invalid number of passengers. Expected ${totalExpectedPassengers}, received ${passengers.length}. Please ensure all passenger fields are complete.`,
          });
      }

      console.log(`✅ Successfully processed ${passengers.length} passengers for regular booking`);
    }

    // Get primary contact
    const primaryEmail = bookingData.email || bookingData.primaryContact?.email || passengers[0]?.email;
    const primaryName = bookingData.fullName || bookingData.primaryContact?.fullName || 
                       `${passengers[0]?.firstName} ${passengers[0]?.lastName}`;
    
    // User creation/lookup (skip for walk-in)
    let existingUser = await User.findOne({ email: primaryEmail });
    let isNewUser = false;
    let tempPassword = null;

    if (!bookingData.isWalkin) {
      if (!existingUser) {
        isNewUser = true;
        tempPassword = generateTempPassword();
        const baseUsername = primaryEmail.split('@')[0].toLowerCase();

        try {
          existingUser = await User.create({
            fullName: primaryName,
            email: primaryEmail,
            username: `${baseUsername}${Date.now()}`,
            password: tempPassword
          });
          
          await sendNewUserToGHL(primaryEmail, primaryName, tempPassword, bookingData.packageName);
          console.log('✅ Welcome email sent to new user');
        } catch (e) {
          console.error('❌ User/GHL Create Error:', e);
        }
      } else {
        try {
          await sendBookingConfirmationToGHL(
            primaryEmail,
            primaryName,
            bookingData.packageName,
            bookingData.totalAmount,
            bookingData.startDate,
            bookingData.endDate,
            passengers.length
          );
          console.log('✅ Booking confirmation email sent');
        } catch (e) {
          console.error('❌ GHL Booking Email Error:', e);
        }
      }
    }

    // Parse flight details
    let flightDetailsObject = bookingData.flightDetails;
    if (flightDetailsObject && typeof flightDetailsObject === 'string') {
        try {
            flightDetailsObject = JSON.parse(flightDetailsObject);
        } catch (e) {
            console.error('Failed to parse flightDetails string:', e);
            flightDetailsObject = null;
        }
    }

    console.log('📊 Creating booking with:');
    console.log('  - Primary Contact:', primaryName, primaryEmail);
    console.log('  - Passengers:', passengers.length);
    console.log('  - Walk-in:', bookingData.isWalkin || false);
    console.log('  - Promo:', bookingData.promoCode || 'None');
    console.log('  - Total Amount:', bookingData.totalAmount);

    // ✅ SANITIZE CUSTOMIZED INCLUSIONS - Ensure all have required 'source' field
    let sanitizedCustomizedInclusions = [];
    if (bookingData.customizedInclusions && Array.isArray(bookingData.customizedInclusions)) {
      sanitizedCustomizedInclusions = bookingData.customizedInclusions.map(inclusion => {
        // Ensure source field exists
        if (!inclusion.source) {
          // Determine source based on available data
          if (inclusion.sellerRateId || inclusion.supplier) {
            inclusion.source = 'seller-rate';
          } else {
            inclusion.source = 'package';
          }
        }
        
        // Ensure all required fields exist with defaults
        return {
          id: inclusion.id || `inc-${Date.now()}-${Math.random()}`,
          name: inclusion.name || 'Unknown Inclusion',
          price: inclusion.price || 0,
          supplierRate: inclusion.supplierRate || null,
          markup: inclusion.markup || null,
          markupType: inclusion.markupType || null,
          supplier: inclusion.supplier || null,
          destination: inclusion.destination || null,
          pax: inclusion.pax || null,
          notes: inclusion.notes || null,
          isOriginal: inclusion.isOriginal !== undefined ? inclusion.isOriginal : false,
          isChecked: inclusion.isChecked !== undefined ? inclusion.isChecked : true,
          source: inclusion.source, // Now guaranteed to exist
          sellerRateId: inclusion.sellerRateId || null
        };
      });
      
      console.log(`✅ Sanitized ${sanitizedCustomizedInclusions.length} customized inclusions`);
    }

    // ✅ Create booking with all fields
    const newBooking = new Booking({
      packageName: bookingData.packageName,
      packageId: bookingData.packageId || null,
      sellerPrice: bookingData.sellerPrice || 0,
      markup: bookingData.markup || 0,
      price: bookingData.price || bookingData.packageTotal || bookingData.totalAmount,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      duration: bookingData.duration,
      pax: bookingData.pax,
      selectedRoomType: bookingData.selectedRoomType,
      hotelName: bookingData.hotelName,
      numberOfRooms: bookingData.numberOfRooms,
      packageTotal: bookingData.packageTotal || bookingData.totalAmount,
      timerExpiredAtBooking: bookingData.timerExpiredAtBooking || false,
  priceType: bookingData.priceType || 'discounted',
  originalPackagePrice: bookingData.originalPackagePrice || bookingData.price || 0,
  appliedMarkup: bookingData.appliedMarkup || 0,
      // Customization fields
      isCustomized: bookingData.isCustomized || false,
      customizedInclusions: sanitizedCustomizedInclusions, // ✅ FIXED: Use sanitized inclusions
      customizationAdditionalPrice: bookingData.customizationAdditionalPrice || 0,
      originalInclusions: bookingData.originalInclusions || [],
      
      includesAirfare: bookingData.includesAirfare || false,
      flightDetails: flightDetailsObject, 
      airfareTotal: bookingData.airfareTotal || 0,
      totalAmount: bookingData.totalAmount,

      paymentType: bookingData.paymentType || 'full',
      initialPaymentAmount: bookingData.initialPaymentAmount || bookingData.totalAmount,
      remainingBalance: bookingData.remainingBalance || 0,
      balancePaidAmount: 0,

      fullName: primaryName,
      email: primaryEmail,
      message: bookingData.message || '',
      passengers: passengers, // ✅ Now populated correctly (or placeholder for walk-in)
      status: 'pending',
      createdAt: new Date(),
      promoCode: bookingData.promoCode || null,
      promoId: bookingData.promoId || null,
      discountAmount: bookingData.discountAmount || 0,
      finalPackageTotal: bookingData.finalPackageTotal || bookingData.totalAmount,
      
      // Walk-in fields
      isWalkin: bookingData.isWalkin || false,
      appointmentDate: bookingData.appointmentDate || null,
      appointmentTime: bookingData.appointmentTime || null
    });

    console.log('💾 Saving booking to database...');
    await newBooking.save();

    console.log(`💰 Booking saved successfully! ID: ${newBooking._id}`);

    // Activity Log
    try {
        const userEmail = bookingData.userEmail || bookingData.adminEmail || 'System';
        const adminId = bookingData.adminId || null;

        await ActivityLog.create({
            action: 'CREATE',
            module: 'Bookings',
            user: userEmail,
            userId: adminId,
            description: `Created new ${bookingData.isWalkin ? 'walk-in ' : ''}booking: ${bookingData.packageName} for ${primaryName}`,
            severity: 'SUCCESS',
            details: {
                recordTitle: `${bookingData.packageName} - ${primaryName}`,
                recordId: newBooking._id.toString(),
                method: 'POST',
                totalAmount: bookingData.totalAmount,
                passengers: passengers.length,
                includesAirfare: bookingData.includesAirfare || false,
                isWalkin: bookingData.isWalkin || false
            }
        });
        console.log('✅ Activity Log saved');
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }

    // ✅ Return booking ID for payment processing
    res.json({
      success: true,
      message: bookingData.isWalkin 
        ? 'Walk-in appointment created successfully.' 
        : 'Booking saved successfully. Proceed to payment link generation.',
      isNewUser: isNewUser,
      bookingId: newBooking._id,
      data: newBooking,
    });

  } catch (error) {
    console.error('❌ ==========================================');
    console.error('❌ BOOKING ERROR (500)');
    console.error('❌ ==========================================');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    req.files?.forEach(file => {
      try {
        fs.unlinkSync(file.path);
        console.log(`🧹 Deleted file: ${file.path}`);
      } catch (e) {
      }
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      email, 
      referenceNumber, 
      isArchive, 
      isCustomized,
      startDate,
      endDate 
    } = req.query;

    let filter = {};

    if (status) filter.status = status;
    if (email) filter.email = { $regex: email, $options: 'i' };
    if (referenceNumber) filter.referenceNumber = { $regex: referenceNumber, $options: 'i' };
    if (isArchive) filter.isArchive = isArchive;
    if (isCustomized !== undefined) filter.isCustomized = isCustomized === 'true';
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(filter)
      .populate('packageId')
      .populate('promoId')
      .sort({ createdAt: -1 });

    // Add customization summaries
    const bookingsWithSummary = bookings.map(booking => {
      const bookingObj = booking.toObject();
      if (booking.isCustomized) {
        bookingObj.customizationSummary = booking.getCustomizationSummary();
      }
      return bookingObj;
    });

    res.json(bookingsWithSummary);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      message: 'Error fetching bookings', 
      error: error.message 
    });
  }
});

// ============================================
// GET CUSTOMIZATION STATISTICS
// ============================================
router.get('/stats/customization', async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ isArchive: 'No' });
    const customizedBookings = await Booking.countDocuments({ 
      isCustomized: true, 
      isArchive: 'No' 
    });

    const customizationRate = totalBookings > 0 
      ? ((customizedBookings / totalBookings) * 100).toFixed(2) 
      : 0;

    // Average additional price from customizations
    const customizationRevenue = await Booking.aggregate([
      { 
        $match: { 
          isCustomized: true, 
          isArchive: 'No',
          status: { $in: ['confirmed', 'fully_paid'] }
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$customizationAdditionalPrice' },
          avgAdditionalPrice: { $avg: '$customizationAdditionalPrice' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Most popular added inclusions
    const popularInclusions = await Booking.aggregate([
      { $match: { isCustomized: true, isArchive: 'No' } },
      { $unwind: '$customizedInclusions' },
      { 
        $match: { 
          'customizedInclusions.isOriginal': false,
          'customizedInclusions.isChecked': true
        }
      },
      {
        $group: {
          _id: '$customizedInclusions.name',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$customizedInclusions.price' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        totalBookings,
        customizedBookings,
        customizationRate: parseFloat(customizationRate),
        revenue: customizationRevenue[0] || {
          totalRevenue: 0,
          avgAdditionalPrice: 0,
          count: 0
        },
        popularInclusions
      }
    });

  } catch (error) {
    console.error('Error fetching customization stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching customization statistics',
      error: error.message 
    });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // 👇👇👇 ACTIVITY LOG START (CANCEL BOOKING) 👇👇👇
    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Bookings',
                user: userEmail,
                userId: adminId || null,
                description: `Cancelled booking: ${booking.packageName} (${booking.fullName})`,
                severity: 'WARNING',
                details: {
                    recordTitle: `${booking.packageName} - ${booking.fullName}`,
                    recordId: booking._id.toString(),
                    method: 'POST',
                    previousStatus: 'pending/confirmed',
                    newStatus: 'cancelled'
                }
            });
            console.log('✅ Activity Log saved for Cancel Booking');
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

router.post('/:id/confirm-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;
    
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'confirmed' || booking.status === 'fully_paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already confirmed'
      });
    }

    // For full payment
    if (booking.paymentType === 'full') {
      booking.status = 'confirmed';
      booking.paidAt = new Date();
      booking.paymentId = paymentId;
    } 
    // For partial payment (initial)
    else if (booking.paymentType === 'partial') {
      booking.status = 'partial_paid';
      booking.paidAt = new Date();
      booking.initialPaymentId = paymentId;
    }

    booking.updatedAt = new Date();
    await booking.save();

    console.log(`✅ Payment confirmed for booking ${id}`);

    // 👇👇👇 ACTIVITY LOG START (PAYMENT CONFIRMATION) 👇👇👇
    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Bookings',
                user: userEmail,
                userId: adminId || null,
                description: `Payment confirmed for booking: ${booking.packageName} (${booking.fullName})`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: `${booking.packageName} - ${booking.fullName}`,
                    recordId: booking._id.toString(),
                    method: 'POST',
                    paymentType: booking.paymentType,
                    amount: booking.paymentType === 'full' ? booking.totalAmount : booking.initialPaymentAmount,
                    paymentId: paymentId
                }
            });
            console.log('✅ Activity Log saved for Payment Confirmation');
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.json({
      success: true,
      message: booking.paymentType === 'full' 
        ? 'Payment confirmed successfully' 
        : 'Initial payment confirmed successfully',
      booking: booking
    });

  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

router.post('/:id/create-balance-payment', async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.paymentType !== 'partial') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not set for partial payment'
      });
    }

    if (booking.isFullyPaid()) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already fully paid'
      });
    }

    const paymentResponse = await axios.post('https://wanderwaveph.onrender.com/api/payment/create-balance-intent', {
      bookingId: booking._id,
      amount: booking.remainingBalance
    });

    if (paymentResponse.data.success && paymentResponse.data.checkoutUrl) {
      booking.balancePaymentLinkId = paymentResponse.data.paymentLinkId;
      await booking.save();

      res.json({
        success: true,
        checkoutUrl: paymentResponse.data.checkoutUrl,
        paymentLinkId: paymentResponse.data.paymentLinkId,
        amount: booking.remainingBalance
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create payment link'
      });
    }

  } catch (error) {
    console.error('❌ Error creating balance payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create balance payment link',
      error: error.message
    });
  }
});

router.put('/:id/confirm-balance-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;
    
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.isFullyPaid()) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already fully paid'
      });
    }

    booking.balancePaidAmount = booking.remainingBalance;
    booking.remainingBalance = 0;
    booking.balancePaymentId = paymentId;
    booking.balancePaidAt = new Date();
    booking.status = 'fully_paid';
    booking.updatedAt = new Date();

    await booking.save();

    console.log(`✅ Balance payment confirmed for booking ${id}`);

    // 👇👇👇 ACTIVITY LOG START (BALANCE PAYMENT) 👇👇👇
    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Bookings',
                user: userEmail,
                userId: adminId || null,
                description: `Balance payment confirmed for booking: ${booking.packageName} (${booking.fullName})`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: `${booking.packageName} - ${booking.fullName}`,
                    recordId: booking._id.toString(),
                    method: 'PUT',
                    balancePaid: booking.balancePaidAmount,
                    paymentType: 'Balance Payment'
                }
            });
            console.log('✅ Activity Log saved for Balance Payment Confirmation');
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.json({
      success: true,
      message: 'Balance payment confirmed successfully',
      booking: booking
    });

  } catch (error) {
    console.error('❌ Error confirming balance payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm balance payment',
      error: error.message
    });
  }
});

router.get('/pending-balance/all', async (req, res) => {
  try {
    const bookings = await Booking.find({
      paymentType: 'partial',
      remainingBalance: { $gt: 0 },
      status: 'partial_paid',
      isArchive: 'No'
    }).sort({ createdAt: -1 });

    const bookingsWithBalance = bookings.map(booking => ({
      _id: booking._id,
      packageName: booking.packageName,
      fullName: booking.fullName,
      email: booking.email,
      totalAmount: booking.totalAmount,
      initialPaymentAmount: booking.initialPaymentAmount,
      remainingBalance: booking.remainingBalance,
      startDate: booking.startDate,
      createdAt: booking.createdAt,
      paidAt: booking.paidAt
    }));

    res.json({
      success: true,
      count: bookingsWithBalance.length,
      bookings: bookingsWithBalance
    });

  } catch (error) {
    console.error('❌ Error fetching pending balance bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings with pending balance'
    });
  }
});

router.patch('/:id/customization', async (req, res) => {
  try {
    const { customizedInclusions, customizationAdditionalPrice } = req.body;

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // ── Snapshot before update (for activity log) ──────────────────────────
    const prevTotalAmount   = booking.totalAmount;
    const prevRemaining     = booking.remainingBalance;
    const prevCustomization = booking.customizationAdditionalPrice;

    // ── Derive the clean base amount ────────────────────────────────────────
    // "Base" = totalAmount before any previous customization adjustment.
    // We strip out the OLD customizationAdditionalPrice so we always compute
    // from a clean starting point regardless of prior saves.
    //
    // Also account for any discount that was applied at booking time.
    const oldCustomization = booking.customizationAdditionalPrice || 0;
    const baseAmount       = booking.totalAmount - oldCustomization;

    // ── New amounts ─────────────────────────────────────────────────────────
    const newCustomizationPrice = Number(customizationAdditionalPrice) || 0;
    const newTotalAmount        = baseAmount + newCustomizationPrice;

    // ── Recalculate remaining balance ───────────────────────────────────────
    // totalAlreadyPaid = initial payment made + any balance payments made
    // For partial bookings this is the amount the client has actually paid so far.
    // For full-payment bookings remainingBalance stays 0 (nothing owed).
    let newRemainingBalance = booking.remainingBalance; // default: unchanged

    if (booking.paymentType === 'partial') {
      const totalAlreadyPaid =
        (booking.initialPaymentAmount || 0) +
        (booking.balancePaidAmount    || 0);

      // Remaining = what they still owe on the NEW total
      newRemainingBalance = Math.max(0, newTotalAmount - totalAlreadyPaid);
    }

    // ── Apply all updates ───────────────────────────────────────────────────
    booking.customizedInclusions          = customizedInclusions;
    booking.customizationAdditionalPrice  = newCustomizationPrice;
    booking.isCustomized                  = true;
    booking.totalAmount                   = newTotalAmount;
    booking.finalPackageTotal             = newTotalAmount;   // keep in sync
    booking.packageTotal                  = (booking.packageTotal || 0) +
                                            (newCustomizationPrice - oldCustomization);
    booking.remainingBalance              = newRemainingBalance;
    booking.updatedAt                     = new Date();

    await booking.save();
    await booking.populate('packageId');

    // ── Destination fallback ─────────────────────────────────────────────
    // If packageId is null in the DB (stored as null or never set), populate
    // returns nothing. Do a secondary title-based lookup so the frontend
    // always receives a synthetic populated packageId with destination intact.
    let responseBooking = booking.toObject ? booking.toObject() : booking;
    if (!responseBooking.packageId?.destination && responseBooking.packageName) {
      try {
        const fallbackPkg = await Package.findOne(
          { title: responseBooking.packageName },
          'title destination inclusions tourType minPax duration'
        ).lean();
        if (fallbackPkg?.destination) {
          responseBooking = {
            ...responseBooking,
            packageId: {
              _id:         fallbackPkg._id,
              title:       fallbackPkg.title,
              destination: fallbackPkg.destination,
              inclusions:  fallbackPkg.inclusions || [],
              tourType:    fallbackPkg.tourType,
              minPax:      fallbackPkg.minPax,
              duration:    fallbackPkg.duration,
            },
          };
        }
      } catch (pkgErr) {
        console.warn('⚠️ Package fallback lookup failed (non-fatal):', pkgErr.message);
      }
    }

    // ── Activity log (non-fatal) ────────────────────────────────────────────
    try {
      const priceDelta = newTotalAmount - prevTotalAmount;
      const sign       = priceDelta >= 0 ? '+' : '';

      await ActivityLog.create({
        action:   'UPDATE',
        module:   'Bookings',
        severity: 'SUCCESS',
        user:     booking.email || 'User',
        description: `Package inclusions customized for booking: ${booking.packageName} (${booking.fullName}). ` +
          `Total changed from ₱${prevTotalAmount.toLocaleString()} → ₱${newTotalAmount.toLocaleString()} (${sign}₱${Math.abs(priceDelta).toLocaleString()}). ` +
          (booking.paymentType === 'partial'
            ? `Remaining balance updated: ₱${prevRemaining.toLocaleString()} → ₱${newRemainingBalance.toLocaleString()}.`
            : ''),
        details: {
          recordTitle:              `${booking.packageName} - ${booking.fullName}`,
          recordId:                 booking._id.toString(),
          method:                   'PATCH',
          endpoint:                 `/api/bookings/${booking._id}/customization`,
          prevTotalAmount,
          newTotalAmount,
          prevRemainingBalance:     prevRemaining,
          newRemainingBalance,
          prevCustomizationPrice:   prevCustomization,
          newCustomizationPrice,
          paymentType:              booking.paymentType,
          initialPaymentAmount:     booking.initialPaymentAmount,
          balancePaidAmount:        booking.balancePaidAmount || 0,
        },
      });
      console.log('✅ Activity log saved for customization update');
    } catch (logErr) {
      console.error('⚠️ Failed to log customization activity:', logErr.message);
    }

    console.log(
      `✅ Customization saved — booking ${booking._id}` +
      ` | total: ₱${prevTotalAmount} → ₱${newTotalAmount}` +
      (booking.paymentType === 'partial'
        ? ` | balance: ₱${prevRemaining} → ₱${newRemainingBalance}`
        : '')
    );

    res.json({
      message: 'Booking customization updated successfully',
      booking: responseBooking,
      // Surface the key computed values so the frontend can update its display
      // without needing a full page refresh
      summary: {
        prevTotalAmount,
        newTotalAmount,
        customizationAdditionalPrice: newCustomizationPrice,
        remainingBalance:             newRemainingBalance,
        paymentType:                  booking.paymentType,
      },
    });

  } catch (error) {
    console.error('Error updating booking customization:', error);
    res.status(400).json({ 
      message: 'Error updating customization', 
      error: error.message 
    });
  }
});

// Sa loob ng bookingRoute.js
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // I-update ang fields (gaya ng passengers)
    Object.assign(booking, req.body);
    booking.updatedAt = new Date();
    await booking.save();

    res.json({ success: true, message: 'Booking updated successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel booking route
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking is already cancelled' 
      });
    }

    // Update booking status to cancelled
    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    await booking.save();

    // 👇👇👇 ACTIVITY LOG START (CANCEL BOOKING) 👇👇👇
    try {
      const { userEmail, adminId } = req.body;
      if (userEmail) {
        await ActivityLog.create({
          action: 'UPDATE',
          module: 'Bookings',
          user: userEmail,
          userId: adminId || null,
          description: `Cancelled booking: ${booking.packageName} (${booking.fullName})`,
          severity: 'WARNING',
          details: {
            recordTitle: `${booking.packageName} - ${booking.fullName}`,
            recordId: booking._id.toString(),
            method: 'POST',
            previousStatus: 'pending',
            newStatus: 'cancelled'
          }
        });
        console.log('✅ Activity Log saved for Cancel Booking');
      }
    } catch (logError) {
      console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.json({ 
      success: true, 
      message: 'Booking cancelled successfully', 
      booking 
    });

  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel booking',
      error: error.message 
    });
  }
});

// ============================================
// PATCH /:id/details — UPDATE BOOKING DETAILS
// Called by BookingCustomizer when admin edits
// Package Name, Duration, Travel Dates, or Pax
// ============================================
router.patch('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      packageName,
      duration,
      startDate,
      endDate,
      pax,
      userEmail,
      adminId,
    } = req.body;

    // 1. Find the existing booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ status: 'error', error: 'Booking not found' });
    }

    // 2. Build update object — only include fields that were actually sent
    const updateData = {};
    const changedFields = [];

    if (packageName !== undefined && packageName !== booking.packageName) {
      updateData.packageName = packageName.trim();
      changedFields.push(`Package Name: "${booking.packageName}" → "${packageName.trim()}"`);
    }

    if (duration !== undefined && duration !== booking.duration) {
      updateData.duration = duration.trim();
      changedFields.push(`Duration: "${booking.duration}" → "${duration.trim()}"`);
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
      changedFields.push('Start Date updated');
    }

    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
      changedFields.push('End Date updated');
    }

    if (pax !== undefined && typeof pax === 'object') {
      updateData.pax = {
        adult:    Number(pax.adult)    || 0,
        children: Number(pax.children) || 0,
        infants:  Number(pax.infants)  || 0,
      };
      changedFields.push('Pax updated');
    }

    // 3. Nothing to update
    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        status: 'ok',
        message: 'No changes detected',
        booking,
      });
    }

    // 4. Apply update (runValidators: false to avoid triggering unrelated validators)
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: false }
    ).populate('packageId'); // ✅ Keep packageId populated so frontend destination check works

    // ── Destination fallback ─────────────────────────────────────────────
    let responseBookingDetails = updatedBooking.toObject ? updatedBooking.toObject() : updatedBooking;
    if (!responseBookingDetails.packageId?.destination && responseBookingDetails.packageName) {
      try {
        const fallbackPkg = await Package.findOne(
          { title: responseBookingDetails.packageName },
          'title destination inclusions tourType minPax duration'
        ).lean();
        if (fallbackPkg?.destination) {
          responseBookingDetails = {
            ...responseBookingDetails,
            packageId: {
              _id:         fallbackPkg._id,
              title:       fallbackPkg.title,
              destination: fallbackPkg.destination,
              inclusions:  fallbackPkg.inclusions || [],
              tourType:    fallbackPkg.tourType,
              minPax:      fallbackPkg.minPax,
              duration:    fallbackPkg.duration,
            },
          };
        }
      } catch (pkgErr) {
        console.warn('⚠️ Package fallback lookup failed (non-fatal):', pkgErr.message);
      }
    }

    // 5. Activity log (non-fatal)
    try {
      if (userEmail) {
        await ActivityLog.create({
          action: 'UPDATE',
          module: 'Bookings',
          user: userEmail,
          userId: adminId || null,
          severity: 'SUCCESS',
          description: `Updated booking details for: ${updatedBooking.packageName} (${updatedBooking.fullName})${
            changedFields.length ? '. Changes: ' + changedFields.join(', ') : ''
          }`,
          details: {
            recordTitle: `${updatedBooking.packageName} - ${updatedBooking.fullName}`,
            recordId: updatedBooking._id.toString(),
            method: 'PATCH',
            endpoint: `/api/bookings/${id}/details`,
          },
        });
        console.log('✅ Activity Log saved for Update Booking Details');
      }
    } catch (logError) {
      console.error('⚠️ Failed to save activity log:', logError.message);
    }

    console.log(`✅ Booking details updated: ${id} — ${changedFields.join(', ') || 'no changes'}`);

    return res.status(200).json({
      status: 'ok',
      message: 'Booking details updated successfully',
      booking: responseBookingDetails,
    });

  } catch (err) {
    console.error('❌ Error updating booking details:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /:id/hotel — UPDATE HOTEL SELECTION FROM USER DASHBOARD
// Called by HotelCustomizer when the user picks a room tier and saves.
// Updates selectedRoomType, hotelName, numberOfRooms on the booking.
// ─────────────────────────────────────────────────────────────
router.patch('/:id/hotel', async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedRoomType, hotelName, numberOfRooms } = req.body;

    if (!selectedRoomType) {
      return res.status(400).json({ status: 'error', error: 'selectedRoomType is required' });
    }

    const updateData = {
      selectedRoomType,
      ...(hotelName     !== undefined && { hotelName }),
      ...(numberOfRooms !== undefined && { numberOfRooms }),
    };

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: false }
    ).populate('packageId');

    if (!updatedBooking) {
      return res.status(404).json({ status: 'error', error: 'Booking not found' });
    }

    // ── Destination fallback ─────────────────────────────────────────────
    let responseBookingHotel = updatedBooking.toObject ? updatedBooking.toObject() : updatedBooking;
    if (!responseBookingHotel.packageId?.destination && responseBookingHotel.packageName) {
      try {
        const fallbackPkg = await Package.findOne(
          { title: responseBookingHotel.packageName },
          'title destination inclusions tourType minPax duration'
        ).lean();
        if (fallbackPkg?.destination) {
          responseBookingHotel = {
            ...responseBookingHotel,
            packageId: {
              _id:         fallbackPkg._id,
              title:       fallbackPkg.title,
              destination: fallbackPkg.destination,
              inclusions:  fallbackPkg.inclusions || [],
              tourType:    fallbackPkg.tourType,
              minPax:      fallbackPkg.minPax,
              duration:    fallbackPkg.duration,
            },
          };
        }
      } catch (pkgErr) {
        console.warn('⚠️ Package fallback lookup failed (non-fatal):', pkgErr.message);
      }
    }

    console.log(`✅ Hotel selection updated — booking ${id}: ${selectedRoomType} @ ${hotelName || 'N/A'}`);

    return res.status(200).json({
      status: 'ok',
      message: 'Hotel selection updated successfully',
      booking: responseBookingHotel,
    });

  } catch (err) {
    console.error('❌ Error updating hotel selection:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// ============================================
// POST /abandoned — ABANDONED BOOKING + GHL WEBHOOK
// Triggered after booking is saved + payment link is generated.
// Updates the booking with abandoned tracking fields and fires GHL webhook
// so the automation can send follow-up emails if payment is not completed.
// ============================================
router.post('/abandoned', async (req, res) => {
  try {
    const {
      existingBookingId, // ✅ ID of the already-created booking
      checkoutUrl,       // ✅ PayMongo checkout URL to include in GHL email
      email,
      fullName,
      packageName,
      totalAmount,
      startDate,
      endDate,
      pax,
      paymentType,       // ✅ FIXED: "Full Payment" or "Partial Payment" — needed for GHL email template
    } = req.body;

    const GHL_ABANDONED_WEBHOOK_URL = process.env.GHL_ABANDONED_BOOKING_WEBHOOK_URL;

    // ✅ We only update an EXISTING booking — never create a duplicate
    if (!existingBookingId) {
      return res.status(400).json({ success: false, message: 'existingBookingId is required.' });
    }

    const targetBooking = await Booking.findByIdAndUpdate(
      existingBookingId,
      {
        $set: {
          abandonedAt: new Date(),
          followUpCount: 0,
          lastFollowUpAt: null,
        }
      },
      { new: true }
    );

    if (!targetBooking) {
      console.warn('⚠️ Abandoned booking: no booking found for ID:', existingBookingId);
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    console.log('✅ Abandoned tracking set for booking:', targetBooking._id);

    // 🔥 Trigger GHL Webhook for follow-up automation
    if (GHL_ABANDONED_WEBHOOK_URL) {
      const ghlPayload = {
        type: 'ABANDONED_BOOKING',
        event: 'booking_form_submitted',
        bookingId: targetBooking._id.toString(),
        email: email || targetBooking.email,
        fullName: fullName || targetBooking.fullName,
        packageName: packageName || targetBooking.packageName,
        totalAmount: totalAmount || targetBooking.totalAmount,
        startDate: startDate || targetBooking.startDate,
        endDate: endDate || targetBooking.endDate,
        pax: pax || targetBooking.pax?.adult || 1,
        paymentLink: checkoutUrl || '', // ✅ PayMongo checkout URL for GHL to include in email
        paymentType: paymentType || (targetBooking.paymentType === 'partial' ? 'Partial Payment' : 'Full Payment'), // ✅ FIXED: Include payment type for GHL email template
        timestamp: new Date().toISOString(),
        source: 'WanderWave Booking Form',
      };

      await axios.post(GHL_ABANDONED_WEBHOOK_URL, ghlPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }).catch(err => {
        // ✅ Non-fatal — never block the response due to GHL failure
        console.error('⚠️ Failed to send to GHL abandoned webhook:', err.message);
      });

      console.log('✅ GHL abandoned webhook fired for booking:', targetBooking._id);
    } else {
      console.warn('⚠️ GHL_ABANDONED_BOOKING_WEBHOOK_URL not set in .env — skipping GHL notification.');
    }

    res.status(200).json({
      success: true,
      message: 'Abandoned booking tracked and GHL notified.',
      bookingId: targetBooking._id,
    });

  } catch (error) {
    console.error('❌ Abandoned booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;