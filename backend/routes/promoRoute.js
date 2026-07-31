const router = require('express').Router();
const Promo = require('../models/promo'); 
const Package = require('../models/package');
const Booking = require('../models/booking');
const ActivityLog = require('../models/ActivityLog');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const authMiddleware = require('../middleware/auth');

// ✅ 1. CLOUDINARY CONFIG
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ 2. CLOUDINARY STORAGE CONFIG - PROMO FOLDER
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/promos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
    }
});

const upload = multer({ storage: storage });

// HELPER: Sanitize Admin ID
const getValidAdminId = (id) => {
    if (id && id !== 'null' && id !== 'undefined' && id !== '') {
        return id;
    }
    return null;
};

// ============================================
// ROUTES
// ============================================

// ✅ NEW ROUTE: SEARCH PACKAGES FOR PROMO
router.get('/search-packages', async (req, res) => {
    try {
        const { search } = req.query;
        
        let query = { isArchive: "No" };
        
        if (search && search.trim() !== '') {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { destination: { $regex: search, $options: 'i' } }
            ];
        }
        
        const packages = await Package.find(query)
            .select('_id title destination category price')
            .limit(20)
            .sort({ title: 1 });
        
        res.status(200).json(packages);
    } catch (err) {
        console.error('❌ Error searching packages:', err);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// 1. ADD PROMO (WITH CLOUDINARY & LOGGING & TARGET PACKAGES)
// Promo CRUD is admin-only. Public promo reads (/all, /, /:id, /validate/:code)
// and /claim/:id (customer redeeming a promo) stay open.
router.post('/add', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const {
            userEmail, adminId,
            code, description, category, discountType,
            durationType, startDate, validUntil, usageLimit,
            localPrice, internationalPrice,
            targetPackages,
            promoType = 'promo'
        } = req.body;
        const logUserId = getValidAdminId(adminId);

        const hasLocal = localPrice && Number(localPrice) > 0;
        const hasInternational = internationalPrice && Number(internationalPrice) > 0;
        const parsedTargetPackages = targetPackages ? JSON.parse(targetPackages) : [];
        const imageUrl = req.file ? req.file.path : "";
        const imagePublicId = req.file ? req.file.filename : "";

        // ✅ Build promo entries based on which prices were provided
        const promoEntries = [];

        if (hasLocal) {
            promoEntries.push({
                code: `${code.toUpperCase()}LOCAL`,
                description,
                category,
                discountType,
                durationType,
                startDate,
                validUntil,
                usageLimit,
                isArchive: "No",
                image: imageUrl,
                imagePublicId: imagePublicId,
                promoType,
                pricing: {
                    local: Number(localPrice),
                    international: 0
                },
                targetPackages: parsedTargetPackages
            });
        }

        if (hasInternational) {
            promoEntries.push({
                code: `${code.toUpperCase()}INL`,
                description,
                category,
                discountType,
                durationType,
                startDate,
                validUntil,
                usageLimit,
                isArchive: "No",
                image: imageUrl,
                imagePublicId: imagePublicId,
                promoType,
                pricing: {
                    local: 0,
                    international: Number(internationalPrice)
                },
                targetPackages: parsedTargetPackages
            });
        }

        if (promoEntries.length === 0) {
            // ✅ Cleanup Cloudinary if no valid promo entries
            if (req.file?.filename) {
                await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
            }
            return res.status(400).json({ status: "error", message: "At least one price (local or international) is required." });
        }

        // ✅ Save all promo entries
        const savedPromos = [];
        for (const promoData of promoEntries) {
            const newPromo = new Promo(promoData);
            const saved = await newPromo.save();
            savedPromos.push(saved);

            // Activity Logging per promo
            try {
                let logDesc = `Created new promo code: ${saved.code}`;
                if (saved.targetPackages && saved.targetPackages.length > 0) {
                    logDesc += ` (${saved.targetPackages.length} package${saved.targetPackages.length > 1 ? 's' : ''} targeted)`;
                }
                await ActivityLog.create({
                    action: 'CREATE',
                    module: 'Promos',
                    user: userEmail || 'System Admin',
                    userId: logUserId,
                    severity: 'SUCCESS',
                    description: logDesc,
                    details: {
                        recordTitle: saved.code,
                        recordId: saved._id,
                        method: 'POST',
                        endpoint: '/api/promos/add'
                    }
                });
                console.log(`✅ Activity Log recorded for New Promo: ${saved.code}`);
            } catch (logError) {
                console.error('❌ Error logging activity:', logError);
            }
        }

        res.status(200).json({ status: "ok", promos: savedPromos, data: savedPromos[0] });
    } catch (err) {
        console.error('❌ Error adding promo:', err);
        
        // ✅ Cleanup Cloudinary if DB save fails
        if (req.file?.filename) {
            await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
        }
        
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 2. GET ALL PROMOS (INCLUDING ARCHIVED) 
// IMPORTANT: Inuna ito bago ang /:id para hindi mag-conflict
router.get('/all', async (req, res) => {
    try {
        const promos = await Promo.find()
            .populate('targetPackages', 'title destination category')
            .sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        console.error('❌ Error fetching all promos:', err);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// 3. GET ALL ACTIVE PROMOS (isArchive: "No") — excludes vouchers (hidden from public carousel)
router.get('/', async (req, res) => {
    try {
        const promos = await Promo.find({ isArchive: "No", promoType: { $ne: 'voucher' } })
            .populate('targetPackages', 'title destination category')
            .sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 4. GET SINGLE PROMO
router.get('/:id', async (req, res) => {
    try {
        const promo = await Promo.findById(req.params.id)
            .populate('targetPackages', 'title destination category price');
        if (!promo) return res.status(404).json({ message: "Promo not found" });
        res.status(200).json(promo);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 5. UPDATE PROMO (WITH CLOUDINARY & DETAILED LOGGING & TARGET PACKAGES)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const {
            userEmail, adminId, existingImagePublicId, changes,
            code, description, category, discountType,
            durationType, startDate, validUntil, usageLimit, isActive,
            localPrice, internationalPrice,
            targetPackages
        } = req.body;
        const logUserId = getValidAdminId(adminId);

        // ✅ FIXED: Explicitly build updateData — no ...req.body spread to avoid
        //    ghost fields like discountValue being passed into Mongoose
        let updateData = {
            code,
            description,
            category,
            discountType,
            durationType,
            startDate,
            validUntil,
            usageLimit,
            ...(isActive !== undefined && { isActive }),
            // ✅ Build pricing sub-document
            pricing: {
                local: Number(localPrice) || 0,
                international: Number(internationalPrice) || 0
            },
            // ✅ Parse targetPackages if sent as JSON string
            targetPackages: targetPackages ? JSON.parse(targetPackages) : []
        };

        // If new image is uploaded
        if (req.file) {
            updateData.image = req.file.path;
            updateData.imagePublicId = req.file.filename;
            
            // ✅ Delete old image from Cloudinary
            if (existingImagePublicId) {
                await cloudinary.uploader.destroy(existingImagePublicId)
                    .catch(e => console.error('❌ Old image delete failed:', e));
            }
        }

        const updatedPromo = await Promo.findByIdAndUpdate(
            req.params.id,
            { $set: updateData }, 
            { new: true }
        ).populate('targetPackages', 'title destination category');

        if (!updatedPromo) {
            // ✅ If update fails, delete newly uploaded image
            if (req.file?.filename) {
                await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
            }
            return res.status(404).json({ message: "Promo not found" });
        }

        // ============================================
        // ✅ ACTIVITY LOGGING (UPDATED LOGIC)
        // ============================================
        try {
            let logDescription = `Updated promo code: ${updatedPromo.code}`;

            // Check if 'changes' exists and append to description
            if (changes) {
                try {
                    const parsedChanges = JSON.parse(changes); 
                    if (Array.isArray(parsedChanges) && parsedChanges.length > 0) {
                        logDescription += `. Changes: ${parsedChanges.join(', ')}`;
                    }
                } catch (e) {
                    logDescription += ` details updated.`;
                }
            }
            
            // Add target packages info
            if (updatedPromo.targetPackages && updatedPromo.targetPackages.length > 0) {
                logDescription += ` (${updatedPromo.targetPackages.length} package${updatedPromo.targetPackages.length > 1 ? 's' : ''} targeted)`;
            }

            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Promos',
                user: userEmail || 'System Admin',
                userId: logUserId,
                severity: 'SUCCESS',
                description: logDescription,
                details: {
                    recordTitle: updatedPromo.code,
                    recordId: updatedPromo._id,
                    method: 'PUT',
                    endpoint: `/api/promos/${req.params.id}`
                }
            });
            console.log('✅ Activity Log recorded for Update Promo');
        } catch (logError) {
            console.error('❌ Error logging activity:', logError);
        }

        res.status(200).json({ status: "ok", data: updatedPromo });
    } catch (err) {
        console.error('❌ Error updating promo:', err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 6. ARCHIVE/RESTORE PROMO (Modified to handle Toggle logic)
router.post('/:id/archive', authMiddleware, async (req, res) => {
    try {
        const { userEmail, adminId } = req.body;
        const logUserId = getValidAdminId(adminId);

        const promo = await Promo.findById(req.params.id);
        if (!promo) return res.status(404).json({ status: "error", message: "Promo not found" });

        // Toggle logic: If "Yes", make it "No". If "No", make it "Yes".
        const newStatus = promo.isArchive === 'Yes' ? 'No' : 'Yes';
        promo.isArchive = newStatus;
        await promo.save();

        const actionType = newStatus === 'Yes' ? 'ARCHIVE' : 'RESTORE';
        const actionMessage = newStatus === 'Yes' ? 'Archived' : 'Restored';

        // Activity Logging
        try {
            await ActivityLog.create({
                action: actionType,
                module: 'Promos',
                user: userEmail || 'System Admin',
                userId: logUserId,
                severity: newStatus === 'Yes' ? 'WARNING' : 'SUCCESS',
                description: `${actionMessage} promo code: ${promo.code}`,
                details: {
                    recordTitle: promo.code,
                    recordId: promo._id,
                    method: 'POST',
                    endpoint: `/api/promos/${req.params.id}/archive`
                }
            });
            console.log(`✅ Activity Log recorded for ${actionType} Promo`);
        } catch (logError) {
            console.error('❌ Error logging activity:', logError);
        }

        res.json({ 
            status: "ok", 
            message: `Promo ${actionMessage.toLowerCase()} successfully`, 
            isArchive: newStatus 
        });
    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
});

// 7. CLAIM PROMO
router.post('/claim/:id', async (req, res) => {
    try {
        const promo = await Promo.findById(req.params.id);
        
        if (!promo) {
            return res.status(404).json({ message: "Promo not found" });
        }
        
        if (!promo.isActive || promo.isArchive === 'Yes') {
            return res.status(400).json({ message: "Promo is no longer active" });
        }
        
        if (new Date() > new Date(promo.validUntil)) {
            return res.status(400).json({ message: "Promo has expired" });
        }
        
        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
            return res.status(400).json({ message: "Promo limit reached" });
        }
        
        promo.usedCount += 1;
        await promo.save();
        
        res.status(200).json({ 
            message: "Promo claimed successfully",
            promo 
        });
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 8. VALIDATE PROMO CODE (✅ UPDATED: Check if promo applies to specific package)
router.get('/validate/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { packageId } = req.query; // ✅ Get package ID from query params
        
        const promo = await Promo.findOne({ 
            code: code.toUpperCase(),
            isArchive: 'No'
        }).populate('targetPackages', '_id');

        if (!promo) {
            return res.status(404).json({ 
                valid: false, 
                message: 'Promo code not found' 
            });
        }

        // Check if active
        if (!promo.isActive) {
            return res.status(400).json({ 
                valid: false, 
                message: 'This promo code is no longer active' 
            });
        }

        // Check if expired
        const today = new Date();
        const validUntil = new Date(promo.validUntil);
        if (today > validUntil) {
            return res.status(400).json({ 
                valid: false, 
                message: 'This promo code has expired' 
            });
        }

        // Check usage limit
        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
            return res.status(400).json({ 
                valid: false, 
                message: 'This promo code has reached its usage limit' 
            });
        }

        // ✅ Check if promo applies to the specific package
        if (packageId && promo.targetPackages && promo.targetPackages.length > 0) {
            console.log('🔍 Validating promo for package:', packageId);
            console.log('🎯 Target packages:', promo.targetPackages.map(p => p._id.toString()));
            
            const isPackageIncluded = promo.targetPackages.some(
                pkg => pkg._id.toString() === packageId.toString()
            );
            
            console.log('✅ Package included?', isPackageIncluded);
            
            if (!isPackageIncluded) {
                return res.status(400).json({ 
                    valid: false, 
                    message: 'This promo code is not valid for this package' 
                });
            }
        }

        res.status(200).json({ 
            valid: true, 
            promo: {
                _id: promo._id,
                code: promo.code,
                description: promo.description,
                discountType: promo.discountType,
                // ✅ UPDATED: Return pricing object instead of discountValue
                pricing: promo.pricing,
                promoType: promo.promoType,
                usageLimit: promo.usageLimit,
                usedCount: promo.usedCount,
                targetPackages: promo.targetPackages
            }
        });

    } catch (err) {
        res.status(500).json({ 
            valid: false, 
            message: err.message 
        });
    }
});

// 8. VALIDATE PROMO CODE (✅ FIXED: Proper package validation)
router.get('/validate/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { packageId } = req.query;
        
        console.log('🔍 ============ PROMO VALIDATION START ============');
        console.log('📝 Promo Code:', code);
        console.log('📦 Package ID from query:', packageId);
        
        const promo = await Promo.findOne({ 
            code: code.toUpperCase(),
            isArchive: 'No'
        }).populate('targetPackages', '_id title');

        if (!promo) {
            console.log('❌ Promo not found');
            return res.status(404).json({ 
                valid: false, 
                message: 'Promo code not found' 
            });
        }

        console.log('✅ Promo found:', promo.code);
        console.log('🎯 Target Packages:', promo.targetPackages);

        // Check if active
        if (!promo.isActive) {
            console.log('❌ Promo not active');
            return res.status(400).json({ 
                valid: false, 
                message: 'This promo code is no longer active' 
            });
        }

        // Check if expired
        const today = new Date();
        const validUntil = new Date(promo.validUntil);
        if (today > validUntil) {
            console.log('❌ Promo expired');
            return res.status(400).json({ 
                valid: false, 
                message: 'This promo code has expired' 
            });
        }

        // Check usage limit
        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
            console.log('❌ Usage limit reached');
            return res.status(400).json({ 
                valid: false, 
                message: 'This promo code has reached its usage limit' 
            });
        }

        // ✅ VOUCHER: One-time use per logged-in user (per specific voucher code only)
        if (promo.promoType === 'voucher') {
            const userEmail = req.query.userEmail || req.query.email;

            if (!userEmail) {
                console.log('❌ Voucher requires logged-in user but no email provided');
                return res.status(400).json({
                    valid: false,
                    message: 'This voucher requires a logged-in account. Please log in first.'
                });
            }

            // ✅ Case-insensitive email, includes pending, checks both promoId and promoCode
            const existingUsage = await Booking.findOne({
                $or: [
                    { promoId: promo._id },
                    { promoCode: promo.code }
                ],
                email: { $regex: new RegExp(`^${userEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                status: { $in: ['pending', 'confirmed', 'fully_paid', 'partial_paid'] }
            });

            if (existingUsage) {
                console.log('❌ Voucher already used by this user — booking status:', existingUsage.status);
                return res.status(400).json({
                    valid: false,
                    message: 'You have already used this voucher. It can only be used once per account.'
                });
            }

            console.log('✅ Voucher check passed for user:', userEmail);
        }
        if (promo.targetPackages && promo.targetPackages.length > 0) {
            console.log('🔍 Promo has target packages. Validating...');
            
            if (!packageId) {
                console.log('❌ No package ID provided but promo requires specific packages');
                return res.status(400).json({ 
                    valid: false, 
                    message: 'This promo code requires a valid package' 
                });
            }
            
            const targetPackageIds = promo.targetPackages.map(p => p._id.toString());
            const normalizedPackageId = packageId.toString().trim();
            
            console.log('🎯 Target Package IDs:', targetPackageIds);
            console.log('📦 Checking Package ID:', normalizedPackageId);
            
            const isPackageIncluded = targetPackageIds.includes(normalizedPackageId);
            
            console.log('✅ Package match result:', isPackageIncluded);
            
            if (!isPackageIncluded) {
                console.log('❌ Package not in target list');
                return res.status(400).json({ 
                    valid: false, 
                    message: 'This promo code is not valid for this package' 
                });
            }
            
            console.log('✅ Package validation passed!');
        } else {
            console.log('ℹ️ Promo has no target packages - valid for all packages');
        }

        // ✅ NEW: Validate promo pricing type matches the package type (local vs international)
        // This runs for ALL promos regardless of whether they have target packages
        if (packageId) {
            const targetPkg = await Package.findById(packageId).select('category');
            if (targetPkg) {
                const pkgCategory = (targetPkg.category || '').toLowerCase();
                const isInternationalPackage = pkgCategory === 'international';

                const promoHasLocal = promo.pricing && promo.pricing.local > 0;
                const promoHasInternational = promo.pricing && promo.pricing.international > 0;

                console.log('📦 Package category:', targetPkg.category, '| Is international:', isInternationalPackage);
                console.log('🏷️ Promo pricing — local:', promo.pricing?.local, '| international:', promo.pricing?.international);

                if (isInternationalPackage && promoHasLocal && !promoHasInternational) {
                    console.log('❌ International package but promo is local-only');
                    return res.status(400).json({
                        valid: false,
                        message: 'This promo code is for local (Philippines) packages only and cannot be applied to international packages.'
                    });
                }

                if (!isInternationalPackage && promoHasInternational && !promoHasLocal) {
                    console.log('❌ Local/domestic package but promo is international-only');
                    return res.status(400).json({
                        valid: false,
                        message: 'This promo code is for international packages only and cannot be applied to local (Philippines) packages.'
                    });
                }

                console.log('✅ Package type vs promo pricing type validation passed!');
            }
        }

        console.log('✅ ============ VALIDATION SUCCESS ============');
        
        res.status(200).json({ 
            valid: true, 
            promo: {
                _id: promo._id,
                code: promo.code,
                description: promo.description,
                discountType: promo.discountType,
                // ✅ UPDATED: Return pricing object instead of discountValue
                pricing: promo.pricing,
                promoType: promo.promoType,
                usageLimit: promo.usageLimit,
                usedCount: promo.usedCount,
                targetPackages: promo.targetPackages
            }
        });

    } catch (err) {
        console.error('❌ Validation error:', err);
        res.status(500).json({ 
            valid: false, 
            message: err.message 
        });
    }
});

// 🔧 DEBUG ROUTE - REMOVE AFTER TESTING
router.get('/debug/:code', async (req, res) => {
    try {
        const promo = await Promo.findOne({ code: req.params.code.toUpperCase() })
            .populate('targetPackages', '_id title');
        
        res.json({
            promo: promo,
            targetPackages: promo?.targetPackages || [],
            targetPackageIds: promo?.targetPackages?.map(p => p._id.toString()) || []
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;