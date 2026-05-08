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

// ✅ FIX: Inuna ang /count route bago ang /:userId/:promoId
// Dati, nahaharang ng /:userId/:promoId ang /:userId/count kasi
// tinatrato ng Express ang "count" bilang isang promoId parameter.
// Get favorite count for a user
router.get('/:userId/count', getFavoriteCount);

// Check if a specific package is favorited
router.get('/:userId/:promoId', checkFavorite);

// Get all favorites for a user
router.get('/:userId', getUserFavorites);

// Clear all favorites for a user
router.delete('/:userId', clearAllFavorites);

module.exports = router;