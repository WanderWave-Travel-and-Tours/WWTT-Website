import axios from 'axios';

const API_URL = 'https://wanderwaveph.onrender.com/api/users';

const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchArchivedUsers = async () => {
    try {
        const response = await axios.get(`${API_URL}/all-with-archived`, {
            headers: getAuthHeaders()
        });
        return response.data.filter(user => user.isArchive === "Yes");
    } catch (error) {
        console.error("Error fetching archived users:", error);
        return [];
    }
};

export const restoreUser = async (userId) => {
    try {
        const response = await axios.put(
            `${API_URL}/update-profile/${userId}`,
            { isArchive: "No" },
            { headers: getAuthHeaders() }
        );
        return response.data.status === "ok";
    } catch (error) {
        console.error("Error restoring user:", error);
        throw error;
    }
};