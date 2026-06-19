// Kick off the packages fetch as early as possible (imported in main.jsx).
// packageDeals.jsx awaits this same promise — only ONE network request ever fires.
// The promise resolves to the parsed JSON body, or null on error.
// Decryption is handled globally by the fetch interceptor in main.jsx.
let _promise = null;

export function preFetchPackages() {
  if (!_promise) {
    _promise = fetch('https://wanderwaveph.onrender.com/api/packages/with-tours')
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return _promise;
}
