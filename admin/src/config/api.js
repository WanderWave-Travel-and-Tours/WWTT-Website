// Thin re-export; the value is sanitised in apiBase.js so a stale absolute URL
// left in the hosting dashboard cannot produce a cross-origin call.
import { API_ROOT } from './apiBase';

const API_BASE_URL = API_ROOT;

export default API_BASE_URL;