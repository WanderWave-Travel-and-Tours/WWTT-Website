const API_URL = 'https://wanderwaveph-backend.onrender.com/api/promos';

export const fetchArchivedPromos = async () => {
    try {
        // Gumagamit tayo ng /all para makuha pati yung may isArchive: "Yes"
        const response = await fetch(`${API_URL}/all`); 
        if (!response.ok) throw new Error('Failed to fetch promos');
        const data = await response.json();
        
        return data
            .filter(p => p.isArchive === 'Yes')
            .map(p => ({
                _id: p._id,
                itemName: p.code,
                type: 'Promo',
                status: 'Archived',
                archivedAt: p.updatedAt,
                reference: p.code,
                rawData: p
            }));
    } catch (error) {
        console.error(error);
        return [];
    }
};

// archiveFunctions/promoService.js

export const restorePromo = async (id) => {
    try {
        const response = await fetch(`http://localhost:5000/api/promos/${id}/archive`, {
            method: 'POST', // Dapat POST dahil ito ang nasa route mo
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                isArchive: 'No', // Pinapadala natin ito pero ang backend ay may toggle logic
                userEmail: localStorage.getItem('userEmail'), // Para sa Activity Log
                adminId: localStorage.getItem('adminId')      // Para sa Activity Log
            })
        });
        
        const result = await response.json();
        return response.ok;
    } catch (error) {
        console.error("Error restoring promo:", error);
        return false;
    }
};