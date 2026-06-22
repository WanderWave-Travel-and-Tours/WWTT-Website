import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { preFetchPackages } from './utils/packagesCache.js'
import { initSessionKey, decrypt, isEncryptedPayload } from './utils/payloadCrypto.js'

// Self-XSS warning — printed before console is silenced so it always shows.
// Deters social-engineering attacks (CVE-2025-63418 style) where a victim is
// tricked into pasting malicious code into the browser console.
;(function selfXssWarning() {
  const w = console.warn.bind(console);
  const l = console.log.bind(console);
  w('%c⛔ STOP!', 'color:#d32f2f;font-size:52px;font-weight:900;');
  l(
    '%cThis is a browser feature intended for developers only.\n' +
    'If someone told you to paste or type anything here, they are attempting to hijack your account.\n' +
    'Close this panel immediately.',
    'color:#b71c1c;font-size:15px;font-weight:bold;line-height:1.6;'
  );
})();

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
preFetchPackages();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
