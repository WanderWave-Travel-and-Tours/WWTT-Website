const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI) 
    .then(() => console.log("✅ DATABASE CONNECTED!"))
    .catch((err) => {
        console.error("❌ Database Connection Error:", err);
        console.error("⚠️ Check your .env file or IP Whitelist.");
    });

const flightRoutes = require('./routes/flightRoute');
const packageRoutes = require('./routes/packageRoute');
const testimonialRoutes = require('./routes/testimonialRoute');
const promoRoutes = require('./routes/promoRoute');
const adminRoutes = require('./routes/adminRoute');
const posterRoutes = require('./routes/posters'); 
const blogRoutes = require('./routes/blogs'); 

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
app.use('/api/blogs', blogRoutes);
app.use('/api/payment', paymentRoute);
app.use('/api/bookings', bookingRoute);

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

const PackageModel = require('./models/package');
const Booking = require('./models/booking');

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

app.get('/api/blogs', async (req, res) => {
  const blogs = await Blog.find();
  res.json(blogs);
});

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});