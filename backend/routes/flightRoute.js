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

router.get('/verify-amadeus', verifyCredentials);
router.get('/search-prices', searchFlightsHybrid);
router.get('/search-prices-amadeus-only', searchFlightOffers);

router.get('/airports', getAirports);              
router.get('/airlines', getAirlines);            
router.get('/airports/cache/status', getCacheStatus);   
router.post('/airports/cache/refresh', refreshAirportsCache); 

router.get('/search-aviationstack', searchFlightsAviationstack);

router.get('/price-calendar', getFlightPriceCalendar);
router.get('/price-prediction', getFlightPricePrediction);

router.get('/search-prices-kiwi', searchFlightPrices);
router.get('/search', searchFlights);

router.get('/search-domestic', searchDomesticFlights);

module.exports = router;