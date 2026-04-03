import { useEffect } from 'react';

// ===================================================================
// usePageTracker — Silent page view tracker hook
// Fires once per component mount. Re-fires only if tracked props change.
//
// Usage:
//   usePageTracker('services',  '/services',           'Other Services Page');
//   usePageTracker('packages',  '/packages',           'Package Deals Page');
//   usePageTracker('flights',   '/flights',            'Flight Search Page');
//   usePageTracker('tours',     '/tours',              'Tour Packages Page');
//
//   // Specific package detail page (sets stage → consideration automatically):
//   usePageTracker('packages', `/packages/${pkg.id}`, 'Specific Package View', pkg.id, pkg.name);
//
// Parameters:
//   page        — one of: 'packages' | 'booking' | 'flights' | 'services' | 'tours'
//   path        — current URL path
//   label       — human-readable label for the dashboard
//   packageId   — (optional) package ID for detail pages
//   packageName — (optional) package name for detail pages
//   extra       — (optional) { email: string } for lead capture
// ===================================================================
const usePageTracker = (
  page,
  path,
  label = '',
  packageId = null,
  packageName = null,
  extra = {}
) => {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Attempt to get the real client IP via ipify
        let visitorIp = 'unknown';
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipRes.json();
          visitorIp = ipData.ip;
        } catch (e) {
          console.warn('⚠️ ipify failed, using fallback IP');
        }

        // Stable session ID scoped to the current browser session
        let sessionId = sessionStorage.getItem('ww_session_id');
        if (!sessionId) {
          sessionId = 'sess_' + Date.now() + Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem('ww_session_id', sessionId);
        }

        await fetch('https://wanderwaveph.onrender.com/api/page-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page,
            path,
            label,
            packageId,
            packageName,
            visitorIp,
            sessionId,
            email: extra.email || null,
          }),
        });
      } catch (err) {
        console.warn('⚠️ Page view tracking failed:', err);
      }
    };

    trackPageView();
  // Re-run only when these values change
  }, [page, path, label, packageId, packageName]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default usePageTracker;
