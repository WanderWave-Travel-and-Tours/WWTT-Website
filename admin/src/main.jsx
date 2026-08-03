import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ---------------------------------------------------------------------------
// Global fetch override — injects credentials so the HttpOnly admin cookie is
// sent automatically on every API call, without touching individual call sites.
// ---------------------------------------------------------------------------
const _nativeFetch = window.fetch.bind(window);

window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input?.url;
    const isApiCall = url?.includes('/api/');

    const apiInit = isApiCall
        ? { ...init, credentials: init?.credentials ?? 'include' }
        : init;

    return _nativeFetch(input, apiInit);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
