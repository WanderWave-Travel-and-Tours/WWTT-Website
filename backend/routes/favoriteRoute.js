// backend/routes/favoriteRoute.js - COMPLETE CODE
const router = require('express').Router();
const { 
    toggleFavorite, 
    getUserFavorites, 
    checkFavorite, 
    clearAllFavorites,
    getFavoriteCount
} = require('../controller/favoritesController');

// Toggle favorite (add or remove)
router.post('/', toggleFavorite);

// Get all favorites for a user
router.get('/:userId', getUserFavorites);

// Get favorite count for a user
router.get('/:userId/count', getFavoriteCount);

// Check if a specific package is favorited
router.get('/:userId/:promoId', checkFavorite);

// Clear all favorites for a user
router.delete('/:userId', clearAllFavorites);

module.exports = router;