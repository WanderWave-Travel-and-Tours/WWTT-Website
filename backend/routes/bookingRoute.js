const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Booking = require('../models/booking');
const User = require('../models/user');
const Promo = require('../models/promo');
const Package = require('../models/package');
const Destination = require('../models/destination');
const ActivityLog = require('../models/ActivityLog');
const { BookingCount } = require('../models/PageView');
const { sendNewUserToGHL, sendBookingConfirmationToGHL, sendPackageBookingToGHL } = require('../utils/ghlService');
const { validatePrimaryPassengerAge, validatePassengersAge } = require('../utils/ageUtils');
const authMiddleware = require('../middleware/auth');
const verifyUserJWT = require('../middleware/verifyUserJWT');
const { cloudinary } = require('../config/cloudinary');

// Fields that must never appear in customer-facing responses
const INTERNAL_FIELDS = ['sellerPrice', 'markup', 'markupType', 'checkoutSessionId', 'createdByEmail', 'createdByType', '__v'];
function stripInternal(obj) {
  const out = { ...obj };
  INTERNAL_FIELDS.forEach(f => delete out[f]);
  return out;
}

// ✅ Uploads a passenger's ID/passport files (if present in req.files) to Cloudinary
// and attaches idDocument/passportDocument onto the passenger object. Shared by both
// the walk-in and regular booking branches so uploaded documents always get saved.
async function attachPassengerDocuments(passenger, index, files) {
  const idFile = files ? files.find(f => f.fieldname === `idFile_${index}`) : null;
  const passportFile = files ? files.find(f => f.fieldname === `passportFile_${index}`) : null;

  if (idFile) {
    try {
      const result = await cloudinary.uploader.upload(idFile.path, {
        folder: 'wanderwave/bookings/ids',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'pdf'],
        resource_type: 'auto'
      });
      passenger.idDocument = {
        filename: result.public_id,
        originalName: idFile.originalname,
        path: result.secure_url,
        size: idFile.size
      };
      console.log(`  📄 ID uploaded to Cloudinary for passenger ${index + 1}: ${idFile.originalname}`);
    } catch (uploadErr) {
      console.error(`❌ Failed to upload ID to Cloudinary for passenger ${index + 1}:`, uploadErr.message);
    } finally {
      try { fs.unlinkSync(idFile.path); } catch (e) {}
    }
  }

  if (passportFile) {
    try {
      const result = await cloudinary.uploader.upload(passportFile.path, {
        folder: 'wanderwave/bookings/passports',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'pdf'],
        resource_type: 'auto'
      });
      passenger.passportDocument = {
        filename: result.public_id,
        originalName: passportFile.originalname,
        path: result.secure_url,
        size: passportFile.size
      };
      console.log(`  📄 Passport uploaded to Cloudinary for passenger ${index + 1}: ${passportFile.originalname}`);
    } catch (uploadErr) {
      console.error(`❌ Failed to upload passport to Cloudinary for passenger ${index + 1}:`, uploadErr.message);
    } finally {
      try { fs.unlinkSync(passportFile.path); } catch (e) {}
    }
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (file.fieldname.startsWith('proofImage_')) {
      uploadPath = './uploads/tmp-proof/';
    } else if (file.fieldname.includes('passport')) {
      uploadPath = './uploads/passports/';
    } else {
      uploadPath = './uploads/ids/';
    }

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

router.get('/user/:email', verifyUserJWT, async (req, res) => {
  if (req.user.email.toLowerCase() !== req.params.email.toLowerCase()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  res.locals.skipEncrypt = true;
  try {
    const { email } = req.params;
    const bookings = await Booking.find({ email: email })
      .populate('packageId')
      .sort({ createdAt: -1 })
      .lean();

    // ── Destination fallback (mirrors /active route) ──────────────────────
    const missingNames = [...new Set(
      bookings
        .filter(b => !b.packageId?.destination && b.packageName)
        .map(b => b.packageName)
    )];

    let fallbackMap = {};
    if (missingNames.length > 0) {
      const fallbackPkgs = await Package.find(
        { title: { $in: missingNames } },
        'title destination inclusions tourType minPax duration'
      ).lean();
      fallbackPkgs.forEach(p => { fallbackMap[p.title] = p; });
    }

    const enriched = bookings.map(b => {
      if (b.packageId?.destination) return b;
      const fallbackPkg = fallbackMap[b.packageName];
      if (!fallbackPkg) return b;
      return {
        ...b,
        packageId: {
          _id:         fallbackPkg._id,
          title:       fallbackPkg.title,
          destination: fallbackPkg.destination,
          inclusions:  fallbackPkg.inclusions || [],
          tourType:    fallbackPkg.tourType,
          minPax:      fallbackPkg.minPax,
          duration:    fallbackPkg.duration,
        },
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched.map(b => stripInternal(b))
    });
  } catch (error) {
    console.error('❌ Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings'
    });
  }
});


router.get('/stats/summary', authMiddleware, async (req, res) => {
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

router.get('/init-archive', authMiddleware, async (req, res) => {
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

// ============================================
// GET /backfill-itinerary
// ============================================
router.get('/backfill-itinerary', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ itinerary: { $size: 0 } }).lean();
    console.log(`🔧 Backfill: found ${bookings.length} booking(s) with empty itinerary`);

    let updated = 0;
    let skipped = 0;

    for (const booking of bookings) {
      let pkgSnapshot = null;

      if (booking.packageId) {
        pkgSnapshot = await Package.findById(booking.packageId)
          .select('itinerary inclusions title')
          .lean();
      }

      if (!pkgSnapshot && booking.packageName) {
        pkgSnapshot = await Package.findOne({ title: booking.packageName })
          .select('itinerary inclusions title')
          .lean();
      }

      if (!pkgSnapshot && booking.packageName) {
        pkgSnapshot = await Package.findOne({
          title: { $regex: new RegExp(`^${booking.packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }).select('itinerary inclusions title').lean();
      }

      if (!pkgSnapshot && booking.packageName) {
        const coreTitle = booking.packageName
          .replace(/\s*\(solo\)\s*/gi, '')
          .replace(/\s*\(group\)\s*/gi, '')
          .replace(/\s*\(pax.*?\)\s*/gi, '')
          .replace(/\s*\(joiner.*?\)\s*/gi, '')
          .replace(/\s*\(private.*?\)\s*/gi, '')
          .trim();
        if (coreTitle && coreTitle !== booking.packageName) {
          pkgSnapshot = await Package.findOne({
            title: { $regex: new RegExp(coreTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
          }).select('itinerary inclusions title').lean();
        }
      }

      if (!pkgSnapshot && booking.packageName) {
        const firstSegment = booking.packageName.split('(')[0].trim();
        if (firstSegment && firstSegment.length >= 4) {
          pkgSnapshot = await Package.findOne({
            title: { $regex: new RegExp(firstSegment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
          }).select('itinerary inclusions title').lean();
        }
      }

      if (!pkgSnapshot || !pkgSnapshot.itinerary || pkgSnapshot.itinerary.length === 0) {
        skipped++;
        continue;
      }

      const updateFields = { itinerary: pkgSnapshot.itinerary };
      if ((!booking.originalInclusions || booking.originalInclusions.length === 0) && pkgSnapshot.inclusions?.length > 0) {
        updateFields.originalInclusions = pkgSnapshot.inclusions;
      }

      await Booking.findByIdAndUpdate(booking._id, { $set: updateFields }, { runValidators: false });
      console.log(`  ✅ Backfilled "${booking.packageName}" (${booking._id}) from "${pkgSnapshot.title}" — ${pkgSnapshot.itinerary.length} day(s)`);
      updated++;
    }

    res.status(200).json({
      status: 'ok',
      message: `Backfill complete. Updated: ${updated}, Skipped (no match or already has data): ${skipped}.`,
      updated,
      skipped,
    });
  } catch (error) {
    console.error('❌ Backfill itinerary error:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});



router.get('/active', authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ isArchive: 'No' })
            .populate('packageId', 'destination title')
            .sort({ createdAt: -1 })
            .lean();

        const missingNames = [...new Set(
            bookings
                .filter(b => !b.packageId?.destination && b.packageName)
                .map(b => b.packageName)
        )];

        let fallbackMap = {};
        if (missingNames.length > 0) {
            const fallbackPkgs = await Package.find(
                { title: { $in: missingNames } },
                'title destination'
            ).lean();
            fallbackPkgs.forEach(p => { fallbackMap[p.title] = p.destination; });
        }

        const enriched = bookings.map(b => ({
            ...b,
            destination: b.packageId?.destination
                || fallbackMap[b.packageName]
                || null
        }));

        res.json({
            success: true,
            count: enriched.length,
            bookings: enriched
        });
    } catch (error) {
        console.error('Error fetching active bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active bookings'
        });
    }
});

router.get('/archived', authMiddleware, async (req, res) => {
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

router.post('/:id/archive', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ status: "error", message: "Booking not found" });

        const newStatus = booking.isArchive === 'Yes' ? 'No' : 'Yes';
        booking.isArchive = newStatus;
        await booking.save();

        try {
            if (newStatus === 'Yes') {
                const deleted = await BookingCount.deleteOne({ bookingId: booking._id });
                console.log(`📊 BookingCount removed on archive (deleted: ${deleted.deletedCount})`);
            } else {
                const exists = await BookingCount.findOne({ bookingId: booking._id });
                if (!exists) {
                    const totalPax = (booking.pax?.adult || 0) + (booking.pax?.children || 0) + (booking.pax?.infants || 0);
                    await BookingCount.create({
                        bookingId:   booking._id,
                        packageId:   booking.packageId   || null,
                        packageName: booking.packageName || null,
                        paxCount:    totalPax || 1,
                        paymentType: booking.paymentType || 'unknown',
                        totalAmount: booking.totalAmount || 0,
                    });
                    console.log(`📊 BookingCount restored for booking: ${booking.packageName}`);
                }
            }
        } catch (syncErr) {
            console.error('⚠️ BookingCount sync failed (non-fatal):', syncErr.message);
        }

        try {
            const { userEmail, adminId } = req.body;
            if (userEmail) {
                await ActivityLog.create({
                    action: newStatus === 'Yes' ? 'ARCHIVE' : 'UPDATE',
                    module: 'Bookings',
                    user: userEmail,
                    userId: adminId || null,
                    description: newStatus === 'Yes' 
                        ? `Archived booking: ${booking.packageName} (${booking.fullName})`
                        : `Restored booking: ${booking.packageName} (${booking.fullName})`,
                    severity: newStatus === 'Yes' ? 'WARNING' : 'INFO',
                    details: {
                        recordTitle: `${booking.packageName} - ${booking.fullName}`,
                        recordId: booking._id.toString(),
                        method: 'POST',
                        archiveStatus: newStatus
                    }
                });
                console.log('✅ Activity Log saved for Archive/Restore Booking');
            }
        } catch (logError) {
            console.error('⚠️ Failed to save activity log:', logError.message);
        }

        res.json({ 
            status: "ok", 
            message: `Booking archive status updated to ${newStatus}`, 
            isArchive: newStatus 
        });
    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
});

// ============================================
// GET /check-voucher-usage
// ⚠️ Must be declared BEFORE router.get('/:id')
// ============================================
router.get('/check-voucher-usage', async (req, res) => {
  res.locals.skipEncrypt = true;
  try {
    const { email, promoCode } = req.query;

    if (!email || !promoCode) {
      return res.status(400).json({ success: false, message: 'email and promoCode are required.' });
    }

    const promo = await Promo.findOne({
      code: promoCode.trim().toUpperCase(),
      isArchive: 'No'
    }).lean();

    if (!promo) {
      return res.status(200).json({ success: true, hasUsed: false });
    }

    if (promo.promoType !== 'voucher') {
      return res.status(200).json({ success: true, hasUsed: false });
    }

    const safeEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingUsage = await Booking.findOne({
      $or: [
        { promoId: promo._id },
        { promoCode: promo.code }
      ],
      email: { $regex: new RegExp(`^${safeEmail}$`, 'i') },
      status: { $in: ['pending', 'confirmed', 'fully_paid', 'partial_paid'] }
    }).lean();

    console.log(`🎫 Voucher usage check — ${email} / ${promoCode}: ${existingUsage ? 'ALREADY USED (status: ' + existingUsage.status + ')' : 'NOT USED'}`);

    return res.status(200).json({
      success: true,
      hasUsed: !!existingUsage,
      bookingStatus: existingUsage ? existingUsage.status : null
    });

  } catch (error) {
    console.error('❌ Error checking voucher usage:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// GET /:id/destination-payload
// ✅ NEW: Returns destination personalization fields (greeting, tips, emergency number)
// for a given booking. Called by the frontend triggerWebhook (paymentSuccess.jsx)
// so that back_to_home_clicked and other frontend-triggered GHL webhooks also carry
// the full destination data — same as the backend BOOKING_CONFIRMATION webhook.
// ⚠️ Must be declared BEFORE router.get('/:id') to avoid Express treating
//    "destination-payload" as an ObjectId for the :id param.
// ============================================
router.get('/:id/destination-payload', async (req, res) => {
  res.locals.skipEncrypt = true;
  try {
    const booking = await Booking.findById(req.params.id).lean();
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // 1. Try destination stored directly on the booking
    let destName = booking.destination || '';

    // 2. Fallback: look up via packageId
    if (!destName && booking.packageId) {
      const pkg = await Package.findById(booking.packageId).select('destination').lean();
      destName = pkg?.destination || '';
    }

    // 3. Fallback: look up via packageName title
    if (!destName && booking.packageName) {
      const pkg = await Package.findOne({ title: booking.packageName }).select('destination').lean();
      destName = pkg?.destination || '';
    }

    // No destination found — return empty payload (non-fatal)
    if (!destName) {
      console.log(`⚠️ No destination found for booking ${req.params.id} — returning empty payload`);
      return res.json({ success: true, payload: {} });
    }

    const destRecord = await Destination.findOne({
      name: { $regex: `^${destName.trim()}$`, $options: 'i' },
      isArchive: 'No'
    });

    if (!destRecord) {
      console.log(`⚠️ Destination "${destName}" not found in DB — returning empty payload`);
      return res.json({ success: true, payload: {} });
    }

    console.log(`✅ Destination payload fetched for frontend webhook: ${destName}`);
    return res.json({ success: true, payload: destRecord.toWebhookPayload() });

  } catch (err) {
    console.error('❌ Error fetching destination payload:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// PUT /:id/confirm — MANUALLY CONFIRM BOOKING (Admin/Sales)
// ⚠️ Must be declared BEFORE router.get('/:id') to avoid Express
//    treating "confirm" as an ObjectId for the :id param.
// ============================================
router.put('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail, adminId } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'confirmed' || booking.status === 'fully_paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already confirmed'
      });
    }

    // Set status based on payment type
    if (booking.paymentType === 'full') {
      booking.status = 'confirmed';
    } else if (booking.paymentType === 'partial') {
      booking.status = 'partial_paid';
    } else {
      booking.status = 'confirmed';
    }

    booking.updatedAt = new Date();
    await booking.save();

    console.log(`✅ Booking manually confirmed by admin: ${id}`);

    try {
      if (userEmail) {
        await ActivityLog.create({
          action: 'UPDATE',
          module: 'Bookings',
          user: userEmail,
          userId: adminId || null,
          severity: 'SUCCESS',
          description: `Manually confirmed booking: ${booking.packageName} (${booking.fullName})`,
          details: {
            recordTitle: `${booking.packageName} - ${booking.fullName}`,
            recordId: booking._id.toString(),
            method: 'PUT',
            endpoint: `/api/bookings/${id}/confirm`,
            newStatus: booking.status,
          },
        });
        console.log('✅ Activity Log saved for Manual Booking Confirmation');
      }
    } catch (logError) {
      console.error('⚠️ Failed to save activity log:', logError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: booking,
    });

  } catch (error) {
    console.error('❌ Error confirming booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
      error: error.message,
    });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('packageId')
      .populate('promoId')
      .populate({
        path: 'customizedInclusions.sellerRateId',
        model: 'SellerRate'
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const response = booking.toObject();
    if (booking.isCustomized) {
      response.customizationSummary = booking.getCustomizationSummary();
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ 
      message: 'Error fetching booking', 
      error: error.message 
    });
  }
});

router.post('/', upload.any(), async (req, res) => {
  res.locals.skipEncrypt = true;
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

  // ===== DETERMINE CREATOR =====
  const bookingToSave = {
    ...bookingData,
    createdByType: bookingData.createdByType || (bookingData.isWalkin ? 'sales' : 'user'),
    createdByEmail: bookingData.createdByEmail || (bookingData.isWalkin ? 'houston@wanderwaveph.com' : bookingData.email),
  };

  // ===== BOUNDARY CHECKS — Issue #2: Negative Value Injection =====
  // Reject any request where critical quantity fields are zero or negative.
  // An attacker sending matching negative numbers (e.g. totalAmount: -500,
  // initialPaymentAmount: -500) satisfies amountPaid >= totalAmount and flips
  // status to FULLY PAID. Hard-stopping here closes that vector entirely.
  const _pax = bookingData.pax || {};
  const totalPax =
    (Number(_pax.adult) || 0) +
    (Number(_pax.children) || 0) +
    (Number(_pax.infants) || 0);

  if (totalPax <= 0) {
    return res.status(400).json({ success: false, message: 'Booking must include at least one passenger.' });
  }

  const primaryPassengerDob = bookingData.passengers?.[0]?.dateOfBirth;
  const ageError = validatePrimaryPassengerAge(primaryPassengerDob);
  if (ageError) {
    return res.status(400).json({ success: false, message: ageError });
  }
  const passengersAgeError = validatePassengersAge(bookingData.passengers);
  if (passengersAgeError) {
    return res.status(400).json({ success: false, message: passengersAgeError });
  }

  if (bookingData.paymentType === 'partial') {
    const _ia = parseFloat(bookingData.initialPaymentAmount);
    if (!_ia || _ia <= 0) {
      return res.status(400).json({ success: false, message: 'initialPaymentAmount must be greater than zero.' });
    }
  }

  // ===== SERVER-SIDE PRICE COMPUTATION — Issue #1: Price Manipulation =====
  // The client is no longer trusted for any price figure. The authoritative
  // per-pax rate is fetched directly from the Package document and every price
  // field on bookingData is overwritten before the Booking document is built.
  if (bookingData.packageId) {
    const pkg = await Package.findById(bookingData.packageId);
    if (!pkg) {
      return res.status(400).json({ success: false, message: 'Package not found.' });
    }

    // Authoritative per-pax price: prefer admin-set solo/group overrides; fall
    // back to the markup-inclusive price computed by the Package pre-save hook.
    let serverPerPaxPrice;
    if (totalPax === 1 && pkg.soloPaxPrice != null && pkg.soloPaxPrice > 0) {
      serverPerPaxPrice = pkg.soloPaxPrice;
    } else if (totalPax > 1 && pkg.multiplePaxPrice != null && pkg.multiplePaxPrice > 0) {
      serverPerPaxPrice = pkg.multiplePaxPrice;
    } else {
      serverPerPaxPrice = pkg.price;
    }

    // Apply 10% timer-expired penalty when the client reports the countdown elapsed.
    // The client flag is trusted here because the penalty only ever INCREASES the
    // price — there is no way for a customer to gain a lower fare by faking it.
    if (bookingData.timerExpiredAtBooking === true) {
      serverPerPaxPrice = Math.round(serverPerPaxPrice * 1.10);
    }

    const serverPackageTotal    = serverPerPaxPrice * totalPax;
    // Floor all additive/subtractive adjustments at 0 so a crafted negative
    // discount cannot reduce the total below the correct base amount.
    const discountAmount        = Math.max(0, parseFloat(bookingData.discountAmount) || 0);
    const customizationExtra    = Math.max(0, parseFloat(bookingData.customizationAdditionalPrice) || 0);
    const airfareTotal          = Math.max(0, parseFloat(bookingData.airfareTotal) || 0);
    const computedTotal         = serverPackageTotal + customizationExtra + airfareTotal - discountAmount;

    if (computedTotal <= 0) {
      return res.status(400).json({ success: false, message: 'Computed booking total must be greater than zero.' });
    }

    // Overwrite every client-supplied price field with server-authoritative values.
    bookingData.sellerPrice                  = pkg.sellerPrice;
    bookingData.markup                       = pkg.markup;
    bookingData.price                        = serverPerPaxPrice;
    bookingData.originalPackagePrice         = serverPerPaxPrice;
    bookingData.packageTotal                 = serverPackageTotal;
    bookingData.finalPackageTotal            = serverPackageTotal - discountAmount;
    bookingData.customizationAdditionalPrice = customizationExtra;
    bookingData.airfareTotal                 = airfareTotal;
    bookingData.discountAmount               = discountAmount;
    bookingData.totalAmount                  = computedTotal;

    if (bookingData.paymentType === 'partial') {
      const _ia = parseFloat(bookingData.initialPaymentAmount);
      if (_ia >= computedTotal) {
        return res.status(400).json({ success: false, message: 'initialPaymentAmount must be less than totalAmount for partial payment.' });
      }
      bookingData.remainingBalance = computedTotal - _ia;
    } else {
      bookingData.initialPaymentAmount = computedTotal;
      bookingData.remainingBalance     = 0;
    }

    console.log(`✅ Server-computed price — perPax: ${serverPerPaxPrice}, packageTotal: ${serverPackageTotal}, computedTotal: ${computedTotal}`);
  } else {
    // Walk-in / manual booking — no package reference. The admin supplies the
    // total directly, but it must still pass the non-negative boundary check.
    const clientTotal = parseFloat(bookingData.totalAmount);
    if (!clientTotal || clientTotal <= 0) {
      return res.status(400).json({ success: false, message: 'totalAmount must be greater than zero.' });
    }
    if (bookingData.paymentType === 'partial') {
      const _ia = parseFloat(bookingData.initialPaymentAmount);
      if (!_ia || _ia <= 0 || _ia >= clientTotal) {
        return res.status(400).json({ success: false, message: 'initialPaymentAmount must be between zero and totalAmount.' });
      }
      bookingData.remainingBalance = clientTotal - _ia;
    }
  }

    // Promo validation
    if (bookingData.promoId) {
      console.log('🎟️ Validating promo code...');
      try {
        const promo = await Promo.findById(bookingData.promoId);
        
        if (!promo) {
          req.files?.forEach(file => {
            try { fs.unlinkSync(file.path); } catch (e) {}
          });
          return res.status(400).json({
            success: false,
            message: 'Promo code not found'
          });
        }

        if (!promo.isActive || promo.isArchive === 'Yes') {
          req.files?.forEach(file => {
            try { fs.unlinkSync(file.path); } catch (e) {}
          });
          return res.status(400).json({
            success: false,
            message: 'This promo code is no longer active'
          });
        }

        const today = new Date();
        if (today > new Date(promo.validUntil)) {
          req.files?.forEach(file => {
            try { fs.unlinkSync(file.path); } catch (e) {}
          });
          return res.status(400).json({
            success: false,
            message: 'This promo code has expired'
          });
        }

        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
          req.files?.forEach(file => {
            try { fs.unlinkSync(file.path); } catch (e) {}
          });
          return res.status(400).json({
            success: false,
            message: 'This promo code has reached its usage limit and is no longer available'
          });
        }

        console.log(`✅ Promo code validated: ${promo.code} (${promo.usedCount}/${promo.usageLimit || '∞'} used)`);
      } catch (promoError) {
        console.error('❌ Promo validation error:', promoError);
        req.files?.forEach(file => {
          try { fs.unlinkSync(file.path); } catch (e) {}
        });
        return res.status(500).json({
          success: false,
          message: 'Failed to validate promo code',
          error: promoError.message
        });
      }
    }

    // ✅ HANDLE WALK-IN BOOKINGS
    let passengers = [];
    
    if (bookingData.isWalkin) {
      console.log('🏢 Processing walk-in booking');

      const rawWalkinPassengers = bookingData.passengers || [];
      console.log('📥 Walk-in raw passengers received:', rawWalkinPassengers.length);
      if (rawWalkinPassengers.length > 0) {
        console.log(`📋 Walk-in: using ${rawWalkinPassengers.length} actual passenger(s) from form`);

        for (let index = 0; index < rawWalkinPassengers.length; index++) {
          const p = rawWalkinPassengers[index];
          const passenger = {
            passengerNumber: p.passengerNumber || index + 1,
            firstName: p.firstName || 'Walk-in',
            lastName: p.lastName || 'Customer',
            email: p.email && p.email.trim() !== '' ? p.email.trim() : null,
            phone: p.phone || '0000000000',
            dateOfBirth: p.dateOfBirth || '2000-01-01',
            age: parseInt(p.age) || 0,
            gender: p.gender || 'Not Specified',
            address: p.address || 'Walk-in',
            nationality: p.nationality || 'Filipino'
          };

          await attachPassengerDocuments(passenger, index, req.files);

          passengers.push(passenger);
        }

        console.log(`✅ Walk-in: ${passengers.length} passenger(s) processed from form`);
      } else {
        passengers = [{
          passengerNumber: 1,
          firstName: bookingData.fullName?.split(' ')[0] || 'Walk-in',
          lastName: bookingData.fullName?.split(' ').slice(1).join(' ') || 'Customer',
          email: bookingData.email && bookingData.email.trim() !== '' ? bookingData.email.trim() : null,
          phone: bookingData.primaryContact?.phone || '0000000000',
          dateOfBirth: '2000-01-01',
          age: 0,
          gender: 'Not Specified',
          address: bookingData.primaryContact?.address || 'Walk-in',
          nationality: 'Filipino'
        }];

        console.log(`✅ Walk-in: placeholder passenger created (no form passengers provided)`);
      }
    } else {
      // ✅ REGULAR BOOKING
      const rawPassengers = bookingData.passengers || []; 
      const totalExpectedPassengers = bookingData.pax?.adult || 1;

      if (rawPassengers.length === 0) {
          console.error(`❌ Embedded passenger array is empty for regular booking.`);
          req.files?.forEach(file => {
            try { fs.unlinkSync(file.path); } catch (e) {}
          });
          return res.status(400).json({
            success: false,
            message: 'No passenger data provided. Regular bookings require complete passenger information.'
          });
      }

      console.log(`📋 Processing ${rawPassengers.length} passengers for regular booking...`);

      for (let index = 0; index < rawPassengers.length; index++) {
        const passengerData = rawPassengers[index];
          if (index === 0 && (!passengerData.firstName || !passengerData.lastName ||
               !passengerData.phone ||
              !passengerData.dateOfBirth)) {
              req.files?.forEach(file => { try { fs.unlinkSync(file.path); } catch (e) {} });
              return res.status(400).json({
                success: false,
                message: `Primary passenger is missing required fields (firstName, lastName, phone, or dateOfBirth). Please complete the primary passenger details.`
              });
          }

          const passenger = {
              passengerNumber: passengerData.passengerNumber || index + 1,
              firstName: passengerData.firstName,
              lastName: passengerData.lastName,
              email: passengerData.email && passengerData.email.trim() !== '' ? passengerData.email.trim() : null,
              phone: passengerData.phone,
              dateOfBirth: passengerData.dateOfBirth,
              age: parseInt(passengerData.age) || 0,
              gender: passengerData.gender || '',
              address: passengerData.address || '',
              nationality: passengerData.nationality || 'Filipino'
          };

          await attachPassengerDocuments(passenger, index, req.files);

          passengers.push(passenger);
      }

      if (passengers.length === 0) {
          req.files?.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (e) {}
          });
          console.error(`❌ No passengers found for regular booking`);
          return res.status(400).json({
            success: false,
            message: `No passenger details were received. Please complete the primary passenger details.`,
          });
      }

      console.log(`✅ Successfully processed ${passengers.length} passengers for regular booking`);
    }

    // ===== PROOF IMAGES — upload to Cloudinary, then discard local temp files =====
    // Capped at one per passenger — re-enforced here in case a tampered request
    // tries to attach more than the frontend's limit.
    const proofImagesData = [];
    const proofImageFiles = (req.files || [])
      .filter(f => f.fieldname.startsWith('proofImage_'))
      .slice(0, passengers.length);

    for (const proofImageFile of proofImageFiles) {
      try {
        const result = await cloudinary.uploader.upload(proofImageFile.path, {
          folder: 'wanderwave/bookings',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }]
        });
        proofImagesData.push({
          filename: result.public_id,
          originalName: proofImageFile.originalname,
          path: result.secure_url,
          size: proofImageFile.size
        });
        console.log(`🖼️ Proof image uploaded to Cloudinary: ${result.secure_url}`);
      } catch (uploadErr) {
        console.error('❌ Failed to upload proof image to Cloudinary:', uploadErr.message);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload one of the proof images. Please try again.'
        });
      } finally {
        try { fs.unlinkSync(proofImageFile.path); } catch (e) {}
      }
    }

    const primaryEmail = bookingData.email || bookingData.primaryContact?.email || passengers[0]?.email;
    const primaryName = bookingData.fullName || bookingData.primaryContact?.fullName || 
                       `${passengers[0]?.firstName} ${passengers[0]?.lastName}`;
    
    let existingUser = await User.findOne({ email: primaryEmail });
    let isNewUser = false;
    let tempPassword = null;

    if (!bookingData.isWalkin) {
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
          let packageData = null;
          if (bookingData.packageId) {
            try {
              packageData = await Package.findById(bookingData.packageId).lean();
              console.log('📦 packageData for GHL:', packageData ? `id=${packageData._id} title=${packageData.title} image=${packageData.image}` : 'NULL — not found');
            } catch (pkgErr) {
              console.warn('⚠️ Package lookup for GHL failed (non-fatal):', pkgErr.message);
            }
          }
          await sendBookingConfirmationToGHL(
            primaryEmail,
            primaryName,
            bookingData.packageName,
            bookingData.totalAmount,
            bookingData.startDate,
            bookingData.endDate,
            passengers.length,
            packageData,
            bookingData
          );
          console.log('✅ Booking confirmation email sent');
        } catch (e) {
          console.error('❌ GHL Booking Email Error:', e);
        }
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

    // ── Add-on summary is logged after sanitizedAddOns is built below ──

    // ✅ SANITIZE CUSTOMIZED INCLUSIONS
    let sanitizedCustomizedInclusions = [];
    if (bookingData.customizedInclusions && Array.isArray(bookingData.customizedInclusions)) {
      sanitizedCustomizedInclusions = bookingData.customizedInclusions.map(inclusion => {
        if (!inclusion.source) {
          if (inclusion.sellerRateId || inclusion.supplier) {
            inclusion.source = 'seller-rate';
          } else {
            inclusion.source = 'package';
          }
        }
        
        return {
          id: inclusion.id || `inc-${Date.now()}-${Math.random()}`,
          name: inclusion.name || 'Unknown Inclusion',
          price: inclusion.price || 0,
          supplierRate: inclusion.supplierRate || null,
          markup: inclusion.markup || null,
          markupType: inclusion.markupType || null,
          supplier: inclusion.supplier || null,
          destination: inclusion.destination || null,
          pax: inclusion.pax || null,
          notes: inclusion.notes || null,
          isOriginal: inclusion.isOriginal !== undefined ? inclusion.isOriginal : false,
          isChecked: inclusion.isChecked !== undefined ? inclusion.isChecked : true,
          source: inclusion.source,
          sellerRateId: inclusion.sellerRateId || null
        };
      });
      
      console.log(`✅ Sanitized ${sanitizedCustomizedInclusions.length} customized inclusions`);
    }

    // ── SANITIZE ADD-ONS (tours + transfers) ──────────────────────────────
    let sanitizedAddOns = { tours: [], transfers: [], addOnsTotal: 0 };

    if (bookingData.addOns && typeof bookingData.addOns === 'object') {
      const raw = bookingData.addOns;

      // Tours
      if (Array.isArray(raw.tours)) {
        sanitizedAddOns.tours = raw.tours.map(t => ({
          tourId:      t.tourId      || null,
          title:       t.title       || '',
          destination: t.destination || '',
          duration:    t.duration    || '',
          category:    t.category    || '',
          image:       t.image       || null,
          price:       parseFloat(t.price)       || 0,
          sellerPrice: parseFloat(t.sellerPrice) || 0,
          paxCount:    parseInt(t.paxCount)      || 1,
          subtotal:    parseFloat(t.subtotal)    || 0,
        }));
      }

      // Transfers
      if (Array.isArray(raw.transfers)) {
        sanitizedAddOns.transfers = raw.transfers.map(t => ({
          transferId:      t.transferId      || null,
          title:           t.title           || '',
          category:        t.category        || '',
          imageUrl:        t.imageUrl        || null,
          transferType:    ['oneway', 'roundtrip'].includes(t.transferType) ? t.transferType : 'oneway',
          oneWayPrice:     parseFloat(t.oneWayPrice)    || 0,
          roundtripPrice:  parseFloat(t.roundtripPrice) || 0,
          selectedPrice:   parseFloat(t.selectedPrice)  || 0,
          subtotal:        parseFloat(t.subtotal)        || 0,
          // Pre-filled from booking context
          travelDate:      t.travelDate      || '',
          returnDate:      t.returnDate      || '',
          destination:     t.destination     || '',
          passengerCount:  parseInt(t.passengerCount) || 1,
          fullName:        t.fullName        || '',
          email:           t.email           || '',
          // From Transfer Details Modal
          arrivalTime:     t.arrivalTime     || '',
          departureTime:   t.departureTime   || '',
          pickupLocation:  t.pickupLocation  || '',
          dropoffLocation: t.dropoffLocation || '',
          message:         t.message         || '',
        }));
      }

      sanitizedAddOns.addOnsTotal = parseFloat(raw.addOnsTotal) || 0;

      console.log(
        `✅ Sanitized add-ons — tours: ${sanitizedAddOns.tours.length}, ` +
        `transfers: ${sanitizedAddOns.transfers.length}, ` +
        `total: ₱${sanitizedAddOns.addOnsTotal.toLocaleString()}`
      );
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── Now safe to log the full booking summary ───────────────────────
    console.log('📊 Creating booking with:');
    console.log('  - Primary Contact:', primaryName, primaryEmail);
    console.log('  - Passengers:', passengers.length);
    console.log('  - Walk-in:', bookingData.isWalkin || false);
    console.log('  - Promo:', bookingData.promoCode || 'None');
    console.log('  - Total Amount:', bookingData.totalAmount);
    console.log('  - Add-On Tours:', sanitizedAddOns.tours.length);
    console.log('  - Add-On Transfers:', sanitizedAddOns.transfers.length);
    console.log('  - Add-Ons Total: ₱', sanitizedAddOns.addOnsTotal);

    // ✅ ITINERARY + INCLUSIONS SNAPSHOT
    let bookingItinerary = [];
    let bookingInclusions = [];

    try {
      let pkgSnapshot = null;

      if (bookingData.packageId) {
        pkgSnapshot = await Package.findById(bookingData.packageId)
          .select('itinerary inclusions title')
          .lean();
        console.log(`🔍 Package lookup by ID (${bookingData.packageId}): ${pkgSnapshot ? 'FOUND' : 'NOT FOUND'}`);
      }

      if (!pkgSnapshot && bookingData.packageName) {
        pkgSnapshot = await Package.findOne({ title: bookingData.packageName })
          .select('itinerary inclusions title')
          .lean();
        console.log(`🔍 Package lookup by exact title ("${bookingData.packageName}"): ${pkgSnapshot ? 'FOUND' : 'NOT FOUND'}`);
      }

      if (!pkgSnapshot && bookingData.packageName) {
        pkgSnapshot = await Package.findOne({
          title: { $regex: new RegExp(`^${bookingData.packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        })
          .select('itinerary inclusions title')
          .lean();
        console.log(`🔍 Package lookup by case-insensitive title ("${bookingData.packageName}"): ${pkgSnapshot ? 'FOUND' : 'NOT FOUND'}`);
      }

      if (!pkgSnapshot && bookingData.packageName) {
        const coreTitle = bookingData.packageName
          .replace(/\s*\(solo\)\s*/gi, '')
          .replace(/\s*\(group\)\s*/gi, '')
          .replace(/\s*\(pax.*?\)\s*/gi, '')
          .replace(/\s*\(joiner.*?\)\s*/gi, '')
          .replace(/\s*\(private.*?\)\s*/gi, '')
          .trim();

        if (coreTitle && coreTitle !== bookingData.packageName) {
          pkgSnapshot = await Package.findOne({
            title: { $regex: new RegExp(coreTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
          })
            .select('itinerary inclusions title')
            .lean();
          console.log(`🔍 Package lookup by stripped title ("${coreTitle}"): ${pkgSnapshot ? 'FOUND' : 'NOT FOUND'}`);
        }
      }

      if (!pkgSnapshot && bookingData.packageName) {
        const firstSegment = bookingData.packageName.split('(')[0].trim();
        if (firstSegment && firstSegment.length >= 4) {
          pkgSnapshot = await Package.findOne({
            title: { $regex: new RegExp(firstSegment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
          })
            .select('itinerary inclusions title')
            .lean();
          console.log(`🔍 Package lookup by first segment ("${firstSegment}"): ${pkgSnapshot ? 'FOUND' : 'NOT FOUND'}`);
        }
      }

      if (pkgSnapshot) {
        const rawItinerary = pkgSnapshot.itinerary && pkgSnapshot.itinerary.length > 0
          ? pkgSnapshot.itinerary
          : (bookingData.itinerary || []);
        bookingItinerary = rawItinerary.map(({ day, title, activities }) => ({ day, title, activities }));

        bookingInclusions = pkgSnapshot.inclusions && pkgSnapshot.inclusions.length > 0
          ? pkgSnapshot.inclusions
          : (bookingData.originalInclusions || bookingData.inclusions || []);
        console.log(`✅ Snapshot from "${pkgSnapshot.title}" — itinerary: ${bookingItinerary.length} day(s), inclusions: ${bookingInclusions.length} item(s)`);
      } else {
        bookingItinerary = (bookingData.itinerary || []).map(item => ({
          day: item.day,
          title: item.title,
          activities: item.activities || []
        }));
        bookingInclusions = bookingData.originalInclusions || bookingData.inclusions || [];
        console.warn(`⚠️ No matching package found in DB for "${bookingData.packageName}" — itinerary: ${bookingItinerary.length}, inclusions: ${bookingInclusions.length}`);
      }
    } catch (snapshotErr) {
      console.warn('⚠️ Package snapshot fetch failed (non-fatal):', snapshotErr.message);
      bookingItinerary = (bookingData.itinerary || []).map(item => ({
        day: item.day,
        title: item.title,
        activities: item.activities || []
      }));
      bookingInclusions = bookingData.originalInclusions || bookingData.inclusions || [];
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
      timerExpiredAtBooking: bookingData.timerExpiredAtBooking || false,
      priceType: bookingData.priceType || 'discounted',
      originalPackagePrice: bookingData.originalPackagePrice || bookingData.price || 0,
      appliedMarkup: bookingData.appliedMarkup || 0,
      isCustomized: bookingData.isCustomized || false,
      customizedInclusions: sanitizedCustomizedInclusions,
      customizationAdditionalPrice: bookingData.customizationAdditionalPrice || 0,
      originalInclusions: bookingInclusions,
      itinerary: bookingItinerary,
      includesAirfare: bookingData.includesAirfare || false,
      flightDetails: flightDetailsObject, 
      airfareTotal: bookingData.airfareTotal || 0,
      totalAmount: bookingData.totalAmount,
      paymentType: bookingData.paymentType || 'full',
      initialPaymentAmount: bookingData.initialPaymentAmount || bookingData.totalAmount,
      remainingBalance: bookingData.remainingBalance || 0,
      balancePaidAmount: 0,
      fullName: primaryName,
      email: primaryEmail,
      message: bookingData.message || '',
      proofImages: proofImagesData,
      passengers: passengers,
      status: 'pending',
      createdAt: new Date(),
      promoCode: bookingData.promoCode || null,
      promoId: bookingData.promoId || null,
      discountAmount: bookingData.discountAmount || 0,
      finalPackageTotal: bookingData.finalPackageTotal || bookingData.totalAmount,
      isWalkin: bookingData.isWalkin || false,
      appointmentDate: bookingData.appointmentDate || null,
      appointmentTime: bookingData.appointmentTime || null,
      createdByType: bookingData.createdByType || (bookingData.isWalkin === true ? 'sales' : 'user'),
      createdByEmail: bookingData.createdByEmail || (bookingData.isWalkin === true
        ? 'houston@wanderwaveph.com'
        : bookingData.email),

      // ── Add-Ons ────────────────────────────────────────────────────────
      addOns: sanitizedAddOns,
    });

    console.log('💾 Saving booking to database...');
    await newBooking.save();

    console.log(`💰 Booking saved successfully! ID: ${newBooking._id}`);

    // Fire the booking automation webhook for walk-in/sales bookings —
    // both partial and full payment — fire-and-forget, never blocks the response.
    if (bookingData.isWalkin) {
      sendPackageBookingToGHL(newBooking).catch((err) =>
        console.error('⚠️ GHL package booking webhook failed (non-fatal):', err.message)
      );
    }

    try {
        const userEmail = bookingData.userEmail || bookingData.adminEmail || 'System';
        const adminId = bookingData.adminId || null;

        await ActivityLog.create({
            action: 'CREATE',
            module: 'Bookings',
            user: userEmail,
            userId: adminId,
            description: `Created new ${bookingData.isWalkin ? 'walk-in ' : ''}booking: ${bookingData.packageName} for ${primaryName}`,
            severity: 'SUCCESS',
            details: {
                recordTitle: `${bookingData.packageName} - ${primaryName}`,
                recordId: newBooking._id.toString(),
                method: 'POST',
                totalAmount: bookingData.totalAmount,
                passengers: passengers.length,
                includesAirfare: bookingData.includesAirfare || false,
                isWalkin: bookingData.isWalkin || false,
                addOnTours: sanitizedAddOns.tours.length,
                addOnTransfers: sanitizedAddOns.transfers.length,
                addOnsTotal: sanitizedAddOns.addOnsTotal,
            }
        });
        console.log('✅ Activity Log saved');
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }

    res.json({
      success: true,
      message: bookingData.isWalkin
        ? 'Walk-in appointment created successfully.'
        : 'Booking saved successfully. Proceed to payment link generation.',
      isNewUser: isNewUser,
      bookingId: newBooking._id,
      data: stripInternal(newBooking.toObject()),
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

router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      status,
      email,
      referenceNumber,
      isArchive,
      isCustomized,
      startDate,
      endDate
    } = req.query;

    let filter = {};

    if (status) filter.status = status;
    if (email) filter.email = { $regex: email, $options: 'i' };
    if (referenceNumber) filter.referenceNumber = { $regex: referenceNumber, $options: 'i' };
    if (isArchive) filter.isArchive = isArchive;
    if (isCustomized !== undefined) filter.isCustomized = isCustomized === 'true';
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(filter)
      .populate('packageId')
      .populate('promoId')
      .sort({ createdAt: -1 });

    const bookingsWithSummary = bookings.map(booking => {
      const bookingObj = booking.toObject();
      if (booking.isCustomized) {
        bookingObj.customizationSummary = booking.getCustomizationSummary();
      }
      return bookingObj;
    });

    res.json(bookingsWithSummary);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      message: 'Error fetching bookings', 
      error: error.message 
    });
  }
});

// ============================================
// GET CUSTOMIZATION STATISTICS
// ============================================
router.get('/stats/customization', authMiddleware, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ isArchive: 'No' });
    const customizedBookings = await Booking.countDocuments({ 
      isCustomized: true, 
      isArchive: 'No' 
    });

    const customizationRate = totalBookings > 0 
      ? ((customizedBookings / totalBookings) * 100).toFixed(2) 
      : 0;

    const customizationRevenue = await Booking.aggregate([
      { 
        $match: { 
          isCustomized: true, 
          isArchive: 'No',
          status: { $in: ['confirmed', 'fully_paid'] }
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$customizationAdditionalPrice' },
          avgAdditionalPrice: { $avg: '$customizationAdditionalPrice' },
          count: { $sum: 1 }
        }
      }
    ]);

    const popularInclusions = await Booking.aggregate([
      { $match: { isCustomized: true, isArchive: 'No' } },
      { $unwind: '$customizedInclusions' },
      { 
        $match: { 
          'customizedInclusions.isOriginal': false,
          'customizedInclusions.isChecked': true
        }
      },
      {
        $group: {
          _id: '$customizedInclusions.name',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$customizedInclusions.price' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        totalBookings,
        customizedBookings,
        customizationRate: parseFloat(customizationRate),
        revenue: customizationRevenue[0] || {
          totalRevenue: 0,
          avgAdditionalPrice: 0,
          count: 0
        },
        popularInclusions
      }
    });

  } catch (error) {
    console.error('Error fetching customization stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching customization statistics',
      error: error.message 
    });
  }
});

router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
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
    booking.cancelledAt = new Date();
    await booking.save();

    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Bookings',
                user: userEmail,
                userId: adminId || null,
                description: `Cancelled booking: ${booking.packageName} (${booking.fullName})`,
                severity: 'WARNING',
                details: {
                    recordTitle: `${booking.packageName} - ${booking.fullName}`,
                    recordId: booking._id.toString(),
                    method: 'POST',
                    previousStatus: 'pending/confirmed',
                    newStatus: 'cancelled'
                }
            });
            console.log('✅ Activity Log saved for Cancel Booking');
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

router.post('/:id/confirm-payment', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;
    
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'confirmed' || booking.status === 'fully_paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already confirmed'
      });
    }

    if (booking.paymentType === 'full') {
      booking.status = 'confirmed';
      booking.paidAt = new Date();
      booking.paymentId = paymentId;
    } 
    else if (booking.paymentType === 'partial') {
      booking.status = 'partial_paid';
      booking.paidAt = new Date();
      booking.initialPaymentId = paymentId;
    }

    booking.updatedAt = new Date();
    await booking.save();

    console.log(`✅ Payment confirmed for booking ${id}`);

    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Bookings',
                user: userEmail,
                userId: adminId || null,
                description: `Payment confirmed for booking: ${booking.packageName} (${booking.fullName})`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: `${booking.packageName} - ${booking.fullName}`,
                    recordId: booking._id.toString(),
                    method: 'POST',
                    paymentType: booking.paymentType,
                    amount: booking.paymentType === 'full' ? booking.totalAmount : booking.initialPaymentAmount,
                    paymentId: paymentId
                }
            });
            console.log('✅ Activity Log saved for Payment Confirmation');
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }

    res.json({
      success: true,
      message: booking.paymentType === 'full' 
        ? 'Payment confirmed successfully' 
        : 'Initial payment confirmed successfully',
      booking: booking
    });

  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

router.post('/:id/create-balance-payment', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.paymentType !== 'partial') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not set for partial payment'
      });
    }

    if (booking.isFullyPaid()) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already fully paid'
      });
    }

    const paymentResponse = await axios.post('https://wanderwaveph.onrender.com/api/payment/create-balance-intent', {
      bookingId: booking._id,
      amount: booking.remainingBalance
    });

    if (paymentResponse.data.success && paymentResponse.data.checkoutUrl) {
      booking.balancePaymentLinkId = paymentResponse.data.paymentLinkId;
      await booking.save();

      res.json({
        success: true,
        checkoutUrl: paymentResponse.data.checkoutUrl,
        paymentLinkId: paymentResponse.data.paymentLinkId,
        amount: booking.remainingBalance
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create payment link'
      });
    }

  } catch (error) {
    console.error('❌ Error creating balance payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create balance payment link',
      error: error.message
    });
  }
});

router.put('/:id/confirm-balance-payment', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;
    
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.isFullyPaid()) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already fully paid'
      });
    }

    booking.balancePaidAmount = booking.remainingBalance;
    booking.remainingBalance = 0;
    booking.balancePaymentId = paymentId;
    booking.balancePaidAt = new Date();
    booking.status = 'fully_paid';
    booking.updatedAt = new Date();

    await booking.save();

    console.log(`✅ Balance payment confirmed for booking ${id}`);

    try {
        const { userEmail, adminId } = req.body;
        if (userEmail) {
            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Bookings',
                user: userEmail,
                userId: adminId || null,
                description: `Balance payment confirmed for booking: ${booking.packageName} (${booking.fullName})`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: `${booking.packageName} - ${booking.fullName}`,
                    recordId: booking._id.toString(),
                    method: 'PUT',
                    balancePaid: booking.balancePaidAmount,
                    paymentType: 'Balance Payment'
                }
            });
            console.log('✅ Activity Log saved for Balance Payment Confirmation');
        }
    } catch (logError) {
        console.error('⚠️ Failed to save activity log:', logError.message);
    }

    res.json({
      success: true,
      message: 'Balance payment confirmed successfully',
      booking: booking
    });

  } catch (error) {
    console.error('❌ Error confirming balance payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm balance payment',
      error: error.message
    });
  }
});

router.get('/pending-balance/all', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      paymentType: 'partial',
      remainingBalance: { $gt: 0 },
      status: 'partial_paid',
      isArchive: 'No'
    }).sort({ createdAt: -1 });

    const bookingsWithBalance = bookings.map(booking => ({
      _id: booking._id,
      packageName: booking.packageName,
      fullName: booking.fullName,
      email: booking.email,
      totalAmount: booking.totalAmount,
      initialPaymentAmount: booking.initialPaymentAmount,
      remainingBalance: booking.remainingBalance,
      startDate: booking.startDate,
      createdAt: booking.createdAt,
      paidAt: booking.paidAt
    }));

    res.json({
      success: true,
      count: bookingsWithBalance.length,
      bookings: bookingsWithBalance
    });

  } catch (error) {
    console.error('❌ Error fetching pending balance bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings with pending balance'
    });
  }
});

router.patch('/:id/customization', authMiddleware, async (req, res) => {
  try {
    const { customizedInclusions, customizationAdditionalPrice } = req.body;

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const prevTotalAmount   = booking.totalAmount;
    const prevRemaining     = booking.remainingBalance;
    const prevCustomization = booking.customizationAdditionalPrice;

    const oldCustomization = booking.customizationAdditionalPrice || 0;
    const baseAmount       = booking.totalAmount - oldCustomization;

    const newCustomizationPrice = Number(customizationAdditionalPrice) || 0;
    const newTotalAmount        = baseAmount + newCustomizationPrice;

    let newRemainingBalance = booking.remainingBalance;

    if (booking.paymentType === 'partial') {
      const totalAlreadyPaid =
        (booking.initialPaymentAmount || 0) +
        (booking.balancePaidAmount    || 0);

      newRemainingBalance = Math.max(0, newTotalAmount - totalAlreadyPaid);
    }

    booking.customizedInclusions          = customizedInclusions;
    booking.customizationAdditionalPrice  = newCustomizationPrice;
    booking.isCustomized                  = true;
    booking.totalAmount                   = newTotalAmount;
    booking.finalPackageTotal             = newTotalAmount;
    booking.packageTotal                  = (booking.packageTotal || 0) +
                                            (newCustomizationPrice - oldCustomization);
    booking.remainingBalance              = newRemainingBalance;
    booking.updatedAt                     = new Date();

    await booking.save();
    await booking.populate('packageId');

    let responseBooking = booking.toObject ? booking.toObject() : booking;
    if (!responseBooking.packageId?.destination && responseBooking.packageName) {
      try {
        const fallbackPkg = await Package.findOne(
          { title: responseBooking.packageName },
          'title destination inclusions tourType minPax duration'
        ).lean();
        if (fallbackPkg?.destination) {
          responseBooking = {
            ...responseBooking,
            packageId: {
              _id:         fallbackPkg._id,
              title:       fallbackPkg.title,
              destination: fallbackPkg.destination,
              inclusions:  fallbackPkg.inclusions || [],
              tourType:    fallbackPkg.tourType,
              minPax:      fallbackPkg.minPax,
              duration:    fallbackPkg.duration,
            },
          };
        }
      } catch (pkgErr) {
        console.warn('⚠️ Package fallback lookup failed (non-fatal):', pkgErr.message);
      }
    }

    try {
      const priceDelta = newTotalAmount - prevTotalAmount;
      const sign       = priceDelta >= 0 ? '+' : '';

      await ActivityLog.create({
        action:   'UPDATE',
        module:   'Bookings',
        severity: 'SUCCESS',
        user:     booking.email || 'User',
        description: `Package inclusions customized for booking: ${booking.packageName} (${booking.fullName}). ` +
          `Total changed from ₱${prevTotalAmount.toLocaleString()} → ₱${newTotalAmount.toLocaleString()} (${sign}₱${Math.abs(priceDelta).toLocaleString()}). ` +
          (booking.paymentType === 'partial'
            ? `Remaining balance updated: ₱${prevRemaining.toLocaleString()} → ₱${newRemainingBalance.toLocaleString()}.`
            : ''),
        details: {
          recordTitle:              `${booking.packageName} - ${booking.fullName}`,
          recordId:                 booking._id.toString(),
          method:                   'PATCH',
          endpoint:                 `/api/bookings/${booking._id}/customization`,
          prevTotalAmount,
          newTotalAmount,
          prevRemainingBalance:     prevRemaining,
          newRemainingBalance,
          prevCustomizationPrice:   prevCustomization,
          newCustomizationPrice,
          paymentType:              booking.paymentType,
          initialPaymentAmount:     booking.initialPaymentAmount,
          balancePaidAmount:        booking.balancePaidAmount || 0,
        },
      });
      console.log('✅ Activity log saved for customization update');
    } catch (logErr) {
      console.error('⚠️ Failed to log customization activity:', logErr.message);
    }

    console.log(
      `✅ Customization saved — booking ${booking._id}` +
      ` | total: ₱${prevTotalAmount} → ₱${newTotalAmount}` +
      (booking.paymentType === 'partial'
        ? ` | balance: ₱${prevRemaining} → ₱${newRemainingBalance}`
        : '')
    );

    res.json({
      message: 'Booking customization updated successfully',
      booking: responseBooking,
      summary: {
        prevTotalAmount,
        newTotalAmount,
        customizationAdditionalPrice: newCustomizationPrice,
        remainingBalance:             newRemainingBalance,
        paymentType:                  booking.paymentType,
      },
    });

  } catch (error) {
    console.error('Error updating booking customization:', error);
    res.status(400).json({ 
      message: 'Error updating customization', 
      error: error.message 
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Whitelist of fields an admin is permitted to overwrite
    const ALLOWED_UPDATE_FIELDS = [
      'status', 'paymentStatus', 'notes', 'appointmentDate', 'appointmentTime',
      'hotelName', 'selectedRoomType', 'numberOfRooms', 'startDate', 'endDate',
      'duration', 'pax', 'packageName', 'isArchive'
    ];
    ALLOWED_UPDATE_FIELDS.forEach(f => {
      if (req.body[f] !== undefined) booking[f] = req.body[f];
    });
    booking.updatedAt = new Date();
    await booking.save();

    res.json({ success: true, message: 'Booking updated successfully', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /:id/details — UPDATE BOOKING DETAILS
// ─────────────────────────────────────────────────────────────
router.patch('/:id/details', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      packageName,
      duration,
      startDate,
      endDate,
      pax,
      userEmail,
      adminId,
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ status: 'error', error: 'Booking not found' });
    }

    const updateData = {};
    const changedFields = [];

    if (packageName !== undefined && packageName !== booking.packageName) {
      updateData.packageName = packageName.trim();
      changedFields.push(`Package Name: "${booking.packageName}" → "${packageName.trim()}"`);
    }

    if (duration !== undefined && duration !== booking.duration) {
      updateData.duration = duration.trim();
      changedFields.push(`Duration: "${booking.duration}" → "${duration.trim()}"`);
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
      changedFields.push('Start Date updated');
    }

    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
      changedFields.push('End Date updated');
    }

    if (pax !== undefined && typeof pax === 'object') {
      updateData.pax = {
        adult:    Number(pax.adult)    || 0,
        children: Number(pax.children) || 0,
        infants:  Number(pax.infants)  || 0,
      };
      changedFields.push('Pax updated');
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        status: 'ok',
        message: 'No changes detected',
        booking,
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: false }
    ).populate('packageId');

    let responseBookingDetails = updatedBooking.toObject ? updatedBooking.toObject() : updatedBooking;
    if (!responseBookingDetails.packageId?.destination && responseBookingDetails.packageName) {
      try {
        const fallbackPkg = await Package.findOne(
          { title: responseBookingDetails.packageName },
          'title destination inclusions tourType minPax duration'
        ).lean();
        if (fallbackPkg?.destination) {
          responseBookingDetails = {
            ...responseBookingDetails,
            packageId: {
              _id:         fallbackPkg._id,
              title:       fallbackPkg.title,
              destination: fallbackPkg.destination,
              inclusions:  fallbackPkg.inclusions || [],
              tourType:    fallbackPkg.tourType,
              minPax:      fallbackPkg.minPax,
              duration:    fallbackPkg.duration,
            },
          };
        }
      } catch (pkgErr) {
        console.warn('⚠️ Package fallback lookup failed (non-fatal):', pkgErr.message);
      }
    }

    try {
      if (userEmail) {
        await ActivityLog.create({
          action: 'UPDATE',
          module: 'Bookings',
          user: userEmail,
          userId: adminId || null,
          severity: 'SUCCESS',
          description: `Updated booking details for: ${updatedBooking.packageName} (${updatedBooking.fullName})${
            changedFields.length ? '. Changes: ' + changedFields.join(', ') : ''
          }`,
          details: {
            recordTitle: `${updatedBooking.packageName} - ${updatedBooking.fullName}`,
            recordId: updatedBooking._id.toString(),
            method: 'PATCH',
            endpoint: `/api/bookings/${id}/details`,
          },
        });
        console.log('✅ Activity Log saved for Update Booking Details');
      }
    } catch (logError) {
      console.error('⚠️ Failed to save activity log:', logError.message);
    }

    console.log(`✅ Booking details updated: ${id} — ${changedFields.join(', ') || 'no changes'}`);

    return res.status(200).json({
      status: 'ok',
      message: 'Booking details updated successfully',
      booking: responseBookingDetails,
    });

  } catch (err) {
    console.error('❌ Error updating booking details:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /:id/hotel — UPDATE HOTEL SELECTION FROM USER DASHBOARD
// ─────────────────────────────────────────────────────────────
router.patch('/:id/hotel', verifyUserJWT, async (req, res) => {
  res.locals.skipEncrypt = true;
  try {
    const { id } = req.params;
    const { selectedRoomType, hotelName, numberOfRooms } = req.body;

    if (!selectedRoomType) {
      return res.status(400).json({ status: 'error', error: 'selectedRoomType is required' });
    }

    // Verify booking ownership before allowing update
    const existing = await Booking.findById(id).select('email').lean();
    if (!existing) {
      return res.status(404).json({ status: 'error', error: 'Booking not found' });
    }
    if (existing.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ status: 'error', error: 'Access denied.' });
    }

    const updateData = {
      selectedRoomType,
      ...(hotelName     !== undefined && { hotelName }),
      ...(numberOfRooms !== undefined && { numberOfRooms }),
    };

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: false }
    ).populate('packageId');

    if (!updatedBooking) {
      return res.status(404).json({ status: 'error', error: 'Booking not found' });
    }

    let responseBookingHotel = updatedBooking.toObject ? updatedBooking.toObject() : updatedBooking;
    if (!responseBookingHotel.packageId?.destination && responseBookingHotel.packageName) {
      try {
        const fallbackPkg = await Package.findOne(
          { title: responseBookingHotel.packageName },
          'title destination inclusions tourType minPax duration'
        ).lean();
        if (fallbackPkg?.destination) {
          responseBookingHotel = {
            ...responseBookingHotel,
            packageId: {
              _id:         fallbackPkg._id,
              title:       fallbackPkg.title,
              destination: fallbackPkg.destination,
              inclusions:  fallbackPkg.inclusions || [],
              tourType:    fallbackPkg.tourType,
              minPax:      fallbackPkg.minPax,
              duration:    fallbackPkg.duration,
            },
          };
        }
      } catch (pkgErr) {
        console.warn('⚠️ Package fallback lookup failed (non-fatal):', pkgErr.message);
      }
    }

    console.log(`✅ Hotel selection updated — booking ${id}: ${selectedRoomType} @ ${hotelName || 'N/A'}`);

    return res.status(200).json({
      status: 'ok',
      message: 'Hotel selection updated successfully',
      booking: responseBookingHotel,
    });

  } catch (err) {
    console.error('❌ Error updating hotel selection:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// ============================================
// POST /abandoned — ABANDONED BOOKING + GHL WEBHOOK
// ============================================
router.post('/abandoned', async (req, res) => {
  res.locals.skipEncrypt = true;
  try {
    const {
      existingBookingId,
      checkoutUrl,
      email,
      fullName,
      packageName,
      totalAmount,
      startDate,
      endDate,
      pax,
      paymentType,
    } = req.body;

    const GHL_ABANDONED_WEBHOOK_URL = process.env.GHL_ABANDONED_BOOKING_WEBHOOK_URL;

    if (!existingBookingId) {
      return res.status(400).json({ success: false, message: 'existingBookingId is required.' });
    }

    const targetBooking = await Booking.findByIdAndUpdate(
      existingBookingId,
      {
        $set: {
          abandonedAt: new Date(),
          followUpCount: 0,
          lastFollowUpAt: null,
        }
      },
      { new: true }
    );

    if (!targetBooking) {
      console.warn('⚠️ Abandoned booking: no booking found for ID:', existingBookingId);
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    console.log('✅ Abandoned tracking set for booking:', targetBooking._id);

    const resolvedEmail = email || targetBooking.email || "";
    const resolvedPhone = targetBooking.phone || "";
    const resolvedFullName = fullName || targetBooking.fullName || "";

    if (GHL_ABANDONED_WEBHOOK_URL) {
      const nameParts = resolvedFullName.trim().split(" ");
      const firstName = nameParts[0] || "Guest";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";

      const ghlPayload = {
        type: 'ABANDONED_BOOKING',
        event: 'booking_form_submitted',
        bookingId: targetBooking._id.toString(),
        first_name: firstName, 
        last_name: lastName,
        email: resolvedEmail,
        phone: resolvedPhone,
        packageName: packageName || targetBooking.packageName,
        totalAmount: totalAmount || targetBooking.totalAmount,
        startDate: startDate || targetBooking.startDate,
        endDate: endDate || targetBooking.endDate,
        pax: pax || targetBooking.pax?.adult || 1,
        paymentLink: checkoutUrl || '', 
        paymentType: paymentType || (targetBooking.paymentType === 'partial' ? 'Partial Payment' : 'Full Payment'),
        timestamp: new Date().toISOString(),
        source: 'WanderWave Booking Form',
      };

      await axios.post(GHL_ABANDONED_WEBHOOK_URL, ghlPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }).catch(err => {
        console.error('⚠️ Failed to send to GHL abandoned webhook:', err.message);
      });

      console.log('✅ GHL abandoned webhook fired for booking:', targetBooking._id);
    } else {
      console.warn('⚠️ GHL_ABANDONED_BOOKING_WEBHOOK_URL not set in .env — skipping GHL notification.');
    }

    res.status(200).json({
      success: true,
      message: 'Abandoned booking tracked and GHL notified.',
      bookingId: targetBooking._id,
    });

  } catch (error) {
    console.error('❌ Abandoned booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;