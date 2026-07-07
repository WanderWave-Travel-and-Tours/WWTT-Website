import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Mail, Home, LayoutDashboard } from 'lucide-react';
import confetti from 'canvas-confetti';
import './paymentSuccess.css';

const CustomPaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const bookingId = searchParams.get('booking_id') || searchParams.get('bookingId');
    const paymentType = searchParams.get('paymentType');

    const confirmBookingByID = async (id) => {
      try {
        await fetch(`https://wanderwaveph.onrender.com/api/payment/confirm-by-booking/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
      }
    };

    if (bookingId) {
      confirmBookingByID(bookingId);
      fetchBookingDetails(bookingId, paymentType);
    } else {
      setLoading(false);
    }

    const storedUser = localStorage.getItem('wanderwave_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
      }
    }

    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#fc9c1b', '#f97316', '#22c55e'] });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#fc9c1b', '#f97316', '#22c55e'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [searchParams]);

  const fetchBookingDetails = async (id, paymentType) => {
    const MAX_RETRIES = 8;
    const RETRY_DELAY = 1800;

    const tryFetch = async (attempt = 1) => {
      try {
        const res = await fetch(`https://wanderwaveph.onrender.com/api/customized-bookings/${id}`);
        const data = await res.json();

        if (res.ok && data.success && data.data) {
          return normalizeBooking(data.data, paymentType);
        }

        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY));
          return tryFetch(attempt + 1);
        }
      } catch (e) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY));
          return tryFetch(attempt + 1);
        }
      }
      return null;
    };

    const bookingData = await tryFetch();
    if (bookingData) setDetails(bookingData);
    setLoading(false);
  };

  const normalizeBooking = (booking, paymentTypeParam) => {
    const isPartial = paymentTypeParam === 'partial' || booking.paymentType === 'partial';
    const tours = Array.isArray(booking.tours) ? booking.tours : [];
    const transfers = Array.isArray(booking.transfers) ? booking.transfers : [];
    const itemCount = tours.length + transfers.length;

    return {
      id: booking._id,
      reference: booking.referenceNumber || booking._id?.slice(-8)?.toUpperCase() || 'N/A',
      title: booking.destination ? `Custom Trip to ${booking.destination}` : 'Custom Trip',
      subTitle: `${itemCount} item${itemCount === 1 ? '' : 's'} • ${booking.paxCount || 1} Pax`,
      dateLabel: 'Pax Count',
      dateValue: `${booking.paxCount || 1} Traveler${(booking.paxCount || 1) === 1 ? '' : 's'}`,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone || '',
      isPartial,
      amount: isPartial ? booking.initialPaymentAmount : booking.totalAmount,
      totalAmount: booking.totalAmount,
      remainingBalance: booking.remainingBalance || 0,
      tours,
      transfers,
    };
  };

  const handleDownloadReceipt = () => {
    if (!details) {
      alert('No transaction details available');
      return;
    }

    const itemsHTML = [
      ...details.tours.map((t, i) => `
        <div class="info-row">
            <span class="info-label">Tour ${i + 1}:</span>
            <span class="info-value">${t.title || 'Tour'} — ₱${(t.subtotal || 0).toLocaleString('en-PH')}</span>
        </div>`),
      ...details.transfers.map((tr, i) => `
        <div class="info-row">
            <span class="info-label">Transfer ${i + 1}:</span>
            <span class="info-value">${tr.title || 'Transfer'} — ₱${(tr.subtotal || 0).toLocaleString('en-PH')}</span>
        </div>`),
    ].join('');

    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>WanderWave Receipt - ${details.reference}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #fc9c1b; padding-bottom: 20px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #fc9c1b; }
        .receipt-title { font-size: 18px; color: #333; margin-top: 10px; }
        .reference { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .reference-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .reference-number { font-size: 20px; font-weight: bold; font-family: monospace; color: #333; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: bold; color: #fc9c1b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
        .info-label { color: #666; font-size: 14px; }
        .info-value { font-weight: bold; color: #333; font-size: 14px; }
        .amount-highlight { font-size: 22px; font-weight: bold; color: #22c55e; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🌊 WanderWave</div>
        <div class="receipt-title">Official Payment Receipt</div>
        <div style="color: #666; font-size: 12px; margin-top: 5px;">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    <div class="reference">
        <div class="reference-label">Reference Number</div>
        <div class="reference-number">${details.reference}</div>
    </div>

    <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${details.fullName}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${details.email}</span>
        </div>
        ${details.phone ? `
        <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${details.phone}</span>
        </div>` : ''}
    </div>

    <div class="section">
        <div class="section-title">Custom Trip Details</div>
        <div class="info-row">
            <span class="info-label">Trip:</span>
            <span class="info-value">${details.title}</span>
        </div>
        <div class="info-row">
            <span class="info-label">${details.dateLabel}:</span>
            <span class="info-value">${details.dateValue}</span>
        </div>
        ${itemsHTML}
    </div>

    <div class="section">
        <div class="section-title">Payment Information</div>
        <div class="info-row">
            <span class="info-label">Payment Type:</span>
            <span class="info-value">${details.isPartial ? 'Partial Payment' : 'Full Payment'}</span>
        </div>
        ${details.isPartial ? `
        <div class="info-row">
            <span class="info-label">Total Price:</span>
            <span class="info-value">₱${details.totalAmount?.toLocaleString()}</span>
        </div>
        <div class="info-row">
            <span class="info-label" style="color: #155724;">Amount Paid (Initial):</span>
            <span class="amount-highlight">₱${details.amount?.toLocaleString()}</span>
        </div>
        <div class="info-row" style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-top: 5px;">
            <span class="info-label" style="color: #856404;">Remaining Balance:</span>
            <span class="info-value" style="color: #856404; font-size: 18px;">₱${details.remainingBalance?.toLocaleString()}</span>
        </div>
        ` : `
        <div class="info-row" style="background: #d4edda; padding: 12px; border-radius: 8px; margin-top: 10px;">
            <span class="info-label" style="color: #155724;">Amount Paid (Full):</span>
            <span class="amount-highlight">₱${details.amount?.toLocaleString()}</span>
        </div>
        `}
    </div>

    <div class="footer">
        <p><strong>WanderWave Travel and Tours OPC</strong></p>
        <p>Thank you for choosing WanderWave! For inquiries, contact us at support@wanderwave.com</p>
        <p style="margin-top: 10px; font-size: 12px;">This is a computer-generated receipt and does not require a signature.</p>
    </div>

    <script>
        window.onload = function() { window.print(); }
    </script>
</body>
</html>
    `;

    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WanderWave-Receipt-${details.reference}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const handleGoToDashboard = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      alert('Please login to view your dashboard');
      navigate('/login');
    }
  };

  const handleClose = () => {
    navigate('/');
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
            {details?.isPartial
              ? "Your initial payment has been confirmed. We'll contact you for the remaining balance before departure."
              : 'Your custom adventure has been secured. Pack your bags!'}
          </p>

          {details && (
            <div className="booking-info-card">
              <h3 className="info-title">Custom Booking Details</h3>

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Reference ID</span>
                  <strong className="info-value" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {details.reference}
                  </strong>
                </div>

                <div className="info-item">
                  <span className="info-label">Trip</span>
                  <strong className="info-value">{details.title}</strong>
                </div>

                <div className="info-item">
                  <span className="info-label">{details.dateLabel}</span>
                  <strong className="info-value">{details.dateValue}</strong>
                </div>

                <div className="info-item">
                  <span className="info-label">Details</span>
                  <strong className="info-value">{details.subTitle}</strong>
                </div>

                {details.isPartial ? (
                  <>
                    <div className="info-item">
                      <span className="info-label">Total Price</span>
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
            <button className="btn-primary" onClick={handleGoToDashboard}>
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
            <button className="btn-link" onClick={handleClose}>
              <Home size={16} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'text-bottom' }} />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPaymentSuccess;
