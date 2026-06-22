import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { isEncryptedPayload, decrypt, initSessionKey } from './utils/payloadCrypto.js'

// Warm the PBKDF2 session key immediately so it is ready before the first API call.
initSessionKey();

// Self-XSS warning — deters console-paste attacks (CVE-2025-63418 style).
;(function selfXssWarning() {
  console.warn('%c⛔ STOP!', 'color:#d32f2f;font-size:52px;font-weight:900;');
  console.log(
    '%cThis is a restricted admin console.\n' +
    'If someone instructed you to paste anything here, they are attempting to compromise the admin panel.\n' +
    'Close this panel and report it immediately.',
    'color:#b71c1c;font-size:15px;font-weight:bold;line-height:1.6;'
  );
})();

// ---------------------------------------------------------------------------
// Global fetch override — auto-decrypts AES-256-GCM payloads from the API.
// Intercepts every fetch() in the admin panel without touching any call site.
// ---------------------------------------------------------------------------
const _nativeFetch = window.fetch.bind(window);

window.fetch = async function decryptingFetch(input, init) {
    const url = typeof input === 'string' ? input : input?.url;
    const isApiCall = url?.includes('/api/');

    // For API calls: inject credentials (cookie) and replace any bogus
    // "Bearer null" / "Bearer undefined" tokens with the real sessionStorage token.
    // This centralises auth for all 18+ fetch call sites without touching each file.
    const apiInit = isApiCall
        ? (() => {
            const sessionToken = sessionStorage.getItem('adminToken');
            const existingHeaders = init?.headers || {};
            const existingAuth = (existingHeaders['Authorization'] || existingHeaders['authorization'] || '').trim();
            const isBogusAuth = /^Bearer (null|undefined)$/.test(existingAuth);
            const headers = {
                ...existingHeaders,
                ...(sessionToken && (!existingAuth || isBogusAuth)
                    ? { 'Authorization': `Bearer ${sessionToken}` }
                    : {}),
            };
            return { ...init, credentials: init?.credentials ?? 'include', headers };
        })()
        : init;

    let response;
    try {
        response = await _nativeFetch(input, apiInit);
    } catch (networkErr) {
        console.error('[fetch] ❌ NETWORK ERROR for', url, '—', networkErr.message);
        throw networkErr;
    }

    if (isApiCall) {
        console.log(`[fetch] ${init?.method || 'GET'} ${url} → HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return response;

    // Clone before consuming so the caller can still call response.json() normally.
    const clone = response.clone();
    let body;
    try {
        body = await clone.json();
    } catch (parseErr) {
        if (isApiCall) console.warn('[fetch] Could not parse JSON for', url, '—', parseErr.message);
        return response;
    }

    if (!isEncryptedPayload(body)) {
        if (isApiCall) console.log('[fetch] Response NOT encrypted for', url, '— passing through as-is. Keys:', Object.keys(body ?? {}).slice(0, 5));
        return response;
    }

    console.log('[fetch] 🔐 Encrypted response detected for', url, '— decrypting...');

    try {
        const decrypted = await decrypt(body);
        console.log('[fetch] ✅ Decrypted OK for', url);
        // Re-wrap as a standard Response so callers receive plain JSON as usual.
        return new Response(JSON.stringify(decrypted), {
            status:     response.status,
            statusText: response.statusText,
            headers:    response.headers,
        });
    } catch (decryptErr) {
        console.error('[fetch] ❌ Decryption FAILED for', url, '—', decryptErr.message, '— returning raw encrypted body');
        // Decryption failed — return original so the caller at least gets raw data.
        return response;
    }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
