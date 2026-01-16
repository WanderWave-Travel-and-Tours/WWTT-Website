const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors()); 

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  if (req.body && req.body.passengers) {
    if (typeof req.body.passengers === 'string') {
      try {
        req.body.passengers = JSON.parse(req.body.passengers);
      } catch (parseError) {}
    }
    if (req.body.flightDetails && typeof req.body.flightDetails === 'string') {
      try {
        req.body.flightDetails = JSON.parse(req.body.flightDetails);
      } catch (e) {}
    }
    if (req.body.passportDetails && typeof req.body.passportDetails === 'string') {
      try {
        req.body.passportDetails = JSON.parse(req.body.passportDetails);
      } catch (e) {}
    }
  }

  if (req.body && req.body.requirements && typeof req.body.requirements === 'string') {
    try {
      req.body.requirements = JSON.parse(req.body.requirements);
    } catch (e) {
      console.error('Failed to parse requirements in middleware:', e);
    }
  }
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
const activityLogRoute = require('./routes/activityLogRoute'); // ✅ SINGLE IMPORT
const draftsRoutes = require('./routes/drafts');
const activityLogsRoutes = require('./routes/activityLogRoute');

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
app.use('/api/activity-logs', activityLogRoute); // ✅ SINGLE REGISTRATION
app.use('/api/drafts', require('./routes/drafts'));
app.use('/api/activity-logs', activityLogRoute); // ✅ Already there!


// ===================================================================
// PACKAGE ADD ENDPOINT
// ===================================================================
app.post('/api/packages/add', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, destination, sellerPrice, markup, duration, 
            category, inclusions, itinerary 
        } = req.body;

        console.log('Received data:', req.body); 
        
        const imageFilename = req.file ? req.file.filename : null;
        const parsedInclusions = inclusions ? JSON.parse(inclusions) : [];
        const parsedItinerary = itinerary ? JSON.parse(itinerary) : [];
        const parsedSellerPrice = parseFloat(sellerPrice);
        const parsedMarkup = parseFloat(markup) || 0;

        if (isNaN(parsedSellerPrice)) {
            return res.status(400).json({ 
                status: "error", 
                error: "Seller price must be a valid number" 
            });
        }

        const totalPrice = parsedSellerPrice + parsedMarkup;

        const newPackage = new PackageModel({
            title, 
            destination, 
            sellerPrice: parsedSellerPrice,
            markup: parsedMarkup,
            price: totalPrice,
            duration, 
            category,
            image: imageFilename,
            inclusions: parsedInclusions,
            itinerary: parsedItinerary 
        });

        await newPackage.save();
        res.json({ 
            status: "ok", 
            message: "Package added successfully!",
            package: newPackage 
        });

    } catch (err) {
        console.error("Error adding package:", err);
        res.status(500).json({ status: "error", error: err.message });
    }
});

// ===================================================================
// BOOKING ENDPOINTS
// ===================================================================
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    const package = await PackageModel.findOne({ title: bookingData.packageName });
    
    if (!package) {
      return res.status(404).json({ 
        success: false,
        message: 'Package not found' 
      });
    }
    
    const totalPax = 
      (bookingData.pax?.adult || 1) + 
      (bookingData.pax?.children || 0) + 
      (bookingData.pax?.infants || 0);
    
    const totalAmount = package.price * totalPax;
    
    console.log('📦 Creating booking with pricing:', {
      packageName: package.title,
      sellerPrice: package.sellerPrice,
      markup: package.markup,
      price: package.price,
      totalPax,
      totalAmount
    });
    
    const newBooking = new Booking({
      ...bookingData,
      packageId: package._id,
      sellerPrice: package.sellerPrice,
      markup: package.markup,
      price: package.price,
      totalAmount: totalAmount
    });
    
    await newBooking.save();
    
    console.log('✅ Booking created successfully with ID:', newBooking._id);
    
    res.status(201).json({ 
      success: true,
      message: 'Booking created successfully', 
      booking: newBooking 
    });
    
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating booking', 
      error: error.message 
    });
  }
});

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
// BLOG ENDPOINTS
// ===================================================================
app.get('/api/blogs', async (req, res) => {
  const blogs = await Blog.find();
  res.json(blogs);
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

// ===================================================================
// SPA SUPPORT: Serve React frontend build (must be placed AFTER all API routes)
// ===================================================================
// Adjust this path based on your project structure
// Common examples:
// - path.join(__dirname, '../client/build')   → if React app is in ../client folder
// - path.join(__dirname, './client/build')    → if in ./client
// - path.join(__dirname, '../build')          → if in ../build
const frontendBuildPath = path.join(__dirname, '../client/build'); // CHANGE THIS IF YOUR BUILD FOLDER IS DIFFERENT

if (fs.existsSync(frontendBuildPath)) {
  // Serve static files (JS, CSS, images, etc.)
  app.use(express.static(frontendBuildPath));

  // Catch-all handler: for any non-API route, serve index.html so React Router can handle it
  app.get('*', (req, res) => {
    // Prevent interfering with API routes
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });

  console.log(`✅ Serving React frontend from: ${frontendBuildPath}`);
} else {
  console.warn(`⚠️ Frontend build folder not found at: ${frontendBuildPath}`);
  console.warn(`   Run 'npm run build' in your React app folder and ensure the path is correct.`);
}

// ===================================================================
// START SERVER
// ===================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});