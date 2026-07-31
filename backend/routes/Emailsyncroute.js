// ============================================================
//  routes/emailSyncRoute.js
//  POST /api/packages/:id/sync-email
//
//  Fetches a package, builds premium inline-CSS HTML blobs
//  for Inclusions + Itinerary, then fires them to the GHL
//  webhook so a single Master Template can render any package.
// ============================================================

const express  = require('express');
const axios    = require('axios');
const router   = express.Router();

// ── Adjust this path to wherever your Package model lives ──
const Package  = require('../models/package');
const authMiddleware = require('../middleware/auth');

// ── GHL webhook URL ────────────────────────────────────────
const GHL_WEBHOOK_URL =
  'https://services.leadconnectorhq.com/hooks/yTzQYPFRZAWXGWiXtIt2/webhook-trigger/3bd4c869-6d88-4e55-b1f4-b561a5c28ccd';

// ──────────────────────────────────────────────────────────
//  HTML BUILDER — INCLUSIONS
//  Produces a styled <ul> safe for email clients (inline CSS).
// ──────────────────────────────────────────────────────────
function buildInclusionsHTML(inclusions = []) {
  if (!inclusions.length) {
    return '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:14px;color:#6b7280;margin:0;">No inclusions listed.</p>';
  }

  const items = inclusions
    .map(
      (item) => `
      <li style="
        font-family: 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        color: #374151;
        line-height: 1.7;
        padding: 6px 0;
        border-bottom: 1px solid #f3f4f6;
        list-style: none;
        display: flex;
        align-items: flex-start;
        gap: 10px;
      ">
        <span style="
          display: inline-block;
          width: 20px;
          height: 20px;
          min-width: 20px;
          background-color: #001F3F;
          border-radius: 50%;
          text-align: center;
          line-height: 20px;
          font-size: 11px;
          color: #ffffff;
          font-weight: 700;
          margin-top: 2px;
        ">✓</span>
        <span style="flex: 1;">${escapeHtml(item)}</span>
      </li>`
    )
    .join('');

  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr>
    <td style="
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px 24px;
    ">
      <p style="
        font-family: 'Helvetica Neue', Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #9ca3af;
        margin: 0 0 12px 0;
      ">What's Included</p>
      <ul style="margin: 0; padding: 0;">
        ${items}
      </ul>
    </td>
  </tr>
</table>`;
}

// ──────────────────────────────────────────────────────────
//  HTML BUILDER — ITINERARY
//  Produces one block per day with a sub-list of activities.
// ──────────────────────────────────────────────────────────
function buildItineraryHTML(itinerary = []) {
  if (!itinerary.length) {
    return '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:14px;color:#6b7280;margin:0;">No itinerary available.</p>';
  }

  // Sort ascending by day number just in case
  const sorted = [...itinerary].sort((a, b) => a.day - b.day);

  const days = sorted
    .map((item) => {
      const activities = (item.activities || [])
        .map(
          (act) => `
          <li style="
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 13px;
            color: #4b5563;
            line-height: 1.65;
            padding: 4px 0;
            list-style: none;
            padding-left: 16px;
            position: relative;
          ">
            <span style="
              position: absolute;
              left: 0;
              top: 9px;
              width: 5px;
              height: 5px;
              background-color: #001F3F;
              border-radius: 50%;
              display: inline-block;
            "></span>
            ${escapeHtml(act)}
          </li>`
        )
        .join('');

      return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin-bottom: 12px;">
        <tr>
          <td style="
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-left: 4px solid #001F3F;
            border-radius: 0 10px 10px 0;
            padding: 16px 20px;
          ">
            <!-- Day badge + title row -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin-bottom: 10px;">
              <tr>
                <td style="width: auto; vertical-align: middle;">
                  <span style="
                    display: inline-block;
                    background-color: #001F3F;
                    color: #ffffff;
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    padding: 3px 10px;
                    border-radius: 20px;
                    margin-right: 10px;
                  ">Day ${item.day}</span>
                </td>
                <td style="vertical-align: middle;">
                  <span style="
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    font-size: 15px;
                    font-weight: 700;
                    color: #111827;
                  ">${escapeHtml(item.title)}</span>
                </td>
              </tr>
            </table>
            <!-- Activities list -->
            ${
              activities
                ? `<ul style="margin: 0; padding: 0;">${activities}</ul>`
                : ''
            }
          </td>
        </tr>
      </table>`;
    })
    .join('');

  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr>
    <td style="
      background-color: #f8f9fb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px 24px;
    ">
      <p style="
        font-family: 'Helvetica Neue', Arial, sans-serif;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #9ca3af;
        margin: 0 0 14px 0;
      ">Day-by-Day Itinerary</p>
      ${days}
    </td>
  </tr>
</table>`;
}

// ──────────────────────────────────────────────────────────
//  HELPER — escape HTML entities in user-supplied strings
// ──────────────────────────────────────────────────────────
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ──────────────────────────────────────────────────────────
//  ROUTE  POST /api/packages/:id/sync-email
//
//  Body  { email: string }          ← the GHL contact email
//
//  GHL Webhook Payload:
//  {
//    email            : string  — contact to update / trigger workflow
//    package_id       : string
//    package_title    : string
//    package_dest     : string
//    inclusions_html  : string  — ready-to-paste HTML blob
//    itinerary_html   : string  — ready-to-paste HTML blob
//    synced_at        : ISO string
//  }
// ──────────────────────────────────────────────────────────
// Admin-only: forwards an arbitrary caller-supplied email address to the GHL
// marketing webhook. Left open, this is a spam/abuse relay — anyone could push
// mail to any address through the company's automation. No frontend caller.
router.post('/:id/sync-email', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  // ── 1. Validate input ─────────────────────────────────
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'A valid "email" field is required in the request body.',
    });
  }

  // ── 2. Fetch package ──────────────────────────────────
  let pkg;
  try {
    pkg = await Package.findById(id).lean();
  } catch (dbErr) {
    console.error('❌ [sync-email] DB error:', dbErr.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid package ID format.',
      error: dbErr.message,
    });
  }

  if (!pkg) {
    return res.status(404).json({
      success: false,
      message: `Package with ID "${id}" was not found.`,
    });
  }

  // ── 3. Build HTML blobs ───────────────────────────────
  const inclusionsHtml = buildInclusionsHTML(pkg.inclusions);
  const itineraryHtml  = buildItineraryHTML(pkg.itinerary);

  // ── 4. Assemble GHL payload ───────────────────────────
  const payload = {
    email,
    package_id:      String(pkg._id),
    package_title:   pkg.title,
    package_dest:    pkg.destination,
    inclusions_html: inclusionsHtml,
    itinerary_html:  itineraryHtml,
    synced_at:       new Date().toISOString(),
  };

  // ── 5. Fire webhook ───────────────────────────────────
  let webhookStatus;
  try {
    const response = await axios.post(GHL_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000, // 10 s
    });
    webhookStatus = response.status;
    console.log(`✅ [sync-email] GHL webhook fired → ${pkg.title} | ${email} | HTTP ${webhookStatus}`);
  } catch (webhookErr) {
    const status = webhookErr.response?.status || 'N/A';
    const detail = webhookErr.response?.data  || webhookErr.message;
    console.error(`❌ [sync-email] Webhook failed → HTTP ${status}`, detail);
    return res.status(502).json({
      success: false,
      message: 'Package found and HTML generated, but the GHL webhook request failed.',
      webhook_status: status,
      webhook_error:  detail,
    });
  }

  // ── 6. Respond ────────────────────────────────────────
  return res.status(200).json({
    success: true,
    message: `Email content synced successfully for "${pkg.title}".`,
    package_title:   pkg.title,
    package_dest:    pkg.destination,
    email,
    webhook_status:  webhookStatus,
    synced_at:       payload.synced_at,
    // Optionally echo the blobs back for the frontend preview panel
    preview: {
      inclusions_html: inclusionsHtml,
      itinerary_html:  itineraryHtml,
    },
  });
});

module.exports = router;