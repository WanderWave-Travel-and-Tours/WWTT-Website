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

// Magdagdag ng bagong poster (Default isArchive: "No")
router.post('/add', upload.single('image'), addPoster);

// Kunin ang lahat ng posters (Kahit archived o hindi)
// Dito kinukuha ng Archive page ang data
router.get('/', getAllPosters);

// Kunin ang mga posters na 'Active' ang status AT isArchive: 'No'
// Dito kinukuha ng Homepage o UI ang ipapakitang banners
router.get('/active', getActivePosters);

// Burahin ang poster at ang file nito sa server permanently
router.delete('/:id', deletePoster);

// I-update ang status (Active/Inactive/Scheduled) O ang isArchive (Yes/No)
// Ginagamit ito ng Restore button sa frontend: papasahan ng { isArchive: "No" }
router.put('/:id/status', updatePosterStatus);

module.exports = router;