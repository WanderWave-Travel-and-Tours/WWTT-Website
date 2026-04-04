// src/hooks/useGHLTrigger.js
import { useEffect, useRef } from 'react';

// ============================================================
// CREATE IN-PAGE MODAL — renders custom HTML form overlay
// No close button — closes automatically 2s after form submit success
// ============================================================
function createGHLModal() {
  if (document.getElementById('ghl-exit-modal-overlay')) return;

  let closeScheduled = false;

  // === CLOSE HELPER ===
  const closeModal = () => {
    if (closeScheduled) return;
    closeScheduled = true;

    const overlay = document.getElementById('ghl-exit-modal-overlay');
    if (!overlay) return;
    overlay.style.animation = 'ghlFadeOut 0.3s ease forwards';
    setTimeout(() => overlay.remove(), 300);
  };

  // === OVERLAY ===
  const overlay = document.createElement('div');
  overlay.id = 'ghl-exit-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
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
    width: min(480px, 92vw);
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,0.40);
    animation: ghlSlideUp 0.3s ease;
    padding: 2rem;
    font-family: 'Manrope', sans-serif;
  `;

  // === INJECT KEYFRAME ANIMATIONS + FORM STYLES (once) ===
  if (!document.getElementById('ghl-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'ghl-modal-styles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
      @keyframes ghlFadeIn  { from { opacity: 0 } to { opacity: 1 } }
      @keyframes ghlFadeOut { from { opacity: 1 } to { opacity: 0 } }
      @keyframes ghlSlideUp { from { transform: translateY(40px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

      #ghl-modal-form h2 {
        font-size: 1.2rem;
        font-weight: 700;
        color: #1A1A1A;
        letter-spacing: -0.3px;
        margin: 0 0 0.2rem 0;
      }
      #ghl-modal-form p.ghl-sub {
        font-size: 0.85rem;
        color: #888;
        margin: 0 0 0.6rem 0;
      }
      #ghl-modal-form .ghl-divider {
        height: 3px;
        width: 36px;
        background: #F5A623;
        border-radius: 4px;
        margin-bottom: 1.2rem;
      }
      #ghl-modal-form label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        color: #444;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.4rem;
      }
      #ghl-modal-form label .req { color: #F5A623; margin-left: 2px; }
      #ghl-modal-form textarea {
        font-family: 'Manrope', sans-serif;
        font-size: 0.9rem;
        color: #1A1A1A;
        background: #fff;
        border: 1.5px solid #E2E2E2;
        border-radius: 10px;
        padding: 0.65rem 0.9rem;
        width: 100%;
        outline: none;
        resize: vertical;
        min-height: 100px;
        line-height: 1.6;
        box-sizing: border-box;
        transition: border-color 0.2s, box-shadow 0.2s;
        margin-bottom: 1rem;
      }
      #ghl-modal-form textarea::placeholder { color: #bbb; }
      #ghl-modal-form textarea:focus {
        border-color: #F5A623;
        box-shadow: 0 0 0 3px rgba(245,166,35,0.25);
      }
      #ghl-modal-form .ghl-btn {
        width: 100%;
        padding: 0.85rem 1.5rem;
        font-family: 'Manrope', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        color: #fff;
        background: #F5A623;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        letter-spacing: 0.3px;
        transition: background 0.2s, transform 0.15s;
        box-shadow: 0 4px 18px rgba(245,166,35,0.25);
      }
      #ghl-modal-form .ghl-btn:hover { background: #e09610; transform: translateY(-1px); }
      #ghl-modal-form .ghl-btn:active { transform: translateY(0); }
      #ghl-modal-form .ghl-success {
        display: none;
        background: #FFF4E0;
        border: 1.5px solid #F5A623;
        border-radius: 10px;
        padding: 0.7rem 1rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #b87209;
        margin-top: 0.85rem;
        text-align: center;
      }
      #ghl-modal-form .ghl-success.show { display: block; }
    `;
    document.head.appendChild(style);
  }

  // === FORM HTML ===
  modal.innerHTML = `
    <div id="ghl-modal-form">
      <h2>Is there anything we can help you?</h2>
      <p class="ghl-sub">Fill out the form below and we'll get back to you shortly.</p>
      <div class="ghl-divider"></div>
      <label>Message <span class="req">*</span></label>
      <textarea id="ghl-msg-input" placeholder="Tell us how we can help you…"></textarea>
      <button class="ghl-btn" id="ghl-send-btn">Send Message</button>
      <div class="ghl-success" id="ghl-success-msg">✓ Message sent! We'll reach out to you soon.</div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // === BUTTON HANDLER ===
  document.getElementById('ghl-send-btn').addEventListener('click', () => {
    const el = document.getElementById('ghl-msg-input');
    if (!el.value.trim()) {
      el.style.borderColor = '#e05c5c';
      el.style.boxShadow = '0 0 0 3px rgba(224,92,92,0.15)';
      el.addEventListener('input', () => {
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }, { once: true });
      return;
    }

    const btn = document.getElementById('ghl-send-btn');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    setTimeout(() => {
      el.value = '';
      document.getElementById('ghl-success-msg').classList.add('show');
      setTimeout(closeModal, 2000);
    }, 1200);
  });
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

    console.log('🚀 Triggering GHL Form Modal...');

    try {
      createGHLModal();
    } catch (err) {
      console.error('GHL Trigger error:', err);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // === 1. TIME DELAY TRIGGER ===
    timerRef.current = setTimeout(() => {
      triggerGHLForm();
    }, delayMinutes * 60 * 1000); // default: 1 minute = 60,000 ms

    // === 2. EXIT INTENT TRIGGER — cursor moving toward close/address bar ===
    if (triggerOnExit) {
      const handleMouseLeave = (e) => {
        // Only fires when mouse leaves through the TOP of the viewport
        // (i.e. moving toward the browser tabs / close button)
        if (e.clientY <= 0) {
          triggerGHLForm();
        }
      };

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