// src/hooks/useGHLTrigger.js
import { useEffect, useRef } from 'react';

const GHL_FORM_URL = "https://api.leadconnectorhq.com/widget/form/Wllw4K1L069hcLtuRl1z";

export function useGHLTrigger({ 
  enabled = true, 
  delayMinutes = 1, 
  triggerOnExit = true 
}) {
  
  const timerRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  const triggerGHLForm = () => {
    if (hasTriggeredRef.current || !enabled) return;
    hasTriggeredRef.current = true;

    console.log("🚀 Triggering GHL Form...");

    // Best way to open GHL Form as popup/modal
    try {
      // Option 1: Kung may GHL widget loader na naka-embed sa index.html
      if (typeof window.openGHLForm === 'function') {
        window.openGHLForm(GHL_FORM_URL);
      } 
      // Option 2: Direct load ng GHL form script (most common working method)
      else {
        const script = document.createElement("script");
        script.src = GHL_FORM_URL;
        script.async = true;
        document.body.appendChild(script);

        // Fallback: Open in new tab kung hindi gumana ang script method
        setTimeout(() => {
          if (!document.querySelector('ghl-form')) {  // rough check
            window.open(GHL_FORM_URL, '_blank');
          }
        }, 800);
      }
    } catch (err) {
      console.error("GHL Trigger error:", err);
      // Ultimate fallback
      window.open(GHL_FORM_URL, '_blank');
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // === 1. TIME DELAY TRIGGER (1 minute) ===
    timerRef.current = setTimeout(() => {
      triggerGHLForm();
    }, delayMinutes * 60 * 1000);   // 1 minute = 60,000 ms

    // === 2. EXIT INTENT TRIGGER ===
    if (triggerOnExit) {
      let mouseLeft = false;

      const handleMouseMove = (e) => {
        if (e.clientY < 20 && !mouseLeft) {   // Mouse near top of screen
          mouseLeft = true;
          triggerGHLForm();
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          triggerGHLForm();
        }
      };

      const handleBeforeUnload = () => {
        triggerGHLForm();
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);

      return () => {
        clearTimeout(timerRef.current);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
      };
    }

    // Cleanup for timer only
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, delayMinutes, triggerOnExit]);

  // Optional: Manual trigger from outside
  return { triggerGHLForm };
}
