// src/hooks/useGHLTrigger.js
import { useEffect, useRef } from 'react';

const GHL_FORM_URL = "https://api.leadconnectorhq.com/widget/form/Wllw4K1L069hcLtuRl1z";

// ============================================================
// CREATE IN-PAGE MODAL — renders an iframe overlay, NOT a redirect
// ============================================================
function createGHLModal() {
  // Avoid duplicate modals
  if (document.getElementById('ghl-exit-modal-overlay')) return;

  // === OVERLAY ===
  const overlay = document.createElement('div');
  overlay.id = 'ghl-exit-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: ghlFadeIn 0.25s ease;
  `;

  // === MODAL CONTAINER ===
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: relative;
    width: min(520px, 95vw);
    height: min(680px, 90vh);
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,0.35);
    animation: ghlSlideUp 0.3s ease;
  `;

  // === CLOSE BUTTON ===
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 14px;
    z-index: 10;
    background: rgba(0,0,0,0.55);
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 34px;
    height: 34px;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const closeModal = () => {
    overlay.style.animation = 'ghlFadeOut 0.2s ease forwards';
    setTimeout(() => overlay.remove(), 200);
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // === IFRAME ===
  const iframe = document.createElement('iframe');
  iframe.src = GHL_FORM_URL;
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  `;
  iframe.title = 'Contact Form';

  // === INJECT KEYFRAME ANIMATIONS (once) ===
  if (!document.getElementById('ghl-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'ghl-modal-styles';
    style.textContent = `
      @keyframes ghlFadeIn  { from { opacity: 0 } to { opacity: 1 } }
      @keyframes ghlFadeOut { from { opacity: 1 } to { opacity: 0 } }
      @keyframes ghlSlideUp { from { transform: translateY(40px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    `;
    document.head.appendChild(style);
  }

  modal.appendChild(closeBtn);
  modal.appendChild(iframe);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// ============================================================
// HOOK
// ============================================================
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

    console.log("🚀 Triggering GHL Form Modal...");

    try {
      createGHLModal();
    } catch (err) {
      console.error("GHL Trigger error:", err);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // === 1. TIME DELAY TRIGGER ===
    timerRef.current = setTimeout(() => {
      triggerGHLForm();
    }, delayMinutes * 60 * 1000);   // default: 1 minute = 60,000 ms

    // === 2. EXIT INTENT TRIGGER — cursor moving toward close/address bar ===
    if (triggerOnExit) {

      const handleMouseLeave = (e) => {
        // Only fires when mouse leaves through the TOP of the viewport
        // (i.e. moving toward the browser tabs / close button)
        if (e.clientY <= 0) {
          triggerGHLForm();
        }
      };

      // mouseleave on document fires when cursor exits the page area
      document.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        clearTimeout(timerRef.current);
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    // Cleanup for timer only (when triggerOnExit is false)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, delayMinutes, triggerOnExit]);

  // Optional: Manual trigger from outside
  return { triggerGHLForm };
}