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
    generateAIContent
} = require('../controller/blogController');
const { uploadBlog } = require('../config/cloudinary');

// AI Generation
router.post('/generate-ai', generateGeminiContent);
router.get('/search-unsplash', searchUnsplashImages);
router.get('/curated-unsplash', getCuratedImages); 
router.post('/download-unsplash', downloadUnsplashImage);
router.post("/generate-ai-content", generateAIContent);  // Add this route


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