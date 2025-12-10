const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Booking = require('../models/booking');

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

// POST /api/bookings - Create new booking with passengers
router.post('/', upload.any(), async (req, res) => {
  try {
    console.log('🔥 ==========================================');
    console.log('🔥 BOOKING REQUEST RECEIVED');
    console.log('🔥 ==========================================');
    console.log('Body keys:', Object.keys(req.body));
    console.log('Files uploaded:', req.files?.length || 0);

    // 🔥 STEP 1: Parse bookingData
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
        console.log('✅ Parsed bookingData successfully');
        console.log('   Package:', bookingData.packageName);
        console.log('   Total:', bookingData.totalAmount);
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
      console.log('✅ Using bookingData object directly');
    } else {
      console.error('❌ bookingData is neither string nor object');
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingData type',
        receivedType: typeof req.body.bookingData
      });
    }

    // 🔥 STEP 2: Process passengers data
    const passengers = [];
    
    console.log('🔍 Checking passengers field type:', typeof req.body.passengers);
    
    // 🔥 NEW: Handle passengers as object (when parsed by express.json())
    if (req.body.passengers && typeof req.body.passengers === 'object') {
      console.log('✅ Passengers received as parsed object');
      
      // Check if it's an array or object with numeric keys
      const passengersData = Array.isArray(req.body.passengers) 
        ? req.body.passengers 
        : Object.values(req.body.passengers);
      
      console.log(`👥 Processing ${passengersData.length} passengers from object`);
      
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

        console.log(`✅ Passenger ${index + 1}:`, {
          name: `${passenger.firstName} ${passenger.lastName}`,
          email: passenger.email,
          age: passenger.age
        });

        // Add file paths if files were uploaded
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
    // 🔥 FALLBACK: Handle as individual fields (original method)
    else {
      const passengerKeys = Object.keys(req.body).filter(key => key.startsWith('passengers['));
      console.log('🔍 Found passenger field keys:', passengerKeys.length);
      
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

      console.log(`👥 Processing ${passengerIndices.length} passengers from fields:`, passengerIndices);

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

        console.log(`✅ Passenger ${index + 1}:`, {
          name: `${passenger.firstName} ${passenger.lastName}`,
          email: passenger.email,
          age: passenger.age
        });

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

    // 🔥 CRITICAL VALIDATION: Make sure we have at least one passenger
    if (passengers.length === 0) {
      console.error('❌ No valid passengers were processed!');
      return res.status(400).json({
        success: false,
        message: 'Failed to process passenger data',
        hint: 'Check that passenger data includes firstName and lastName'
      });
    }

    console.log(`✅ Successfully processed ${passengers.length} passenger(s)`);

    // Create booking object
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
      fullName: bookingData.primaryContact?.fullName || `${passengers[0]?.firstName} ${passengers[0]?.lastName}`,
      email: bookingData.primaryContact?.email || passengers[0]?.email,
      message: bookingData.message || '',
      passengers: passengers,
      status: 'pending',
      createdAt: new Date()
    });

    console.log('💾 Saving booking to database...');
    console.log('   Passengers in booking:', newBooking.passengers.length);

    await newBooking.save();

    console.log('✅ ==========================================');
    console.log('✅ BOOKING SAVED SUCCESSFULLY');
    console.log('✅ ==========================================');
    console.log('   Booking ID:', newBooking._id);
    console.log('   Package:', newBooking.packageName);
    console.log('   Total Amount: ₱' + newBooking.totalAmount);
    console.log('   Passengers saved:', newBooking.passengers.length);
    console.log('   Passenger names:', newBooking.passengers.map(p => `${p.firstName} ${p.lastName}`).join(', '));

    res.json({
      success: true,
      message: 'Booking created successfully',
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

// GET /api/bookings/:id
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

// GET /api/bookings
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

// PUT /api/bookings/:id/confirm
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

// PUT /api/bookings/:id/cancel
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

// GET /api/bookings/stats/summary
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