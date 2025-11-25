const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- 2. SERVE STATIC FILES (CRUCIAL FOR IMAGES) ---
// This allows the frontend to access images at http://localhost:5000/uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI) 
    .then(() => console.log("✅ DATABASE CONNECTED!"))
    .catch((err) => {
        console.error("❌ Database Connection Error:", err);
        console.error("⚠️ Check your .env file or IP Whitelist.");
    });

// --- 4. IMPORT ROUTES ---
const flightRoutes = require('./routes/flightRoute');
const packageRoutes = require('./routes/packageRoute');
const testimonialRoutes = require('./routes/testimonialRoute');
const promoRoutes = require('./routes/promoRoute');
const adminRoutes = require('./routes/adminRoute');
const posterRoutes = require('./routes/posters'); 
const blogRoutes = require('./routes/blogs'); // <--- NEW BLOG ROUTE

// --- 5. USE ROUTES ---
app.get('/', (req, res) => {
  res.send('WanderWave API is running!');
});

const paymentRoute = require('./routes/paymentRoute');
const bookingRoute = require('./routes/bookingRoute');
app.use('/api/packages', packageRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posters', posterRoutes); 
app.use('/api/blogs', blogRoutes); // <--- NEW BLOG ENDPOINT
app.use('/api/payment', paymentRoute);
app.use('/api/bookings', bookingRoute);

// --- 6. EXISTING INLINE LOGIC (PACKAGE UPLOAD & BOOKINGS) ---
// Note: Ideally, these should be moved to their own controllers/routes files in the future
// but we are keeping them here to ensure your existing app continues to work.

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer config for inline routes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const PackageModel = require('./models/package');
const Booking = require('./models/booking');

// Legacy Route: Add Package
app.post('/api/packages/add', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, destination, price, duration, 
            category, inclusions, itinerary 
        } = req.body;
        
        const imageFilename = req.file ? req.file.filename : null;
        const parsedInclusions = inclusions ? JSON.parse(inclusions) : [];
        const parsedItinerary = itinerary ? JSON.parse(itinerary) : [];

        const newPackage = new PackageModel({
            title, destination, price, duration, category,
            image: imageFilename,
            inclusions: parsedInclusions,
            itinerary: parsedItinerary 
        });

        await newPackage.save();
        res.json({ status: "ok", message: "Package added successfully!" });

    } catch (err) {
        console.error("Error adding package:", err);
        res.status(500).json({ status: "error", error: err.message });
    }
});

// Legacy Route: Create Booking
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    const newBooking = new Booking(bookingData);
    await newBooking.save();
    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking', error });
  }
});

// Legacy Route: Get Bookings
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

// --- 7. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});