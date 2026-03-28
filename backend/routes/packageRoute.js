const router = require('express').Router();
const Package = require('../models/package');
const Tour = require('../models/tour');
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

// HELPER: Safely parse a pax price value — returns null if blank/invalid
const parsePaxPrice = (value) => {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    if (trimmed === '') return null;
    const num = Number(trimmed);
    if (isNaN(num) || num < 0) return null;
    return num;
};

// ============================================
// ROUTES
// ============================================

// 1. ADD PACKAGE (WITH CLOUDINARY & LOGGING)
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, destination, sellerPrice, markup, markupType,
            duration, category, inclusions, itinerary,
            tourType, pax, minPax,
            soloPaxPrice,       // ✅ Selling price for solo (1 person) booking
            multiplePaxPrice,   // ✅ Selling price for multiple/group booking
            userEmail, adminId 
        } = req.body;

        // Validation
        if (!title || !destination || !sellerPrice || !duration || !category) {
            return res.status(400).json({ status: 'error', error: 'Missing required fields' });
        }

        if (!req.file) {
            return res.status(400).json({ status: 'error', error: 'Image is required' });
        }

        // ✅ Validate tourType, pax, and minPax
        if (tourType === 'private' && (!pax || parseInt(pax) < 1)) {
            return res.status(400).json({ status: 'error', error: 'Pax is required for private tours' });
        }

        if (tourType === 'joiners' && (!minPax || parseInt(minPax) < 1)) {
            return res.status(400).json({ status: 'error', error: 'Minimum pax is required for joiner tours' });
        }

        const sellerPriceNum = Number(sellerPrice) || 0;
        const markupNum = Number(markup) || 0;
        const logUserId = getValidAdminId(adminId);

        // ✅ Log received pax prices for verification
        console.log('📦 Package /add — soloPaxPrice:', soloPaxPrice, '| multiplePaxPrice:', multiplePaxPrice);

        // ✅ Prepare package data
        const packageData = {
            title,
            destination,
            sellerPrice: sellerPriceNum,
            markup: markupNum,
            markupType: markupType || 'fixed',             // ✅ pass markupType so pre-save computes price correctly
            price: sellerPriceNum + markupNum,
            duration,
            category,
            tourType: tourType || 'private',
            soloPaxPrice: parsePaxPrice(soloPaxPrice),         // ✅ null if blank
            multiplePaxPrice: parsePaxPrice(multiplePaxPrice), // ✅ null if blank
            image: req.file.path,
            imagePublicId: req.file.filename,
            inclusions: inclusions ? JSON.parse(inclusions) : [],
            itinerary: itinerary ? JSON.parse(itinerary) : [],
            isArchive: 'No'
        };

        // ✅ Add pax or minPax based on tourType
        if (tourType === 'private' && pax) {
            packageData.pax = parseInt(pax);
        } else if (tourType === 'joiners' && minPax) {
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
            title, destination, sellerPrice, markup, markupType, duration, 
            category, existingImage, existingImagePublicId, inclusions, itinerary,
            tourType, pax, minPax,
            soloPaxPrice,       // ✅ Selling price for solo (1 person) booking
            multiplePaxPrice,   // ✅ Selling price for multiple/group booking
            userEmail, adminId, changes
        } = req.body;
        
        const logUserId = getValidAdminId(adminId);
        const sellerPriceNum = Number(sellerPrice) || 0;
        const markupNum = Number(markup) || 0;

        // ✅ Compute correct price here since findByIdAndUpdate does NOT trigger pre-save hooks
        let computedPrice;
        if (markupType === 'percentage') {
            const markupAmount = (sellerPriceNum * markupNum) / 100;
            computedPrice = sellerPriceNum + markupAmount;
        } else {
            computedPrice = sellerPriceNum + markupNum;
        }

        // ✅ Validate tourType, pax, and minPax for Edit
        if (tourType === 'private' && (!pax || parseInt(pax) < 1)) {
            return res.status(400).json({ status: 'error', error: 'Pax is required for private tours' });
        }

        if (tourType === 'joiners' && (!minPax || parseInt(minPax) < 1)) {
            return res.status(400).json({ status: 'error', error: 'Minimum pax is required for joiner tours' });
        }

        const updateData = {
            title,
            destination,
            sellerPrice: sellerPriceNum,
            markup: markupNum,
            markupType: markupType || 'fixed',
            price: computedPrice,                          // ✅ uses correct price based on markupType
            duration,
            category,
            tourType: tourType || 'private',
            soloPaxPrice: parsePaxPrice(soloPaxPrice),         // ✅ null if blank
            multiplePaxPrice: parsePaxPrice(multiplePaxPrice), // ✅ null if blank
            inclusions: inclusions ? JSON.parse(inclusions) : [],
            itinerary: itinerary ? JSON.parse(itinerary) : [],
        };




// ✅ SAFE ITINERARY - Huwag burahin kung walang valid itinerary na sinend
if (itinerary && itinerary !== '' && itinerary !== '[]') {
    try {
        const parsed = JSON.parse(itinerary);
        if (Array.isArray(parsed) && parsed.length > 0) {
            updateData.itinerary = parsed;
            console.log(`Itinerary updated with ${parsed.length} days`);
        } else {
            console.log("Received empty itinerary - skipping to protect existing data");
        }
    } catch (e) {
        console.error("Invalid itinerary JSON from frontend");
    }
} else {
    console.log("No itinerary in request - keeping existing itinerary (safe mode)");
}
        
        // ✅ Handle pax and minPax based on tourType
        if (tourType === 'private' && pax) {
            updateData.pax = parseInt(pax);
            updateData.minPax = null; // Clear minPax
        } else if (tourType === 'joiners' && minPax) {
            updateData.minPax = parseInt(minPax);
            updateData.pax = null; // Clear pax
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

        // ✅ Use $set explicitly so null values for soloPaxPrice/multiplePaxPrice are written to DB
        // Without $set, MongoDB may ignore null fields on update
        const updatedPkg = await Package.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: false }
        );

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

// 3. ARCHIVE TOGGLE ✅ FIX: Bypasses Validation for legacy data
router.post('/:id/archive', async (req, res) => {
    try {
        const { userEmail, adminId } = req.body; 
        const logUserId = getValidAdminId(adminId);

        // 1. Fetch package first to get current status and title
        const pkg = await Package.findById(req.params.id);
        
        if (!pkg) {
            console.log('❌ Package not found:', req.params.id);
            return res.status(404).json({ status: "error", message: "Package not found" });
        }

        // 2. Determine new values
        const newStatus = pkg.isArchive === 'Yes' ? 'No' : 'Yes';
        const newArchivedAt = newStatus === 'Yes' ? new Date() : null;
        
        // 3. UPDATE using findByIdAndUpdate with runValidators: false
        // This avoids validation errors (like "pax required") on old data when just archiving
        await Package.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    isArchive: newStatus,
                    archivedAt: newArchivedAt
                } 
            },
            { new: true, runValidators: false } // <--- CRITICAL FIX
        );

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

        console.log(`✅ Package ${newStatus === 'Yes' ? 'archived' : 'restored'}:`, pkg.title);
        res.json({ 
            status: "ok", 
            message: `Package ${newStatus === 'Yes' ? 'archived' : 'restored'} successfully`, 
            isArchive: newStatus 
        });
    } catch (err) {
        console.error('❌ Archive toggle error:', err);
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
        console.log(`📦 Found ${archived.length} archived packages`);
        res.status(200).json({ status: 'ok', data: archived });
    } catch (error) {
        console.error('❌ Error fetching archived packages:', error);
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

// 7. FETCH ALL ACTIVE PACKAGES ENRICHED WITH TOUR AVAILABILITY
// Analyzes each package's destination against the Tour collection
// Returns packages with hasTours: true/false and matchedTours metadata
router.get('/with-tours', async (req, res) => {
    try {
        // Fetch all active packages
        const packages = await Package.find({ isArchive: 'No' }).sort({ _id: -1 });

        // Fetch all non-archived tours (only need destination field for matching)
        const tours = await Tour.find({ isArchive: 'No' }, { destination: 1, title: 1, tourType: 1, price: 1 });

        // Build a map: normalized destination → [tour docs]
        const toursByDestination = {};
        for (const tour of tours) {
            const key = tour.destination.trim().toLowerCase();
            if (!toursByDestination[key]) {
                toursByDestination[key] = [];
            }
            toursByDestination[key].push(tour);
        }

        // Enrich each package
        const enriched = packages.map((pkg) => {
            const pkgDestKey = (pkg.destination || '').trim().toLowerCase();

            // Exact match first, then partial match
            let matchedTours = toursByDestination[pkgDestKey] || [];

            if (matchedTours.length === 0) {
                // Partial match: destination contains or is contained by tour destination
                matchedTours = tours.filter((t) => {
                    const tKey = t.destination.trim().toLowerCase();
                    return tKey.includes(pkgDestKey) || pkgDestKey.includes(tKey);
                });
            }

            return {
                ...pkg.toObject(),
                hasTours: matchedTours.length > 0,
                tourCount: matchedTours.length,
                matchedTours: matchedTours.map((t) => ({
                    _id: t._id,
                    title: t.title,
                    tourType: t.tourType,
                    price: t.price,
                    destination: t.destination
                }))
            };
        });

        console.log(`✅ /with-tours — ${enriched.length} packages, ${enriched.filter(p => p.hasTours).length} have matching tours`);
        res.status(200).json({ status: 'ok', data: enriched });
    } catch (error) {
        console.error('❌ Error in /with-tours:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// 8. FETCH SINGLE PACKAGE (Generic ID routes should be last)
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