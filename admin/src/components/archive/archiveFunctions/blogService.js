import axios from 'axios';

const API_URL = 'https://wanderwaveph-backend.onrender.com/api/blogs'; // Palitan base sa iyong Port

export const fetchArchivedBlogs = async () => {
    try {
        // Gagawa tayo ng bagong endpoint sa controller mamaya
        const response = await axios.get(`${API_URL}/archived`);
        return response.data.map(blog => ({
            ...blog,
            type: 'Blog' // Mahalaga para sa Archive.jsx mapping
        }));
    } catch (error) {
        console.error("Error fetching archived blogs:", error);
        return [];
    }
};

export const restoreBlog = async (id) => {
    try {
        // Gagamitin natin ang existing update endpoint o toggle
        const response = await axios.put(`${API_URL}/${id}`, { isArchive: 'No' });
        return response.status === 200;
    } catch (error) {
        console.error("Error restoring blog:", error);
        return false;
    }
};