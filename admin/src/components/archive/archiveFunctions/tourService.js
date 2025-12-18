// archiveFunctions/tourService.js
const API_BASE_URL = 'http://localhost:5000/api/tours';

export const fetchArchivedTours = async () => {
    try {
        // Must match the backend route defined in tourRoutes.js
        const response = await fetch(`${API_BASE_URL}/archived-list`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.status === 'ok') {
            return result.data.map(tour => ({
                ...tour,
                type: 'Tour', // Explicitly label as Tour for Archive.jsx filtering
                archivedAt: tour.updatedAt
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching tours:", error);
        return [];
    }
};

export const restoreTour = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/restore/${id}`, {
            method: 'PATCH'
        });
        const result = await response.json();
        return result.status === 'ok';
    } catch (error) {
        console.error("Error restoring tour:", error);
        return false;
    }
};