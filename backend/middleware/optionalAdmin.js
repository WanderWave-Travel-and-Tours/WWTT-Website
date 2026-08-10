// Non-blocking admin identification for endpoints that are public but return
// richer data to authenticated staff.
//
// Unlike middleware/auth.js, this NEVER rejects: a missing, invalid, expired or
// revoked token simply leaves req.isAdmin === false and the request continues as
// anonymous. Routes use req.isAdmin to pick a field projection — anonymous
// callers get the public projection with cost/margin fields removed.
//
// Why a projection instead of encrypting the response: the public site renders
// these listings without a login, so any decryption key would have to ship in
// the browser bundle where anyone can read it. That approach was tried here
// before and defeated (see the note at the top of server.js). Fields that are
// never sent cannot be recovered by any client-side means.
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const TokenBlacklist = require('../models/TokenBlacklist');

const JWT_SECRET = process.env.JWT_SECRET || 'wanderwaveph_admin25';

module.exports = async function optionalAdmin(req, res, next) {
    req.isAdmin = false;

    try {
        const authHeader = req.headers.authorization;
        const token =
            req.cookies?.adminToken ||
            (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

        if (!token) return next();

        const decoded = jwt.verify(token, JWT_SECRET);

        // Honour the logout blacklist — a revoked token must not unlock cost data.
        if (await TokenBlacklist.exists({ token })) return next();

        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin || !admin.isActive) return next();

        req.isAdmin = true;
        req.user = admin;
        req.adminId = admin._id;
        req.adminEmail = admin.email;
    } catch {
        // Any failure (bad signature, expired, DB hiccup) → stay anonymous.
        // Falling through to the public projection is the safe default.
    }

    return next();
};
