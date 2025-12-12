const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    addPoster, 
    getAllPosters, 
    getActivePosters, 
    deletePoster, 
    updatePosterStatus 
} = require('../controller/posterController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.post('/add', upload.single('image'), addPoster);
router.get('/', getAllPosters);
router.get('/active', getActivePosters);
router.delete('/:id', deletePoster);
router.put('/:id/status', updatePosterStatus);

module.exports = router;