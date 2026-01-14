const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    addBlog, 
    getAllBlogs, 
    getBlogById, 
    getArchivedBlogs, 
    deleteBlog, 
    updateBlog 
} = require('../controller/blogController');
const { uploadBlog } = require('../config/cloudinary');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

router.post('/add', uploadBlog.single('image'), addBlog);
router.put('/update/:id', uploadBlog.single('image'), updateBlog);

router.get('/', getAllBlogs);
router.get('/archived', getArchivedBlogs);
router.get('/:id', getBlogById);
router.delete('/:id', deleteBlog); 
router.put('/:id', upload.single('image'), updateBlog); 

module.exports = router;