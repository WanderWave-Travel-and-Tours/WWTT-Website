const express = require('express');
const router = express.Router();
const multer = require('multer');
const { addImage, getAllImages, deleteImage } = require('../controllers/imageController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

router.post('/add', upload.single('image'), addImage);
router.get('/', getAllImages);
router.delete('/:id', deleteImage);

module.exports = router;