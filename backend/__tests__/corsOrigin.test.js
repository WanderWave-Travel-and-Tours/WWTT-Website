// Verifies the CORS origin allowlist, including the two defects fixed:
//   1. 'https://*.gohighlevel.com' was a glob in a string array — the cors
//      package compares those literally, so it matched nothing.
//   2. The Render origin was allowlisted "so direct API calls don't get
//      blocked", making the API self-authorizing.
//
// Rebuilds the same predicate as server.js. Kept in sync deliberately: importing
// server.js here would boot Mongo, the scheduler and the SPA handler.
const ALLOWED_ORIGINS = new Set([
  'https://wanderwaveph.com',
  'https://www.wanderwaveph.com',
  'https://app.gohighlevel.com',
  'https://checkout.paymongo.com',
]);
const ALLOWED_ORIGIN_SUFFIXES = ['.gohighlevel.com', '.leadconnectorhq.com'];
const DEV_ORIGINS = new Set([
  'http://localhost:3000', 'http://localhost:3001',
  'http://localhost:5173', 'http://127.0.0.1:3000',
]);

function makeIsAllowed(isProduction) {
  return function isAllowedOrigin(origin) {
    if (ALLOWED_ORIGINS.has(origin)) return true;
    if (!isProduction && DEV_ORIGINS.has(origin)) return true;
    try {
      const { protocol, hostname } = new URL(origin);
      if (protocol !== 'https:') return false;
      return ALLOWED_ORIGIN_SUFFIXES.some(s => hostname.endsWith(s));
    } catch {
      return false;
    }
  };
}

const isAllowedProd = makeIsAllowed(true);
const isAllowedDev = makeIsAllowed(false);

describe('CORS origin allowlist', () => {
  test('allows the production sites', () => {
    expect(isAllowedProd('https://wanderwaveph.com')).toBe(true);
    expect(isAllowedProd('https://www.wanderwaveph.com')).toBe(true);
  });

  test('allows GHL subdomains — the glob entry never did', () => {
    expect(isAllowedProd('https://tenant.gohighlevel.com')).toBe(true);
    expect(isAllowedProd('https://a.b.leadconnectorhq.com')).toBe(true);
  });

  test('does NOT allow the Render origin (no longer self-authorizing)', () => {
    expect(isAllowedProd('https://wanderwaveph.onrender.com')).toBe(false);
  });

  test('rejects suffix-spoofing lookalike domains', () => {
    // The '.' prefix in the suffix is what stops these.
    expect(isAllowedProd('https://evilgohighlevel.com')).toBe(false);
    expect(isAllowedProd('https://notleadconnectorhq.com')).toBe(false);
    // Attacker-controlled domain merely *containing* an allowed host.
    expect(isAllowedProd('https://gohighlevel.com.evil.test')).toBe(false);
    expect(isAllowedProd('https://wanderwaveph.com.evil.test')).toBe(false);
  });

  test('rejects plaintext http for partner subdomains', () => {
    expect(isAllowedProd('http://tenant.gohighlevel.com')).toBe(false);
  });

  test('rejects localhost in production but allows it in development', () => {
    expect(isAllowedProd('http://localhost:3000')).toBe(false);
    expect(isAllowedDev('http://localhost:3000')).toBe(true);
  });

  test('rejects malformed and empty origins', () => {
    expect(isAllowedProd('not-a-url')).toBe(false);
    expect(isAllowedProd('')).toBe(false);
    expect(isAllowedProd('null')).toBe(false);
  });

  test('rejects arbitrary third-party sites', () => {
    expect(isAllowedProd('https://attacker.test')).toBe(false);
  });
});
