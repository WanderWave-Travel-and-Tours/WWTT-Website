import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ---------------------------------------------------------------------------
// Content-Security-Policy — injected into the PRODUCTION build only.
// Kept out of dev so Vite HMR (inline scripts, eval, ws:) keeps working.
// Scoped to the admin panel's real third-party origins:
//   - reCAPTCHA (google / gstatic) for the login page
//   - LeadConnector (GHL) widget + webhooks
//   - PayMongo checkout, Render API backend, ipify
// ---------------------------------------------------------------------------
const cspPlugin = () => {
  const csp = [
    "default-src 'none'",
    "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://*.leadconnectorhq.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    // No Render origin here on purpose: every API call must be same-origin
    // ('/api/...') so it routes through the Cloudflare Worker, which injects the
    // X-Origin-Secret the backend verifies. See src/config/apiBase.js. Keeping
    // the Render host allowlisted here would let a stray hardcoded URL bypass
    // the Worker silently — this CSP is the net that catches that.
    "connect-src 'self' https://api.ipify.org https://*.leadconnectorhq.com https://nominatim.openstreetmap.org https://www.google.com",
    "frame-src https://www.google.com https://checkout.paymongo.com https://*.leadconnectorhq.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`
      );
    },
  };
};

export default defineConfig({
  plugins: [react(), cspPlugin()],
  base: '/',
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://wanderwaveph.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})