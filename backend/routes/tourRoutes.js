const express = require('express');
const router = express.Router();
const { uploadTour } = require('../config/cloudinary'); // ✅ Import Cloudinary tour uploader
const tourController = require('../controller/tourController');

// Routes - Using Cloudinary storage now
router.post('/add', uploadTour.single('image'), tourController.createTour);
router.get('/all', tourController.getAllTours);
router.get('/:id', tourController.getTourById);
router.put('/update/:id', uploadTour.single('image'), tourController.updateTour);

// PINALITAN: Mula .delete('/delete/:id') ginawang .patch('/archive/:id')
router.patch('/archive/:id', tourController.archiveTour);

module.exports = router;