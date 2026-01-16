const express = require('express');
const router = express.Router();
const { 
    addBlog, 
    getAllBlogs, 
    getBlogById, 
    getArchivedBlogs, 
    deleteBlog, 
    updateBlog,
    generateGeminiContent,
    searchUnsplashImages, // ✅ UPDATED: Renamed from Pexels
    downloadUnsplashImage, // ✅ UPDATED: Renamed from Pexels
    getCuratedImages  // ✅ This uses Unsplash logic now
} = require('../controller/blogController');
const { uploadBlog } = require('../config/cloudinary');

// AI Generation
router.post('/generate-ai', generateGeminiContent);

// =============================================================================
// 🌍 UNSPLASH INTEGRATION ROUTES (Updated)
// =============================================================================
// Note: Frontend calls these endpoints specifically
router.get('/search-unsplash', searchUnsplashImages);
router.get('/curated-unsplash', getCuratedImages); 
router.post('/download-unsplash', downloadUnsplashImage);

// =============================================================================
// 📝 CRUD OPERATIONS
// =============================================================================
router.post('/add', uploadBlog.single('image'), addBlog);
router.get('/', getAllBlogs);
router.get('/archived', getArchivedBlogs);
router.get('/:id', getBlogById);
router.put('/update/:id', uploadBlog.single('image'), updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;