// In backend/routes/authRoute.js
const express = require('express');
// Ensure resendOtp is imported
const { signup, login, verifyOtp, resendOtp } = require('../controller/authController'); 
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp); 
router.post('/resend-otp', resendOtp); // The new resend endpoint

module.exports = router;