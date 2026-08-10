const express = require('express');
const router = express.Router();
const { uploadTour } = require('../config/cloudinary'); // ✅ Import Cloudinary tour uploader
const tourController = require('../controller/tourController');
const authMiddleware = require('../middleware/auth');
const optionalAdmin = require('../middleware/optionalAdmin');

// Routes - Using Cloudinary storage now
// Reads stay public (tour catalog); writes are admin-only.
router.post('/add', authMiddleware, uploadTour.single('image'), tourController.createTour);
// optionalAdmin never rejects — it just sets req.isAdmin so the controller can
// pick a projection. Anonymous callers get tours without sellerPrice/markup.
router.get('/all', optionalAdmin, tourController.getAllTours);
router.get('/:id', optionalAdmin, tourController.getTourById);
router.put('/update/:id', authMiddleware, uploadTour.single('image'), tourController.updateTour);

// PINALITAN: Mula .delete('/delete/:id') ginawang .patch('/archive/:id')
router.patch('/archive/:id', authMiddleware, tourController.archiveTour);

module.exports = router;