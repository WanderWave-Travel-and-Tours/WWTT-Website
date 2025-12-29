const router = require('express').Router();
const Package = require('../models/package');
const multer = require('multer'); 
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// CLOUDINARY CONFIG
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// CLOUDINARY STORAGE
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/packages',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 800, crop: 'limit' }]
    }
});

const upload = multer({ storage: storage });

// ============================================
// SPECIFIC ROUTES FIRST
// ============================================

// INITIALIZE ARCHIVE STATUS
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

// FETCH ALL ACTIVE
router.get('/all', async (req, res) => {
    try {
        const packages = await Package.find({ isArchive: 'No' }).sort({ _id: -1 });
        return res.status(200).json({ status: 'ok', data: packages });
    } catch (error) {
        return res.status(500).json({ status: 'error', error: 'Failed to retrieve packages.' });
    }
});

// FETCH ARCHIVED
router.get('/archived-list', async (req, res) => {
    try {
        const archived = await Package.find({ isArchive: 'Yes' }).sort({ _id: -1 });
        return res.status(200).json({ status: 'ok', data: archived });
    } catch (error) {
        return res.status(500).json({ status: 'error', error: error.message });
    }
});

// ============================================
// CREATE NEW PACKAGE (CLOUDINARY)
// ============================================
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        console.log('📥 POST /add - Creating new package...');

        const { 
            title, destination, sellerPrice, markup, 
            duration, category, inclusions, itinerary 
        } = req.body;

        if (!title || !destination || !sellerPrice || !duration || !category) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Missing required fields' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Image is required' 
            });
        }

        const sellerPriceNum = Number(sellerPrice) || 0;
        const markupNum = Number(markup) || 0;

        const newPackage = new Package({
            title,
            destination,
            sellerPrice: sellerPriceNum,
            markup: markupNum,
            price: sellerPriceNum + markupNum,
            duration,
            category,
            image: req.file.path, // Cloudinary URL
            imagePublicId: req.file.filename, // Cloudinary public_id
            inclusions: inclusions ? JSON.parse(inclusions) : [],
            itinerary: itinerary ? JSON.parse(itinerary) : [],
            isArchive: 'No'
        });

        await newPackage.save();

        console.log('✅ Package created:', newPackage._id);
        console.log('📸 Image URL:', req.file.path);

        res.status(201).json({
            status: 'ok',
            message: 'Package created successfully!',
            data: newPackage
        });

    } catch (err) {
        console.error('❌ Error:', err);
        
        // Cleanup uploaded image on error
        if (req.file?.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (e) {}
        }
        
        res.status(500).json({ 
            status: 'error', 
            error: err.message 
        });
    }
});

// ============================================
// EDIT PACKAGE (CLOUDINARY)
// ============================================
router.put('/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, destination, sellerPrice, markup, duration, 
            category, existingImage, existingImagePublicId, inclusions, itinerary 
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

        // If new image uploaded
        if (req.file) {
            updateData.image = req.file.path; // Cloudinary URL
            updateData.imagePublicId = req.file.filename; // Cloudinary public_id
            
            // Delete old image from Cloudinary
            if (existingImagePublicId) {
                try {
                    await cloudinary.uploader.destroy(existingImagePublicId);
                } catch (err) {
                    console.error('Failed to delete old image:', err);
                }
            }
        } else {
            updateData.image = existingImage;
            updateData.imagePublicId = existingImagePublicId;
        }

        await Package.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ status: 'ok', message: 'Package updated successfully!' });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// ============================================
// ARCHIVE TOGGLE
// ============================================
router.post('/:id/archive', async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ status: "error", message: "Not found" });

        const newStatus = pkg.isArchive === 'Yes' ? 'No' : 'Yes';
        pkg.isArchive = newStatus;
        await pkg.save();

        res.json({ status: "ok", message: `Package status updated to ${newStatus}`, isArchive: newStatus });
    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
});

// ============================================
// GENERIC ROUTES LAST
// ============================================

// FETCH SINGLE PACKAGE
router.get('/:id', async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ status: 'error', error: 'Package not found.' });
        return res.status(200).json({ status: 'ok', data: pkg });
    } catch (error) {
        return res.status(500).json({ status: 'error', error: 'Failed to retrieve package data.' });
    }
});

module.exports = router;