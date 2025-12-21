const API_URL = 'https://wanderwaveph-backend.onrender.com0/api/promos';

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

export const restorePromo = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchive: 'No' })
    });
    return response.ok;
};