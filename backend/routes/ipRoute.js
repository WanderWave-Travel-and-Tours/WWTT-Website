// routes/ipRoute.js
// ✅ FIX: This route was missing — caused 404 on /api/ip/check-otc-access
// Mount in server.js as: app.use('/api/ip', require('./routes/ipRoute'));

const express = require('express');
const router  = express.Router();

// ── Helper: extract real IP behind proxies / Render's load balancer ──────────
const getRealIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '';
};

// ── OTC (Over-The-Counter) whitelist ─────────────────────────────────────────
// Add your office/branch IP addresses here.
// These are the only IPs that will see the "Pay Over the Counter" button.
const OTC_WHITELIST = (process.env.OTC_IP_WHITELIST || '')
  .split(',')
  .map(ip => ip.trim())
  .filter(Boolean);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ip/check-otc-access
// Returns whether the caller's IP is whitelisted for OTC payment.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/check-otc-access', (req, res) => {
  const clientIp      = getRealIp(req);
  const hasOTCAccess  = OTC_WHITELIST.length > 0 && OTC_WHITELIST.includes(clientIp);

  console.log(`📍 OTC check — IP: ${clientIp} | access: ${hasOTCAccess}`);

  res.json({
    success:      true,
    hasOTCAccess,
    ip:           clientIp,   // useful for whitelisting setup
  });
});

module.exports = router;