export const getAuthHeaders = () => {
    const token = localStorage.getItem('wanderwave_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};
