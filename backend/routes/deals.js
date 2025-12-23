const express = require('express');
const router = express.Router();
const multer = require('multer');
const { addDeal, getAllDeals, deleteDeal } = require('../controller/dealController');
const { uploadDeal } = require('../config/cloudinary');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

//router.post('/add', upload.single('image'), addDeal);
router.get('/', getAllDeals);
router.delete('/:id', deleteDeal);
router.post('/add', uploadDeal.single('image'), addDeal);
router.put('/update/:id', uploadDeal.single('image'), addDeal);


module.exports = router;