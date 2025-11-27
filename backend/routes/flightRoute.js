const express = require('express');
const router = express.Router();

// Import controllers
const { searchFlights } = require('../controller/flightController');
const { 
  searchFlightPrices, 
  validateFlightPrice, 
  getCheapestFlight 
} = require('../controller/kiwiController');
const { 
  searchFlightOffers,
  getFlightPriceCalendar,
  getFlightPricePrediction,
  verifyCredentials
} = require('../controller/amadeusController');

router.get('/verify-amadeus', verifyCredentials);
router.get('/search-prices', searchFlightOffers);
router.get('/price-calendar', getFlightPriceCalendar);
router.get('/price-prediction', getFlightPricePrediction);
router.get('/search-prices-kiwi', searchFlightPrices);
router.get('/search', searchFlights);
router.post('/validate-price', validateFlightPrice);
router.get('/cheapest', getCheapestFlight);

module.exports = router;