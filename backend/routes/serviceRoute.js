const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  getAllServices,
  getServicesByCategory,
  getService,
  createService,
  updateService,
  deleteService,
  getAllServicesForAdmin
} = require('../controller/serviceController');
const authMiddleware = require('../middleware/auth');

// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- ROUTES ---

// Public Routes
router.get('/', getAllServices);
router.get('/category/:category', getServicesByCategory);
router.get('/:id', getService);

// Admin Routes
router.get('/admin/all', authMiddleware, getAllServicesForAdmin);

// Create & Update (Need upload middleware for image)
router.post('/', authMiddleware, upload.single('image'), createService);
router.put('/:id', authMiddleware, upload.single('image'), updateService);

// Delete
router.delete('/:id', authMiddleware, deleteService);

module.exports = router;