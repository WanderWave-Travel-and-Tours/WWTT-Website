const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import ang Controller na may Activity Logs
const { 
    addTestimonial, 
    getAllTestimonials, 
    getTestimonialById, 
    updateTestimonial, 
    archiveTestimonial 
} = require('../controller/testimonialController');
const authMiddleware = require('../middleware/auth');

// --- MULTER CONFIGURATION ---
// Ito ang bahala sa pag-save ng image sa 'uploads' folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- ROUTES MAPPING ---

// 1. Create Testimonial (with Image Upload)
// Ang logic ay nasa 'addTestimonial' sa controller
// Admin-authored testimonials (admin dashboard), not public submissions.
router.post('/', authMiddleware, upload.single('customerImage'), addTestimonial);

// 2. Get All Testimonials
router.get('/', getAllTestimonials);

// 3. Get Single Testimonial by ID
router.get('/:id', getTestimonialById);

// 4. Update Testimonial (with Image Upload)
router.put('/update/:id', authMiddleware, upload.single('customerImage'), updateTestimonial);

// 5. Archive / Restore Testimonial
router.patch('/:id', authMiddleware, archiveTestimonial);

module.exports = router;