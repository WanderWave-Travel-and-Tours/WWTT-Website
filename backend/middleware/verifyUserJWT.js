const jwt = require('jsonwebtoken');
const User = require('../models/user');

const USER_JWT_SECRET = process.env.USER_JWT_SECRET || process.env.JWT_SECRET || 'wanderwaveph_user25';

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided. Please log in.',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, USER_JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found.',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: 'error', message: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'error', message: 'Token expired. Please log in again.' });
        }
        return res.status(500).json({ status: 'error', message: 'Authentication error.' });
    }
};
