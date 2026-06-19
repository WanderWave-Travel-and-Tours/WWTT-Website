import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { isEncryptedPayload, decrypt, initSessionKey } from './utils/payloadCrypto.js'

// Warm the PBKDF2 session key immediately so it is ready before the first API call.
initSessionKey();

// ---------------------------------------------------------------------------
// Global fetch override — auto-decrypts AES-256-GCM payloads from the API.
// Intercepts every fetch() in the admin panel without touching any call site.
// ---------------------------------------------------------------------------
const _nativeFetch = window.fetch.bind(window);

window.fetch = async function decryptingFetch(input, init) {
    const response = await _nativeFetch(input, init);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return response;

    // Clone before consuming so the caller can still call response.json() normally.
    const clone = response.clone();
    let body;
    try {
        body = await clone.json();
    } catch {
        return response;
    }

    if (!isEncryptedPayload(body)) return response;

    try {
        const decrypted = await decrypt(body);
        // Re-wrap as a standard Response so callers receive plain JSON as usual.
        return new Response(JSON.stringify(decrypted), {
            status:     response.status,
            statusText: response.statusText,
            headers:    response.headers,
        });
    } catch {
        // Decryption failed — return original so the caller at least gets raw data.
        return response;
    }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
