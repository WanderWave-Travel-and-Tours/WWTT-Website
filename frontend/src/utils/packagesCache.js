// Kick off the packages fetch as early as possible (imported in main.jsx).
// packageDeals.jsx awaits this same promise — only ONE network request ever fires.
// The promise resolves to the parsed JSON body, or null on error.
// Decryption is handled globally by the fetch interceptor in main.jsx.
let _promise = null;

async function fetchWithRetry(url, retries = 3, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.json();
    } catch {}
    if (i < retries - 1) await new Promise(res => setTimeout(res, delayMs));
  }
  return null;
}

export function preFetchPackages() {
  if (!_promise) {
    _promise = fetchWithRetry('https://wanderwaveph.onrender.com/api/packages/with-tours');
  }
  return _promise;
}
