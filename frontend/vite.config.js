import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import JavaScriptObfuscator from 'javascript-obfuscator'

// ---------------------------------------------------------------------------
// Anti-tamper / anti-debugging — injected into the PRODUCTION build only and
// OBFUSCATED so it cannot be casually read or bypassed. Behaviour:
//   - Runs ONLY on the live domain (wanderwaveph.com). Never on localhost or
//     preview builds, so the team's own DevTools testing is unaffected.
//   - Team self-bypass: run  localStorage.setItem('ww_dev','1')  once in a
//     trusted browser to disable all checks on that device.
//   - When DevTools is detected (via debugger-timing), it repeatedly hits a
//     `debugger` statement (pause-in-debugging) and HIDES the chat widget.
// NOTE: This is deterrence, not real security — a skilled attacker can disable
// breakpoints and walk around it. The genuine protections remain httpOnly
// cookies, server-side validation, and the CSP above.
// ---------------------------------------------------------------------------
const ANTI_TAMPER_SRC = `
(function () {
  var host = location.hostname;
  if (host !== 'wanderwaveph.com' && host !== 'www.wanderwaveph.com') return;
  try { if (localStorage.getItem('ww_dev') === '1') return; } catch (e) {}

  var tripped = false;
  function hideChat() {
    try {
      var el = document.querySelector('chat-widget');
      if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      }
    } catch (e) {}
  }
  function trip() { if (tripped) return; tripped = true; hideChat(); }

  function check() {
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    (function () { debugger; })();
    var t1 = (window.performance && performance.now) ? performance.now() : Date.now();
    if (t1 - t0 > 120) trip();
  }
  setInterval(check, 800);
  setInterval(function () { if (tripped) hideChat(); }, 500);
})();
`;

const antiTamperPlugin = () => {
  let obfuscated = '';
  try {
    obfuscated = JavaScriptObfuscator.obfuscate(ANTI_TAMPER_SRC, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      selfDefending: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 1,
      identifierNamesGenerator: 'hexadecimal',
      numbersToExpressions: true,
      simplify: true,
      transformObjectKeys: true,
    }).getObfuscatedCode();
  } catch (e) {
    console.warn('[anti-tamper] obfuscation skipped:', e.message);
    obfuscated = '';
  }

  return {
    name: 'inject-anti-tamper',
    apply: 'build',
    transformIndexHtml(html) {
      if (!obfuscated) return html;
      return html.replace('</head>', `  <script>${obfuscated}</script>\n  </head>`);
    },
  };
};

// ---------------------------------------------------------------------------
// Content-Security-Policy — injected into the PRODUCTION build only.
// Kept out of dev so Vite HMR (which needs inline scripts, eval and ws:) works.
// Allowlist is scoped to the exact third-party origins the site actually uses:
//   - LeadConnector (GHL chat widget + webhooks)
//   - Google Translate + reCAPTCHA (translate/google/gstatic)
//   - Google Fonts + Font Awesome (fonts.googleapis / fonts.gstatic / cdnjs)
//   - PayMongo checkout (payment iframe + redirect)
//   - Render API backend + ipify
// 'unsafe-inline' stays because index.html ships inline scripts and Google
// Translate injects more at runtime; the real wins here are the tight
// connect-src (blocks data exfiltration), object-src 'none', and base-uri.
// ---------------------------------------------------------------------------
const cspPlugin = () => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://*.leadconnectorhq.com https://translate.google.com https://translate.googleapis.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://www.gstatic.com",
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://wanderwaveph.onrender.com https://api.ipify.org https://*.leadconnectorhq.com https://translate.googleapis.com https://fonts.googleapis.com",
    "frame-src https://checkout.paymongo.com https://*.leadconnectorhq.com https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.paymongo.com",
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
  plugins: [react(), cspPlugin(), antiTamperPlugin()],
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