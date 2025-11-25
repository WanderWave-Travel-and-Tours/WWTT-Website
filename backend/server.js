const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//Models
const AdminModel = require('./models/admin');
const PackageModel = require('./models/package');
const TestimonialModel = require('./models/testimonial');
const PromoModel = require('./models/promo');
const Booking = require('./models/booking');

mongoose.connect(process.env.MONGODB_URI) 
    .then(() => console.log("✅ DATABASE CONNECTED! Ready to Login."))
    .catch((err) => {
        console.error("❌ Database Connection Error:", err);
        console.error("⚠️  Check your .env file or IP Whitelist.");
    });

app.get('/', (req, res) => {
  res.send('WanderWave API is running!');
});

// Routes
const flightRoutes = require('./routes/flightRoute');
const packageRoutes = require('./routes/packageRoute');
const testimonialRoutes = require('./routes/testimonialRoute');
const promoRoutes = require('./routes/promoRoute');
const adminRoutes = require('./routes/adminRoute');
const paymentRoute = require('./routes/paymentRoute');
const bookingRoute = require('./routes/bookingRoute');
app.use('/api/packages', packageRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoute);
app.use('/api/bookings', bookingRoute);

app.get('/', (req, res) => {
  res.send('WanderWave API is running!');
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

app.post('/api/packages/add', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, 
            destination, 
            price, 
            duration, 
            category,
            inclusions,
            itinerary 
        } = req.body;
        
        const imageFilename = req.file ? req.file.filename : null;
        const parsedInclusions = JSON.parse(inclusions);
        const parsedItinerary = JSON.parse(itinerary);

        const newPackage = new PackageModel({
            title,
            destination,
            price,
            duration,
            category,
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

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});