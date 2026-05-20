import React from 'react';
import ReactDOM from 'react-dom';
import { Clock } from 'lucide-react';

const LateNightSurchargeModal = ({ lateNightModal, pendingTime, onConfirm, onClose }) => {
  if (!lateNightModal) return null;
  const isArrival = lateNightModal === 'arrival';

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.18s ease',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 420,
        margin: '0 16px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        animation: 'slideUp 0.22s cubic-bezier(.22,1,.36,1)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          padding: '24px 28px 20px',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(251,191,36,0.15)',
              border: '1.5px solid rgba(251,191,36,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Clock size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>Late Night Schedule</div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>
                {isArrival ? 'Arrival' : 'Departure'} time: {pendingTime}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: 8, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1,
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {/* Info Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #fff9f0, #fefce8)',
            border: '1.5px solid #fcd34d',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            marginBottom: 18,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>
              <Clock size={18} color="#f59e0b" />
            </span>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem', marginBottom: 4 }}>
                Extra Charge Notice
              </div>
              <div style={{ color: '#78350f', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Schedules between <strong>12:00 AM – 5:00 AM</strong> incur an additional late night surcharge due to off-peak hours.
              </div>
            </div>
          </div>

          {/* Surcharge pill */}
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fca5a5',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#7f1d1d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Late Night Surcharge
              </div>
              <div style={{ fontSize: '0.82rem', color: '#b91c1c', marginTop: 2 }}>
                Applied to {isArrival ? 'arrival' : 'departure'} time
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#dc2626' }}>
              +₱500
            </div>
          </div>

          <p style={{ fontSize: '0.83rem', color: '#64748b', marginTop: 14, lineHeight: 1.55, marginBottom: 0 }}>
            If you proceed, <strong style={{ color: '#0f172a' }}>₱500</strong> will be added to the total amount. You can also close this and choose a different time to avoid the extra charge.
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 28px 24px', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              background: '#f1f5f9', color: '#475569',
              border: '1.5px solid #e2e8f0', fontWeight: 700,
              fontSize: '0.9rem', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            Close
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1.4, padding: '12px 0', borderRadius: 12,
              background: 'linear-gradient(135deg, #f59e0b, #fc9c1b)',
              color: '#fff', border: 'none', fontWeight: 700,
              fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            ✓ Continue with +₱500
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>,
    document.body
  );
};

export default LateNightSurchargeModal;
