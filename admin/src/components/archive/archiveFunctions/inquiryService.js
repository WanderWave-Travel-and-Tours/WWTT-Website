// src/components/archive/archiveFunctions/inquiryService.js
import axios from 'axios';

const API_URL = 'https://wanderwaveph-backend.onrender.com0/api/inquiries'; // Siguraduhing tama ang port mo

export const fetchArchivedInquiries = async () => {
  try {
    // Nagpapadala tayo ng query parameter na isArchive=Yes
    const response = await axios.get(`${API_URL}?isArchive=Yes`);
    if (response.data.success) {
      // Gina-map ang data para mag-match sa display fields ng Archive.jsx
      return response.data.data.map(item => ({
        ...item,
        itemName: `${item.fullName} - ${item.serviceName}`, // Ipakita ang pangalan at service
        type: item.inquiryType || 'VISA Processing', // Siguraduhin na tugma ito sa SERVICE_SUBTYPES_LIST
        archivedAt: item.updatedAt // Gagamitin para sa "Days Remaining" calculation
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching archived inquiries:", error);
    return [];
  }
};

export const restoreInquiry = async (id) => {
  try {
    // Gumagamit ng toggleArchive endpoint na ginawa mo sa backend
    const response = await axios.put(`${API_URL}/${id}/archive`, { isArchive: 'No' });
    return response.data.success;
  } catch (error) {
    console.error("Error restoring inquiry:", error);
    return false;
  }
};