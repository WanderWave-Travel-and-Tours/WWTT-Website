const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    addBlog, 
    getAllBlogs, 
    getBlogById, 
    deleteBlog, 
    updateBlog 
} = require('../controller/blogController');

// Multer Config (Reuse logic)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Routes
router.post('/add', upload.single('image'), addBlog);
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);
router.delete('/:id', deleteBlog);
router.put('/:id', upload.single('image'), updateBlog); // Support image update

module.exports = router;