import api from '../../../lib/axiosInstance';

const API_PATH = '/api/users';

export const fetchArchivedUsers = async () => {
    try {
        const response = await api.get(`${API_PATH}/all-with-archived`);
        return response.data.filter(user => user.isArchive === "Yes");
    } catch (error) {
        console.error("Error fetching archived users:", error);
        return [];
    }
};

export const restoreUser = async (userId) => {
    try {
        const response = await api.put(
            `${API_PATH}/update-profile/${userId}`,
            { isArchive: "No" }
        );
        return response.data.status === "ok";
    } catch (error) {
        console.error("Error restoring user:", error);
        throw error;
    }
};