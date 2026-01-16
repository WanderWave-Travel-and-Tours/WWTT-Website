const router = require('express').Router();
const Hotel = require('../models/hotel');
const { uploadHotel, cloudinary } = require('../config/cloudinary');

const uploadFields = uploadHotel.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
]);

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

router.get("/location/:location/rooms", async (req, res) => {
    try {
        const { location } = req.params;
        
        const hotels = await Hotel.find({ 
            isActive: true,
            isArchive: "No",
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

router.get("/", async (req, res) => {
    try {
        const hotels = await Hotel.find({ 
            isActive: true, 
            isArchive: "No"
        }).sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, data: hotels });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

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

router.post("/", uploadFields, async (req, res) => {
    try {
        console.log('📤 Uploading hotel with Cloudinary...');
        
        const hotelData = { ...req.body };
        
        if (req.files && req.files['mainImage']) {
            const mainFile = req.files['mainImage'][0];
            hotelData.mainImage = mainFile.path; 
            hotelData.imagePublicId = mainFile.filename; 
            console.log('✅ Main image uploaded to Cloudinary:', mainFile.path);
        }
        
        if (req.files && req.files['galleryImages']) {
            hotelData.images = req.files['galleryImages'].map(file => ({
                url: file.path,
                public_id: file.filename, 
                caption: ''
            }));
            console.log(`✅ ${req.files['galleryImages'].length} gallery images uploaded to Cloudinary`);
        }
        
        if (typeof hotelData.amenities === 'string') {
            try {
                hotelData.amenities = JSON.parse(hotelData.amenities);
                console.log('✅ Parsed amenities');
            } catch (e) {
                console.error('❌ Error parsing amenities:', e);
            }
        }
        
        if (typeof hotelData.roomTypes === 'string') {
            try {
                hotelData.roomTypes = JSON.parse(hotelData.roomTypes);
                console.log('✅ Parsed roomTypes:', hotelData.roomTypes);
            } catch (e) {
                console.error('❌ Error parsing roomTypes:', e);
            }
        }
        
        hotelData.isActive = true;
        hotelData.isArchive = "No";
        
        const newHotel = new Hotel(hotelData);
        const savedHotel = await newHotel.save();
        
        console.log('✅ Hotel created successfully:', savedHotel.name);
        res.status(201).json({ success: true, data: savedHotel });
    } catch (err) {
        console.error('❌ Error creating hotel:', err);
        
        if (req.files) {
            if (req.files['mainImage']) {
                await cloudinary.uploader.destroy(req.files['mainImage'][0].filename);
            }
            if (req.files['galleryImages']) {
                for (const file of req.files['galleryImages']) {
                    await cloudinary.uploader.destroy(file.filename);
                }
            }
        }
        
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put("/update/:id", uploadFields, async (req, res) => {
    try {
        console.log('🔄 Updating hotel with Cloudinary...');
        
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        
        let updateData = { ...req.body };
        
        if (req.files && req.files['mainImage']) {
            const mainFile = req.files['mainImage'][0];
            
            if (hotel.imagePublicId) {
                await cloudinary.uploader.destroy(hotel.imagePublicId);
                console.log('🗑️ Old main image deleted from Cloudinary');
            }
            
            updateData.mainImage = mainFile.path;
            updateData.imagePublicId = mainFile.filename;
            console.log('✅ New main image uploaded to Cloudinary:', mainFile.path);
        }
        
        let finalImagesArray = [];
        
        if (updateData.existingImages) {
            try {
                const existingUrls = JSON.parse(updateData.existingImages);
                finalImagesArray = hotel.images.filter(img => existingUrls.includes(img.url));
            } catch (e) {
                console.error("Error parsing existingImages:", e);
            }
            delete updateData.existingImages;
        }
        
        if (req.files && req.files['galleryImages']) {
            const newImageObjects = req.files['galleryImages'].map(file => ({
                url: file.path,
                public_id: file.filename,
                caption: ''
            }));
            finalImagesArray = [...finalImagesArray, ...newImageObjects];
            console.log(`✅ ${req.files['galleryImages'].length} new gallery images uploaded`);
        }
        
        const existingUrls = finalImagesArray.map(img => img.url);
        const imagesToDelete = hotel.images.filter(img => !existingUrls.includes(img.url));
        for (const img of imagesToDelete) {
            if (img.public_id) {
                await cloudinary.uploader.destroy(img.public_id);
                console.log('🗑️ Removed gallery image from Cloudinary:', img.public_id);
            }
        }
        
        if (finalImagesArray.length > 0) {
            updateData.images = finalImagesArray;
        }
        D
        if (typeof updateData.amenities === 'string') {
            try {
                updateData.amenities = JSON.parse(updateData.amenities);
            } catch (e) {
                console.error('Error parsing amenities:', e);
            }
        }
        
        if (typeof updateData.roomTypes === 'string') {
            try {
                updateData.roomTypes = JSON.parse(updateData.roomTypes);
                console.log('✅ Parsed roomTypes for update');
            } catch (e) {
                console.error('Error parsing roomTypes:', e);
            }
        }
        
        const updatedHotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        console.log('✅ Hotel updated successfully:', updatedHotel.name);
        res.status(200).json({ success: true, message: "Hotel updated", data: updatedHotel });
    } catch (err) {
        console.error("❌ Update Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

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
        
        console.log('📦 Hotel archived (images kept in Cloudinary):', hotel.name);
        res.status(200).json({ 
            success: true, 
            message: "Hotel moved to archive successfully", 
            data: hotel 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete("/permanent/:id", async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        
        if (hotel.imagePublicId) {
            await cloudinary.uploader.destroy(hotel.imagePublicId);
            console.log('🗑️ Main image deleted from Cloudinary:', hotel.imagePublicId);
        }
        
        if (hotel.images && hotel.images.length > 0) {
            for (const img of hotel.images) {
                if (img.public_id) {
                    await cloudinary.uploader.destroy(img.public_id);
                    console.log('🗑️ Gallery image deleted from Cloudinary:', img.public_id);
                }
            }
        }
        
        await Hotel.findByIdAndDelete(req.params.id);
        
        console.log('✅ Hotel permanently deleted:', hotel.name);
        res.status(200).json({ 
            success: true, 
            message: "Hotel and all images permanently deleted" 
        });
    } catch (err) {
        console.error("❌ Error permanently deleting hotel:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;