// archiveFunctions/sellerService.js
import axios from 'axios';

// For local development, use 'http://localhost:5000/api/seller-rates'
// For production, use 'http://localhost:5000/api/seller-rates'
// Adjust based on your environment; perhaps use environment variables
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:5000/api/seller-rates' 
  : 'http://localhost:5000/api/seller-rates';

export const fetchArchivedSellerRates = async () => {
  try {
    console.log('📦 Fetching archived seller rates from:', `${API_URL}/all-with-archived`);
    
    const response = await axios.get(`${API_URL}/all-with-archived`);
    
    const data = response.data;
    console.log('📊 Raw seller rates data:', data);
    
    // Handle different response formats
    let allRates = [];
    if (data.success && Array.isArray(data.rates)) {
      allRates = data.rates;
    } else if (Array.isArray(data)) {
      allRates = data;
    } else if (data.data && Array.isArray(data.data)) {
      allRates = data.data;
    } else {
      throw new Error('Unexpected response format');
    }
    
    // Filter only archived rates (isArchive = "Yes")
    const archivedRates = allRates.filter(rate => rate.isArchive === 'Yes');
    
    console.log(`✅ Found ${archivedRates.length} archived seller rates`);
    
    // Format the data for the archive component
    const formattedRates = archivedRates.map(rate => ({
      _id: rate._id,
      mongoId: rate._id,
      type: 'Seller Rates',
      itemName: rate.activity || 'Unnamed Service',
      name: rate.activity,
      reference: rate.destination || 'N/A',
      archivedAt: rate.lastUpdated || rate.dateAdded || new Date().toISOString(),
      updatedAt: rate.lastUpdated || rate.dateAdded || new Date().toISOString(),
      isArchive: rate.isArchive,
      status: rate.status || 'archived',
      rawData: rate,
      destination: rate.destination,
      supplier: rate.supplierName,
      supplierRate: rate.supplierRate,
      markup: rate.markup,
      markupType: rate.markupType,
      sellingPrice: rate.sellingPrice,
      pax: rate.pax,
      inclusions: rate.inclusions,
      notes: rate.notes
    }));
    
    return formattedRates;
    
  } catch (error) {
    console.error('❌ Error fetching archived seller rates:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return [];
  }
};

export const restoreSellerRate = async (id) => {
  try {
    console.log('🔄 Restoring seller rate:', id);
    
    const response = await axios.patch(`${API_URL}/${id}/restore`);

    console.log('✅ Seller rate restored successfully:', response.data);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error restoring seller rate:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
};