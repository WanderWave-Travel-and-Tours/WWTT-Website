// src/hooks/usePageTracker.js
//
// Drop-in hook for tracking page views with full history + stop detection.
//
// Usage (call once per page component):
//   usePageTracker({ page: 'packages', path: '/packages', label: 'Package Deals' });
//   usePageTracker({ page: 'booking',  path: '/booking',  packageId: pkg._id, packageName: pkg.title });
//
// What it does:
//   1. Fetches the visitor's real public IP via ipify (once per app session)
//   2. Generates/reuses a stable sessionId per browser tab
//   3. POSTs the page visit to /api/page-views → gets back a viewId
//   4. On tab close / page hide → PATCHes /api/page-views/:viewId/stop
//      so the backend can mark exactly where the visitor stopped

import { useEffect, useRef } from 'react';

const API_BASE = 'https://wanderwaveph.onrender.com/api/page-views';

// ── IP cache — fetched once per app session (stored in sessionStorage) ──
async function getPublicIp() {
  const cached = sessionStorage.getItem('ww_visitor_ip');
  if (cached) return cached;

  try {
    const res  = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    const data = await res.json();
    const ip   = data.ip || 'unknown';
    sessionStorage.setItem('ww_visitor_ip', ip);
    return ip;
  } catch {
    return 'unknown';
  }
}

// ── Session ID — one per browser tab (survives React re-renders) ─────────
function getSessionId() {
  let sid = sessionStorage.getItem('ww_session_id');
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('ww_session_id', sid);
  }
  return sid;
}

// ── Main hook ─────────────────────────────────────────────────────────────
export function usePageTracker({ page, path, label = '', packageId = null, packageName = null, email = null }) {
  const viewIdRef    = useRef(null);   // ID of the saved PageView document
  const startTimeRef = useRef(null);   // when the user arrived on this page

  useEffect(() => {
    let cancelled = false;

    async function trackView() {
      try {
        const visitorIp = await getPublicIp();
        const sessionId = getSessionId();

        const body = {
          page,
          path,
          label,
          packageId,
          packageName,
          visitorIp,
          sessionId,
          email,
        };

        const res  = await fetch(API_BASE, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        });

        const data = await res.json();

        if (!cancelled && data.status === 'ok' && data.viewId) {
          viewIdRef.current    = data.viewId;
          startTimeRef.current = Date.now();
          console.log(`📍 Tracking: [${page}] viewId=${data.viewId}`);
        }
      } catch (err) {
        console.warn('⚠️ usePageTracker: failed to log view', err);
      }
    }

    trackView();

    // ── Stop tracking — called when user leaves ──────────────────────
    function sendStop() {
      const viewId = viewIdRef.current;
      if (!viewId) return;

      const timeOnPageSeconds = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : null;

      // Use sendBeacon so the request survives tab close
      const payload = JSON.stringify({ timeOnPageSeconds });
      const url     = `${API_BASE}/${viewId}/stop`;

      const sent = navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));

      if (!sent) {
        // Fallback: synchronous fetch (may not complete on tab close, but ok for navigation)
        fetch(url, {
          method:     'PATCH',
          headers:    { 'Content-Type': 'application/json' },
          body:       payload,
          keepalive:  true,
        }).catch(() => {});
      }

      console.log(`🛑 Stop sent: [${page}] viewId=${viewId} time=${timeOnPageSeconds}s`);

      // Clear so we don't double-send
      viewIdRef.current = null;
    }

    // visibilitychange: fires reliably on mobile and most desktop browsers
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        sendStop();
      }
    }

    // pagehide / beforeunload: extra safety net for desktop browsers
    function handlePageHide() {
      sendStop();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide',           handlePageHide);
    window.addEventListener('beforeunload',       handlePageHide);

    return () => {
      cancelled = true;

      // User navigated to a different React route — mark stop
      sendStop();

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide',           handlePageHide);
      window.removeEventListener('beforeunload',       handlePageHide);
    };
  // Re-run if the tracked page identity changes (e.g. package detail page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, path, packageId]);
}