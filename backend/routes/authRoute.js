const express = require('express');
const { signup, login, verifyOtp, resendOtp } = require('../controller/authController');
const { authLimiter } = require('../middleware/rateLimiters');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', authLimiter, login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

module.exports = router;