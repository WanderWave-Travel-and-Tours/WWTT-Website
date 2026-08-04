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
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://*.leadconnectorhq.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://wanderwaveph.onrender.com https://api.ipify.org https://*.leadconnectorhq.com https://nominatim.openstreetmap.org",
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