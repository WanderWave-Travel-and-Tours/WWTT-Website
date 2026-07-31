// ⚠️ NOT MOUNTED. server.js never calls app.use('/api/deals', ...), and no
// caller exists in the public frontend or the admin bundle, so every route in
// this file is currently unreachable (requests return 404 from the API
// catch-all). Auth is applied below anyway so that mounting it later is safe
// by default. Decide to either wire it up or delete the file + controller +
// model — leaving it half-present invites someone mounting it unguarded.
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