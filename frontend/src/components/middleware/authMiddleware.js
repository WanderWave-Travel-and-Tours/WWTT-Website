// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/user'); // I-adjust ang path kung kailangan

// KUNIN ANG JWT SECRET KEY
// Tiyakin na mayroon kang environment variable na JWT_SECRET sa .env file
const JWT_SECRET = process.env.JWT_SECRET || 'isang_malaking_secret_key_dapat_ito'; 

const protect = async (req, res, next) => {
    let token;

    // 1. Titingnan kung ang token ay nasa Authorization header (Bearer <token>)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Kukunin ang token mula sa header
            token = req.headers.authorization.split(' ')[1];

            // I-verify ang token gamit ang secret key
            const decoded = jwt.verify(token, JWT_SECRET);

            // 2. Kukunin ang user mula sa database (batay sa ID sa token)
            // at ilalagay sa req object para ma-access ng controller (req.user.id)
            req.user = await User.findById(decoded.id).select('-password'); 

            if (!req.user) {
                 return res.status(401).json({ status: 'error', message: 'Not authorized, user not found.' });
            }
            
            // Ipagpapatuloy ang proseso sa favoriteRoute.js
            next();

        } catch (error) {
            console.error("Token verification failed:", error.message);
            return res.status(401).json({ status: 'error', message: 'Not authorized, token failed or expired.' });
        }
    }

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Not authorized, no token provided. Please log in.' });
    }
};

module.exports = { protect };