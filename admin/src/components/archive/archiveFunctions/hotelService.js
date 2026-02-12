// archiveFunctions/hotelService.js
import axios from 'axios';

const BASE_URL = 'https://wanderwaveph.onrender.com/api/hotels';

export const fetchArchivedHotels = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/archived`);
        
        if (response.data.success) {
            return response.data.data.map(hotel => ({
                _id: hotel._id,
                mongoId: hotel._id,
                type: 'Hotel',
                itemName: hotel.name,
                name: hotel.name,
                status: hotel.isArchive === "Yes" ? 'Archived' : 'Active',
                archivedAt: hotel.archivedAt || hotel.updatedAt || new Date().toISOString(),
                reference: hotel.location || hotel.city || hotel._id?.substring(0, 8) || 'N/A',
                location: hotel.location,
                city: hotel.city,
                price: hotel.price,
                rating: hotel.rating,
                rawData: hotel
            }));
        }
        return [];
    } catch (error) {
        console.error("❌ Error fetching archived hotels:", error);
        return [];
    }
};

export const restoreHotel = async (id) => {
    try {
        const response = await axios.put(`${BASE_URL}/restore/${id}`);
        console.log("✅ Hotel restored successfully:", response.data);
        return response.data.success;
    } catch (error) {
        console.error("❌ Error restoring hotel:", error);
        throw new Error(error.response?.data?.message || "Failed to restore hotel");
    }
};