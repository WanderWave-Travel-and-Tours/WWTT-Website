const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Booking = require('../models/booking');
const User = require('../models/user');
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
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking: booking
    });

  } catch (error) {
    console.error('❌ Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
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

    const rawPassengers = bookingData.passengers || []; 
    const totalExpectedPassengers = bookingData.pax?.adult || 1;
    const passengers = []; 

    if (rawPassengers.length === 0) {
        console.error(`❌ Embedded passenger array is empty.`);
    }

    rawPassengers.forEach((passengerData, index) => {
        if (!passengerData.firstName || !passengerData.lastName || !passengerData.email || !passengerData.phone || !passengerData.dateOfBirth) {
            console.warn(`⚠️ Warning: Skipping passenger ${index + 1} due to missing required fields in embedded data.`);
            return;
        }

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

        passengers.push(passenger);
    });

    if (passengers.length !== totalExpectedPassengers) {
        req.files?.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {}
        });
        console.error(`❌ CRASH REASON: Invalid number of passengers processed: ${passengers.length} found, ${totalExpectedPassengers} expected. (Mongoose Validation Failure or incomplete form data)`);
        return res.status(400).json({
          success: false,
          message: `Booking failed: Invalid number of passengers processed. Expected ${totalExpectedPassengers}, found ${passengers.length}. Please ensure all passenger fields are complete.`,
        });
    }

    const primaryEmail = bookingData.primaryContact?.email || passengers[0]?.email;
    const primaryName = bookingData.primaryContact?.fullName || `${passengers[0]?.firstName} ${passengers[0]?.lastName}`;
    
    let existingUser = await User.findOne({ email: primaryEmail });
    let isNewUser = false;
    let tempPassword = null;

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

    let flightDetailsObject = bookingData.flightDetails;
    if (flightDetailsObject && typeof flightDetailsObject === 'string') {
        try {
            flightDetailsObject = JSON.parse(flightDetailsObject);
        } catch (e) {
            console.error('Failed to parse flightDetails string:', e);
            flightDetailsObject = null;
        }
    }

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
      includesAirfare: bookingData.includesAirfare || false,
      flightDetails: flightDetailsObject, 
      airfareTotal: bookingData.airfareTotal || 0,
      totalAmount: bookingData.totalAmount,
      fullName: primaryName,
      email: primaryEmail,
      message: bookingData.message || '',
      passengers: passengers, 
      status: 'pending',
      createdAt: new Date()
    });

    console.log('💾 Saving booking to database...');
    await newBooking.save();

    console.log(`💰 Booking saved. Returning ID for payment link creation: ${newBooking._id}`);

    res.json({
      success: true,
      message: 'Booking saved successfully. Proceed to payment link generation.',
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
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: bookings.length,
      bookings: bookings
    });
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
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

    booking.status = 'confirmed';
    booking.updatedAt = new Date();
    
    if (!booking.paidAt) {
      booking.paidAt = new Date();
    }

    await booking.save();

    console.log('✅ Booking confirmed:', id);

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


module.exports = router;