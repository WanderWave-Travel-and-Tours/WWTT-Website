const express = require('express');
const router = express.Router();
const { uploadGeneric } = require('../config/cloudinary');

router.post('/documents', uploadGeneric.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      filePath: req.file.path // Cloudinary URL
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;