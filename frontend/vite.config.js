import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ---------------------------------------------------------------------------
// Content-Security-Policy — injected into the PRODUCTION build only.
// Kept out of dev so Vite HMR (which needs inline scripts, eval and ws:) works.
// Allowlist is scoped to the exact third-party origins the site actually uses:
//   - LeadConnector (GHL chat widget + webhooks + attribution tracking)
//   - Google Translate + reCAPTCHA (translate/google/gstatic)
//   - Google Fonts + Font Awesome (fonts.googleapis / fonts.gstatic / cdnjs)
//   - PayMongo checkout (payment iframe + redirect)
//   - Render API backend + ipify
//
// 'unsafe-inline' stays in script-src — confirmed by a local production-build
// test (devtools console) that BOTH Google Translate's widget AND GHL's own
// beta.leadconnectorhq.com/loader.js inject and execute inline <script> tags
// as part of their normal runtime bootstrapping. Both are third-party code we
// don't control, so there's no hash/nonce that survives their next deploy.
// index.html itself ships zero inline scripts (all moved to public/*.js) —
// this flag exists solely for the two widgets above.
// ---------------------------------------------------------------------------
const cspPlugin = () => {
  const csp = [
    "default-src 'none'",
    "script-src 'self' 'unsafe-inline' https://*.leadconnectorhq.com https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://www.gstatic.com https://fonts.bunny.net https://*.leadconnectorhq.com",
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com https://fonts.bunny.net",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://wanderwaveph.onrender.com https://api.ipify.org https://*.leadconnectorhq.com https://translate.googleapis.com https://fonts.googleapis.com https://services.msgsndr.com https://nominatim.openstreetmap.org",
    "frame-src https://checkout.paymongo.com https://*.leadconnectorhq.com https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.paymongo.com",
    "frame-ancestors 'none'",
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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cspPlugin()],
  base: '/',
  server: {
    port: 3000,
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
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'axios'],
        }
      }
    }
  }
})