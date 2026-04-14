// archiveFunctions/tourBookingService.js
import axios from 'axios';

const BASE_URL = 'https://wanderwaveph.onrender.com/api/tour-bookings';

export const fetchArchivedTourBookings = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/archived`);
        
        if (response.data.success) {
            return response.data.data.map(booking => ({
                _id: booking._id,
                mongoId: booking._id,
                type: 'Tour Booking',           // ← Ito ang susi
                itemName: booking.packageName || booking.fullName || 'Tour Booking',
                status: booking.status || 'Archived',
                archivedAt: booking.archivedAt || booking.updatedAt || new Date().toISOString(),
                reference: booking.referenceNumber || booking._id?.substring(0, 8) || 'N/A',
                rawData: booking,
                daysRemaining: 30   // para consistent sa archive
            }));
        }
        return [];
    } catch (error) {
        console.error("❌ Error fetching archived tour bookings:", error);
        return [];
    }
};

export const restoreTourBooking = async (id) => {
    try {
        const response = await axios.put(`${BASE_URL}/restore/${id}`);
        console.log("✅ Tour booking restored successfully:", response.data);
        return response.data.success;
    } catch (error) {
        console.error("❌ Error restoring tour booking:", error);
        throw new Error(error.response?.data?.message || "Failed to restore tour booking");
    }
};