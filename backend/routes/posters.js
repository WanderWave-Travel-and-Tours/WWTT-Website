const express = require('express');
const router = express.Router();
const { 
    addPoster, 
    getAllPosters, 
    getActivePosters, 
    getPosterById,
    updatePoster,
    deletePoster, 
    updatePosterStatus 
} = require('../controller/posterController');
const { uploadPoster } = require('../config/cloudinary');

router.post('/add', uploadPoster.single('image'), addPoster);
router.put('/update/:id', uploadPoster.single('image'), updatePoster);
router.get('/', getAllPosters);
router.get('/active', getActivePosters);
router.get('/:id', getPosterById);
router.put('/:id/status', updatePosterStatus);
router.delete('/:id', deletePoster);

module.exports = router;