const express = require('express');
const router = express.Router();
const { searchFlights } = require('../controller/flightController');

router.get('/search', searchFlights);

module.exports = router;