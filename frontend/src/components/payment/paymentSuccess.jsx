import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Mail, Home, LayoutDashboard } from 'lucide-react';
import confetti from 'canvas-confetti';
import './paymentSuccess.css'; 

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(null); // 'booking' or 'inquiry'

  useEffect(() => {
    // 1. Confetti Effect
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#fc9c1b', '#f97316', '#22c55e']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#fc9c1b', '#f97316', '#22c55e']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // 2. Identify Transaction Type
    // ✅ Support both old (booking_id) and new (bookingId) query params
    const bookingId = searchParams.get('booking_id') || searchParams.get('bookingId');
    const inquiryId = searchParams.get('inquiryId');
    const paymentType = searchParams.get('paymentType'); // full or partial

    if (bookingId) {
      setType('booking');
      fetchBookingDetails(bookingId, paymentType);
    } else if (inquiryId) {
      setType('inquiry');
      fetchInquiryDetails(inquiryId);
    } else {
      // No ID found - show generic success
      setLoading(false); 
    }
  }, [searchParams]);

  // Fetch Booking Data
  const fetchBookingDetails = async (id, paymentType) => {
    try {
      const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/bookings/${id}`);
      const data = await response.json();
      
      if (data && data._id) {
        // Extract booking data (response might not have .success wrapper)
        const booking = data.success ? data.booking : data;
        
        // Determine if this was initial or balance payment
        const isPartialPayment = paymentType === 'partial' || booking.paymentType === 'partial';
        const paidAmount = isPartialPayment ? booking.initialPaymentAmount : booking.totalAmount;
        
        setDetails({
          reference: booking.referenceNumber || booking._id.slice(-8).toUpperCase(),
          title: booking.packageName,
          subTitle: `${booking.duration} • ${booking.pax?.adult || 1} Pax`,
          amount: paidAmount,
          totalAmount: booking.totalAmount,
          remainingBalance: booking.remainingBalance,
          email: booking.email,
          dateLabel: "Travel Dates",
          dateValue: `${booking.startDate} - ${booking.endDate}`,
          status: booking.status,
          isPartial: isPartialPayment,
          paymentType: booking.paymentType
        });
      } else {
        console.error('Invalid booking data received');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Inquiry Data
  const fetchInquiryDetails = async (id) => {
    try {
        const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/inquiries/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const inquiry = data.data;
            setDetails({
                reference: inquiry._id.slice(-8).toUpperCase(),
                title: inquiry.serviceName,
                subTitle: inquiry.visaCountry ? `Visa Assistance for ${inquiry.visaCountry}` : 'Custom Service',
                amount: inquiry.estimatedPrice,
                email: inquiry.email,
                dateLabel: "Date Submitted",
                dateValue: new Date(inquiry.createdAt).toLocaleDateString(),
                status: 'PAID',
                isPartial: false
            });
        }
    } catch (error) {
        console.error('Error fetching inquiry:', error);
    } finally {
        setLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    alert('Receipt download coming soon!');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Verifying your payment...</p>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon-wrapper">
            <CheckCircle size={80} color="#22c55e" strokeWidth={3} />
          </div>

          <h1 className="success-title">Payment Successful! 🎉</h1>
          <p className="success-subtitle">
            {type === 'booking' 
              ? (details?.isPartial 
                  ? 'Your initial payment has been confirmed. We\'ll contact you for the remaining balance before departure.' 
                  : 'Your adventure has been secured. Pack your bags!')
              : 'Your transaction is complete. We will process your documents shortly.'}
          </p>

          {details && (
            <div className="booking-info-card">
              <h3 className="info-title">Transaction Details</h3>
              
              <div className="info-grid">
                {/* Reference Number */}
                <div className="info-item">
                  <span className="info-label">Reference ID</span>
                  <strong className="info-value" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {details.reference || 'N/A'}
                  </strong>
                </div>

                {/* Service / Package Name */}
                <div className="info-item">
                  <span className="info-label">{type === 'booking' ? 'Package' : 'Service'}</span>
                  <strong className="info-value">{details.title}</strong>
                </div>
                
                {/* Dates */}
                <div className="info-item">
                  <span className="info-label">{details.dateLabel}</span>
                  <strong className="info-value">
                    {details.dateValue}
                  </strong>
                </div>
                
                {/* Additional Info (Pax or Country) */}
                <div className="info-item">
                  <span className="info-label">Details</span>
                  <strong className="info-value">{details.subTitle}</strong>
                </div>
                
                {/* Payment Amounts */}
                {details.isPartial ? (
                  <>
                    <div className="info-item">
                      <span className="info-label">Total Package Price</span>
                      <strong className="info-value">₱{details.totalAmount?.toLocaleString()}</strong>
                    </div>
                    <div className="info-item payment-highlight">
                      <span className="info-label">✅ Paid Today (Initial)</span>
                      <strong className="info-value amount">₱{details.amount?.toLocaleString()}</strong>
                    </div>
                    {details.remainingBalance > 0 && (
                      <div className="info-item remaining-balance">
                        <span className="info-label">⚠️ Remaining Balance</span>
                        <strong className="info-value amount">₱{details.remainingBalance?.toLocaleString()}</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="info-item payment-highlight">
                    <span className="info-label">✅ Amount Paid (Full)</span>
                    <strong className="info-value amount">₱{details.amount?.toLocaleString()}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Type Notice */}
          {details?.isPartial && (
            <div className="payment-notice">
              <strong>Note:</strong> The remaining balance of ₱{details.remainingBalance?.toLocaleString()} must be paid before your departure date. 
              Our team will send you a payment link when it's time to settle the balance.
            </div>
          )}

          <div className="email-notice">
            <Mail size={20} className="shrink-0" />
            <span>
              A confirmation email has been sent to <strong>{details?.email}</strong>
            </span>
          </div>

          <div className="action-buttons">
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              <LayoutDashboard size={20} />
              Go to Dashboard
            </button>
            
            <button className="btn-secondary" onClick={handleDownloadReceipt}>
              <Download size={20} />
              Download Receipt
            </button>
          </div>

          <div className="success-footer">
            <p>Need help? Contact us at <a href="mailto:support@wanderwave.com">support@wanderwave.com</a></p>
            <button className="btn-link" onClick={() => navigate('/')}>
              <Home size={16} style={{marginRight: '4px', display:'inline-block', verticalAlign:'text-bottom'}}/>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;