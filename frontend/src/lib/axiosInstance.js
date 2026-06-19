/**
 * axiosInstance.js — Pre-configured Axios instance with:
 *   1. Auth header injection (user JWT or admin JWT)
 *   2. Automatic response decryption via interceptor
 *
 * Import this instead of raw `axios` anywhere you make API calls.
 *
 *   import api from '@/lib/axiosInstance';
 *   const { data } = await api.get('/api/users');  // data is already decrypted
 */
import axios from 'axios';
import { isEncryptedPayload, decrypt } from '../utils/payloadCrypto';

const BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    'https://wanderwaveph.onrender.com';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR — attach the right JWT automatically
// ---------------------------------------------------------------------------
api.interceptors.request.use(
    (config) => {
        // User routes use wanderwave_token; admin routes use adminToken
        const token =
            localStorage.getItem('wanderwave_token') ||
            localStorage.getItem('adminToken');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR — auto-decrypt encrypted payloads
// ---------------------------------------------------------------------------
api.interceptors.response.use(
    async (response) => {
        if (isEncryptedPayload(response.data)) {
            try {
                response.data = await decrypt(response.data);
            } catch (err) {
                // Reject so the caller knows something is wrong, not silently
                // return bad data
                return Promise.reject(
                    new Error('Response decryption failed. Key mismatch?')
                );
            }
        }
        return response;
    },
    async (error) => {
        // If the server sends an encrypted error body (optional — depends on
        // whether you chose to encrypt 4xx in encryptResponse.js), decrypt it
        // so error.response.data is still readable in catch blocks.
        if (error.response && isEncryptedPayload(error.response.data)) {
            try {
                error.response.data = await decrypt(error.response.data);
            } catch {
                // Leave encrypted on failure — better than crashing the chain
            }
        }
        return Promise.reject(error);
    }
);

export default api;
