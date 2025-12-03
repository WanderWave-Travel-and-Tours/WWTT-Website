const express = require('express');
const { getPassportServices } = require('../controller/passportController');
const router = express.Router();

router.get('/service/:serviceId', getPassportServices);

module.exports = router;