import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowLeft, Calendar, Users, MapPin, Clock, QrCode } from 'lucide-react'; // Added QrCode Icon
import toast, { Toaster } from 'react-hot-toast';
import './payment.css';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state?.bookingData;

  // Added 'qrph' to potential state
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!bookingData) {
      toast.error("No booking data found. Please start again.");
      navigate('/packages');
    }
  }, [bookingData, navigate]);

  if (!bookingData) return null;

  const paymentAmount = bookingData.initialPaymentAmount || bookingData.totalAmount;
  const isPartialPayment = bookingData.paymentType === 'partial';

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingData._id, 
          paymentType: bookingData.paymentType || 'full',              
          paymentAmount: paymentAmount,
          method: paymentMethod // ✅ Passed the selected method (card, gcash, maya, qrph)
        })
      });

      const data = await response.json();


      if (data.success) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.message || 'Payment creation failed');
      }

    } catch (error) {
      toast.error(error.message || "Failed to process payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const bgImage = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop'; 

  return (
    <div
      className="payment-page-wrapper"
      style={{ '--payment-bg-image': `url(${bgImage})` }}
    >
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="payment-card-container">
        
        <div className="payment-summary-section">
          <button className="back-link-modern" onClick={() => navigate(-1)} disabled={isProcessing}>
            <ArrowLeft size={18} />
            <span>Back</span>
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
                   <div className="total-row payment-total-row--sub">
                     <span>Total Package Price:</span>
                     <span>₱{bookingData.totalAmount.toLocaleString()}</span>
                   </div>
                   <div className="total-row">
                     <span className="total-label-lg">Amount Due Now ({bookingData.paymentType === 'partial' && bookingData.includesAirfare ? '85%' : '50%'})</span>
                     <span className="total-amount-lg">₱{paymentAmount.toLocaleString()}</span>
                   </div>
                   <div className="total-row payment-total-row--remaining">
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

        <div className="payment-form-section">
          <div className="form-header-modern">
            <h1 className="form-title-modern">Payment Details</h1>
            <p className="form-subtitle-modern">Complete your purchase by providing your payment details.</p>
          </div>

          <div className="payment-methods-modern">
            
            {/* CARD */}
            <div 
              className={`method-card ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="method-main-row">
                 <div className="radio-container">
                    <div className={`custom-radio ${paymentMethod === 'card' ? 'checked' : ''}`}></div>
                 </div>
                 <div className="method-info">
                    <span className="m-name">Credit / Debit Card</span>
                    <span className="m-desc">Visa, Mastercard, Amex</span>
                 </div>
                 <div className="method-logo-badge">
                    <CardIconsBadge />
                 </div>
              </div>
            </div>

            {/* GCASH */}
            <div 
              className={`method-card ${paymentMethod === 'gcash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('gcash')}
            >
              <div className="method-main-row">
                 <div className="radio-container">
                    <div className={`custom-radio ${paymentMethod === 'gcash' ? 'checked' : ''}`}></div>
                 </div>
                 <div className="method-info">
                    <span className="m-name">GCash</span>
                    <span className="m-desc">Pay with e-wallet</span>
                 </div>
                 <div className="method-logo-badge">
                    <GCashBadge />
                 </div>
              </div>
            </div>

            {/* MAYA */}
            <div 
              className={`method-card ${paymentMethod === 'paymaya' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('paymaya')}
            >
              <div className="method-main-row">
                 <div className="radio-container">
                    <div className={`custom-radio ${paymentMethod === 'paymaya' ? 'checked' : ''}`}></div>
                 </div>
                 <div className="method-info">
                    <span className="m-name">Maya</span>
                    <span className="m-desc">Pay with e-wallet</span>
                 </div>
                 <div className="method-logo-badge">
                    <MayaBadge />
                 </div>
              </div>
            </div>

            {/* ✅ NEW: QRPH OPTION */}
            <div 
              className={`method-card ${paymentMethod === 'qrph' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('qrph')}
            >
              <div className="method-main-row">
                 <div className="radio-container">
                    <div className={`custom-radio ${paymentMethod === 'qrph' ? 'checked' : ''}`}></div>
                 </div>
                 <div className="method-info">
                    <span className="m-name">QRPH</span>
                    <span className="m-desc">Scan to Pay (Any Bank)</span>
                 </div>
                 <div className="method-logo-badge">
                    <QRPHBadge />
                 </div>
              </div>
            </div>

          </div>

          <div className="security-banner">
            <Shield size={16} />
            <span>Secured by PayMongo SSL Encryption</span>
          </div>

          <button 
            className="pay-button-modern"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
               <span className="spinner-modern"></span> 
            ) : (
              <>
                <Lock size={18} /> 
                CONFIRM ₱{paymentAmount.toLocaleString()}
              </>
            )}
          </button>
          
          {isPartialPayment && (
            <p className="payment-remaining-note">
              Remaining balance of ₱{bookingData.remainingBalance.toLocaleString()} due before departure
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- SVG COMPONENTS ---

const CardIconsBadge = () => (
  <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#EB001B" fillOpacity="0.8"/>
    <circle cx="24" cy="12" r="10" fill="#F79E1B" fillOpacity="0.8"/>
  </svg>
);

const GCashBadge = () => (
  <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="24" rx="4" fill="#007DFE"/>
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="'Arial', sans-serif">GCash</text>
  </svg>
);

const MayaBadge = () => (
  <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="59" height="23" rx="3.5" fill="white" stroke="#666" strokeOpacity="0.3"/>
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#58B947" fontSize="13" fontWeight="800" fontFamily="'Arial', sans-serif">Maya</text>
  </svg>
);

// ✅ NEW: QRPH BADGE
const QRPHBadge = () => (
  <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="59" height="23" rx="3.5" fill="white" stroke="#666" strokeOpacity="0.3"/>
    {/* Simple Icon Representation */}
    <rect x="8" y="6" width="5" height="5" stroke="#1F2937" strokeWidth="1.5"/>
    <rect x="8" y="13" width="5" height="5" stroke="#1F2937" strokeWidth="1.5"/>
    <rect x="15" y="6" width="5" height="5" stroke="#1F2937" strokeWidth="1.5"/>
    <path d="M15 15H17M17 15V17M15 17H17" stroke="#DB2777" strokeWidth="2" strokeLinecap="round"/>
    
    <text x="65%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#1F2937" fontSize="11" fontWeight="800" fontFamily="Arial">QRPH</text>
  </svg>
);

export default Payment;