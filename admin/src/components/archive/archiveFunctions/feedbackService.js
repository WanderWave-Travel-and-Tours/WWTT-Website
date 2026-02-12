// ============================================
// FEEDBACK SERVICE - Archive Functions
// ============================================

const API_BASE_URL = 'https://wanderwaveph.onrender.com/api';

/**
 * Fetch all archived feedbacks (isArchive = "Yes")
 */
export const fetchArchivedFeedbacks = async () => {
  try {
    console.log('📡 Fetching archived feedbacks...');
    
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Raw feedback data:', data);

    if (!data.success || !Array.isArray(data.feedbacks)) {
      console.warn('⚠️ Invalid feedback data structure');
      return [];
    }

    // Filter only archived feedbacks (isArchive = "Yes")
    const archivedFeedbacks = data.feedbacks.filter(
      feedback => feedback.isArchive === 'Yes'
    );

    console.log(`✅ Found ${archivedFeedbacks.length} archived feedbacks`);

    // Format for Archive component
    const formatted = archivedFeedbacks.map(feedback => ({
      _id: feedback._id,
      type: 'Feedback',
      itemName: `Feedback from ${feedback.name || 'Anonymous'}`,
      name: feedback.name || 'Anonymous',
      category: feedback.category,
      message: feedback.message,
      rating: feedback.rating,
      status: feedback.status,
      reference: feedback._id.substring(0, 8),
      archivedAt: feedback.updatedAt || feedback.createdAt,
      updatedAt: feedback.updatedAt || feedback.createdAt,
      rawData: feedback
    }));

    return formatted;

  } catch (error) {
    console.error('❌ Error fetching archived feedbacks:', error);
    return [];
  }
};

/**
 * Restore archived feedback (set isArchive back to "No")
 */
export const restoreFeedback = async (feedbackId) => {
  try {
    console.log('🔄 Restoring feedback:', feedbackId);

    const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}/restore`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to restore feedback');
    }

    const data = await response.json();
    console.log('✅ Feedback restored successfully:', data);

    return data.success;

  } catch (error) {
    console.error('❌ Error restoring feedback:', error);
    throw error;
  }
};