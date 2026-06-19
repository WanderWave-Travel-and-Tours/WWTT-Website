import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { preFetchPackages } from './utils/packagesCache.js'

// Silence all browser console output in production.
// Use Render's backend logs or Vite's terminal for debugging instead.
if (import.meta.env.PROD) {
  const noop = () => {};
  console.log   = noop;
  console.error = noop;
  console.warn  = noop;
  console.info  = noop;
  console.debug = noop;
}

preFetchPackages();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
