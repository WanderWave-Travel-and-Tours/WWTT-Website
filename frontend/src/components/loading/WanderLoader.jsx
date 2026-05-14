// src/components/loading/WanderLoader.jsx
import { useState, useEffect } from 'react';
import './WanderLoader.css';

// ============================================================
// REUSABLE WANDERWAVE LOADING OVERLAY
//
// Props:
//   loading    {boolean}  — pass your loading state; loader fades
//                           out automatically when it becomes false
//   text       {string}   — custom label (default: "LOADING YOUR EXPERIENCE")
//   subtitle   {string}   — custom subtitle (default: "Please wait a moment")
//   fullScreen {boolean}  — if true, covers the entire viewport including
//                           the navbar (z-index: 9999, top: 0). Use this
//                           on pages like UserDashboard where you want a
//                           completely immersive loading experience.
//
// Usage:
//   import WanderLoader from '../loading/WanderLoader';
//   <WanderLoader loading={loading} text="LOADING TOUR PACKAGES" />
//   <WanderLoader loading={loading} fullScreen />   ← full viewport cover
// ============================================================

function WanderLoader({
  loading,
  text = 'LOADING YOUR EXPERIENCE',
  subtitle = 'Please wait a moment',
  fullScreen = false,
}) {
  // ── FIX: initialise visible from the loading prop so that when the
  //    component first mounts with loading=false (idle state in FlightSearch)
  //    it doesn't immediately play the fade-out and lock visible to false. ──
  const [visible, setVisible] = useState(loading);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (loading) {
      // ── FIX: reset visibility every time a new search starts ──
      setVisible(true);
      setFading(false);
    } else {
      // Only fade out if the overlay is actually visible
      if (visible) {
        setFading(true);
        const timer = setTimeout(() => setVisible(false), 520);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (!visible) return null;

  return (
    <div className={`wl-overlay ${fading ? 'wl-fade-out' : ''} ${fullScreen ? 'wl-fullscreen' : ''}`}>
      {/* ── Corner decorations ── */}
      <div className="wl-corner wl-tl"></div>
      <div className="wl-corner wl-tr"></div>
      <div className="wl-corner wl-bl"></div>
      <div className="wl-corner wl-br"></div>

      {/* ── Logo ── */}
      <img
        src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6915330c2f13300458943c45.png"
        alt="Wanderwave Logo"
        className="wl-logo"
      />

      {/* ── Progress bar + airplane ── */}
      <div className="wl-bar-container">
        <div className="wl-bar">
          <div className="wl-progress"></div>
        </div>
        <img
          src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6914547293707b3f66e9c108.png"
          alt="Airplane"
          className="wl-airplane"
        />
      </div>

      {/* ── Text ── */}
      <div className="wl-text">{text}</div>
      <div className="wl-subtitle">{subtitle}</div>
    </div>
  );
}

export default WanderLoader;