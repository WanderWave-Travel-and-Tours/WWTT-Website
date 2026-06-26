const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialise PBKDF2 session key synchronously at startup (one-time cost ~300ms)
const { initSession } = require('./utils/payloadCrypto');
initSession();
const encryptResponse = require('./middleware/encryptResponse');

// DNS resolvers for the MongoDB Atlas SRV lookup. We APPEND public resolvers
// as fallbacks instead of REPLACING the system resolver — forcing only Google
// DNS means that if 8.8.8.8 rate-limits or times out on the SRV/TXT query, the
// whole Atlas connection fails and every route 500s. Keeping the OS resolver
// first preserves normal resolution; the public servers are just a safety net.
const dns = require('dns');
const existingDnsServers = dns.getServers();
dns.setServers([...new Set([...existingDnsServers, '8.8.8.8', '8.8.4.4', '1.1.1.1'])]);

const app = express();

// Render (and most cloud hosts) sit behind a reverse proxy that sets X-Forwarded-For.
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

// ====================== CRITICAL: WEBHOOK SETUP FIRST ======================

// 1. PayMongo Webhook — RAW body, must be registered BEFORE cors() and express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// 2. Security headers — applied to every response before CORS and routing.
app.use((req, res, next) => {
  // Prevent browsers from MIME-sniffing the content type
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Deny embedding this site in iframes (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');
  // Enable XSS auditor in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Limit referrer information sent to third parties
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict access to sensitive browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// CORS — after webhook so it doesn't interfere with PayMongo's raw requests
const corsOptions = {
  origin: [
    'https://wanderwaveph.com',
    'https://www.wanderwaveph.com',
    'https://wanderwaveph.onrender.com', // ✅ FIX: Added Render URL so direct API calls don't get blocked
    'https://app.gohighlevel.com',
    'https://*.gohighlevel.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'https://checkout.paymongo.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
};

// PayMongo webhook is an external service — skip CORS for it
app.use((req, res, next) => {
  if (req.path === '/api/payment/webhook') {
    return next(); // Skip CORS for webhook
  }
  cors(corsOptions)(req, res, next);
});

// 3. Normal middleware — after webhook and CORS
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ====================== 🔍 GLOBAL REQUEST LOGGER ======================
// Logs every incoming request so we can identify exactly what's hitting the server
app.use((req, res, next) => {
  const start = Date.now();

  // Skip logging for static file requests to keep logs clean
  if (req.path.startsWith('/uploads')) return next();

  console.log(`\n📥 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log(`   Origin: ${req.headers.origin || 'N/A'}`);
  console.log(`   Content-Type: ${req.headers['content-type'] || 'N/A'}`);

  // Log request body for POST/PUT/PATCH (but skip file uploads)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.headers['content-type']?.includes('application/json')) {
    console.log(`   Body: ${JSON.stringify(req.body)}`);
  }

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusIcon = res.statusCode >= 400 ? '❌' : '✅';
    console.log(`   ${statusIcon} Response: ${res.statusCode} (${duration}ms)`);
  });

  next();
});
// ======================================================================

// 4. Webhook request logger
app.use((req, res, next) => {
  if (req.path === '/api/payment/webhook') {
    console.log('🔥 WEBHOOK REQUEST RECEIVED - Path:', req.path);
    console.log('Content-Type:', req.headers['content-type']);
  }
  next();
});

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

// Global API rate limiter — 100 req / 15 min per IP; skips the raw PayMongo webhook
const { apiLimiter } = require('./middleware/rateLimiters');
app.use('/api/', (req, res, next) => {
  if (req.path === '/payment/webhook') return next();
  apiLimiter(req, res, next);
});

// Encrypt all 2xx JSON responses. Must come AFTER body-parsing, BEFORE routes.
// Routes that must skip encryption (e.g. /api/crypto/session-hint) set res.locals.skipEncrypt = true.
app.use(encryptResponse);

// Rewrite Cloudinary URLs in every JSON response so browsers never see the cloud name.
// This wrapper runs BEFORE encryptResponse (outer wrap = first called), so URL rewriting
// happens on the plain data before encryption.
function _replaceCloudinaryUrls(obj, proxyBase) {
  if (typeof obj === 'string') {
    return obj.replace(/https:\/\/res\.cloudinary\.com\/[^/]+\//g, `${proxyBase}/img/`);
  }
  if (Array.isArray(obj)) return obj.map(v => _replaceCloudinaryUrls(v, proxyBase));
  if (obj && typeof obj === 'object') {
    // Mongoose documents: serialize to a plain object FIRST. .toJSON() converts
    // ObjectId → hex string and Date → ISO string, so the recursion below sees
    // primitives instead of mangling the special types into empty {}.
    if (typeof obj.toJSON === 'function' && (obj.$__ || obj._doc)) {
      return _replaceCloudinaryUrls(obj.toJSON(), proxyBase);
    }
    // Leave other special objects (raw ObjectId, Date, Buffer, etc.) untouched —
    // recursing into them with Object.entries() would destroy them. e.g. an
    // ObjectId would become a plain {} and _id.split() then throws on the frontend.
    const proto = Object.getPrototypeOf(obj);
    const isPlain = proto === Object.prototype || proto === null;
    if (!isPlain) return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = _replaceCloudinaryUrls(v, proxyBase);
    return out;
  }
  return obj;
}
app.use((req, res, next) => {
  const _origJson = res.json.bind(res);
  const proxyBase = `${req.protocol}://${req.get('host')}`;
  res.json = function (body) { return _origJson(_replaceCloudinaryUrls(body, proxyBase)); };
  next();
});

// ── MongoDB connection with resilient retry ────────────────────────────────
// Render's container can briefly lose network on cold start, and the Atlas SRV
// lookup can intermittently fail. Without retry, a single failed connect leaves
// the server running with NO database — every route then 500s until a manual
// restart. This connects with sane timeouts and keeps retrying until it's up,
// and re-establishes automatically if the connection drops later.
const MONGO_OPTIONS = {
    serverSelectionTimeoutMS: 10000, // fail fast instead of hanging queries
    socketTimeoutMS: 45000,
    maxPoolSize: 20,
    minPoolSize: 2,
    retryWrites: true,
};

async function connectWithRetry(attempt = 1) {
    try {
        await mongoose.connect(process.env.MONGODB_URI, MONGO_OPTIONS);
        console.log("✅ DATABASE CONNECTED!");
    } catch (err) {
        console.error(`❌ Database Connection Error (attempt ${attempt}):`, err.message);
        console.error("⚠️ Check your .env file or IP Whitelist. Retrying in 5s…");
        setTimeout(() => connectWithRetry(attempt + 1), 5000);
    }
}

// Auto-reconnect if the live connection drops after the server is already up.
mongoose.connection.on('disconnected', () => {
    console.error("⚠️ MongoDB disconnected — attempting to reconnect…");
});
mongoose.connection.on('error', (err) => {
    console.error("❌ MongoDB runtime error:", err.message);
});

connectWithRetry();

    
app.get('/', (req, res) => {
  res.send('WanderWave API is running!');
});

// Image proxy — serves Cloudinary images through the backend so the cloud name
// is never exposed to the browser. Not under /api/ so the rate limiter is bypassed.
app.get('/img/*path', async (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return res.status(503).send('Image service unavailable');

  const imagePath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path;
  const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/${imagePath}`;

  try {
    const axios = require('axios');
    const upstream = await axios.get(cloudinaryUrl, { responseType: 'stream', timeout: 15000 });
    res.set('Content-Type', upstream.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    upstream.data.pipe(res);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).send('Image not found');
  }
});

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
const tourBookingRoute = require('./routes/tourBookingRoute');
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
const pageViewRoutes = require('./routes/pageViewRoute');
const siteVisitRoutes = require('./routes/siteVisitRoute');
const emailSyncRoute = require('./routes/Emailsyncroute');
const destinationRoutes = require('./routes/destinationRoute');
const transferRoute             = require('./routes/transferBookingRoute');       // Transfer listings (vehicles/options)
const transferBookingOrderRoute = require('./routes/transferBookingOrderRoute'); // Customer transfer bookings
const customizedBookingRoute    = require('./routes/Customizedbookingroute');    // ✅ ADDED: Customized booking wizard
const locationRoute             = require('./routes/locationRoute');           // ← ADD
const activityLogRoutes         = require('./routes/activityLogRoute');
const feedbackRoutes            = require('./routes/feedbackRoutes');
const favoriteRoutes            = require('./routes/favoriteRoute');
const cryptoRoute               = require('./routes/cryptoRoute');

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
const Blog = require('./models/blog');
const ServiceModel = require('./models/service');
const User = require('./models/user');

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

// Lightweight wake-up endpoint — called by the frontend on app load so Render's
// server is fully awake before real data requests go out.
app.get('/api/ping', (req, res) => res.status(200).json({ status: 'ok' }));

// ✅ FIX: siteVisitRoutes is now mounted BEFORE inline app.post/app.get routes
// to ensure it is matched first and not shadowed by anything below it.
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
app.use('/api/tour-bookings', tourBookingRoute);
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
app.use('/api/page-views', pageViewRoutes);
app.use('/api/site-visits', siteVisitRoutes); 
app.use('/api/packages', emailSyncRoute);
app.use('/api/destinations', destinationRoutes);
app.use('/api/transfers', transferRoute);                     // Transfer listings (CRUD: vehicles/options)
app.use('/api/transfer-bookings', transferBookingOrderRoute); // Customer transfer bookings
app.use('/api/locations',         locationRoute);                              // ← ADD
app.use('/api/customized-bookings', customizedBookingRoute); // ✅ ADDED: Customized booking wizard
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/crypto',    cryptoRoute);
// ✅ Single mount — transferBookingRoute duplicate removed


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

app.get('/api/blogs', async (req, res) => {
  const blogs = await Blog.find();
  res.json(blogs);
});

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

// ⭐ FAVORITES — see routes/favoriteRoute.js (JWT-protected, userId from token)

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL MEDIA REDIRECT ROUTES
// ─────────────────────────────────────────────────────────────────────────────
const SOCIAL_REDIRECTS = {
  fb: {
    platform: 'facebook',
    url: 'https://wanderwaveph.com?source=facebook',
  },
  ig: {
    platform: 'instagram',
    url: 'https://wanderwaveph.com?source=instagram',
  },
  tt: {
    platform: 'tiktok',
    url: 'https://wanderwaveph.com?source=tiktok',
  },
};

Object.entries(SOCIAL_REDIRECTS).forEach(([slug, { platform, url }]) => {
  app.get(`/${slug}`, async (req, res) => {
    try {
      const SiteVisit = require('./models/siteVisit');
      const visit = new SiteVisit({ platform });
      await visit.save();
      console.log(`✅ Social visit logged — platform: ${platform}`);
    } catch (err) {
      console.error(`❌ Failed to log visit for /${slug}:`, err.message);
    }
    res.redirect(302, url);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NEW: WanderWave Custom Ad & Organic Redirect Routes (6 URLs)
// Logs directly to SiteVisit with fullPath + campaignType
// Added without deleting any existing code
// ─────────────────────────────────────────────────────────────────────────────
const CUSTOM_URLS = {
  // Paid Ads
  'fb-ads':     { platform: 'facebook', campaignType: 'ads' },
  'ig-ads':     { platform: 'instagram', campaignType: 'ads' },
  'tiktok-ads': { platform: 'tiktok', campaignType: 'ads' },
  // Organic
  'fb-org':     { platform: 'facebook', campaignType: 'organic' },
  'ig-org':     { platform: 'instagram', campaignType: 'organic' },
  'tiktok-org': { platform: 'tiktok', campaignType: 'organic' },
};

Object.entries(CUSTOM_URLS).forEach(([path, { platform, campaignType }]) => {
  app.get(`/${path}`, async (req, res) => {
    try {
      const SiteVisit = require('./models/siteVisit');
      const visit = new SiteVisit({
        platform,
        campaignType,
        fullPath: `/${path}`,           // exact clean URL path
        referrer: req.headers.referer || req.headers.referrer || null,
      });
      await visit.save();

      console.log(`✅ Custom URL visit logged → ${path} | ${platform} | ${campaignType}`);
    } catch (err) {
      console.error(`❌ Failed to log custom URL ${path}:`, err.message);
    }

    // Redirect to homepage (clean, no UTM needed anymore)
    res.redirect(302, 'https://wanderwaveph.com/');
  });
});

// ====================== SERVE REACT ADMIN DASHBOARD ======================
const distPath = path.join(__dirname, 'dist');

console.log('🚀 NODE_ENV:', process.env.NODE_ENV);
console.log('📁 Dist path:', distPath);
console.log('📁 Dist exists?', fs.existsSync(distPath));
console.log('📁 index.html exists?', fs.existsSync(path.join(distPath, 'index.html')));

if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
  console.log('✅ Dist folder OK → Serving Admin SPA');

  app.use(express.static(distPath));

  // ←←← UPDATED CATCH-ALL: app.get('*') — mas reliable para sa React + basename="/admin"
  app.get('/{*path}', (req, res) => {
    // Huwag i-serve ang index.html sa API, uploads, at social redirects
    if (req.path.startsWith('/api/') ||
        req.path.startsWith('/uploads') ||
        req.path.startsWith('/img') ||
        req.path.startsWith('/fb') ||      // social redirects
        req.path.startsWith('/ig') ||
        req.path.startsWith('/tiktok')) {
      return res.status(404).json({ error: 'Not found' });
    }

    console.log(`✅ Serving index.html for: ${req.path}`);
    res.sendFile(path.join(distPath, 'index.html'));
  });

} else {
  console.error('❌ DIST FOLDER NOT FOUND!');
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});