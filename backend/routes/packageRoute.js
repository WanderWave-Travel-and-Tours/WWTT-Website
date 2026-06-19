const router = require('express').Router();
const Package = require('../models/package');
const Tour = require('../models/tour');
const ActivityLog = require('../models/ActivityLog');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const authMiddleware = require('../middleware/auth');

// Fields that must NEVER leave the server in a public response.
// sellerPrice / markup / markupType are internal cost data — exposing them
// leaks margin info to competitors and customers.
const PUBLIC_SELECT = '-sellerPrice -markup -markupType -imagePublicId -isArchive -archivedAt -__v';

// Strip sensitive keys from a plain object (used when .select() isn't available,
// e.g. after .toObject() in /with-tours and /search mapping).
function publicFields(obj) {
    const { sellerPrice, markup, markupType, imagePublicId, isArchive, archivedAt, __v, ...rest } = obj;
    return rest;
}

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
            soloPaxPrice,
            multiplePaxPrice,
            userEmail, adminId 
        } = req.body;

        if (!title || !destination || !sellerPrice || !duration || !category) {
            return res.status(400).json({ status: 'error', error: 'Missing required fields' });
        }

        if (!req.file) {
            return res.status(400).json({ status: 'error', error: 'Image is required' });
        }

        if (tourType === 'private' && (!pax || parseInt(pax) < 1)) {
            return res.status(400).json({ status: 'error', error: 'Pax is required for private tours' });
        }

        if (tourType === 'joiners' && (!minPax || parseInt(minPax) < 1)) {
            return res.status(400).json({ status: 'error', error: 'Minimum pax is required for joiner tours' });
        }

        const sellerPriceNum = Number(sellerPrice) || 0;
        const markupNum = Number(markup) || 0;
        const logUserId = getValidAdminId(adminId);

        console.log('📦 Package /add — soloPaxPrice:', soloPaxPrice, '| multiplePaxPrice:', multiplePaxPrice);

        const packageData = {
            title,
            destination,
            sellerPrice: sellerPriceNum,
            markup: markupNum,
            markupType: markupType || 'fixed',
            price: sellerPriceNum + markupNum,
            duration,
            category,
            tourType: tourType || 'private',
            soloPaxPrice: parsePaxPrice(soloPaxPrice),
            multiplePaxPrice: parsePaxPrice(multiplePaxPrice),
            image: req.file.path,
            imagePublicId: req.file.filename,
            inclusions: inclusions ? JSON.parse(inclusions) : [],
            itinerary: itinerary ? JSON.parse(itinerary) : [],
            isArchive: 'No'
        };

        if (tourType === 'private' && pax) {
            packageData.pax = parseInt(pax);
        } else if (tourType === 'joiners' && minPax) {
            packageData.minPax = parseInt(minPax);
        }

        const newPackage = new Package(packageData);
        const savedPackage = await newPackage.save();

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
            soloPaxPrice,
            multiplePaxPrice,
            userEmail, adminId, changes
        } = req.body;
        
        const logUserId = getValidAdminId(adminId);
        const sellerPriceNum = Number(sellerPrice) || 0;
        const markupNum = Number(markup) || 0;

        let computedPrice;
        if (markupType === 'percentage') {
            const markupAmount = (sellerPriceNum * markupNum) / 100;
            computedPrice = sellerPriceNum + markupAmount;
        } else {
            computedPrice = sellerPriceNum + markupNum;
        }

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
            price: computedPrice,
            duration,
            category,
            tourType: tourType || 'private',
            soloPaxPrice: parsePaxPrice(soloPaxPrice),
            multiplePaxPrice: parsePaxPrice(multiplePaxPrice),
            inclusions: inclusions ? JSON.parse(inclusions) : [],
            itinerary: itinerary ? JSON.parse(itinerary) : [],
        };

        if (tourType === 'private' && pax) {
            updateData.pax = parseInt(pax);
            updateData.minPax = null;
        } else if (tourType === 'joiners' && minPax) {
            updateData.minPax = parseInt(minPax);
            updateData.pax = null;
        }

        // ✅ SAFE ITINERARY - Huwag burahin kung walang valid itinerary na sinend
        if (itinerary && itinerary !== '' && itinerary !== '[]') {
            try {
                const parsed = JSON.parse(itinerary);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    updateData.itinerary = parsed;
                }
            } catch (e) {
                console.warn('⚠️ Could not parse itinerary, keeping existing');
                delete updateData.itinerary;
            }
        } else {
            delete updateData.itinerary;
        }

        // Handle image
        if (req.file) {
            updateData.image = req.file.path;
            updateData.imagePublicId = req.file.filename;
            if (existingImagePublicId) {
                await cloudinary.uploader.destroy(existingImagePublicId).catch(() => {});
            }
        } else if (existingImage) {
            updateData.image = existingImage;
            updateData.imagePublicId = existingImagePublicId || '';
        }

        const updatedPkg = await Package.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: false }
        );

        if (!updatedPkg) {
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
        
        if (!pkg) {
            console.log('❌ Package not found:', req.params.id);
            return res.status(404).json({ status: "error", message: "Package not found" });
        }

        const newStatus = pkg.isArchive === 'Yes' ? 'No' : 'Yes';
        const newArchivedAt = newStatus === 'Yes' ? new Date() : null;
        
        await Package.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    isArchive: newStatus,
                    archivedAt: newArchivedAt
                } 
            },
            { new: true, runValidators: false }
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

// ============================================================
// ADMIN-ONLY ROUTES — full data including sellerPrice/markup
// Must come BEFORE the public /:id catch-all
// ============================================================

// ADMIN: all active packages (full fields)
router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        const packages = await Package.find({ isArchive: 'No' }).sort({ _id: -1 });
        res.status(200).json({ status: 'ok', data: packages });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Failed to retrieve packages.' });
    }
});

// ADMIN: archived packages (full fields)
router.get('/admin/archived-list', authMiddleware, async (req, res) => {
    try {
        const archived = await Package.find({ isArchive: 'Yes' }).sort({ _id: -1 });
        res.status(200).json({ status: 'ok', data: archived });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// ADMIN: single package by id (full fields)
router.get('/admin/:id', authMiddleware, async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ status: 'error', error: 'Package not found.' });
        res.status(200).json({ status: 'ok', data: pkg });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Failed to retrieve package data.' });
    }
});

// ============================================================
// PUBLIC ROUTES — sensitive pricing fields stripped
// ============================================================

// 4. FETCH ALL ACTIVE (public — no cost data)
router.get('/all', async (req, res) => {
    try {
        const packages = await Package.find({ isArchive: 'No' })
            .select(PUBLIC_SELECT)
            .sort({ _id: -1 });
        res.status(200).json({ status: 'ok', data: packages });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Failed to retrieve packages.' });
    }
});

// 5. FETCH ARCHIVED (admin-only in practice; keep auth for safety)
router.get('/archived-list', authMiddleware, async (req, res) => {
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

// 7. FETCH ALL ACTIVE PACKAGES ENRICHED WITH TOUR AVAILABILITY
router.get('/with-tours', async (req, res) => {
    try {
        const packages = await Package.find({ isArchive: 'No' }).sort({ _id: -1 });
        const tours = await Tour.find({ isArchive: 'No' }, { destination: 1, title: 1, tourType: 1, price: 1 });

        const toursByDestination = {};
        for (const tour of tours) {
            const key = tour.destination.trim().toLowerCase();
            if (!toursByDestination[key]) {
                toursByDestination[key] = [];
            }
            toursByDestination[key].push(tour);
        }

        const enriched = packages.map((pkg) => {
            const pkgDestKey = (pkg.destination || '').trim().toLowerCase();
            let matchedTours = toursByDestination[pkgDestKey] || [];

            if (matchedTours.length === 0) {
                matchedTours = tours.filter((t) => {
                    const tKey = t.destination.trim().toLowerCase();
                    return tKey.includes(pkgDestKey) || pkgDestKey.includes(tKey);
                });
            }

            return {
                ...publicFields(pkg.toObject()),
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

// ============================================================
// ✅ FUNNEL SEARCH ENDPOINT
// GET /api/packages/search?destination=Bohol&duration=3D2N&pax=2
//
// Logic:
//  - Filter by destination (case-insensitive partial match)
//  - Filter by duration (case-insensitive exact match, optional)
//  - displayPrice always uses pkg.price (the required base price
//    computed from sellerPrice + markup). soloPaxPrice and
//    multiplePaxPrice are stored on the record but are NOT used
//    for the landing page display — pkg.price is always shown.
//  - Only return active (non-archived) packages
// ============================================================
router.get('/search', async (req, res) => {
    try {
        const { destination, duration, pax } = req.query;
        const paxNum = parseInt(pax) || 1;

        if (!destination) {
            return res.status(400).json({ status: 'error', error: 'Destination is required.' });
        }

        // Build query
        const query = {
            isArchive: 'No',
            destination: { $regex: destination.trim(), $options: 'i' }
        };

        // Optional: filter by duration if provided
        if (duration && duration.trim() !== '') {
            query.duration = { $regex: duration.trim(), $options: 'i' };
        }

        const packages = await Package.find(query).sort({ _id: -1 });

        // ✅ displayPrice always equals pkg.price.
        // Even when soloPaxPrice or multiplePaxPrice are set on the record,
        // the landing page always shows the base computed price.
        const results = packages.map((pkg) => {
            const obj = publicFields(pkg.toObject());
            return {
                ...obj,
                displayPrice: obj.price,
                paxUsed: paxNum
            };
        });

        console.log(`🔍 /search — destination: "${destination}", duration: "${duration}", pax: ${paxNum} → ${results.length} result(s)`);

        res.status(200).json({ status: 'ok', data: results });

    } catch (error) {
        console.error('❌ Error in /search:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// 8. FETCH SINGLE PACKAGE — public, no cost data (Generic ID routes must be last)
router.get('/:id', async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id).select(PUBLIC_SELECT);
        if (!pkg) return res.status(404).json({ status: 'error', error: 'Package not found.' });
        res.status(200).json({ status: 'ok', data: pkg });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Failed to retrieve package data.' });
    }
});

module.exports = router;