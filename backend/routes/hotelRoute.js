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
  getHotelStats,
  updateRoomTypes,
  getRoomTypesByLocation
} = require('../controller/hotelController');

router.get('/', getAllHotels);
router.get('/featured', getFeaturedHotels);
router.get('/stats', getHotelStats);
router.get('/city/:city', getHotelsByCity);
router.get('/location/:location/rooms', getRoomTypesByLocation);
router.get('/:id', getHotelById);

router.post('/', createHotel); 
router.put('/:id', updateHotel); 
router.delete('/:id', deleteHotel); 
router.delete('/:id/permanent', permanentDeleteHotel);
router.patch('/:id/featured', toggleFeatured); 

router.patch('/:id/rating', updateRating); 
router.patch('/:id/room-types', updateRoomTypes);

module.exports = router;