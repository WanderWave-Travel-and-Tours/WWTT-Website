const router = require('express').Router();
const Package = require('../models/package');
const ActivityLog = require('../models/ActivityLog');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 1. CLOUDINARY CONFIG
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. CLOUDINARY STORAGE CONFIG
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/packages',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 800, crop: 'limit' }]
    }
});

const upload = multer({ storage: storage });

// HELPER: Sanitize Admin ID to avoid CastError
const getValidAdminId = (id) => {
    if (id && id !== 'null' && id !== 'undefined' && id !== '') {
        return id;
    }
    return null;
};

// ============================================
// ROUTES
// ============================================

// 1. ADD PACKAGE (WITH CLOUDINARY & LOGGING)
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, destination, sellerPrice, markup, 
            duration, category, inclusions, itinerary,
            tourType, minPax,  // ✅ ADDED
            userEmail, adminId 
        } = req.body;

        // Validation
        if (!title || !destination || !sellerPrice || !duration || !category) {
            return res.status(400).json({ status: 'error', error: 'Missing required fields' });
        }

        if (!req.file) {
            return res.status(400).json({ status: 'error', error: 'Image is required' });
        }

        // ✅ Validate tourType and minPax
        if (tourType === 'joiners' && (!minPax || parseInt(minPax) < 1)) {
            return res.status(400).json({ status: 'error', error: 'Minimum pax is required for joiner tours' });
        }

        const sellerPriceNum = Number(sellerPrice) || 0;
        const markupNum = Number(markup) || 0;
        const logUserId = getValidAdminId(adminId);

        // ✅ Prepare package data with tourType and minPax
        const packageData = {
            title,
            destination,
            sellerPrice: sellerPriceNum,
            markup: markupNum,
            price: sellerPriceNum + markupNum,
            duration,
            category,
            tourType: tourType || 'private', // ✅ ADDED
            image: req.file.path, // Cloudinary Secure URL
            imagePublicId: req.file.filename, // Cloudinary ID for deletion later
            inclusions: inclusions ? JSON.parse(inclusions) : [],
            itinerary: itinerary ? JSON.parse(itinerary) : [],
            isArchive: 'No'
        };

        // ✅ Only add minPax if tourType is joiners
        if (tourType === 'joiners' && minPax) {
            packageData.minPax = parseInt(minPax);
        }

        const newPackage = new Package(packageData);
        const savedPackage = await newPackage.save();

        // Activity Logging
        await ActivityLog.create({
            action: 'CREATE',
            module: 'Packages',
            user: userEmail || 'System Admin',
            userId: logUserId,
            severity: 'SUCCESS',
            description: `Created a new tour package: ${title}`,
            details: {
                recordTitle: title,
                recordId: savedPackage._id,
                method: 'POST',
                endpoint: '/api/packages/add'
            }
        });

        res.status(201).json({ status: 'ok', message: 'Package created successfully!', data: savedPackage });

    } catch (err) {
        console.error('❌ Error adding package:', err);
        // Cleanup image in Cloudinary if DB save fails
        if (req.file?.filename) {
            await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
        }
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// 2. EDIT PACKAGE (WITH CLOUDINARY & LOGGING)
router.put('/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, destination, sellerPrice, markup, duration, 
            category, existingImage, existingImagePublicId, inclusions, itinerary,
            tourType, minPax, 
            userEmail, adminId, changes
        } = req.body;
        
        const logUserId = getValidAdminId(adminId);
        const sellerPriceNum = Number(sellerPrice) || 0;
        const markupNum = Number(markup) || 0;

        if (tourType === 'joiners' && (!minPax || parseInt(minPax) < 1)) {
            return res.status(400).json({ status: 'error', error: 'Minimum pax is required for joiner tours' });
        }

        const updateData = {
            title,
            destination,
            sellerPrice: sellerPriceNum,
            markup: markupNum,
            price: sellerPriceNum + markupNum,
            duration,
            category,
            tourType: tourType || 'private',  
            inclusions: inclusions ? JSON.parse(inclusions) : [],
            itinerary: itinerary ? JSON.parse(itinerary) : [],
        };

        if (tourType === 'joiners' && minPax) {
            updateData.minPax = parseInt(minPax);
        } else if (tourType === 'private') {
            updateData.minPax = null; 
        }

        if (req.file) {
            updateData.image = req.file.path;
            updateData.imagePublicId = req.file.filename;
            
            if (existingImagePublicId) {
                await cloudinary.uploader.destroy(existingImagePublicId).catch(e => console.error('Old image delete failed:', e));
            }
        } else {
            updateData.image = existingImage;
            updateData.imagePublicId = existingImagePublicId;
        }

        const updatedPkg = await Package.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!updatedPkg) {
            if (req.file?.filename) {
                await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
            }
            return res.status(404).json({ status: 'error', error: 'Package not found' });
        }

        try {
            let logDescription = `Updated tour package: ${title}`;

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

            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Packages',
                user: userEmail || 'System Admin',
                userId: logUserId,
                severity: 'SUCCESS',
                description: logDescription,
                details: {
                    recordTitle: title,
                    recordId: updatedPkg._id,
                    method: 'PUT',
                    endpoint: `/api/packages/edit/${req.params.id}`
                }
            });
            console.log('✅ Activity Log recorded for Update Package');
        } catch (logError) {
            console.error('❌ Error logging activity:', logError);
        }

        res.json({ status: 'ok', message: 'Package updated successfully!', data: updatedPkg });
    } catch (err) {
        console.error("❌ Error updating package:", err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// 3. ARCHIVE TOGGLE
router.post('/:id/archive', async (req, res) => {
    try {
        const { userEmail, adminId } = req.body; 
        const logUserId = getValidAdminId(adminId);

        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ status: "error", message: "Not found" });

        const newStatus = pkg.isArchive === 'Yes' ? 'No' : 'Yes';
        pkg.isArchive = newStatus;
        await pkg.save();

        const actionType = newStatus === 'Yes' ? 'ARCHIVE' : 'RESTORE';
        const severity = newStatus === 'Yes' ? 'WARNING' : 'SUCCESS';

        await ActivityLog.create({
            action: actionType, 
            module: 'Packages',
            user: userEmail || 'System Admin',
            userId: logUserId,
            severity: severity,
            description: `${newStatus === 'Yes' ? 'Archived' : 'Restored'} package: ${pkg.title}`,
            details: {
                recordTitle: pkg.title,
                recordId: pkg._id,
                method: 'POST',
                endpoint: `/api/packages/${req.params.id}/archive`
            }
        });

        res.json({ status: "ok", message: `Package status updated to ${newStatus}`, isArchive: newStatus });
    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
});

// 4. FETCH ALL ACTIVE
router.get('/all', async (req, res) => {
    try {
        const packages = await Package.find({ isArchive: 'No' }).sort({ _id: -1 });
        res.status(200).json({ status: 'ok', data: packages });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Failed to retrieve packages.' });
    }
});

// 5. FETCH ARCHIVED
router.get('/archived-list', async (req, res) => {
    try {
        const archived = await Package.find({ isArchive: 'Yes' }).sort({ _id: -1 });
        res.status(200).json({ status: 'ok', data: archived });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// 6. INITIALIZE ARCHIVE STATUS
router.get('/init-archive', async (req, res) => {
    try {
        const result = await Package.updateMany(
            { isArchive: { $exists: false } },
            { $set: { isArchive: 'No' } }
        );
        res.status(200).json({ status: 'ok', message: `Success! ${result.modifiedCount} documents updated.` });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// 7. FETCH SINGLE PACKAGE (Generic ID routes should be last)
router.get('/:id', async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ status: 'error', error: 'Package not found.' });
        res.status(200).json({ status: 'ok', data: pkg });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Failed to retrieve package data.' });
    }
});

module.exports = router;