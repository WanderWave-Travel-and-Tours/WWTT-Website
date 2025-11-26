import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Mail, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import './paymentSuccess.css'

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    const bookingId = searchParams.get('booking_id');
      if (bookingId) {
        fetchBookingDetails(bookingId);
      } else {
        setLoading(false);
      }
    }, [searchParams]);

  const fetchBookingDetails = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}`);
      const data = await response.json();
      if (data.success) {
        setBookingDetails(data.booking);
        if (data.booking.status !== 'confirmed') {
          console.warn('Booking not yet confirmed');
        }
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
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
        <p>Loading your booking details...</p>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon-wrapper">
            <CheckCircle size={80} color="#22c55e" strokeWidth={2} />
          </div>

          <h1 className="success-title">Payment Successful! 🎉</h1>
          <p className="success-subtitle">
            Your booking has been confirmed. Get ready for an amazing adventure!
          </p>

          {bookingDetails && (
            <div className="booking-info-card">
              <h3 className="info-title">Booking Details</h3>
              
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Booking ID</span>
                  <strong className="info-value">#{bookingDetails._id?.slice(-8).toUpperCase()}</strong>
                </div>

                <div className="info-item">
                  <span className="info-label">Reference Number</span>
                  <strong className="info-value" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {bookingDetails.referenceNumber}
                  </strong>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Package</span>
                  <strong className="info-value">{bookingDetails.packageName}</strong>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Travel Dates</span>
                  <strong className="info-value">
                    {bookingDetails.startDate} - {bookingDetails.endDate}
                  </strong>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Number of Pax</span>
                  <strong className="info-value">{bookingDetails.pax?.adult || 0} person(s)</strong>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Total Paid</span>
                  <strong className="info-value amount">₱{bookingDetails.totalAmount?.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="email-notice">
            <Mail size={20} color="#3b82f6" />
            <p>
              A confirmation email has been sent to <strong>{bookingDetails?.email}</strong>
            </p>
          </div>

          <div className="action-buttons">
            <button className="btn-primary" onClick={() => navigate('/my-bookings')}>
              <ArrowRight size={20} />
              View My Bookings
            </button>
            
            <button className="btn-secondary" onClick={handleDownloadReceipt}>
              <Download size={20} />
              Download Receipt
            </button>
          </div>

          <div className="success-footer">
            <p>Need help? Contact us at <a href="mailto:support@wanderwave.com">support@wanderwave.com</a></p>
            <button className="btn-link" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;