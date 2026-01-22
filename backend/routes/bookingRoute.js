const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Booking = require('../models/booking');
const User = require('../models/user');
const Promo = require('../models/promo');
const Package = require('../models/package');
const ActivityLog = require('../models/ActivityLog'); 
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
    const bookings = await Booking.find({ email: email }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
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
        const bookings = await Booking.find({ isArchive: 'No' }).sort({ createdAt: -1 });
        res.json({
            success: true,
            count: bookings.length,
            bookings: bookings
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

      rawPassengers.forEach((passengerData, index) => {
          // Validate required fields for regular bookings
          if (!passengerData.firstName || !passengerData.lastName || 
              !passengerData.email || !passengerData.phone || 
              !passengerData.dateOfBirth) {
              console.warn(`⚠️ Warning: Skipping passenger ${index + 1} due to missing required fields`);
              return; // Skip this passenger
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
      });

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
      
      // Customization fields
      isCustomized: bookingData.isCustomized || false,
      customizedInclusions: bookingData.customizedInclusions || [],
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
          avgPrice: { $avg: '$customizedInclusions.price' },
          totalRevenue: { $sum: '$customizedInclusions.price' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalBookings,
      customizedBookings,
      customizationRate: parseFloat(customizationRate),
      revenue: customizationRevenue[0] || { 
        totalRevenue: 0, 
        avgAdditionalPrice: 0, 
        count: 0 
      },
      popularInclusions
    });

  } catch (error) {
    console.error('Error fetching customization stats:', error);
    res.status(500).json({ 
      message: 'Error fetching statistics', 
      error: error.message 
    });
  }
});

router.put('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already confirmed'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm a cancelled booking'
      });
    }

    if (booking.promoId) {
      try {
        console.log(`🎟️ Incrementing promo usage count for booking ${id}...`);
        
        const promo = await Promo.findById(booking.promoId);
        
        if (promo) {
          if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
            return res.status(400).json({
              success: false,
              message: 'Promo code usage limit has been reached. Cannot confirm booking.'
            });
          }

          promo.usedCount += 1;
          await promo.save();
          
          console.log(`✅ Promo usage incremented: ${promo.code} (${promo.usedCount}/${promo.usageLimit || '∞'})`);
        } else {
          console.warn(`⚠️ Warning: Promo ID ${booking.promoId} not found, but continuing with booking confirmation`);
        }
      } catch (promoError) {
        console.error('❌ Error incrementing promo usage:', promoError);
      }
    }

    booking.status = 'confirmed';
    booking.updatedAt = new Date();
    
    if (!booking.paidAt) {
      booking.paidAt = new Date();
    }

    await booking.save();

    console.log('✅ Booking confirmed:', id);

    // 👇👇👇 ACTIVITY LOG START (CONFIRM BOOKING) 👇👇👇
    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Bookings',
                user: userEmail,
                userId: adminId || null,
                description: `Confirmed booking: ${booking.packageName} for ${booking.fullName}`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: `${booking.packageName} - ${booking.fullName}`,
                    recordId: booking._id.toString(),
                    method: 'PUT',
                    statusChange: 'pending → confirmed'
                }
            });
            console.log('✅ Activity Log saved for Confirm Booking');
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }
    // 👆👆👆 ACTIVITY LOG END 👆👆👆

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: booking
    });

  } catch (error) {
    console.error('❌ Confirm booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
      error: error.message
    });
  }
});

router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

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
    booking.updatedAt = new Date();
    booking.cancelledAt = new Date();

    await booking.save();

    // 👇👇👇 ACTIVITY LOG START (CANCEL BOOKING) 👇👇👇
    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            await ActivityLog.create({
                action: 'DELETE',
                module: 'Bookings',
                user: userEmail,
                userId: adminId || null,
                description: `Cancelled booking: ${booking.packageName} for ${booking.fullName}`,
                severity: 'WARNING',
                details: {
                    recordTitle: `${booking.packageName} - ${booking.fullName}`,
                    recordId: booking._id.toString(),
                    method: 'PUT',
                    previousStatus: 'confirmed/pending',
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
      booking: booking
    });

  } catch (error) {
    console.error('❌ Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

router.get('/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const balanceInfo = {
      bookingId: booking._id,
      totalAmount: booking.totalAmount,
      paymentType: booking.paymentType,
      initialPaymentAmount: booking.initialPaymentAmount,
      remainingBalance: booking.remainingBalance,
      balancePaidAmount: booking.balancePaidAmount,
      isFullyPaid: booking.isFullyPaid(),
      paymentStatus: booking.getPaymentStatusDescription(),
      initialPaymentDate: booking.paidAt,
      balancePaymentDate: booking.balancePaidAt
    };

    res.json({
      success: true,
      balanceInfo: balanceInfo
    });

  } catch (error) {
    console.error('❌ Error fetching balance info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance information',
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
        message: 'This booking was paid in full'
      });
    }

    if (booking.remainingBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No remaining balance to pay'
      });
    }

    if (booking.isFullyPaid()) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already fully paid'
      });
    }

    const axios = require('axios');
    
    const paymentResponse = await axios.post('http://localhost:5000/api/payment/create-balance-intent', {
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

    // Recalculate total amount with new customization
    const baseAmount = booking.totalAmount - booking.customizationAdditionalPrice;
    const newTotalAmount = baseAmount + customizationAdditionalPrice;

    booking.customizedInclusions = customizedInclusions;
    booking.customizationAdditionalPrice = customizationAdditionalPrice;
    booking.totalAmount = newTotalAmount;
    booking.isCustomized = true;

    await booking.save();

    res.json({
      message: 'Booking customization updated successfully',
      booking
    });

  } catch (error) {
    console.error('Error updating booking customization:', error);
    res.status(400).json({ 
      message: 'Error updating customization', 
      error: error.message 
    });
  }
});

module.exports = router;