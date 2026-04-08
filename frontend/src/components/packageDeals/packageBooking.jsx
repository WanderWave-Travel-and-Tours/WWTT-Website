import React, { useState, useEffect, useRef } from 'react';
import BookingLeftColumn from './bookingLeftColumn';
import BookingRightForm from './bookingRightForm';

import './packageBooking.css';
import { usePageTracker } from '../../hooks/usePageTracker';
import { useGHLTrigger } from '../../hooks/useGHLTrigger';

function PackageBooking({ 
  pkg, 
  onGoBack, 
  currency = 'PHP', 
  exchangeRate = 58,
  initialPaxFromFunnel = null 
}) {
  const [customizationData, setCustomizationData] = useState(null);
  const [paxCount, setPaxCount] = useState(1); // ✅ Lifted pax state — synced from BookingRightForm via onPaxChange
  const [selectedFlight, setSelectedFlight] = useState(null); // ✅ Lifted flight state — synced from BookingRightForm
  
  // ============================================
  // TIMER & OFFER STATES (LIFTED FROM CHILD)
  // ============================================
  const [userIpAddress, setUserIpAddress] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);
  

  // Ref to track if component is mounted
  const isMounted = useRef(true);

  if (!pkg) return null;

  // ============================================================
  // PAGE VIEW TRACKER — fires once per package booking page view.
  // Uses the shared hook so stop signals (tab close/navigate away)
  // are automatically sent via sendBeacon.
  // ============================================================
  const packageId   = pkg._id || pkg.id;
  const packageName = pkg.name || pkg.title || 'Unknown Package';

  usePageTracker({
    page:        'booking',
    path:        `/booking/${packageId}`,
    label:       `Booking Page: ${packageName}`,
    packageId,
    packageName,
  });

  // ── GHL Trigger — fires after 1 minute OR on exit intent ────────
  useGHLTrigger({
    enabled: true,
    delayMinutes: 1,
    triggerOnExit: true
  });

  // ============================================
  // PREVENT BACK NAVIGATION FROM BOOKING PAGE
  // ============================================
  useEffect(() => {
    // Push a dummy state when component mounts
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = (event) => {
      // Push the state again to prevent going back
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);


  // ============================================
  // FIX: PREVENT UNINTENDED NAVIGATION
  // ============================================
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ============================================
  // 1. GET USER IP ADDRESS
  // ============================================
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        if (isMounted.current) {
          setUserIpAddress(data.ip);
        }
      } catch (error) {
        console.error('❌ Error fetching IP:', error);
        if (isMounted.current) {
          setUserIpAddress('unknown');
        }
      }
    };
    fetchIpAddress();
  }, []);

  // ============================================
  // 2. TIMER LOGIC & ANIMATION SEQUENCE
  // ============================================
  useEffect(() => {
    if (!userIpAddress || (!pkg._id && !pkg.id) || !isMounted.current) return;
    const packageId = pkg._id || pkg.id;

    const timerKey = `timer_${packageId}_${userIpAddress}`;
    const lastResetKey = `lastReset_${packageId}_${userIpAddress}`;
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem(lastResetKey);

    // ✅ FIX: Run daily reset check FIRST before reading storedTimer.
    // This prevents a stale timerKey from a previous day from immediately
    // triggering timerExpired=true before the daily reset interval fires.
    if (lastReset !== today) {
      localStorage.removeItem(timerKey);
      localStorage.setItem(lastResetKey, today);
      const startTime = Date.now();
      localStorage.setItem(timerKey, JSON.stringify({ startTime }));
      if (isMounted.current) {
        setTimeRemaining(900000);
        setTimerExpired(false);
      }
      return; // ✅ Already initialized fresh — skip storedTimer processing below
    }

    const storedTimer = localStorage.getItem(timerKey);

    // Calculate Time
    if (storedTimer) {
      const timerData = JSON.parse(storedTimer);
      const now = Date.now();
      const elapsed = now - timerData.startTime;
      const remaining = Math.max(0, 900000 - elapsed); // 15 minutes = 900000ms

      if (remaining > 0) {
        if (isMounted.current) {
          setTimeRemaining(remaining);
          setTimerExpired(false);
        }
      } else if (isMounted.current) {
        setTimeRemaining(0);
        setTimerExpired(true);
      }
    } else {
      // Start new timer for new user/day
      const startTime = Date.now();
      localStorage.setItem(timerKey, JSON.stringify({ startTime }));
      // ✅ Always stamp today so the daily-reset check never fires prematurely
      //    on the same day the timer was first created.
      localStorage.setItem(lastResetKey, today);
      if (isMounted.current) {
        setTimeRemaining(900000); // 15 minutes
        setTimerExpired(false);
      }
    }
  }, [userIpAddress, pkg._id, pkg.id]);

  // ============================================
  // 3. COUNTDOWN TICKER
  // ============================================
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      if (isMounted.current) {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            setTimerExpired(true);
            return 0;
          }
          return prev - 1000;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // ============================================
  // 4. RESET TIMER DAILY
  // ============================================
  useEffect(() => {
    if (!userIpAddress || (!pkg._id && !pkg.id)) return;
    const packageId = pkg._id || pkg.id;

    const checkDailyReset = () => {
      if (!isMounted.current) return;
      
      const timerKey = `timer_${packageId}_${userIpAddress}`;
      const lastResetKey = `lastReset_${packageId}_${userIpAddress}`;
      const lastReset = localStorage.getItem(lastResetKey);
      const today = new Date().toDateString();

      if (lastReset !== today) {
        // ✅ FIX: Only restart discount if the timer was already expired.
        //    If the timer is still running (timerExpired=false, timeRemaining>0),
        //    just update the date stamp without blowing away the active session.
        const storedTimer = localStorage.getItem(timerKey);
        const wasExpired = !storedTimer || (() => {
          try {
            const { startTime } = JSON.parse(storedTimer);
            return (Date.now() - startTime) >= 900000;
          } catch { return true; }
        })();

        localStorage.setItem(lastResetKey, today);

        if (wasExpired && isMounted.current) {
          // Timer was expired — give a fresh 15-min window for the new day
          localStorage.removeItem(timerKey);
          setTimeRemaining(900000);
          setTimerExpired(false);
        }
        // If timer was still running, do nothing to the running timer state
      }
    };

    // ✅ Call immediately on mount so stale date is caught within the same tick,
    // not up to 60 seconds later.
    checkDailyReset();
    const dailyCheck = setInterval(checkDailyReset, 60000); // Check every minute
    return () => clearInterval(dailyCheck);
  }, [userIpAddress, pkg._id, pkg.id]);


  // ============================================
  // HANDLERS
  // ============================================
  const handleCustomizationChange = (data) => {
    setCustomizationData(data);
  };

  // Calculate effective prices
  const effectivePackagePrice = customizationData 
    ? customizationData.totalPrice 
    : pkg.price;

  const effectivePackageTotal = customizationData
    ? customizationData.totalPrice
    : pkg.price;

  // Currency symbol
  const currencySymbol = currency === 'PHP' ? '₱' : '$';

  return (
    <div className="pb-page">
      
      <div className="pb-container">
        <div className="pb-unified-card">
          <div className="pb-left-panel">
            <BookingLeftColumn 
              pkg={pkg} 
              currency={currency}       
              exchangeRate={exchangeRate}
              onCustomizationChange={handleCustomizationChange}
              timerExpired={timerExpired}
              onGoBack={onGoBack}
              paxCount={paxCount}
              selectedFlight={selectedFlight}
            />
          </div>

          <div className="pb-right-panel">
            <BookingRightForm 
              pkg={pkg} 
              currency={currency}       
              exchangeRate={exchangeRate}
              customizationData={customizationData}
              effectivePackagePrice={effectivePackagePrice}
              effectivePackageTotal={effectivePackageTotal}
              timerExpired={timerExpired}
              onPaxChange={setPaxCount}
              onFlightChange={setSelectedFlight}
                initialPaxFromFunnel={initialPaxFromFunnel || pkg.initialPaxFromFunnel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageBooking;