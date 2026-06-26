import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { preFetchPackages } from './utils/packagesCache.js'
import { initSessionKey, decrypt, isEncryptedPayload } from './utils/payloadCrypto.js'

// Silence all browser console output in production.
if (import.meta.env.PROD) {
  const noop = () => {};
  console.log   = noop;
  console.error = noop;
  console.warn  = noop;
  console.info  = noop;
  console.debug = noop;
}

// Global fetch interceptor — auto-decrypts every encrypted API response so no
// individual component needs to import decrypt(). External API calls (ipify, etc.)
// and error responses (4xx/5xx) are unencrypted and pass through unchanged.
const _nativeFetch = window.fetch.bind(window);
window.fetch = async function (...args) {
  const response = await _nativeFetch(...args);
  const originalJson = response.json.bind(response);
  response.json = async function () {
    const data = await originalJson();
    return isEncryptedPayload(data) ? decrypt(data) : data;
  };
  return response;
};

// Warm PBKDF2 session key before any component mounts and makes encrypted API calls
initSessionKey();

// Wake up the Render server first, then kick off the packages pre-fetch.
// On cold start, /api/ping responds in ~5-15s while the server boots —
// waiting for it ensures /with-tours doesn't fire into a sleeping server.
fetch('https://wanderwaveph.onrender.com/api/ping')
  .catch(() => {})
  .finally(() => preFetchPackages());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
