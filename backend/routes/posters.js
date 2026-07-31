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
const authMiddleware = require('../middleware/auth');

// Reads stay public (posters render on the site); writes are admin-only.
router.post('/add', authMiddleware, uploadPoster.single('image'), addPoster);
router.put('/update/:id', authMiddleware, uploadPoster.single('image'), updatePoster);
router.get('/', getAllPosters);
router.get('/active', getActivePosters);
router.get('/:id', getPosterById);
router.put('/:id/status', authMiddleware, updatePosterStatus);
router.delete('/:id', authMiddleware, deletePoster);

module.exports = router;