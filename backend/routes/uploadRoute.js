const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Siguraduhin na may 'uploads' folder
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Dito ise-save yung files
  },
  filename: function (req, file, cb) {
    // Lalagyan ng timestamp para unique ang filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST route para sa '/api/uploads/documents'
// Note: 'file' ang name kasi sa React code mo: formData.append("file", file);
router.post('/documents', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Ito yung response na inaasahan ng React code mo
    res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      // Ibalik ang path na pwedeng ma-access sa frontend
      filePath: `https://wanderwaveph-backend.onrender.com/uploads/${req.file.filename}` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;