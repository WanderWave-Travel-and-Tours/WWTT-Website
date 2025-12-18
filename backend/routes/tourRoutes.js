const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const tourController = require('../controller/tourController');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// Routes
router.post('/add', upload.single('image'), tourController.createTour);
router.get('/all', tourController.getAllTours);
router.get('/:id', tourController.getTourById);
router.put('/update/:id', upload.single('image'), tourController.updateTour);

// PINALITAN: Mula .delete('/delete/:id') ginawang .patch('/archive/:id')
router.patch('/archive/:id', tourController.archiveTour);

module.exports = router;  