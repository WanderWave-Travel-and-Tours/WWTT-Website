import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { preFetchPackages } from './utils/packagesCache.js'
import { initSessionKey, decrypt, isEncryptedPayload } from './utils/payloadCrypto.js'

// DEBUG: console silencing temporarily disabled to trace fetch/decrypt issues
// if (import.meta.env.PROD) {
//   const noop = () => {};
//   console.log   = noop;
//   console.error = noop;
//   console.warn  = noop;
//   console.info  = noop;
//   console.debug = noop;
// }

// Global fetch interceptor — auto-decrypts every encrypted API response so no
// individual component needs to import decrypt(). External API calls (ipify, etc.)
// and error responses (4xx/5xx) are unencrypted and pass through unchanged.
const _nativeFetch = window.fetch.bind(window);
window.fetch = async function (...args) {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
  const isApiCall = url?.includes('/api/');

  let response;
  try {
    response = await _nativeFetch(...args);
  } catch (networkErr) {
    console.error('[fetch] ❌ NETWORK ERROR:', url, networkErr.message);
    throw networkErr;
  }

  if (isApiCall) {
    console.log(`[fetch] ${args[1]?.method || 'GET'} ${url} → ${response.status}`);
  }

  const originalJson = response.json.bind(response);
  response.json = async function () {
    const data = await originalJson();
    if (!isEncryptedPayload(data)) {
      if (isApiCall) console.log('[fetch] NOT encrypted:', url, '— keys:', Object.keys(data ?? {}).slice(0, 5));
      return data;
    }
    console.log('[fetch] 🔐 Decrypting:', url);
    try {
      const result = await decrypt(data);
      console.log('[fetch] ✅ Decrypted OK:', url, '— type:', Array.isArray(result) ? `array[${result.length}]` : typeof result);
      return result;
    } catch (err) {
      console.error('[fetch] ❌ Decrypt FAILED:', url, err.message);
      throw err;
    }
  };
  return response;
};

// Warm PBKDF2 session key before any component mounts and makes encrypted API calls
initSessionKey();
preFetchPackages();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
