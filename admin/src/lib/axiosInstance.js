/**
 * axiosInstance.js (admin panel)
 * Pre-configured Axios with AES-256-GCM response decryption.
 * The admin's global fetch override in main.jsx only covers fetch() calls;
 * axios uses XMLHttpRequest, so it must be intercepted here instead.
 *
 * Usage:
 *   import api from '../../lib/axiosInstance';
 *   const res = await api.get('/api/inquiries');  // already decrypted
 */
import axios from 'axios';
import { isEncryptedPayload, decrypt, initSessionKey } from '../utils/payloadCrypto';

const BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    'https://wanderwaveph.onrender.com';

initSessionKey();

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
    async (response) => {
        if (isEncryptedPayload(response.data)) {
            try {
                response.data = await decrypt(response.data);
            } catch {
                return Promise.reject(new Error('Admin response decryption failed.'));
            }
        }
        return response;
    },
    async (error) => {
        if (error.response && isEncryptedPayload(error.response.data)) {
            try {
                error.response.data = await decrypt(error.response.data);
            } catch {
                // Leave encrypted on failure
            }
        }
        return Promise.reject(error);
    }
);

export default api;
