// archiveFunctions/transferBookingService.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetch and restore archived Transfer Booking Orders.
// isArchive === 'Yes' → archived; patch to 'No' to restore.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://wanderwaveph.onrender.com';

/**
 * Fetch all transfer bookings where isArchive === 'Yes'.
 * Returns an array of raw booking objects tagged with type = 'Transfer Booking'.
 */
export const fetchArchivedTransferBookings = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/transfer-bookings?limit=500`);
    if (!res.ok) throw new Error('Failed to fetch transfer bookings');
    const json = await res.json();
    const raw = json.data || json.bookings || [];

    const archived = raw.filter(b => b.isArchive === 'Yes');

    return archived.map(b => ({
      ...b,
      type:       'Transfer Booking',
      itemName:   b.activityName || b.fullName || 'Transfer Booking',
      reference:  b._id?.substring(0, 8) || 'N/A',
      archivedAt: b.archivedAt || b.updatedAt,
    }));
  } catch (err) {
    console.error('❌ fetchArchivedTransferBookings error:', err);
    return [];
  }
};

/**
 * Restore a transfer booking by setting isArchive back to 'No'.
 * Uses PATCH /api/transfer-bookings/:id which accepts { isArchive } in the body.
 * Returns true on success, false on failure.
 */
export const restoreTransferBooking = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/api/transfer-bookings/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isArchive: 'No' }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to restore transfer booking');
    }

    console.log(`✅ Transfer booking ${id} restored.`);
    return true;
  } catch (err) {
    console.error('❌ restoreTransferBooking error:', err);
    return false;
  }
};