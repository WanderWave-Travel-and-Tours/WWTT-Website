const API_URL = 'https://wanderwaveph-backend.onrender.com/api/packages';

export const fetchArchivedPackages = async () => {
  try {
    const response = await fetch(`${API_URL}/archived-list`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (result.status === 'ok' && result.data) {
      return result.data.map(pkg => {
        const archivedDate = pkg.archivedAt || pkg.updatedAt || pkg.createdAt || new Date().toISOString();
        return {
          _id: pkg._id,
          fullName: pkg.title || 'Unnamed Package',
          name: pkg.title || 'Unnamed Package',
          type: 'Package',
          status: 'cancelled',
          archivedAt: archivedDate,
          referenceNumber: pkg._id.substring(pkg._id.length - 6).toUpperCase(),
          slug: pkg._id,
          packageData: pkg
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching packages:', error);
    return [];
  }
};

export const restorePackage = async (id) => {
  const response = await fetch(`${API_URL}/${id}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return response.ok;
};