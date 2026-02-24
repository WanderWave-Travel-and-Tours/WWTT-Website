import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, ArrowLeft, Calendar, Users,
  MapPin, Clock, QrCode, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './payment.css';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state?.bookingData;

  const [qrStatus, setQrStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!bookingData) {
      toast.error('No booking data found. Please start again.');
      navigate('/packages');
    }
  }, [bookingData, navigate]);

  useEffect(() => {
    if (!bookingData) return;
    const generate = async () => {
      setQrStatus('generating');
      try {
        const response = await fetch(
          'https://wanderwaveph.onrender.com/api/payment/create-intent',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId:     bookingData._id,
              paymentType:   bookingData.paymentType || 'full',
              paymentAmount: bookingData.initialPaymentAmount || bookingData.totalAmount,
              method:        'qrph',
            }),
          }
        );
        const data = await response.json();
        if (data.success && data.checkoutUrl) {
          setQrStatus('ready');
          setTimeout(() => { window.location.href = data.checkoutUrl; }, 800);
        } else {
          throw new Error(data.message || 'QR generation failed');
        }
      } catch (err) {
        setQrStatus('error');
        setErrorMessage(err.message || 'Failed to generate QR. Please try again.');
      }
    };
    generate();
  }, []);

  if (!bookingData) return null;

  const paymentAmount    = bookingData.initialPaymentAmount || bookingData.totalAmount;
  const isPartialPayment = bookingData.paymentType === 'partial';
  const handleRetry      = () => window.location.reload();

  const QRPanel = () => {
    if (qrStatus === 'idle' || qrStatus === 'generating') return (
      <div className="qr-panel qr-panel--loading">
        <div className="qr-pulse-ring">
          <div className="qr-pulse-ring__inner">
            <QrCode size={48} color="#f97316" strokeWidth={1.5} />
          </div>
        </div>
        <div className="qr-status-text">
          <Loader2 size={17} className="qr-spinner" />
          <span>Generating your QR Code…</span>
        </div>
        <p className="qr-subtext">Please wait. You will be redirected automatically.</p>
      </div>
    );
    if (qrStatus === 'ready') return (
      <div className="qr-panel qr-panel--ready">
        <div className="qr-ready-icon">
          <CheckCircle size={56} color="#10b981" strokeWidth={1.5} />
        </div>
        <div className="qr-status-text qr-status-text--ready">
          <span>QR Code Ready!</span>
        </div>
        <p className="qr-subtext">Redirecting to payment page…</p>
      </div>
    );
    if (qrStatus === 'error') return (
      <div className="qr-panel qr-panel--error">
        <AlertCircle size={52} color="#ef4444" strokeWidth={1.5} style={{ opacity: 0.7 }} />
        <div className="qr-status-text qr-status-text--error">
          <span>QR Generation Failed</span>
        </div>
        <p className="qr-subtext qr-subtext--error">{errorMessage}</p>
        <button className="qr-retry-btn" onClick={handleRetry}>Try Again</button>
      </div>
    );
  };

  const bgImage = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop';

  return (
    <div className="payment-page-wrapper" style={{ backgroundImage: `url(${bgImage})` }}>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="payment-card-container">

        {/* LEFT: Summary */}
        <div className="payment-summary-section">
          <button
            className="back-link-modern"
            onClick={() => navigate(-1)}
            disabled={qrStatus === 'generating' || qrStatus === 'ready'}
          >
            <ArrowLeft size={18} /><span>Back</span>
          </button>
          <div className="summary-content">
            <div className="pkg-header">
              <span className="pkg-subtitle">BOOKING SUMMARY</span>
              <h2 className="pkg-title">{bookingData.packageName}</h2>
            </div>
            <div className="summary-card">
              <div className="summary-row">
                <div className="summary-icon"><Calendar size={18} /></div>
                <div className="summary-text">
                  <span className="s-label">Travel Dates</span>
                  <span className="s-value">{bookingData.startDate} – {bookingData.endDate}</span>
                </div>
              </div>
              <div className="summary-row">
                <div className="summary-icon"><Clock size={18} /></div>
                <div className="summary-text">
                  <span className="s-label">Duration</span>
                  <span className="s-value">{bookingData.duration}</span>
                </div>
              </div>
              <div className="summary-row">
                <div className="summary-icon"><Users size={18} /></div>
                <div className="summary-text">
                  <span className="s-label">Guests</span>
                  <span className="s-value">{bookingData.pax.adult} Adult(s)</span>
                </div>
              </div>
              <div className="summary-row">
                <div className="summary-icon"><MapPin size={18} /></div>
                <div className="summary-text">
                  <span className="s-label">Guest Name</span>
                  <span className="s-value">{bookingData.fullName}</span>
                </div>
              </div>
            </div>
            <div className="summary-footer">
              {isPartialPayment ? (
                <>
                  <div className="total-row" style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>
                    <span>Total Package Price:</span>
                    <span>₱{bookingData.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="total-row">
                    <span className="total-label-lg">Amount Due Now ({bookingData.includesAirfare ? '85%' : '50%'})</span>
                    <span className="total-amount-lg">₱{paymentAmount.toLocaleString()}</span>
                  </div>
                  <div className="total-row" style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>
                    <span>Remaining Balance:</span>
                    <span>₱{bookingData.remainingBalance.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div className="total-row">
                  <span className="total-label-lg">Total Amount</span>
                  <span className="total-amount-lg">₱{paymentAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: QR Panel */}
        <div className="payment-form-section">
          <div className="form-header-modern">
            <h1 className="form-title-modern">Scan to Pay</h1>
            <p className="form-subtitle-modern">
              Pay instantly with any Philippine bank or e-wallet using QRPH.
            </p>
          </div>
          <QRPanel />
          <div className="security-banner" style={{ marginTop: '24px' }}>
            <Shield size={16} />
            <span>Secured by PayMongo · QRPH BSP-Accredited</span>
          </div>
          <div className="qr-supported-hint">
            <span>Works with</span>
            <div className="qr-supported-logos">
              <span className="qr-badge qr-badge--gcash">GCash</span>
              <span className="qr-badge qr-badge--maya">Maya</span>
              <span className="qr-badge qr-badge--bpi">BPI</span>
              <span className="qr-badge qr-badge--bdo">BDO</span>
              <span className="qr-badge qr-badge--more">+ more</span>
            </div>
          </div>
          {isPartialPayment && (
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#6b7280', marginTop: '16px' }}>
              Remaining balance of ₱{bookingData.remainingBalance.toLocaleString()} due before departure
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Payment;