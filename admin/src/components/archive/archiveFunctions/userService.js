
// archiveFunctions/userService.js
import axios from 'axios';

const API_URL = 'https://wanderwaveph-backend.onrender.com/api/users'; // Palitan base sa iyong server config

export const fetchArchivedUsers = async () => {
    try {
        // Sa usersRouter.js mo, ang GET '/' ay nagbabalik ng { isArchive: { $ne: "Yes" } }
        // Kaya kailangan natin ng bagong endpoint o i-filter ito.
        // Base sa iyong usersRouter.js, wala pang specific endpoint para sa archived users lang.
        // Gagawa tayo ng logic dito para kunin lahat at i-filter or i-update ang router mo mamaya.
        const response = await axios.get(`${API_URL}/all-with-archived`); 
        return response.data.filter(user => user.isArchive === "Yes");
    } catch (error) {
        console.error("Error fetching archived users:", error);
        return [];
    }
};

export const restoreUser = async (userId) => {
    try {
        const response = await axios.put(`${API_URL}/update-profile/${userId}`, {
            isArchive: "No"
        });
        return response.data.status === "ok";
    } catch (error) {
        console.error("Error restoring user:", error);
        throw error;
    }
};