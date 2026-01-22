const API_URL = 'https://wanderwaveph-backend.onrender.com/api/packages';

export const fetchArchivedPackages = async () => {
  try {
    const response = await fetch(`${API_URL}/archived-list`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    console.log('📦 Archived Packages Response:', result);
    
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
    
    console.log('⚠️ No archived packages found or invalid response structure');
    return [];
  } catch (error) {
    console.error('❌ Error fetching archived packages:', error);
    return [];
  }
};

export const restorePackage = async (id) => {
  try {
    console.log('🔄 Attempting to restore package:', id);
    
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
      console.log('✅ Package restored via update:', result);
      return true;
    }
    
    // Method 2: If update fails, try archive toggle endpoint
    console.log('⚠️ Update method failed, trying archive toggle...');
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
    console.log('✅ Package restored via archive toggle:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Error restoring package:', error);
    throw error;
  }
};