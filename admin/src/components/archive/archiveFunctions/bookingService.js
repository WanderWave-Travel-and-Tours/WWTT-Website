const API_URL = 'http://localhost:5000/api/bookings';

export const fetchArchivedBookings = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    let allBookings = [];
    
    if (result.success && Array.isArray(result.bookings)) allBookings = result.bookings;
    else if (result.success && Array.isArray(result.data)) allBookings = result.data;
    else if (Array.isArray(result)) allBookings = result;
    else if (result.bookings) allBookings = result.bookings;

    return allBookings
      .filter(booking => booking.isArchive === 'Yes')
      .map(booking => {
        const archivedDate = booking.archivedAt || booking.updatedAt || booking.createdAt || new Date().toISOString();
        return {
          _id: booking._id,
          fullName: booking.fullName || 'Unnamed Booking',
          name: booking.fullName || 'Unnamed Booking',
          type: 'Booking',
          status: 'cancelled',
          archivedAt: archivedDate,
          referenceNumber: booking.referenceNumber || booking._id.substring(booking._id.length - 8).toUpperCase(),
          slug: booking._id,
          bookingData: booking
        };
      });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

export const restoreBooking = async (id) => {
  const response = await fetch(`${API_URL}/${id}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return response.ok;
};