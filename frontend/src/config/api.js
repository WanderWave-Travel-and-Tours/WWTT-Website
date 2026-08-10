
// src/config/api.js
// Kept as a thin re-export so existing `import API_BASE_URL from '@/config/api'`
// call sites keep working. The value is sanitised in apiBase.js — see the note
// there on why the env var is not read directly.
import { API_ROOT } from './apiBase';

const API_BASE_URL = API_ROOT;

export default API_BASE_URL;