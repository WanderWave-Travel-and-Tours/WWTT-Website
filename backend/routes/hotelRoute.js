const router = require('express').Router();
const Hotel = require('../models/hotel');
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

const uploadFields = upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
]);

// --- ROUTES ---

// IMPORTANT: SPECIFIC ROUTES MUST COME BEFORE DYNAMIC ROUTES (/:id)

// 1. GET ALL ARCHIVED HOTELS (MUST BE BEFORE /:id)
router.get("/archived", async (req, res) => {
    try {
        const archivedHotels = await Hotel.find({ isArchive: "Yes" }).sort({ archivedAt: -1 });
        
        res.status(200).json({ 
            success: true, 
            count: archivedHotels.length,
            data: archivedHotels 
        });
    } catch (err) {
        console.error("Error fetching archived hotels:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. RESTORE FROM ARCHIVE (MUST BE BEFORE /:id)
router.put("/restore/:id", async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            { 
                isArchive: "No", 
                isActive: true,
                archivedAt: null 
            },
            { new: true }
        );
        
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        
        res.status(200).json({ 
            success: true, 
            message: "Hotel restored successfully", 
            data: hotel 
        });
    } catch (err) {
        console.error("Error restoring hotel:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. GET HOTELS BY LOCATION WITH ROOM TYPES (MUST BE BEFORE /:id)
router.get("/location/:location/rooms", async (req, res) => {
    try {
        const { location } = req.params;
        
        const hotels = await Hotel.find({ 
            isActive: true,
            isArchive: "No", // Only show non-archived hotels
            $or: [
                { location: new RegExp(location, 'i') },
                { city: new RegExp(location, 'i') }
            ]
        }).sort({ rating: -1 });

        if (!hotels || hotels.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: `No hotels found in ${location}` 
            });
        }

        const roomsData = hotels.map(hotel => ({
            hotelId: hotel._id,
            hotelName: hotel.name,
            hotelLocation: hotel.location,
            hotelRating: hotel.rating,
            hotelImage: hotel.mainImage,
            roomTypes: hotel.roomTypes || []
        }));

        res.status(200).json({ 
            success: true, 
            data: roomsData,
            count: hotels.length
        });
    } catch (err) {
        console.error('Error fetching rooms by location:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. GET ALL ACTIVE HOTELS (MUST BE BEFORE /:id)
router.get("/", async (req, res) => {
    try {
        const hotels = await Hotel.find({ 
            isActive: true, 
            isArchive: "No" // Only show non-archived hotels
        }).sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, data: hotels });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. GET SINGLE HOTEL (DYNAMIC ROUTE - MUST BE AFTER SPECIFIC ROUTES)
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

// 6. CREATE HOTEL
router.post("/", upload.single('mainImage'), async (req, res) => {
    try {
        const newHotel = new Hotel({
            ...req.body,
            mainImage: req.file ? req.file.filename : "", 
            isActive: true,
            isArchive: "No" // Default value
        });
        
        if (typeof req.body.amenities === 'string') {
             try { newHotel.amenities = JSON.parse(req.body.amenities); } catch (e) {}
        }
        
        const savedHotel = await newHotel.save();
        res.status(201).json({ success: true, data: savedHotel });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 7. UPDATE HOTEL
router.put("/update/:id", uploadFields, async (req, res) => {
    try {
        let updateData = { ...req.body };

        if (req.files && req.files['mainImage']) {
            updateData.mainImage = req.files['mainImage'][0].filename;
        }

        let finalImagesArray = [];
        if (updateData.existingImages) {
             try {
                const existingUrls = JSON.parse(updateData.existingImages);
                finalImagesArray = existingUrls.map(url => ({ url: url }));
             } catch (e) {
                 console.error("Error parsing existingImages:", e);
             }
            delete updateData.existingImages;
        }

        if (req.files && req.files['galleryImages']) {
            const newImageObjects = req.files['galleryImages'].map(file => ({
                url: file.filename
            }));
            finalImagesArray = [...finalImagesArray, ...newImageObjects];
        }

        if (finalImagesArray.length > 0 || (req.files && req.files['galleryImages'])) {
             updateData.images = finalImagesArray;
        }

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

// 8. ARCHIVE HOTEL (Soft Delete)
router.put("/archive/:id", async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            { 
                isArchive: "Yes", 
                isActive: false,
                archivedAt: new Date() 
            },
            { new: true }
        );
        
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        
        res.status(200).json({ 
            success: true, 
            message: "Hotel moved to archive successfully", 
            data: hotel 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;