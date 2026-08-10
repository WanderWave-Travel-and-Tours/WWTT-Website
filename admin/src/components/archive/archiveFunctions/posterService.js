const API_URL = '/api/posters';

export const fetchArchivedPosters = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    // Siguraduhing array ang nakuha mula sa backend
    const allPosters = Array.isArray(result) ? result : [];

    return allPosters
      .filter(poster => poster.isArchive === 'Yes')
      .map(poster => {
        const archivedDate = poster.updatedAt || poster.createdAt || new Date().toISOString();
        return {
          _id: poster._id,
          itemName: poster.title || 'Unnamed Poster',
          type: 'Poster',
          status: poster.status || 'Inactive',
          archivedAt: archivedDate,
          // Kunin ang huling 8 characters ng ID bilang reference
          reference: poster._id.substring(poster._id.length - 8).toUpperCase(),
          rawData: poster
        };
      });
  } catch (error) {
    console.error('Error fetching posters:', error);
    return [];
  }
};

export const restorePoster = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchive: 'No' }) 
    });
    return response.ok;
  } catch (error) {
    console.error('Error restoring poster:', error);
    return false;
  }
};