// archiveFunctions/customizedBookingService.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetch and restore archived Customized Bookings for the Archive page.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = '';

/**
 * Fetch all customized bookings where isArchive === 'Yes'.
 * Maps the raw DB documents into the shape Archive.jsx expects.
 */
export const fetchArchivedCustomizedBookings = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/customized-bookings/archived`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const items = json.data || json || [];

    return items.map(item => ({
      ...item,
      type: 'Customized Booking',
      itemName: item.fullName || item.referenceNumber || 'Unnamed Booking',
      reference: item.referenceNumber || item._id?.substring(0, 8) || 'N/A',
      archivedAt: item.updatedAt,
    }));
  } catch (err) {
    console.error('❌ fetchArchivedCustomizedBookings error:', err);
    return [];
  }
};

/**
 * Restore a customized booking (set isArchive back to 'No').
 */
export const restoreCustomizedBooking = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/api/customized-bookings/${id}/unarchive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success !== false;
  } catch (err) {
    console.error('❌ restoreCustomizedBooking error:', err);
    return false;
  }
};