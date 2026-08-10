// imageService.js
import axios from 'axios';

const API_URL = '/api/images';

export const fetchArchivedImages = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data
            .filter(img => img.isArchive === 'Yes')
            .map(img => ({
                ...img,
                type: 'Image Gallery',
                itemName: img.imageName || 'Untitled Image',
                archivedAt: img.updatedAt
            }));
    } catch (error) {
        console.error('Error fetching archived images:', error);
        return [];
    }
};

// Eto ang magpapalit ng isArchive sa "No"
export const restoreImage = async (id) => {
    try {
        // Nagpapadala tayo ng data body na may isArchive: "No"
        const response = await axios.patch(`${API_URL}/${id}`, {
            isArchive: 'No'
        });
        return response.status === 200;
    } catch (error) {
        console.error('Error restoring image:', error);
        throw error;
    }
};