const router = require('express').Router();
const Package = require('../models/package');
const fs = require('fs');
const multer = require('multer'); 
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

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

// FETCH ALL ACTIVE (Dito mo sinet na "No" lang ang lalabas)
router.get('/all', async (req, res) => {
    try {
        // Sinisiguro na ang kinukuha lang ay isArchive: "No"
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

// FETCH SINGLE
router.get('/:id', async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ status: 'error', error: 'Package not found.' });
        return res.status(200).json({ status: 'ok', data: pkg });
    } catch (error) {
        return res.status(500).json({ status: 'error', error: 'Failed to retrieve package data.' });
    }
});

// EDIT PACKAGE
router.put('/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { 
            title, destination, sellerPrice, markup, duration, 
            category, existingImage, inclusions, itinerary 
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

        await Package.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ status: 'ok', message: 'Package updated successfully!' });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// ARCHIVE TOGGLE (Eto ang magpapalit ng status sa "Yes")
router.post('/:id/archive', async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ status: "error", message: "Not found" });

        // Kapag pinindot ang Archive, gagawin nating "Yes" ang status
        const newStatus = pkg.isArchive === 'Yes' ? 'No' : 'Yes';
        pkg.isArchive = newStatus;
        await pkg.save();

        res.json({ status: "ok", message: `Package status updated to ${newStatus}`, isArchive: newStatus });
    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
});

module.exports = router;