const router = require('express').Router();
const Hotel = require('../models/hotel'); // Siguraduhin tama ang path sa Model
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- MULTER CONFIG (Image Upload) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Setup for handling multiple fields: 'mainImage' (single) and 'galleryImages' (multiple)
const uploadFields = upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 } // Allow up to 10 gallery images at once
]);


// --- ROUTES ---

// 1. GET ALL ACTIVE HOTELS
router.get("/", async (req, res) => {
    try {
        const hotels = await Hotel.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: hotels });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. GET SINGLE HOTEL
router.get("/:id", async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        res.status(200).json({ success: true, data: hotel });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. CREATE HOTEL
router.post("/", upload.single('mainImage'), async (req, res) => {
    try {
        const newHotel = new Hotel({
            ...req.body,
            mainImage: req.file ? req.file.filename : "", 
            isActive: true
        });
        // Parse amenities if sent as stringified JSON
        if (typeof req.body.amenities === 'string') {
             try { newHotel.amenities = JSON.parse(req.body.amenities); } catch (e) {}
        }
        const savedHotel = await newHotel.save();
        res.status(201).json({ success: true, data: savedHotel });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. UPDATE HOTEL (UPDATED for Multiple Images)
router.put("/update/:id", uploadFields, async (req, res) => {
    try {
        let updateData = { ...req.body };

        // --- Handle Main Image ---
        if (req.files && req.files['mainImage']) {
            updateData.mainImage = req.files['mainImage'][0].filename;
        }

        // --- Handle Gallery Images ---
        // 1. Kunin ang mga existing images na gustong i-retain ng user
        let finalImagesArray = [];
        if (updateData.existingImages) {
             try {
                const existingUrls = JSON.parse(updateData.existingImages);
                // Convert back to object structure needed by schema
                finalImagesArray = existingUrls.map(url => ({ url: url }));
             } catch (e) {
                 console.error("Error parsing existingImages:", e);
             }
            delete updateData.existingImages; // Clean up req body
        }

        // 2. Idagdag ang mga bagong upload na gallery images
        if (req.files && req.files['galleryImages']) {
            const newImageObjects = req.files['galleryImages'].map(file => ({
                url: file.filename
            }));
            finalImagesArray = [...finalImagesArray, ...newImageObjects];
        }

        // Only update the images field if there are changes
        if (finalImagesArray.length > 0 || (req.files && req.files['galleryImages'])) {
             updateData.images = finalImagesArray;
        }

        // --- Handle Amenities Parsing ---
        if (typeof updateData.amenities === 'string') {
             try {
                 updateData.amenities = JSON.parse(updateData.amenities);
             } catch (e) { /* ignore */ }
        }

        const updatedHotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedHotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        res.status(200).json({ success: true, message: "Hotel updated", data: updatedHotel });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. ARCHIVE / SOFT DELETE (Used by Modal)
router.delete("/:id", async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found" });
        res.status(200).json({ success: true, message: "Hotel archived successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;