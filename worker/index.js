// WanderWave — Cloudflare Worker: static asset serving + per-request CSP nonce.
//
// This Worker fronts the static frontend/dist build (via the "assets"
// binding configured in wrangler.jsonc) and does one extra thing a plain
// static-asset Worker can't: injects a fresh CSP nonce into every HTML
// response, replacing the "__CSP_NONCE__" placeholder that Vite's
// html.cspNonce config (frontend/vite.config.js) bakes into the build's
// <script>/<link>/<style> tags. A per-request nonce lets script-src drop
// 'unsafe-inline' entirely — see frontend/vite.config.js for the full
// rationale (Google Translate's widget and GHL's loader.js still
// self-inject their own inline <script> tags at runtime; those won't carry
// our nonce and stay blocked, which is fine — their actual functionality
// loads via external, domain-allowlisted <script src> tags).

function randomNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function buildCsp(nonce) {
  return [
    "default-src 'none'",
    `script-src 'self' 'nonce-${nonce}' https://*.leadconnectorhq.com https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com`,
    "style-src-elem 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://www.gstatic.com https://fonts.bunny.net https://*.leadconnectorhq.com",
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com https://fonts.bunny.net",
    "img-src 'self' data: blob: https:",
    // Render origin deliberately absent — API calls go same-origin through this
    // Worker so it can inject X-Origin-Secret. See frontend/src/config/apiBase.js.
    "connect-src 'self' https://api.ipify.org https://*.leadconnectorhq.com https://translate.googleapis.com https://fonts.googleapis.com https://services.msgsndr.com https://nominatim.openstreetmap.org https://www.google.com",
    "frame-src https://checkout.paymongo.com https://*.leadconnectorhq.com https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.paymongo.com",
    "frame-ancestors 'none'",
  ].join('; ');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // The site root ("/") is a separate GHL/LeadConnector-hosted landing
    // page, not part of this React app's build — it's DNS-routed to a
    // different origin entirely. This Worker's route (wanderwaveph.com/*)
    // intercepts that request too, so pass it straight through to
    // whatever origin the zone's DNS record points at, completely
    // unmodified (no CSP rewriting — that page has its own inline
    // scripts/styles we don't control and can't safely restrict).
    // fetch(request) from inside a routed Worker forwards to the zone's
    // DNS-configured origin rather than re-triggering this Worker.
    if (url.pathname === '/') {
      return fetch(request);
    }

    // Everything else is the React SPA. env.ASSETS serves the static build
    // configured via wrangler.jsonc's "assets" binding (frontend/dist, SPA
    // fallback to index.html).
    const response = await env.ASSETS.fetch(request);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    const nonce = randomNonce();
    const originalBody = await response.text();
    const rewrittenBody = originalBody.replaceAll('__CSP_NONCE__', nonce);

    const newHeaders = new Headers(response.headers);
    newHeaders.set('Content-Security-Policy', buildCsp(nonce));

    return new Response(rewrittenBody, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
