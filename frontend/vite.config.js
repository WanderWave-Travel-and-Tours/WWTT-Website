import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ---------------------------------------------------------------------------
// Content-Security-Policy — the CSP header itself is generated per-request by
// backend/server.js (buildContentSecurityPolicy), NOT by this build config.
// The <meta http-equiv="Content-Security-Policy"> approach previously used
// here couldn't carry frame-ancestors (browsers ignore that directive in a
// meta tag) and couldn't carry a per-request nonce (a build-time-baked value
// is static and defeats the point of a nonce) — so CSP delivery moved
// entirely to the real HTTP header, and this plugin was removed.
//
// script-src no longer needs 'unsafe-inline': the HTML's own
// <script type="module"> entry point now carries a nonce (see html.cspNonce
// below), matched against the per-request 'nonce-...' value
// backend/server.js adds to script-src. Google Translate's widget and GHL's
// loader.js still self-inject their own inline <script> tags at runtime as
// part of normal bootstrapping — those won't carry our nonce and stay
// blocked, which is fine: their actual widget functionality loads via
// external, domain-allowlisted <script src> tags, not the blocked inline
// snippets.
//
// style-src is split into style-src-elem (strict, no unsafe-inline — all of
// our own JSX inline style={{}} usage has been converted to CSS classes) and
// style-src-attr (kept permissive) because two runtime dependencies still set
// inline style="" attributes we don't control: react-easy-crop (image cropper
// drag/zoom positioning) and react-datepicker (calendar popper positioning).
// Neither can be forked/patched without losing upstream updates. CSP3's
// style-src-elem/style-src-attr split has near-universal evergreen-browser
// support (Chrome 111+, Firefox 102+, Safari 15.4+); browsers without CSP3
// support fall back past style-src to default-src 'none', which would break
// those two libraries' inline positioning on such browsers — an accepted
// tradeoff given the target audience.
// ---------------------------------------------------------------------------

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  html: {
    // Placeholder token Vite bakes into every module <script>/<link> tag it
    // manages in the build output. backend/server.js reads the built
    // index.html once at startup and replaces every occurrence of this
    // exact string with a fresh per-request nonce before sending the
    // response — see the frontend-serving block in backend/server.js.
    cspNonce: '__CSP_NONCE__',
  },
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