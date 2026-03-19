import React, { useState, useEffect, useRef } from 'react';
import BookingLeftColumn from './bookingLeftColumn';
import BookingRightForm from './bookingRightForm';
import { 
  Plane, X, Timer, ChevronRight, 
  Flame, Eye, TrendingUp, Shield, 
  CheckCircle, Zap, Star 
} from 'lucide-react';
import './packageBooking.css';

function PackageBooking({ pkg, onGoBack, currency = 'PHP', exchangeRate = 58 }) {
  const [customizationData, setCustomizationData] = useState(null);
  const [paxCount, setPaxCount] = useState(1); // ✅ Lifted pax state — synced from BookingRightForm via onPaxChange
  
  // ============================================
  // TIMER & OFFER STATES (LIFTED FROM CHILD)
  // ============================================
  const [userIpAddress, setUserIpAddress] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);
  
  // UI States for Animation & Modal
  const [showAnimation, setShowAnimation] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [hasOfferClosed, setHasOfferClosed] = useState(false);

  // Ref to track if component is mounted
  const isMounted = useRef(true);

  if (!pkg) return null;

  // ============================================================
  // PAGE VIEW TRACKER — fires once per package booking page view
  // ============================================================
  useEffect(() => {
    if (!pkg) return;
    const packageId = pkg._id || pkg.id;
    const packageName = pkg.name || pkg.title || 'Unknown Package';

    const trackPageView = async () => {
      try {
        await fetch('https://wanderwaveph.onrender.com/api/page-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 'booking',
            path: `/booking/${packageId}`,
            label: `Booking Page: ${packageName}`,
            packageId,
            packageName,
          }),
        });
      } catch (err) {
        console.warn('⚠️ Booking page view tracking failed:', err);
      }
    };
    trackPageView();
  }, [pkg?.id, pkg?._id]);

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
  // FIX: PREVENT PAGE SCROLL WHEN MODAL IS OPEN
  // ============================================
  useEffect(() => {
    if (showOfferModal) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling on body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scrolling
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [showOfferModal]);

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
    const storedTimer = localStorage.getItem(timerKey);
    const sessionModalKey = `seenModal_${packageId}_${userIpAddress}`;
    const hasSeenModal = sessionStorage.getItem(sessionModalKey);

    // Function to handle the start of the sequence
    const startSequence = () => {
      if (!hasSeenModal && isMounted.current) {
        // Step 1: Show Animation immediately
        setShowAnimation(true);
        
        // Step 2: After animation duration (2s), show Modal
        setTimeout(() => {
          if (isMounted.current) {
            setShowAnimation(false);
            setShowOfferModal(true);
            sessionStorage.setItem(sessionModalKey, 'true');
          }
        }, 2000);
      } else if (isMounted.current) {
        setShowAnimation(false);
        // If timer is still running but they reloaded, show floating widget, not modal
        setHasOfferClosed(true); 
      }
    };

    // ✅ FIX: Define lastResetKey here so it can be used in both branches
    const lastResetKey = `lastReset_${packageId}_${userIpAddress}`;
    const today = new Date().toDateString();

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
          startSequence();
        }
      } else if (isMounted.current) {
        setTimeRemaining(0);
        setTimerExpired(true);
        setShowAnimation(false);
        setShowOfferModal(false);
      }
    } else {
      // Start new timer for new user/day
      const startTime = Date.now();
      localStorage.setItem(timerKey, JSON.stringify({ startTime }));
      // ✅ FIX: Always stamp today so the daily-reset check never fires prematurely
      //    on the same day the timer was first created.
      localStorage.setItem(lastResetKey, today);
      if (isMounted.current) {
        setTimeRemaining(900000); // 15 minutes
        setTimerExpired(false);
        startSequence();
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
            setShowOfferModal(false); // Close modal if time runs out
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
        sessionStorage.removeItem(`seenModal_${packageId}_${userIpAddress}`);

        if (wasExpired && isMounted.current) {
          // Timer was expired — give a fresh 15-min discount for the new day
          localStorage.removeItem(timerKey);
          setTimeRemaining(900000);
          setTimerExpired(false);
          setShowAnimation(true);
          setShowOfferModal(false);
          setHasOfferClosed(false);
        }
        // If timer was still running, do nothing to the running timer state
      }
    };

    const dailyCheck = setInterval(checkDailyReset, 60000); // Check every minute
    return () => clearInterval(dailyCheck);
  }, [userIpAddress, pkg._id, pkg.id]);


  // ============================================
  // HANDLERS
  // ============================================
  const handleCustomizationChange = (data) => {
    setCustomizationData(data);
  };

  const handleCloseModal = () => {
    setShowOfferModal(false);
    setHasOfferClosed(true); // Triggers the floating widget to appear
  };

  const handleOpenModalFromFloating = () => {
    setShowOfferModal(true);
  };

  // Calculate effective prices
  const effectivePackagePrice = customizationData 
    ? customizationData.totalPrice 
    : pkg.price;

  const effectivePackageTotal = customizationData
    ? customizationData.totalPrice
    : pkg.price;

  // Calculate savings
  const basePrice = pkg.price || 0;
  const originalPriceWithMarkup = Math.round(basePrice * 1.10);
  const savingsAmount = originalPriceWithMarkup - basePrice;
  const savingsPercentage = Math.round(((originalPriceWithMarkup - basePrice) / originalPriceWithMarkup) * 100);

  // Format Helper
  const formatTimeParts = (ms) => {
    if (ms === null) return { min: '00', sec: '00' };
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
        min: minutes.toString().padStart(2, '0'),
        sec: seconds.toString().padStart(2, '0')
    };
  };

  const { min, sec } = formatTimeParts(timeRemaining);

  // Currency symbol
  const currencySymbol = currency === 'PHP' ? '₱' : '$';

  return (
    <div className="pb-page">
      
      {/* ✈️ ENHANCED AIRPLANE ANIMATION WITH TRAIL */}
      {showAnimation && !timerExpired && (
        <div className="pb-airplane-entrance">
          <div className="pb-plane-trail"></div>
          <Plane size={120} className="pb-plane-icon" strokeWidth={1.5} fill="currentColor" />
          <div className="pb-plane-sparkle" style={{ top: -20, left: -20 }}></div>
          <div className="pb-plane-sparkle" style={{ top: -30, left: 10 }}></div>
          <div className="pb-plane-sparkle" style={{ top: 10, left: -30 }}></div>
        </div>
      )}

      {/* 🎁 ENHANCED LIMITED TIME OFFER MODAL */}
      {showOfferModal && !timerExpired && (
        <div className="pb-offer-overlay">
          <div className="pb-offer-modal">
            {/* Animated Decorations */}
            <div className="pb-modal-decoration" style={{ top: 20, left: 20 }}></div>
            <div className="pb-modal-decoration" style={{ top: 30, right: 30 }}></div>
            <div className="pb-modal-decoration" style={{ bottom: 40, left: 30 }}></div>

            {/* Close Button */}
            <button className="pb-offer-close" onClick={handleCloseModal} aria-label="Close modal">
              <X size={20} />
            </button>
            
            <div className="pb-modal-content">
              {/* Urgency Badge with Fire Icon */}
              <div className="pb-offer-badge">
                <Flame size={14} className="pb-fire-icon" />
                <span>HOT DEAL - ACT FAST!</span>
              </div>

              {/* Enhanced Title */}
              <div className="pb-offer-title">Exclusive Flash Sale!</div>

              {/* Package Name Display */}
              <div className="pb-offer-package-info">
                <span className="pb-offer-package-label">Special Discount For</span>
                <span className="pb-offer-package-name">{pkg.name}</span>
              </div>

              {/* Subtitle */}
              <div className="pb-offer-subtitle">
                We've unlocked a <strong>limited-time discount</strong> exclusively for you. 
                Grab this deal before it expires or prices go back up!
              </div>

              {/* Savings Highlight */}
              <div className="pb-savings-highlight">
                <Zap size={18} />
                <span>SAVE {currencySymbol}{savingsAmount.toLocaleString()} ({savingsPercentage}% OFF)</span>
              </div>
              
              {/* Enhanced Countdown Timer */}
              <div className="pb-timer-large">
                <div className="pb-timer-box">
                  <div className="pb-timer-value">{min}</div>
                  <div className="pb-timer-label">Minutes</div>
                </div>
                <div className="pb-timer-colon">:</div>
                <div className="pb-timer-box">
                  <div className="pb-timer-value">{sec}</div>
                  <div className="pb-timer-label">Seconds</div>
                </div>
              </div>

              {/* Enhanced CTA Button */}
              <button className="pb-offer-cta" onClick={handleCloseModal}>
                <span>CLAIM MY DISCOUNT NOW</span>
                <ChevronRight size={20} className="pb-cta-icon" />
              </button>

              {/* Trust Badges */}
              <div className="pb-trust-badges">
                <div className="pb-trust-badge">
                  <Shield size={16} />
                  <span>Secure Booking</span>
                </div>
                <div className="pb-trust-badge">
                  <CheckCircle size={16} />
                  <span>Best Price Guarantee</span>
                </div>
                <div className="pb-trust-badge">
                  <Star size={16} />
                  <span>5-Star Rated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⏱️ ENHANCED FLOATING TIMER WIDGET - COMPACT */}
      {!showOfferModal && !timerExpired && timeRemaining > 0 && hasOfferClosed && (
        <div className="pb-floating-timer" onClick={handleOpenModalFromFloating}>
          {/* Urgency Dot */}
          <div className="pb-urgency-dot"></div>
          
          {/* Icon with Pulse */}
          <div className="pb-floating-icon-wrapper">
            <Timer size={20} color="#f97316" strokeWidth={2.5} />
          </div>
          
          {/* Timer Content */}
          <div className="pb-floating-content">
            <div className="pb-floating-title">⚡ OFFER ENDS</div>
            <div className="pb-floating-value">{min}:{sec}</div>
          </div>
        </div>
      )}

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
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageBooking;