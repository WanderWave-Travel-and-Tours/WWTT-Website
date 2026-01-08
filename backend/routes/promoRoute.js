const router = require('express').Router();
const Promo = require('../models/promo'); 
const ActivityLog = require('../models/ActivityLog');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

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
        folder: 'wanderwave/promos', // 🎯 YOUR PROMO FOLDER
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }] // Square for promo images
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

// 1. ADD PROMO (WITH CLOUDINARY & LOGGING)
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { userEmail, adminId } = req.body;
        const logUserId = getValidAdminId(adminId);

        const promoData = {
            ...req.body,
            isArchive: "No",
            image: req.file ? req.file.path : "", // ✅ Cloudinary URL
            imagePublicId: req.file ? req.file.filename : "" // ✅ Cloudinary public_id
        };

        const newPromo = new Promo(promoData);
        const savedPromo = await newPromo.save();

        // Activity Logging
        try {
            await ActivityLog.create({
                action: 'CREATE',
                module: 'Promos',
                user: userEmail || 'System Admin',
                userId: logUserId,
                severity: 'SUCCESS',
                description: `Created new promo code: ${savedPromo.code}`,
                details: {
                    recordTitle: savedPromo.code,
                    recordId: savedPromo._id,
                    method: 'POST',
                    endpoint: '/api/promos/add'
                }
            });
            console.log('✅ Activity Log recorded for New Promo');
        } catch (logError) {
            console.error('❌ Error logging activity:', logError);
        }

        res.status(200).json({ status: "ok", data: savedPromo });
    } catch (err) {
        console.error('❌ Error adding promo:', err);
        
        // ✅ Cleanup Cloudinary if DB save fails
        if (req.file?.filename) {
            await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
        }
        
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 2. GET SINGLE PROMO
router.get('/:id', async (req, res) => {
    try {
        const promo = await Promo.findById(req.params.id);
        if (!promo) return res.status(404).json({ message: "Promo not found" });
        res.status(200).json(promo);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 3. GET ALL ACTIVE PROMOS
router.get('/', async (req, res) => {
    try {
        const promos = await Promo.find({ isArchive: "No" }).sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 4. GET ALL PROMOS (INCLUDING ARCHIVED)
router.get('/all', async (req, res) => {
    try {
        const promos = await Promo.find().sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 5. UPDATE PROMO (WITH CLOUDINARY & DETAILED LOGGING)
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        // ✅ EXTRACT EXTRA FIELDS: changes, userEmail, adminId
        const { userEmail, adminId, existingImagePublicId, changes } = req.body;
        const logUserId = getValidAdminId(adminId);

        let updateData = { ...req.body };

        // If new image is uploaded
        if (req.file) {
            updateData.image = req.file.path; // ✅ Cloudinary URL
            updateData.imagePublicId = req.file.filename; // ✅ Cloudinary public_id
            
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
        );

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
            // Frontend sends 'changes' as a JSON string via FormData
            if (changes) {
                try {
                    const parsedChanges = JSON.parse(changes); 
                    if (Array.isArray(parsedChanges) && parsedChanges.length > 0) {
                        logDescription += `. Changes: ${parsedChanges.join(', ')}`;
                    }
                } catch (e) {
                    // Fallback if parsing fails or if it's a simple string
                    logDescription += ` details updated.`;
                }
            }

            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Promos',
                user: userEmail || 'System Admin',
                userId: logUserId,
                severity: 'SUCCESS',
                description: logDescription, // ✅ Log description now includes specific changes
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

// 6. ARCHIVE/RESTORE PROMO
router.post('/:id/archive', async (req, res) => {
    try {
        const { userEmail, adminId } = req.body;
        const logUserId = getValidAdminId(adminId);

        const promo = await Promo.findById(req.params.id);
        if (!promo) return res.status(404).json({ status: "error", message: "Promo not found" });

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

// 8. VALIDATE PROMO CODE
router.get('/validate/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        const promo = await Promo.findOne({ 
            code: code.toUpperCase(),
            isArchive: 'No'
        });

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

        res.status(200).json({ 
            valid: true, 
            promo: {
                _id: promo._id,
                code: promo.code,
                description: promo.description,
                discountType: promo.discountType,
                discountValue: promo.discountValue,
                usageLimit: promo.usageLimit,
                usedCount: promo.usedCount
            }
        });

    } catch (err) {
        res.status(500).json({ 
            valid: false, 
            message: err.message 
        });
    }
});

module.exports = router;