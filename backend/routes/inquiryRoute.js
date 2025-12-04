const express = require('express');
const {
  createInquiry,
  getAllInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiriesByEmail,
  getInquiryStats
} = require('../controller/inquiryController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Siguraduhing may 'uploads' folder ka sa root
  },
  filename: function (req, file, cb) {
    cb(null, 'evidence-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post('/', createInquiry);
router.get('/email/:email', getInquiriesByEmail);

router.get('/', getAllInquiries);
router.get('/stats', getInquiryStats);
router.get('/:id', getInquiry);
//router.put('/:id', updateInquiryStatus);
router.delete('/:id', deleteInquiry);
router.put('/:id/status', upload.single('evidence'), updateInquiryStatus);

module.exports = router;