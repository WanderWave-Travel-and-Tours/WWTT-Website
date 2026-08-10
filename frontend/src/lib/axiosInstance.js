/**
 * axiosInstance.js — Pre-configured Axios instance with auth header injection
 * (user JWT or admin JWT).
 *
 * Import this instead of raw `axios` anywhere you make API calls.
 *
 *   import api from '@/lib/axiosInstance';
 *   const { data } = await api.get('/api/users');
 */
import axios from 'axios';
import { API_BASE_URL as BASE_URL } from '../config/apiBase';

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

export default api;
