import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowLeft, Calendar, Users, MapPin, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './payment.css';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state?.bookingData;

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!bookingData) {
      toast.error("No booking data found. Please start again.");
      navigate('/packages');
    }
  }, [bookingData, navigate]);

  if (!bookingData) return null;

  // ✅ Use the correct payment amount
  const paymentAmount = bookingData.initialPaymentAmount || bookingData.totalAmount;
  const isPartialPayment = bookingData.paymentType === 'partial';

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      console.log('💳 Creating payment for booking:', bookingData._id);
      
      const response = await fetch('https://wanderwaveph-backend.onrender.com/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingData._id, 
          paymentType: bookingData.paymentType || 'full',              
          paymentAmount: paymentAmount  // ✅ Use the calculated amount
        })
      });

      const data = await response.json();

      console.log('🔥 Payment response:', data);

      if (data.success) {
        console.log('✅ Redirecting to:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.message || 'Payment creation failed');
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      toast.error(error.message || "Failed to process payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const bgImage = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop'; 

  return (
    <div 
      className="payment-page-wrapper"
      style={{ backgroundImage: `url(${bgImage})` }} 
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
               {/* ✅ Show payment breakdown for partial payments */}
               {isPartialPayment ? (
                 <>
                   <div className="total-row" style={{fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px'}}>
                     <span>Total Package Price:</span>
                     <span>₱{bookingData.totalAmount.toLocaleString()}</span>
                   </div>
                   <div className="total-row">
                     <span className="total-label-lg">Amount Due Now ({bookingData.paymentType === 'partial' && bookingData.includesAirfare ? '85%' : '50%'})</span>
                     <span className="total-amount-lg">₱{paymentAmount.toLocaleString()}</span>
                   </div>
                   <div className="total-row" style={{fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px'}}>
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
          
          {/* ✅ Show payment info */}
          {isPartialPayment && (
            <p style={{textAlign: 'center', fontSize: '0.85rem', color: '#6b7280', marginTop: '12px'}}>
              Remaining balance of ₱{bookingData.remainingBalance.toLocaleString()} due before departure
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

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

export default Payment;