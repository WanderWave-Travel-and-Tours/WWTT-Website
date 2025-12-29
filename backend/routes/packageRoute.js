const router = require('express').Router();
const Package = require('../models/package');
const ActivityLog = require('../models/ActivityLog'); // Import Activity Log Model
const fs = require('fs');
const multer = require('multer'); 
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath); // Safety check
        cb(null, uploadPath); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ============================================================
// 1. ADD PACKAGE (WITH PRICE FIX & LOGGING & NULL ID FIX)
// ============================================================
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, destination, sellerPrice, markup, 
            duration, category, inclusions, itinerary,
            // Admin Info from Frontend
            userEmail, adminId 
        } = req.body;

        // FIX: Manual calc to avoid "Path price is required" error
        const calculatedPrice = Number(sellerPrice) + Number(markup);

        // FIX: Handle "null" string from FormData to avoid ObjectId CastError
        // Kung ang adminId ay string na "null", empty, o "undefined", gawin itong null value.
        let logUserId = null;
        if (adminId && adminId !== 'null' && adminId !== 'undefined' && adminId !== '') {
            logUserId = adminId;
        }

        const newPackage = new Package({
            title,
            destination,
            sellerPrice: Number(sellerPrice),
            markup: Number(markup),
            price: calculatedPrice, // Set explicitly
            duration,
            category,
            image: req.file ? req.file.filename : '',
            inclusions: inclusions ? JSON.parse(inclusions) : [],
            itinerary: itinerary ? JSON.parse(itinerary) : []
        });

        const savedPackage = await newPackage.save();

        // --- INSERT ACTIVITY LOG HERE ---
        await ActivityLog.create({
            action: 'CREATE',
            module: 'Packages',
            user: userEmail || 'System Admin', 
            userId: logUserId, // Gamitin ang sanitized ID
            severity: 'SUCCESS',
            description: `Created a new tour package: ${title}`,
            details: {
                recordTitle: title,
                recordId: savedPackage._id,
                method: 'POST',
                endpoint: '/api/packages/add'
            }
        });
        // --------------------------------

        res.status(200).json({ status: 'ok', message: 'Package added successfully!' });
    } catch (err) {
        console.error("Error adding package:", err); // Log error para madali makita
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// INITIALIZE ARCHIVE STATUS (Original Code)
router.get('/init-archive', async (req, res) => {
    try {
        const result = await Package.updateMany(
            { isArchive: { $exists: false } },
            { $set: { isArchive: 'No' } }
        );
        res.status(200).json({ 
            status: 'ok', 
            message: `Success! ${result.modifiedCount} documents updated.` 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// FETCH ALL ACTIVE (Original Code)
router.get('/all', async (req, res) => {
    try {
        const packages = await Package.find({ isArchive: 'No' }).sort({ _id: -1 });
        return res.status(200).json({ status: 'ok', data: packages });
    } catch (error) {
        return res.status(500).json({ status: 'error', error: 'Failed to retrieve packages.' });
    }
});

// FETCH ARCHIVED (Original Code)
router.get('/archived-list', async (req, res) => {
    try {
        const archived = await Package.find({ isArchive: 'Yes' }).sort({ _id: -1 });
        return res.status(200).json({ status: 'ok', data: archived });
    } catch (error) {
        return res.status(500).json({ status: 'error', error: error.message });
    }
});

// FETCH SINGLE (Original Code)
router.get('/:id', async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ status: 'error', error: 'Package not found.' });
        return res.status(200).json({ status: 'ok', data: pkg });
    } catch (error) {
        return res.status(500).json({ status: 'error', error: 'Failed to retrieve package data.' });
    }
});

// ============================================================
// 2. EDIT PACKAGE (WITH LOGGING INSERTED & ID FIX)
// ============================================================
router.put('/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, destination, sellerPrice, markup, duration, 
            category, existingImage, inclusions, itinerary,
            // Admin Info
            userEmail, adminId
        } = req.body;
        
        const updateData = {
            title,
            destination,
            sellerPrice: Number(sellerPrice),
            markup: Number(markup),
            price: Number(sellerPrice) + Number(markup),
            duration,
            category,
            inclusions: inclusions ? JSON.parse(inclusions) : [],
            itinerary: itinerary ? JSON.parse(itinerary) : [],
        };

        if (req.file) {
            updateData.image = req.file.filename;
            if (existingImage && existingImage !== 'placeholder.png') { 
                const oldPath = path.join(__dirname, '../uploads', existingImage);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        } else {
            updateData.image = existingImage;
        }

        const updatedPkg = await Package.findByIdAndUpdate(req.params.id, updateData, { new: true });

        // Sanitize ID
        let logUserId = null;
        if (adminId && adminId !== 'null' && adminId !== 'undefined' && adminId !== '') {
            logUserId = adminId;
        }

        // --- INSERT ACTIVITY LOG HERE ---
        await ActivityLog.create({
            action: 'UPDATE',
            module: 'Packages',
            user: userEmail || 'System Admin',
            userId: logUserId,
            severity: 'SUCCESS',
            description: `Updated tour package: ${title}`,
            details: {
                recordTitle: title,
                recordId: updatedPkg._id,
                method: 'PUT',
                endpoint: `/api/packages/edit/${req.params.id}`
            }
        });
        // --------------------------------

        res.json({ status: 'ok', message: 'Package updated successfully!' });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// ============================================================
// 3. ARCHIVE TOGGLE (WITH LOGGING INSERTED & ID FIX)
// ============================================================
router.post('/:id/archive', async (req, res) => {
    try {
        const { userEmail, adminId } = req.body; 

        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ status: "error", message: "Not found" });

        const newStatus = pkg.isArchive === 'Yes' ? 'No' : 'Yes';
        pkg.isArchive = newStatus;
        await pkg.save();

        const actionType = newStatus === 'Yes' ? 'ARCHIVE' : 'RESTORE';

        // Sanitize ID
        let logUserId = null;
        if (adminId && adminId !== 'null' && adminId !== 'undefined' && adminId !== '') {
            logUserId = adminId;
        }

        // --- INSERT ACTIVITY LOG HERE ---
        await ActivityLog.create({
            action: actionType, 
            module: 'Packages',
            user: userEmail || 'System Admin',
            userId: logUserId,
            severity: 'SUCCESS',
            description: `${actionType === 'ARCHIVE' ? 'Archived' : 'Restored'} package: ${pkg.title}`,
            details: {
                recordTitle: pkg.title,
                recordId: pkg._id,
                method: 'POST',
                endpoint: `/api/packages/${req.params.id}/archive`
            }
        });
        // --------------------------------

        res.json({ status: "ok", message: `Package status updated to ${newStatus}`, isArchive: newStatus });
    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
});

module.exports = router;