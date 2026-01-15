const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

const JWT_SECRET = process.env.JWT_SECRET || 'wanderwaveph_admin25';

module.exports = async (req, res, next) => {
  try {
    // ✅ GET TOKEN FROM HEADER
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided. Authorization denied.',
        requiresAuth: true
      });
    }

    // ✅ EXTRACT TOKEN
    const token = authHeader.split(' ')[1];

    // ✅ VERIFY TOKEN
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ FIND ADMIN
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: 'Admin not found. Authorization denied.',
        requiresAuth: true
      });
    }

    // ✅ CHECK IF ADMIN IS ACTIVE
    if (!admin.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Admin account is inactive. Access denied.',
        requiresAuth: true
      });
    }

    // ✅ ATTACH ADMIN TO REQUEST
    req.user = admin;
    req.adminId = admin._id;
    req.adminEmail = admin.email;
    req.isMainAdmin = admin.email.toLowerCase() === 'info@wanderwavetravelandtours.com';

    next();

  } catch (error) {
    console.error('🔒 Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. Authorization denied.',
        requiresAuth: true
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again.',
        requiresAuth: true
      });
    }

    return res.status(500).json({ 
      success: false,
      message: 'Server error during authentication.'
    });
  }
};