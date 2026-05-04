// routes/transferBookingRoute.js
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const Transfer = require('../models/transfer');

// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary – loaded lazily so a missing config does NOT crash the route file.
// The route will still work; image upload will just return an error if
// CLOUDINARY_* env vars are missing.
// ─────────────────────────────────────────────────────────────────────────────
let cloudinary = null;

const getCloudinary = () => {
  if (!cloudinary) {
    try {
      const cld = require('cloudinary').v2;
      // Validate that the required env vars are present before using
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        cloudinary = cld;
      } else {
        console.warn('⚠️  Cloudinary env vars missing — image upload disabled for transfers.');
      }
    } catch (err) {
      console.warn('⚠️  cloudinary package not installed — image upload disabled for transfers.');
    }
  }
  return cloudinary;
};

// ─────────────────────────────────────────────────────────────────────────────
// Multer – store upload in memory so we can pipe it to Cloudinary (or disk)
// ─────────────────────────────────────────────────────────────────────────────
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'), false);
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper – upload buffer to Cloudinary
// Returns { url, publicId } or throws
// ─────────────────────────────────────────────────────────────────────────────
const uploadToCloudinary = (buffer, mimetype) => {
  const cld = getCloudinary();
  if (!cld) {
    return Promise.reject(
      new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.')
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      { folder: 'transfers', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper – safely destroy a Cloudinary image (no-op if not configured)
// ─────────────────────────────────────────────────────────────────────────────
const destroyFromCloudinary = async (publicId) => {
  const cld = getCloudinary();
  if (!cld || !publicId) return;
  try {
    await cld.uploader.destroy(publicId);
  } catch (err) {
    console.warn('⚠️  Could not delete old Cloudinary image:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/transfers
// Create a new transfer listing (from AddTransfer form)
// Body: multipart/form-data
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      packageDestination,
      category,
      pax,
      // One Way
      oneWaySupplierRate,
      oneWayMarkupValue,
      oneWayMarkupType,
      oneWayPrice,
      // Roundtrip
      roundtripSupplierRate,
      roundtripMarkupValue,
      roundtripMarkupType,
      roundtripPrice,
    } = req.body;

    // ── Required field validation ──────────────────────────────────────────
    if (!title) {
      return res.status(400).json({ success: false, message: 'title is required.' });
    }

    // ── Image upload ───────────────────────────────────────────────────────
    let imageUrl      = null;
    let imagePublicId = null;

    if (req.file) {
      try {
        const uploaded = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        imageUrl      = uploaded.url;
        imagePublicId = uploaded.publicId;
      } catch (uploadErr) {
        console.error('❌ Image upload failed:', uploadErr.message);
        return res.status(500).json({
          success: false,
          message: `Image upload failed: ${uploadErr.message}`,
        });
      }
    }

    // ── Create & save document ─────────────────────────────────────────────
    const transfer = new Transfer({
      title,
      packageDestination: packageDestination || null,
      category:    category    || 'Local Transfer',
      pax:         pax !== undefined && pax !== '' ? parseInt(pax) : null,
      imageUrl,
      imagePublicId,

      oneWaySupplierRate: parseFloat(oneWaySupplierRate) || 0,
      oneWayMarkupValue:  parseFloat(oneWayMarkupValue)  || 0,
      oneWayMarkupType:   oneWayMarkupType || 'peso',
      oneWayPrice:        parseFloat(oneWayPrice)        || 0,

      roundtripSupplierRate: parseFloat(roundtripSupplierRate) || 0,
      roundtripMarkupValue:  parseFloat(roundtripMarkupValue)  || 0,
      roundtripMarkupType:   roundtripMarkupType || 'peso',
      roundtripPrice:        parseFloat(roundtripPrice)        || 0,
    });

    await transfer.save();

    console.log('✅ Transfer listing created:', transfer._id, '|', title);

    return res.status(201).json({
      success:    true,
      message:    'Transfer created successfully.',
      transferId: transfer._id,
      transfer,
    });

  } catch (err) {
    console.error('❌ Transfer creation error:', err);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    return res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transfers
// List all active transfer listings
// Query params: category, page, limit, all
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 50, all } = req.query;

    const filter = {};
    if (!all) filter.isActive = true; // by default only return active listings
    if (category) filter.category = { $regex: category, $options: 'i' };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Transfer.countDocuments(filter);
    const transfers = await Transfer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    return res.status(200).json({
      success: true,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data:  transfers,
    });
  } catch (err) {
    console.error('❌ Fetch transfers error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/transfers/:id
// Get a single transfer listing
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id).select('-__v');
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found.' });
    }
    return res.status(200).json({ success: true, data: transfer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/transfers/:id
// Update a transfer listing
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found.' });
    }

    const fields = [
      'title', 'packageDestination', 'category',
      'oneWayMarkupType', 'roundtripMarkupType', 'isActive',
    ];
    const numericFields = [
      'oneWaySupplierRate', 'oneWayMarkupValue', 'oneWayPrice',
      'roundtripSupplierRate', 'roundtripMarkupValue', 'roundtripPrice',
    ];

    fields.forEach((key) => {
      if (req.body[key] !== undefined) transfer[key] = req.body[key];
    });
    numericFields.forEach((key) => {
      if (req.body[key] !== undefined) transfer[key] = parseFloat(req.body[key]) || 0;
    });

    // Handle pax separately (nullable number)
    if (req.body.pax !== undefined) {
      transfer.pax = req.body.pax !== '' ? parseInt(req.body.pax) : null;
    }

    // Replace image if a new one was uploaded
    if (req.file) {
      try {
        // Delete old image from Cloudinary first (safe no-op if not configured)
        await destroyFromCloudinary(transfer.imagePublicId);

        const uploaded = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        transfer.imageUrl      = uploaded.url;
        transfer.imagePublicId = uploaded.publicId;
      } catch (uploadErr) {
        console.error('❌ Image upload failed during update:', uploadErr.message);
        return res.status(500).json({
          success: false,
          message: `Image upload failed: ${uploadErr.message}`,
        });
      }
    }

    await transfer.save();

    console.log('✅ Transfer listing updated:', transfer._id);
    return res.status(200).json({ success: true, message: 'Transfer updated.', data: transfer });
  } catch (err) {
    console.error('❌ Transfer update error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/transfers/:id/toggle
// Toggle active / inactive status
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/toggle', async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found.' });
    }

    transfer.isActive = !transfer.isActive;
    await transfer.save();

    console.log(`✅ Transfer ${transfer._id} isActive → ${transfer.isActive}`);
    return res.status(200).json({
      success:  true,
      message:  `Transfer is now ${transfer.isActive ? 'active' : 'inactive'}.`,
      isActive: transfer.isActive,
      data:     transfer,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/transfers/:id  (admin only – hard delete)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const transfer = await Transfer.findByIdAndDelete(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer not found.' });
    }

    // Clean up image from Cloudinary if present (safe no-op if not configured)
    await destroyFromCloudinary(transfer.imagePublicId);

    console.log('🗑️ Transfer listing deleted:', req.params.id);
    return res.status(200).json({ success: true, message: 'Transfer deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;