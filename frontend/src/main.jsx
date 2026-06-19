import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { preFetchPackages } from './utils/packagesCache.js'

// Fire packages fetch immediately — wakes render.com from cold start and
// caches the result so PackageDeals doesn't need to re-fetch when it mounts.
preFetchPackages();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
