const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    addPoster, 
    getAllPosters, 
    getActivePosters, 
    getPosterById,       // IMPORTED
    updatePoster,        // IMPORTED
    deletePoster, 
    updatePosterStatus 
} = require('../controller/posterController');

// Configuration para sa Multer (File Uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

/**
 * ROUTES
 */

// Magdagdag ng bagong poster
router.post('/add', upload.single('image'), addPoster);

// Update Poster (Full Edit with Image) - NEW ROUTE
router.put('/update/:id', upload.single('image'), updatePoster);

// Kunin ang lahat ng posters
router.get('/', getAllPosters);

// Kunin ang mga active posters
router.get('/active', getActivePosters);

// Get Single Poster by ID (For Edit Page) - NEW ROUTE
// NOTE: Dapat ito nasa ilalim ng /active para hindi ma-catch ng :id ang salitang "active"
router.get('/:id', getPosterById);

// Update Status only
router.put('/:id/status', updatePosterStatus);

// Delete Poster
router.delete('/:id', deletePoster);

module.exports = router;