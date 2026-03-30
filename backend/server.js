const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors()); 

// === HIGH LIMITS – avoids Render proxy 400 on large booking payloads ===
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

app.use((req, res, next) => {
  const size = req.headers['content-length']
    ? `${(parseInt(req.headers['content-length']) / 1024).toFixed(1)} KB`
    : 'unknown';

  console.log(`📨 ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Size: ${size} | Content-Type: ${req.headers['content-type'] || 'none'}`);

  // Parse common stringified fields safely
  const parseFields = [
    'bookingData', 'passengers', 'flightDetails',
    'selectedFlight', 'selectedRoomType', 'pax',
    'customizationData', 'passportDetails', 'requirements'
  ];

  parseFields.forEach(field => {
    if (req.body?.[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
        console.log(`✅ Parsed ${field}`);
      } catch (e) {
        if (field === 'requirements') {
          console.error(`❌ Failed to parse ${field}:`, e.message.substring(0, 100));
        }
      }
    }
  });

  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI) 
    .then(() => console.log("✅ DATABASE CONNECTED!"))
    .catch((err) => {
        console.error("❌ Database Connection Error:", err);
        console.error("⚠️ Check your .env file or IP Whitelist.");
    });

    
app.get('/', (req, res) => {
  res.send('WanderWave API is running!');
});

// ===================================================================
// IMPORT ALL ROUTES
// ===================================================================
const flightRoutes = require('./routes/flightRoute');
const packageRoutes = require('./routes/packageRoute');
const testimonialRoutes = require('./routes/testimonialRoute');
const promoRoutes = require('./routes/promoRoute');
const adminRoutes = require('./routes/adminRoute');
const posterRoutes = require('./routes/posters'); 
const blogRoutes = require('./routes/blogs');
const paymentRoute = require('./routes/paymentRoute');
const bookingRoute = require('./routes/bookingRoute');
const authRoute = require('./routes/authRoute');
const tourRoutes = require('./routes/tourRoutes'); 
const userRoutes = require('./routes/usersRouter');
const visaRoutes = require('./routes/visaRoute');
const serviceRoutes = require('./routes/serviceRoute');
const psaRoutes = require('./routes/psaRoute');
const cenomarRoutes = require('./routes/cenomarRoute');
const passportRoutes = require('./routes/passportRoute');
const inquiryRoutes = require('./routes/inquiryRoute');
const uploadRoutes = require('./routes/uploadRoute');
const hotelRoutes = require('./routes/hotelRoute');
const imagesRoutes = require('./routes/imagesRoute');
const sellerRateRoutes = require('./routes/sellerRoute');
const activityLogRoute = require('./routes/activityLogRoute'); 
const draftsRoutes = require('./routes/drafts');
const activityLogsRoutes = require('./routes/activityLogRoute');
const favoriteRoute = require('./routes/favoriteRoute');
const feedbackRoutes = require('./routes/feedbackRoutes'); 
const ipRoutes = require('./routes/ipRoute');
const pageViewRoutes = require('./routes/pageViewRoute');


// ===================================================================
// ENSURE UPLOAD DIRECTORY EXISTS
// ===================================================================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ===================================================================
// MULTER CONFIGURATION
// ===================================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ===================================================================
// IMPORT MODELS
// ===================================================================
const PackageModel = require('./models/package');
const Booking = require('./models/booking');
const Blog = require('./models/blog');
const ServiceModel = require('./models/service');

// ===================================================================
// VISA FILE UPLOAD ENDPOINT
// ===================================================================
app.post('/api/visas/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        const fileName = req.file.originalname;

        console.log('✅ Visa file uploaded:', fileName);

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                fileName: fileName,
                fileUrl: fileUrl
            }
        });
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'File upload failed', 
            error: error.message 
        });
    }
});

// ===================================================================
// CENOMAR FILE UPLOAD ENDPOINT
// ===================================================================
app.post('/api/cenomar/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        const fileName = req.file.originalname;

        console.log('✅ CENOMAR file uploaded:', fileName);

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                fileName: fileName,
                fileUrl: fileUrl
            }
        });
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'File upload failed', 
            error: error.message 
        });
    }
});

// ===================================================================
// SERVICE CREATE ENDPOINT
// ===================================================================
app.post('/api/services', upload.single('image'), async (req, res) => {
    try {
        const imageFilename = req.file ? req.file.filename : null;
        
        if (!imageFilename) {
            return res.status(400).json({ success: false, message: 'Image file is required' });
        }

        let requirementsArray = req.body.requirements;
        if (typeof req.body.requirements === 'string') {
            requirementsArray = JSON.parse(req.body.requirements);
        }

        const serviceData = {
            ...req.body,
            image: imageFilename, 
            requirements: requirementsArray,
            price: parseFloat(req.body.price) || 0,
            order: parseInt(req.body.order) || 0,
            isActive: req.body.isActive === 'true',
            hasSubCollection: req.body.hasSubCollection === 'true',
        };
        
        const newService = new ServiceModel(serviceData);
        await newService.save();

        console.log('✅ Service created successfully with ID:', newService._id);
        
        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: newService
        });

    } catch (error) {
        console.error('❌ Create service error:', error);
        
        if (error.code === 11000) {
          return res.status(400).json({ success: false, message: 'Service title already exists' });
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: 'Validation failed: ' + messages.join(', ') });
        }

        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});





// ============================================================================
// ✅ BOOKING UPDATE ROUTE - MUST BE BEFORE app.use('/api/bookings')
// ============================================================================
app.put('/api/bookings/:id', async (req, res) => {
  console.log('');
  console.log('🔥🔥🔥 BOOKING UPDATE ROUTE HIT! 🔥🔥🔥');
  console.log('📍 Route: PUT /api/bookings/:id');
  console.log('🆔 Booking ID:', req.params.id);
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  console.log('');

  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || id === 'undefined' || id === 'null') {
      console.log('❌ Invalid booking ID');
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID'
      });
    }

    console.log('🔍 Finding booking:', id);
    const booking = await Booking.findById(id);

    if (!booking) {
      console.log('❌ Booking not found');
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('✅ Booking found:', booking.packageName);

    const allowedUpdates = [
      'packageName', 'fullName', 'email', 'message', 
      'startDate', 'endDate', 'duration', 'pax',
      'selectedRoomType', 'hotelName', 'numberOfRooms',
      'flightDetails', 'passengers'
    ];

    let updatedFields = [];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        booking[field] = updateData[field];
        updatedFields.push(field);
      }
    });

    console.log('📝 Updated:', updatedFields.join(', '));

    booking.updatedAt = new Date();
    await booking.save();

    console.log('💾 Saved!');
    console.log('✅ Success!');
    console.log('');

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: booking
    });

  } catch (error) {
    console.error('');
    console.error('❌❌❌ ERROR ❌❌❌');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('');
    
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
});

console.log('✅ Booking update route registered');

// ===================================================================
// REGISTER ALL ROUTES
// ===================================================================
app.use('/api/packages', packageRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posters', posterRoutes); 
app.use('/api/blogs', blogRoutes);
app.use('/api/payment', paymentRoute);
app.use('/api/bookings', bookingRoute);
app.use('/api/auth', authRoute);
app.use('/api/tours', tourRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/visas', visaRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/psa', psaRoutes);
app.use('/api/cenomar', cenomarRoutes); 
app.use('/api/passports', passportRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/documents', require('./routes/documentRoute'));
app.use('/api/uploads', uploadRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/seller-rates', sellerRateRoutes);
app.use('/api/activity-logs', activityLogRoute); 
app.use('/api/drafts', require('./routes/drafts'));
app.use('/api/activity-logs', activityLogRoute); 
app.use('/api/favorites', favoriteRoute);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ip', ipRoutes);
app.use('/api/page-views', pageViewRoutes);



// ===================================================================
// ===================================================================
// BLOG ENDPOINTS
// ===================================================================
app.get('/api/blogs', async (req, res) => {
  const blogs = await Blog.find();
  res.json(blogs);
});

// ===================================================================
// ADMIN BOOKING ENDPOINTS (get / confirm / cancel)
// ===================================================================
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 }) 
      .select('-__v'); 

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

app.put('/api/admin/bookings/:id/confirm', async (req, res) => {
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

app.put('/api/admin/bookings/:id/cancel', async (req, res) => {
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

    console.log('❌ Booking cancelled:', id);

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


// ===================================================================
// STATISTICS ENDPOINT
// ===================================================================
app.get('/api/admin/statistics', async (req, res) => {
  try {
    const confirmedBookings = await Booking.find({ status: 'confirmed' });
    const statistics = confirmedBookings.reduce((acc, booking) => {
      const pax = 
        (booking.pax?.adult || 1) + 
        (booking.pax?.children || 0) + 
        (booking.pax?.infants || 0);
      if (booking.sellerPrice && booking.markup) {
        acc.totalSellerCost += booking.sellerPrice * pax;
        acc.totalMarkup += booking.markup * pax;
        acc.totalSales += booking.totalAmount;
      }
      
      acc.totalBookings += 1;
      
      return acc;
    }, {
      totalSellerCost: 0,
      totalMarkup: 0,
      totalSales: 0,
      totalBookings: 0
    });
    
    statistics.profitMargin = statistics.totalSales > 0 
      ? ((statistics.totalMarkup / statistics.totalSales) * 100).toFixed(1)
      : 0;
    
    console.log('📊 Statistics calculated:', statistics);
    
    res.json({
      success: true,
      data: statistics
    });
    
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching statistics', 
      error: error.message 
    });
  }
});

const frontendBuildPath = path.join(__dirname, '../client/build'); 

if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));

  app.all('/{*path}', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ 
        success: false, 
        message: `API endpoint not found: ${req.method} ${req.originalUrl}` 
      });
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });

  console.log(`✅ Serving React frontend from: ${frontendBuildPath}`);
} else {
  // No frontend build — still guard API routes from returning HTML
  app.all('/{*path}', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ 
        success: false, 
        message: `API endpoint not found: ${req.method} ${req.originalUrl}` 
      });
    }
    res.status(404).json({ success: false, message: 'Not found' });
  });

  console.warn(`⚠️ Frontend build folder not found at: ${frontendBuildPath}`);
  console.warn(`   Run 'npm run build' in your React app folder and ensure the path is correct.`);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});