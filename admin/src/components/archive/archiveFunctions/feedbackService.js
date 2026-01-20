// ============================================
// FEEDBACK ARCHIVE SERVICE
// ============================================

const API_URL = 'https://wanderwaveph-backend.onrender.com/api/feedback';

// Fetch ALL Archived Feedbacks
export const fetchArchivedFeedbacks = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch feedbacks');
        
        const data = await response.json();
        
        // Filter only items where isArchive === "Yes"
        const archivedFeedbacks = (data.feedbacks || []).filter(item => 
            item.isArchive === "Yes"
        ).map(item => ({
            ...item,
            // Normalizing data for Archive Table
            type: 'Feedback', 
            itemName: item.name || 'Anonymous', // Use submitter name as Item Name
            reference: item.category ? item.category.toUpperCase() : 'GENERAL', // Use Category as reference
            archivedAt: item.updatedAt, // Use update time as archive time
            
            // Map message to archiveReason so it appears in the Modal
            archiveReason: item.message 
        }));

        return archivedFeedbacks;
    } catch (error) {
        console.error('Error fetching archived feedbacks:', error);
        return [];
    }
};

// Restore Feedback
export const restoreFeedback = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}/restore`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Failed to restore feedback');
        return true;
    } catch (error) {
        console.error('Error restoring feedback:', error);
        return false;
    }
};