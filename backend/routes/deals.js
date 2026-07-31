const express = require('express');
const router = express.Router();
const multer = require('multer');
const { addDeal, getAllDeals, deleteDeal } = require('../controller/dealController');
const { uploadDeal } = require('../config/cloudinary');
const authMiddleware = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

//router.post('/add', upload.single('image'), addDeal);
// Read stays public (deals shown on the site); writes are admin-only.
router.get('/', getAllDeals);
router.delete('/:id', authMiddleware, deleteDeal);
router.post('/add', authMiddleware, uploadDeal.single('image'), addDeal);
router.put('/update/:id', authMiddleware, uploadDeal.single('image'), addDeal);


module.exports = router;