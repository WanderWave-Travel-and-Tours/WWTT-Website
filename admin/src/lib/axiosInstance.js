/**
 * axiosInstance.js (admin panel)
 * Pre-configured Axios instance for the admin panel API calls.
 *
 * Usage:
 *   import api from '../../lib/axiosInstance';
 *   const res = await api.get('/api/inquiries');
 */
import axios from 'axios';

import { API_BASE_URL as BASE_URL } from '../config/apiBase';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

export default api;
