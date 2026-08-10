const API_URL = '/api/packages';

const getAdminHeaders = () => ({});

export const fetchArchivedPackages = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/archived-list`, { headers: getAdminHeaders() });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    
    if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
      return result.data.map(pkg => {
        const archivedDate = pkg.archivedAt || pkg.updatedAt || pkg.createdAt || new Date().toISOString();
        
        return {
          _id: pkg._id,
          mongoId: pkg._id,
          itemName: pkg.title || 'Unnamed Package',
          packageName: pkg.title || 'Unnamed Package',
          name: pkg.title || 'Unnamed Package',
          fullName: pkg.title || 'Unnamed Package',
          title: pkg.title || 'Unnamed Package',
          type: 'Package',
          status: 'cancelled',
          isArchive: pkg.isArchive || 'Yes',
          archivedAt: archivedDate,
          updatedAt: pkg.updatedAt || archivedDate,
          createdAt: pkg.createdAt || archivedDate,
          reference: pkg._id?.substring(pkg._id.length - 6).toUpperCase() || 'N/A',
          referenceNumber: pkg._id?.substring(pkg._id.length - 6).toUpperCase() || 'N/A',
          
          rawData: {
            ...pkg,
            status: 'cancelled',
            archiveReason: `Package "${pkg.title}" was archived on ${new Date(archivedDate).toLocaleDateString()}`
          }
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching archived packages:', error);
    return [];
  }
};

export const restorePackage = async (id) => {
  try {
    
    // Method 1: Try direct update endpoint
    const updateResponse = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isArchive: 'No'
      })
    });
    
    if (updateResponse.ok) {
      const result = await updateResponse.json();
      return true;
    }
    
    // Method 2: If update fails, try archive toggle endpoint
    const archiveResponse = await fetch(`${API_URL}/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isArchive: 'No', // Explicitly set to No
        userEmail: 'System Admin',
        adminId: null
      })
    });
    
    if (!archiveResponse.ok) {
      const error = await archiveResponse.json();
      throw new Error(error.error || error.message || 'Failed to restore package');
    }
    
    const result = await archiveResponse.json();
    return true;
    
  } catch (error) {
    console.error('❌ Error restoring package:', error);
    throw error;
  }
};