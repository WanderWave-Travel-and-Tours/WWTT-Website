const express = require('express');
const router = express.Router();
const {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  permanentDeleteHotel,
  toggleFeatured,
  getFeaturedHotels,
  getHotelsByCity,
  updateRating,
  getHotelStats
} = require('../controllers/hotelController');

// Import middleware if you have authentication
// const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllHotels);
router.get('/featured', getFeaturedHotels);
router.get('/stats', getHotelStats); // If you want this public
router.get('/city/:city', getHotelsByCity);
router.get('/:id', getHotelById);

// Protected routes (uncomment and add middleware when you have auth)
// Admin only routes
router.post('/', createHotel); // Add: protect, authorize('admin')
router.put('/:id', updateHotel); // Add: protect, authorize('admin')
router.delete('/:id', deleteHotel); // Add: protect, authorize('admin')
router.delete('/:id/permanent', permanentDeleteHotel); // Add: protect, authorize('admin')
router.patch('/:id/featured', toggleFeatured); // Add: protect, authorize('admin')

// User routes (for ratings)
router.patch('/:id/rating', updateRating); // Add: protect

module.exports = router;