import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Lock, ArrowLeft } from 'lucide-react';
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

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Step 1: Create Payment Intent
      const response = await fetch('http://localhost:5000/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: bookingData.totalAmount * 100, // Convert to centavos
          description: `Booking for ${bookingData.packageName}`,
          bookingData: bookingData
        })
      });

      const data = await response.json();

      if (data.success) {
        // Step 2: Redirect to PayMongo checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.message || 'Payment creation failed');
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Failed to process payment. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-page">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="payment-container">
        {/* Back Button */}
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
          disabled={isProcessing}
        >
          <ArrowLeft size={20} />
          Back to Booking
        </button>

        {/* Payment Card */}
        <div className="payment-card">
          
          {/* Header */}
          <div className="payment-header">
            <div className="payment-logo">
              <img 
                src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
                alt="Wanderwave Logo"
              />
            </div>
            <h1 className="payment-title">Complete Your Payment</h1>
            <p className="payment-subtitle">You're almost there! Secure your booking now.</p>
          </div>

          {/* Booking Summary */}
          <div className="booking-summary-card">
            <h3 className="summary-title">Booking Summary</h3>
            
            <div className="summary-details">
              <div className="summary-row">
                <span className="summary-label">Package</span>
                <strong>{bookingData.packageName}</strong>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Travel Dates</span>
                <strong>{bookingData.startDate} - {bookingData.endDate}</strong>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Duration</span>
                <strong>{bookingData.duration}</strong>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Number of Pax</span>
                <strong>{bookingData.pax.adult} person(s)</strong>
              </div>

              <div className="summary-row">
                <span className="summary-label">Customer</span>
                <strong>{bookingData.fullName}</strong>
              </div>

              <div className="summary-divider"></div>
              
              <div className="summary-row total-row">
                <span className="summary-label">Total Amount</span>
                <strong className="total-amount">₱{bookingData.totalAmount.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="payment-method-section">
            <h3 className="section-title">Select Payment Method</h3>
            
            <div className="payment-methods">
              <button 
                className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={24} />
                <span>Credit/Debit Card</span>
              </button>
              
              <button 
                className={`payment-method-btn ${paymentMethod === 'gcash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('gcash')}
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/GCash_logo.svg/320px-GCash_logo.svg.png" 
                  alt="GCash"
                />
                <span>GCash</span>
              </button>
              
              <button 
                className={`payment-method-btn ${paymentMethod === 'paymaya' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('paymaya')}
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/PayMaya_Logo.svg/320px-PayMaya_Logo.svg.png" 
                  alt="PayMaya"
                />
                <span>PayMaya</span>
              </button>
            </div>
          </div>

          {/* Security Info */}
          <div className="security-info">
            <Shield size={20} color="#10b981" />
            <span>Your payment is secured with PayMongo SSL encryption</span>
          </div>

          {/* Pay Button */}
          <button 
            className="pay-now-btn"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="spinner"></div>
                Processing...
              </>
            ) : (
              <>
                <Lock size={20} />
                Pay ₱{bookingData.totalAmount.toLocaleString()} Now
              </>
            )}
          </button>

          <p className="payment-note">
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payment;