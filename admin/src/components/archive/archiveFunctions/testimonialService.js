const API_URL = 'http://localhost:5000/api/testimonials';

/**
 * Kunin lahat ng testimonials na naka-archive (isArchive: "Yes")
 */
export const fetchArchivedTestimonials = async () => {
  try {
    const response = await fetch(API_URL); //
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    let allTestimonials = Array.isArray(result) ? result : (result.data || []);

    return allTestimonials
      .filter(t => t.isArchive === 'Yes') //
      .map(t => {
        const archivedDate = t.updatedAt || t.createdAt || new Date().toISOString();
        return {
          _id: t._id,
          fullName: t.customerName || 'Anonymous Customer',
          name: t.customerName || 'Anonymous Customer',
          type: 'Testimonial',
          status: 'Archived',
          archivedAt: archivedDate,
          referenceNumber: t.source || 'N/A',
          slug: t._id,
          bookingData: t 
        };
      });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
};

/**
 * Restore function na tumutugma sa iyong testimonialRoute.js
 * Ginagamit ang PATCH method at direct ID endpoint
 */
export const restoreTestimonial = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, { // Tumutugma sa router.patch("/:id")
      method: 'PATCH', //
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isArchive: "No" }) //
    });

    return response.ok;
  } catch (error) {
    console.error('Error restoring testimonial:', error);
    return false;
  }
};