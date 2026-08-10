/**
 * Single source of truth for the API base URL.
 *
 * WHY THIS EXISTS
 * All API calls must be same-origin (`/api/...`) so they route through the
 * Cloudflare Worker, which injects the X-Origin-Secret header the backend
 * verifies. A call that goes straight to the Render origin has no secret and
 * is rejected once enforcement is on.
 *
 * Reading `import.meta.env.VITE_API_BASE_URL` directly is not safe: Vite bakes
 * whatever value the *build host* provides into the bundle, and a stale value
 * left in a hosting dashboard silently overrides the committed .env. That is
 * exactly what happened here — the repo was clean and the local build was
 * clean, yet the deployed bundle still contained absolute Render URLs.
 *
 * So the env value is treated as untrusted input and sanitised: any absolute
 * origin is stripped back to a same-origin path. Setting the variable wrong
 * can no longer produce a cross-origin call.
 */

// Origins that must never appear in a request URL from the browser. Requests to
// these bypass the Worker and therefore carry no origin secret.
const FORBIDDEN_ORIGIN_PATTERN = /^https?:\/\/[^/]*onrender\.com/i;

/**
 * Normalise a configured base URL to a safe, same-origin value.
 *  - undefined/empty            -> ''            (same-origin)
 *  - '/api'                     -> '/api'        (already relative)
 *  - 'https://x.onrender.com'   -> ''            (origin stripped)
 *  - 'https://x.onrender.com/api' -> '/api'      (path kept, origin stripped)
 *  - trailing slashes trimmed so `${base}/api/x` never yields `//api/x`
 */
export function sanitizeApiBase(rawValue) {
    let value = String(rawValue ?? '').trim();

    if (!value) return '';

    // Strip a forbidden absolute origin, keeping any path that followed it.
    if (FORBIDDEN_ORIGIN_PATTERN.test(value)) {
        value = value.replace(FORBIDDEN_ORIGIN_PATTERN, '');
    }

    // Any other absolute URL is left alone only if it is not http(s) — there is
    // no legitimate cross-origin API host, so collapse those to same-origin too.
    if (/^https?:\/\//i.test(value)) {
        try {
            value = new URL(value).pathname;
        } catch {
            return '';
        }
    }

    // Drop trailing slashes; callers always supply a leading '/' themselves.
    value = value.replace(/\/+$/, '');

    // Guarantee a leading slash on a non-empty path so `${base}/api` is valid.
    if (value && !value.startsWith('/')) value = `/${value}`;

    return value;
}

/**
 * Base for callers that build full paths themselves, e.g.
 *   fetch(`${API_BASE_URL}/api/bookings/${id}`)
 * Normally '' — meaning the request is same-origin.
 */
export const API_BASE_URL = sanitizeApiBase(import.meta.env.VITE_API_BASE_URL);

/**
 * Base for callers that expect the '/api' prefix baked in, e.g.
 *   fetch(`${API_ROOT}/tours/all`)
 */
export const API_ROOT = sanitizeApiBase(import.meta.env.VITE_API_URL) || '/api';

export default API_BASE_URL;
