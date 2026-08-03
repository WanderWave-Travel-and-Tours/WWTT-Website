const router = require('express').Router();
const Package = require('../models/package');
const Tour = require('../models/tour');
const ActivityLog = require('../models/ActivityLog');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const authMiddleware = require('../middleware/auth');
const requireSameOrigin = require('../middleware/requireSameOrigin');

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
router.post('/add', authMiddleware, upload.single('image'), async (req, res) => {
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
router.put('/edit/:id', authMiddleware, upload.single('image'), async (req, res) => {
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
router.post('/:id/archive', authMiddleware, async (req, res) => {
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
router.get('/all', requireSameOrigin, async (req, res) => {
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const packages = await Package.find({ isArchive: 'No' })
                .select(PUBLIC_SELECT)
                .sort({ _id: -1 });
            return res.status(200).json({ status: 'ok', data: packages });
        } catch (error) {
            console.error(`❌ /api/packages/all attempt ${attempt} failed:`, error.message);
            if (attempt === 2) {
                return res.status(500).json({ status: 'error', error: 'Failed to retrieve packages.', detail: error.message });
            }
            await new Promise(r => setTimeout(r, 1500));
        }
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

// 6. INITIALIZE ARCHIVE STATUS — one-off data migration, admin-only
router.get('/init-archive', authMiddleware, async (req, res) => {
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
router.get('/with-tours', requireSameOrigin, async (req, res) => {
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
router.get('/search', requireSameOrigin, async (req, res) => {
    try {
        const { destination, duration, pax, category, title } = req.query;
        const paxNum = parseInt(pax) || 1;

        const destStr  = (destination || '').trim();
        const titleStr = (title || '').trim();

        if (!destStr && !titleStr) {
            return res.status(400).json({ status: 'error', error: 'Destination is required.' });
        }

        // ── TITLE-SEARCH WHITELIST ───────────────────────────────────────
        // These 7 international destinations store their packages by title
        // or itinerary in the DB rather than by a clean destination field.
        // Search order for these destinations:
        //   1. Title field search (keyword match)
        //   2. Itinerary search (itinerary.title + itinerary.activities)
        //      — fallback when title search returns 0 results
        // All other destinations always use the normal destination field
        // search — title and itinerary params are ignored.
        // ────────────────────────────────────────────────────────────────
        const TITLE_SEARCH_DESTINATIONS = new Set([
            'Bangkok',
            'Hongkong',
            'Hanoi, Vietnam',
            'Ho Chi Minh, Vietnam',
            'Kuala Lumpur',
            'Sapa + Hanoi, Vietnam',
            'Singapore, Universal Studio',
        ]);

        const useTitleSearch = titleStr !== '' && TITLE_SEARCH_DESTINATIONS.has(destStr);

        // Helper: build shared filters (duration + category) to reuse across queries
        const buildSharedFilters = () => {
            const filters = { isArchive: 'No' };
            if (duration && duration.trim() !== '') {
                filters.duration = { $regex: duration.trim(), $options: 'i' };
            }
            if (category && category.trim() !== '') {
                const cat = category.trim().toLowerCase();
                if (cat.startsWith('inter')) {
                    filters.category = { $regex: 'Internation', $options: 'i' };
                } else if (cat.startsWith('local')) {
                    filters.category = { $regex: '^Local$', $options: 'i' };
                } else {
                    filters.category = { $regex: category.trim(), $options: 'i' };
                }
            }
            return filters;
        };

        const formatResults = (packages) => packages.map((pkg) => {
            const obj = publicFields(pkg.toObject());
            return { ...obj, displayPrice: obj.price, paxUsed: paxNum };
        });

        // ── SEARCH EXECUTION ─────────────────────────────────────────────
        let packages = [];
        let searchMode = 'destination';

        if (useTitleSearch) {
            // STEP 1: Title field search
            const titleQuery = { ...buildSharedFilters(), title: { $regex: titleStr, $options: 'i' } };
            packages = await Package.find(titleQuery).sort({ _id: -1 });
            searchMode = 'title';

            // STEP 2: Itinerary search — fallback when title search returns 0
            // Searches itinerary.title (day titles) and itinerary.activities (activity names)
            if (packages.length === 0) {
                const itineraryQuery = {
                    ...buildSharedFilters(),
                    $or: [
                        { 'itinerary.title':      { $regex: titleStr, $options: 'i' } },
                        { 'itinerary.activities': { $regex: titleStr, $options: 'i' } },
                    ]
                };
                packages = await Package.find(itineraryQuery).sort({ _id: -1 });
                searchMode = 'itinerary';

                // STEP 3: Itinerary search without duration — if still 0, drop duration filter
                // so we still show relevant packages even if duration doesn't match exactly
                if (packages.length === 0 && duration && duration.trim() !== '') {
                    const itineraryQueryNoDur = {
                        isArchive: 'No',
                        $or: [
                            { 'itinerary.title':      { $regex: titleStr, $options: 'i' } },
                            { 'itinerary.activities': { $regex: titleStr, $options: 'i' } },
                        ]
                    };
                    if (category && category.trim() !== '') {
                        const cat = category.trim().toLowerCase();
                        if (cat.startsWith('inter')) {
                            itineraryQueryNoDur.category = { $regex: 'Internation', $options: 'i' };
                        } else if (cat.startsWith('local')) {
                            itineraryQueryNoDur.category = { $regex: '^Local$', $options: 'i' };
                        } else {
                            itineraryQueryNoDur.category = { $regex: category.trim(), $options: 'i' };
                        }
                    }
                    packages = await Package.find(itineraryQueryNoDur).sort({ _id: -1 });
                    searchMode = 'itinerary-no-duration';
                }
            }

        } else if (destStr) {
            // Normal destination field search for all other destinations
            const destQuery = { ...buildSharedFilters(), destination: { $regex: destStr, $options: 'i' } };
            packages = await Package.find(destQuery).sort({ _id: -1 });
            searchMode = 'destination';
        } else {
            return res.status(400).json({ status: 'error', error: 'Destination is required.' });
        }

        const results = formatResults(packages);

        console.log(`🔍 /search — destination: "${destStr || '—'}", title: "${titleStr || '—'}" (mode: ${searchMode}), duration: "${duration}", pax: ${paxNum}, category: "${category || 'any'}" → ${results.length} result(s)`);

        res.status(200).json({ status: 'ok', data: results });

    } catch (error) {
        console.error('❌ Error in /search:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// ============================================================
// ✅ DISTINCT DESTINATIONS ENDPOINT
// GET /api/packages/destinations?category=International
//
// Returns distinct destinations across all active packages,
// optionally filtered by category, with package counts. Used by
// the funnel booking form's International destination grid.
// is 100% data-driven (no hard-coded names or photos).
//
// Response: { status:'ok', data:[ { name, count }, ... ] }
// ============================================================
router.get('/destinations', requireSameOrigin, async (req, res) => {
    try {
        const { category } = req.query;
        const match = { isArchive: 'No' };

        if (category && category.trim() !== '') {
            const cat = category.trim().toLowerCase();
            if (cat.startsWith('inter')) {
                match.category = { $regex: 'Internation', $options: 'i' };
            } else if (cat.startsWith('local')) {
                match.category = { $regex: '^Local$', $options: 'i' };
            } else {
                match.category = { $regex: category.trim(), $options: 'i' };
            }
        }

        // Group by trimmed destination, count packages. Skip docs with a blank destination.
        // Images are intentionally excluded — the form uses its own curated photos.
        const grouped = await Package.aggregate([
            { $match: match },
            { $group: { _id: { $trim: { input: { $ifNull: ['$destination', ''] } } }, count: { $sum: 1 } } },
            { $match: { _id: { $ne: '' } } },
            { $project: { _id: 0, name: '$_id', count: 1 } },
            { $sort: { name: 1 } }
        ]);

        console.log(`📍 /destinations — category: "${category || 'all'}" → ${grouped.length} destination(s)`);
        res.status(200).json({ status: 'ok', data: grouped });

    } catch (error) {
        console.error('❌ Error in /destinations:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// 8. FETCH SINGLE PACKAGE — public, no cost data (Generic ID routes must be last)
router.get('/:id', requireSameOrigin, async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id).select(PUBLIC_SELECT);
        if (!pkg) return res.status(404).json({ status: 'error', error: 'Package not found.' });
        res.status(200).json({ status: 'ok', data: pkg });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Failed to retrieve package data.' });
    }
});

module.exports = router;