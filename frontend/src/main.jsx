import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { preFetchPackages } from './utils/packagesCache.js'

// Silence all browser console output in production.
if (import.meta.env.PROD) {
  const noop = () => {};
  console.log   = noop;
  console.error = noop;
  console.warn  = noop;
  console.info  = noop;
  console.debug = noop;
}

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
