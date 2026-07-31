const express = require('express');
const router = express.Router();

const { searchFlights } = require('../controller/flightController');

const { 
  searchFlightPrices 
} = require('../controller/kiwiController');

const { 
  searchFlightOffers,
  getFlightPriceCalendar,
  getFlightPricePrediction,
  verifyCredentials
} = require('../controller/amadeusController');

const { 
  searchFlights: searchFlightsAviationstack,
  getAirports,
  getAirlines,
  refreshAirportsCache, 
  getCacheStatus        
} = require('../controller/aviationstackController');

const { searchFlightsHybrid } = require('../controller/hybridController');
const { searchDomesticFlights } = require('../controller/serpApiController');
const authMiddleware = require('../middleware/auth');

// Ops/diagnostic endpoint — reports whether Amadeus credentials are valid.
// Admin-only: no frontend caller, and it confirms credential state to anyone.
router.get('/verify-amadeus', authMiddleware, verifyCredentials);
router.get('/search-prices', searchFlightsHybrid);
router.get('/search-prices-amadeus-only', searchFlightOffers);

router.get('/airports', getAirports);              
router.get('/airlines', getAirlines);            
router.get('/airports/cache/status', authMiddleware, getCacheStatus);
// Admin-only: a full airport-cache rebuild burns paid AviationStack API quota,
// so an anonymous caller could run up the bill by hammering this.
router.post('/airports/cache/refresh', authMiddleware, refreshAirportsCache);

router.get('/search-aviationstack', searchFlightsAviationstack);

router.get('/price-calendar', getFlightPriceCalendar);
router.get('/price-prediction', getFlightPricePrediction);

router.get('/search-prices-kiwi', searchFlightPrices);
router.get('/search', searchFlights);

router.get('/search-domestic', searchDomesticFlights);

module.exports = router;