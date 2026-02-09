const API_URL = 'https://wanderwaveph.onrender.com/api/tours';

export const fetchArchivedTours = async () => {
  try {
    // Mahalaga: Dinagdagan ng '/all' para tumugma sa backend route mo
    const response = await fetch(`${API_URL}/all`);
    
    if (!response.ok) {
        console.error(`Status ${response.status} found at ${API_URL}/all`);
        return [];
    }
    
    const result = await response.json();
    let allTours = [];
    
    // Pag-handle sa iba't ibang format ng response mula sa backend
    if (result.success && Array.isArray(result.tours)) allTours = result.tours;
    else if (Array.isArray(result)) allTours = result;
    else if (result.data) allTours = result.data;

    // I-filter lang ang mga naka-archive at i-map sa format ng table
    return allTours
      .filter(tour => tour.isArchive === 'Yes')
      .map(tour => ({
        _id: tour._id,
        // Ginawang 'itemName' para standard sa Archive.jsx mapping
        itemName: tour.title, 
        type: 'Tour', 
        status: 'archived',
        archivedAt: tour.updatedAt || tour.createdAt || new Date().toISOString(),
        // Kumuha ng 8 characters mula sa ID bilang reference
        reference: tour._id ? tour._id.substring(tour._id.length - 8).toUpperCase() : 'N/A',
        rawData: tour
      }));
  } catch (error) {
    console.error('Network Error in tourService:', error);
    return []; 
  }
};

export const restoreTour = async (id) => {
  try {
    // Tandaan: Ang backend route mo ay PATCH /archive/:id para sa toggle
    const response = await fetch(`${API_URL}/archive/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchive: 'No' })
    });
    return response.ok;
  } catch (error) {
    console.error('Error restoring tour:', error);
    return false;
  }
};  