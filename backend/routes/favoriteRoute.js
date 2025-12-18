// routes/favoriteRoute.js

const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { protect } = require('../middleware/authMiddleware'); // Import ng middleware

// Route 1: POST /api/favorites (Add or Remove Favorite)
// KAILANGAN NG 'protect' bago tawagin ang controller para ma-secure ang req.user.id
router.post('/', protect, favoritesController.toggleFavorite);

// Route 2: GET /api/favorites (Fetch User's Favorites)
// KAILANGAN DIN NG 'protect'
router.get('/', protect, favoritesController.getFavoritesByUser);

// Route 3: DELETE /api/favorites/:id (Remove Specific Favorite Document)
router.delete('/:id', protect, favoritesController.removeFavoriteById);

module.exports = router;