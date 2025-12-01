const express = require('express');
const router = express.Router();

const { searchFlights } = require('../controller/flightController');

// ✅ FIX: Inimport ko lang yung natitirang function. Tinanggal ko na yung validateFlightPrice at getCheapestFlight.
const { 
  searchFlightPrices 
} = require('../controller/kiwiController');

const { 
  searchFlightOffers,
  getFlightPriceCalendar,
  getFlightPricePrediction,
  verifyCredentials
} = require('../controller/amadeusController');

// ✨ Aviationstack endpoints with enhanced caching
const { 
  searchFlights: searchFlightsAviationstack,
  getAirports,
  getAirlines,
  refreshAirportsCache,  // NEW: Manual cache refresh
  getCacheStatus         // NEW: Check cache status
} = require('../controller/aviationstackController');

// ✨ Hybrid search combining Amadeus + Aviationstack
const { searchFlightsHybrid } = require('../controller/hybridController');

// Verification
router.get('/verify-amadeus', verifyCredentials);

// 🚀 RECOMMENDED: Use hybrid search for maximum airline diversity
router.get('/search-prices', searchFlightsHybrid);

// Alternative: Use Amadeus only (if you want)
router.get('/search-prices-amadeus-only', searchFlightOffers);

// ✈️ AIRPORT & AIRLINE DATA ENDPOINTS
router.get('/airports', getAirports);              // Get airports with search (CACHED)
router.get('/airlines', getAirlines);              // Get airlines list
router.get('/airports/cache/status', getCacheStatus);    // NEW: Check cache status
router.post('/airports/cache/refresh', refreshAirportsCache); // NEW: Manually refresh cache

// Aviationstack flight search
router.get('/search-aviationstack', searchFlightsAviationstack);

// Other endpoints
router.get('/price-calendar', getFlightPriceCalendar);
router.get('/price-prediction', getFlightPricePrediction);

// ✅ KIWI SEARCH (RapidAPI)
router.get('/search-prices-kiwi', searchFlightPrices);

router.get('/search', searchFlights);

// ❌ FIX: Tinanggal ko na ang mga ito kasi wala na sila sa controller at nagpapa-crash lang:
// router.post('/validate-price', validateFlightPrice);
// router.get('/cheapest', getCheapestFlight);

module.exports = router;