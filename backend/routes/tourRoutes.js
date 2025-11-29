const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const tourController = require('../controller/tourController');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/add', upload.single('image'), tourController.createTour);
router.get('/all', tourController.getAllTours);

module.exports = router;