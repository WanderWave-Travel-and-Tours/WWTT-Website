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
    searchUnsplashImages, 
    downloadUnsplashImage, 
    getCuratedImages,
    generateAIContent,
    createFromSEOAutopilot
} = require('../controller/blogController');
const { uploadBlog } = require('../config/cloudinary');
const authMiddleware = require('../middleware/auth');

// AI Generation
// AI generation + Unsplash helpers are admin authoring tools (they burn paid
// API quota), so they are admin-only.
router.post('/generate-ai', authMiddleware, generateGeminiContent);
router.get('/search-unsplash', searchUnsplashImages);
router.get('/curated-unsplash', getCuratedImages); 
router.post('/download-unsplash', authMiddleware, downloadUnsplashImage);
router.post("/generate-ai-content", authMiddleware, generateAIContent);  // Add this route


// =============================================================================
// 📝 CRUD OPERATIONS
// =============================================================================
// Reads stay public (blog is public content); writes are admin-only.
router.post('/add', authMiddleware, uploadBlog.single('image'), addBlog);
router.get('/', getAllBlogs);
router.get('/archived', authMiddleware, getArchivedBlogs);
router.get('/:id', getBlogById);
router.put('/update/:id', authMiddleware, uploadBlog.single('image'), updateBlog);
router.delete('/:id', authMiddleware, deleteBlog);
// ⚠️ External SEO-autopilot integration — cannot carry an admin JWT, so it
// stays open. It should be authenticated with a shared secret/HMAC header
// instead; leaving as-is here to avoid breaking the integration.
router.post('/webhook/seo-autopilot', createFromSEOAutopilot);
module.exports = router;