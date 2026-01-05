const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

module.exports = async (req, res, next) => {
  try {
    // ✅ GET TOKEN FROM HEADER
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided. Authorization denied.' 
      });
    }

    // ✅ EXTRACT TOKEN
    const token = authHeader.split(' ')[1];

    // ✅ VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // ✅ FIND USER
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found. Authorization denied.' 
      });
    }

    // ✅ ATTACH USER TO REQUEST
    req.user = admin;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. Authorization denied.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }

    return res.status(500).json({ 
      success: false,
      message: 'Server error during authentication.' 
    });
  }
};