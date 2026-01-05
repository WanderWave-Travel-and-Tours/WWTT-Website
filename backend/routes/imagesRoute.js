const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { addImage, getAllImages, archiveImage } = require('../controller/imageController');

// ✅ 1. CLOUDINARY CONFIG (same as package route)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ 2. CLOUDINARY STORAGE CONFIGURATION
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/gallery', // Separate folder for gallery images
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ width: 1920, height: 1080, crop: 'limit' }] // HD quality
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ✅ 3. ROUTES (CLEAN - NO DUPLICATES)
router.post('/add', upload.single('image'), addImage);
router.get('/', getAllImages);
router.patch('/:id', archiveImage); 

module.exports = router;