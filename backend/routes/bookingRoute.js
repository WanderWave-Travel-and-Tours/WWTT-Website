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
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG and PDF are allowed.'), false);
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

router.post('/', upload.any(), async (req, res) => {
  try {
    let bookingData;
    
    if (!req.body.bookingData) {
      console.error('❌ No bookingData field found in request!');
      return res.status(400).json({
        success: false,
        message: 'No booking data provided',
        hint: 'The bookingData field is missing from the request',
        receivedKeys: Object.keys(req.body).slice(0, 10)
      });
    }

    if (typeof req.body.bookingData === 'string') {
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
    } else if (typeof req.body.bookingData === 'object') {
      bookingData = req.body.bookingData;
    } else {
      console.error('❌ bookingData is neither string nor object');
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingData type',
        receivedType: typeof req.body.bookingData
      });
    }

    const passengers = [];
    
    if (req.body.passengers && typeof req.body.passengers === 'object') {
      const passengersData = Array.isArray(req.body.passengers) 
        ? req.body.passengers 
        : Object.values(req.body.passengers);
      
      passengersData.forEach((passengerData, index) => {
        if (!passengerData.firstName || !passengerData.lastName) {
          console.error(`❌ Missing required fields for passenger ${index + 1}`);
          return;
        }

        const passenger = {
          passengerNumber: parseInt(passengerData.passengerNumber) || index + 1,
          firstName: passengerData.firstName,
          lastName: passengerData.lastName,
          email: passengerData.email || '',
          phone: passengerData.phone || '',
          dateOfBirth: passengerData.dateOfBirth || '',
          age: parseInt(passengerData.age) || 0,
          gender: passengerData.gender || '',
          address: passengerData.address || '',
          nationality: passengerData.nationality || 'Filipino'
        };

        const idFile = req.files?.find(f => f.fieldname === `passenger_${index}_id`);
        const passportFile = req.files?.find(f => f.fieldname === `passenger_${index}_passport`);

        if (idFile) {
          passenger.idDocument = {
            filename: idFile.filename,
            originalName: idFile.originalname,
            path: idFile.path,
            size: idFile.size
          };
          console.log(`  📄 ID uploaded: ${idFile.originalname}`);
        }

        if (passportFile) {
          passenger.passportDocument = {
            filename: passportFile.filename,
            originalName: passportFile.originalname,
            path: passportFile.path,
            size: passportFile.size
          };
          console.log(`  📄 Passport uploaded: ${passportFile.originalname}`);
        }

        passengers.push(passenger);
      });
    } 
    else {
      const passengerKeys = Object.keys(req.body).filter(key => key.startsWith('passengers['));
      
      if (passengerKeys.length === 0) {
        console.warn('⚠️ No passenger data found!');
        return res.status(400).json({
          success: false,
          message: 'No passenger data provided',
          hint: 'Make sure passenger data is being sent correctly'
        });
      }

      const passengerIndices = [...new Set(passengerKeys.map(key => {
        const match = key.match(/passengers\[(\d+)\]/);
        return match ? parseInt(match[1]) : null;
      }))].filter(index => index !== null).sort((a, b) => a - b);

      passengerIndices.forEach(index => {
        const firstName = req.body[`passengers[${index}][firstName]`];
        const lastName = req.body[`passengers[${index}][lastName]`];
        
        if (!firstName || !lastName) {
          console.error(`❌ Missing required fields for passenger ${index + 1}`);
          return;
        }

        const passenger = {
          passengerNumber: parseInt(req.body[`passengers[${index}][passengerNumber]`]) || index + 1,
          firstName: firstName,
          lastName: lastName,
          email: req.body[`passengers[${index}][email]`] || '',
          phone: req.body[`passengers[${index}][phone]`] || '',
          dateOfBirth: req.body[`passengers[${index}][dateOfBirth]`] || '',
          age: parseInt(req.body[`passengers[${index}][age]`]) || 0,
          gender: req.body[`passengers[${index}][gender]`] || '',
          address: req.body[`passengers[${index}][address]`] || '',
          nationality: req.body[`passengers[${index}][nationality]`] || 'Filipino'
        };

        const idFile = req.files?.find(f => f.fieldname === `passenger_${index}_id`);
        const passportFile = req.files?.find(f => f.fieldname === `passenger_${index}_passport`);

        if (idFile) {
          passenger.idDocument = {
            filename: idFile.filename,
            originalName: idFile.originalname,
            path: idFile.path,
            size: idFile.size
          };
          console.log(`  📄 ID uploaded: ${idFile.originalname}`);
        }

        if (passportFile) {
          passenger.passportDocument = {
            filename: passportFile.filename,
            originalName: passportFile.originalname,
            path: passportFile.path,
            size: passportFile.size
          };
          console.log(`  📄 Passport uploaded: ${passportFile.originalname}`);
        }

        passengers.push(passenger);
      });
    }

    if (passengers.length === 0) {
      console.error('❌ No valid passengers were processed!');
      return res.status(400).json({
        success: false,
        message: 'Failed to process passenger data',
        hint: 'Check that passenger data includes firstName and lastName'
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
      packageTotal: bookingData.packageTotal || bookingData.totalAmount,
      includesAirfare: bookingData.includesAirfare || false,
      flightDetails: bookingData.flightDetails || null,
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

    res.json({
      success: true,
      message: 'Booking created successfully',
      isNewUser: isNewUser,
      data: newBooking
    });

  } catch (error) {
    console.error('❌ ==========================================');
    console.error('❌ BOOKING ERROR');
    console.error('❌ ==========================================');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
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

module.exports = router;