// middleware/verifyAdminOrUser.js
// ─────────────────────────────────────────────────────────────────────────────
// Allows a route to be called either by an authenticated admin (full access,
// no email restriction) or an authenticated customer (req.authType = 'user',
// route handlers must then filter results to req.user.email).
// ─────────────────────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const User = require('../models/user');
const TokenBlacklist = require('../models/TokenBlacklist');

const ADMIN_JWT_SECRET = process.env.JWT_SECRET || 'wanderwaveph_admin25';
const USER_JWT_SECRET = process.env.USER_JWT_SECRET || process.env.JWT_SECRET || 'wanderwaveph_user25';

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token =
    req.cookies?.adminToken ||
    (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided. Authorization denied.' });
  }

  // Try admin token first
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    const isRevoked = await TokenBlacklist.exists({ token });
    if (!isRevoked) {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin && admin.isActive) {
        req.user = admin;
        req.adminId = admin._id;
        req.adminEmail = admin.email;
        req.authType = 'admin';
        return next();
      }
    }
  } catch (_) {
    // Not a valid admin token — fall through to user token check
  }

  // Try user token
  try {
    const decoded = jwt.verify(token, USER_JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    req.user = user;
    req.authType = 'user';
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token. Authorization denied.' });
  }
};
