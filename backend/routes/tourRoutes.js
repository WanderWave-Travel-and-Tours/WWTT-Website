const express = require('express');
const router = express.Router();
const { uploadTour } = require('../config/cloudinary'); // ✅ Import Cloudinary tour uploader
const tourController = require('../controller/tourController');
const authMiddleware = require('../middleware/auth');

// Routes - Using Cloudinary storage now
// Reads stay public (tour catalog); writes are admin-only.
router.post('/add', authMiddleware, uploadTour.single('image'), tourController.createTour);
router.get('/all', tourController.getAllTours);
router.get('/:id', tourController.getTourById);
router.put('/update/:id', authMiddleware, uploadTour.single('image'), tourController.updateTour);

// PINALITAN: Mula .delete('/delete/:id') ginawang .patch('/archive/:id')
router.patch('/archive/:id', authMiddleware, tourController.archiveTour);

module.exports = router;