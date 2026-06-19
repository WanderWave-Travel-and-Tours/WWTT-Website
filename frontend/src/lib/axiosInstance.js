/**
 * axiosInstance.js — Pre-configured Axios instance with:
 *   1. Auth header injection (user JWT or admin JWT)
 *   2. Automatic AES-256-GCM response decryption via interceptor
 *   3. Session-key warm-up on first import (fires PBKDF2 in the background)
 *
 * Import this instead of raw `axios` anywhere you make API calls.
 *
 *   import api from '@/lib/axiosInstance';
 *   const { data } = await api.get('/api/users');  // data is already decrypted
 */
import axios from 'axios';
import { isEncryptedPayload, decrypt, initSessionKey } from '../utils/payloadCrypto';

const BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    'https://wanderwaveph.onrender.com';

// Start PBKDF2 key derivation immediately on module load so it's ready
// before the first encrypted response arrives (~1-3 s on mobile).
initSessionKey();

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR — attach the right JWT automatically
// ---------------------------------------------------------------------------
api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem('wanderwave_token') ||
            localStorage.getItem('adminToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR — auto-decrypt encrypted payloads
// decrypt() already handles a single retry on key-mismatch (server restart).
// ---------------------------------------------------------------------------
api.interceptors.response.use(
    async (response) => {
        if (isEncryptedPayload(response.data)) {
            try {
                response.data = await decrypt(response.data);
            } catch {
                return Promise.reject(
                    new Error('Response decryption failed after key refresh.')
                );
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
