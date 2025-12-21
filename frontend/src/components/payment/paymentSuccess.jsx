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
    const bookingId = searchParams.get('booking_id');
    const inquiryId = searchParams.get('inquiryId');

    if (bookingId) {
      setType('booking');
      fetchBookingDetails(bookingId);
    } else if (inquiryId) {
      setType('inquiry');
      fetchInquiryDetails(inquiryId);
    } else {
      // Demo Data for testing if no ID is present (Optional: remove this else block in production)
      setLoading(false); 
    }
  }, [searchParams]);

  // Fetch Booking Data
  const fetchBookingDetails = async (id) => {
    try {
      const response = await fetch(`https://wanderwaveph-backend.onrender.com0/api/bookings/${id}`);
      const data = await response.json();
      if (data.success) {
        setDetails({
          reference: data.booking.referenceNumber,
          title: data.booking.packageName,
          subTitle: `${data.booking.duration} • ${data.booking.pax?.adult || 1} Pax`,
          amount: data.booking.totalAmount,
          email: data.booking.email,
          dateLabel: "Travel Dates",
          dateValue: `${data.booking.startDate} - ${data.booking.endDate}`,
          status: data.booking.status
        });
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
        const response = await fetch(`https://wanderwaveph-backend.onrender.com0/api/inquiries/${id}`);
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
                status: 'PAID'
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
              ? 'Your adventure has been secured. Pack your bags!' 
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
                
                {/* Total Amount */}
                <div className="info-item">
                  <span className="info-label">Amount Paid</span>
                  <strong className="info-value amount">₱{details.amount?.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="email-notice">
            <Mail size={20} className="shrink-0" /> {/* shrink-0 prevents icon squishing on mobile */}
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