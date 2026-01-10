const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Blog Images Storage
const blogStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/blogs',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 800, crop: 'limit' }]
    }
});

// Deal Images Storage
const dealStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/deals',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 600, crop: 'limit' }]
    }
});

// Gallery Images Storage
const galleryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/gallery',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1920, height: 1080, crop: 'limit' }]
    }
});

// Poster Images Storage
const posterStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/posters',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1600, crop: 'limit' }]
    }
});

// Documents Storage (PDF, Images, Word)
const documentStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
        resource_type: 'auto',
        type: 'upload',
        access_mode: 'public' // ✅ Make files public
    }
});

// Evidence Storage
const evidenceStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/evidence',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto'
    }
});

// Generic Upload Storage
const genericStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'wanderwave/uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
        resource_type: 'auto'
    }
});

// Export multer instances
module.exports = {
    cloudinary,
    uploadBlog: multer({ storage: blogStorage }),
    uploadDeal: multer({ storage: dealStorage }),
    uploadGallery: multer({ storage: galleryStorage }),
    uploadPoster: multer({ storage: posterStorage }),
    uploadDocument: multer({ storage: documentStorage, limits: { fileSize: 10 * 1024 * 1024 } }),
    uploadEvidence: multer({ storage: evidenceStorage }),
    uploadGeneric: multer({ storage: genericStorage })
};