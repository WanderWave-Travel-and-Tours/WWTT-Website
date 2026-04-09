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
  const [type, setType] = useState(null);
  const [user, setUser] = useState(null); // ✅ NEW

  useEffect(() => {
    // ✅ SAFETY NET: Confirm booking immediately on page load using booking_id.
    // This is the PRIMARY fallback when the PayMongo webhook doesn't fire.
    // We call confirm-by-booking FIRST (non-blocking), then fetch booking details.
    const bookingId = searchParams.get('booking_id') || searchParams.get('bookingId');
    const inquiryId = searchParams.get('inquiryId');
    const paymentType = searchParams.get('paymentType');

    // ✅ Must declare BEFORE calling — const is not hoisted
    const confirmBookingByID = async (id) => {
      try {
        const res = await fetch(`https://wanderwaveph.onrender.com/api/payment/confirm-by-booking/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        console.log('✅ Safety-net confirm-by-booking result:', data);
      } catch (err) {
        console.error('Safety-net booking confirmation failed (non-fatal):', err);
      }
    };

    if (bookingId) {
      // Fire immediately — don't await, let fetchBookingDetails poll for the result
      confirmBookingByID(bookingId);
    }

    const storedUser = localStorage.getItem('wanderwave_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('✅ User session restored:', parsedUser.email);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }

    // Confetti Effect
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

    // Identify Transaction Type and fetch details
    if (bookingId) {
      setType('booking');
      fetchBookingDetails(bookingId, paymentType);
    } else if (inquiryId) {
      setType('inquiry');
      fetchInquiryDetails(inquiryId);
    } else {
      setLoading(false); 
    }
  }, [searchParams]);

  const fetchBookingDetails = async (id, paymentType) => {
    // ✅ FIX: Poll with retries to wait for PayMongo webhook to update booking status.
    // Without this, the page loads before the webhook fires and shows 'pending'.
    const MAX_RETRIES = 10;
    const RETRY_DELAY_MS = 2000; // 2 seconds between retries

    const tryFetch = async (attempt) => {
      try {
        const response = await fetch(`https://wanderwaveph.onrender.com/api/bookings/${id}`);
        const data = await response.json();
        
        if (data && (data._id || (data.success && data.booking))) {
          const booking = data.success ? data.booking : data;
          const isPartialPayment = paymentType === 'partial' || booking.paymentType === 'partial';
          const paidAmount = isPartialPayment ? booking.initialPaymentAmount : booking.totalAmount;

          // ✅ If booking is still pending and we have retries left, keep polling
          if (booking.status === 'pending' && attempt < MAX_RETRIES) {
            console.log(`⏳ Booking still pending, retrying... (attempt ${attempt}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return tryFetch(attempt + 1);
          }
          
          setDetails({
            id: booking._id,
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
            paymentType: booking.paymentType,
            fullName: booking.fullName,
            createdAt: booking.createdAt
          });
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return tryFetch(attempt + 1);
        }
      } finally {
        if (attempt >= MAX_RETRIES) {
          setLoading(false);
        }
      }
    };

    await tryFetch(1);
    setLoading(false);
  };

  const fetchInquiryDetails = async (id) => {
    try {
        const response = await fetch(`https://wanderwaveph.onrender.com/api/inquiries/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const inquiry = data.data;
            setDetails({
                id: inquiry._id,
                reference: inquiry._id.slice(-8).toUpperCase(),
                title: inquiry.serviceName,
                subTitle: inquiry.visaCountry ? `Visa Assistance for ${inquiry.visaCountry}` : 'Custom Service',
                amount: inquiry.estimatedPrice,
                email: inquiry.email,
                dateLabel: "Date Submitted",
                dateValue: new Date(inquiry.createdAt).toLocaleDateString(),
                status: inquiry.status,
                isPartial: false,
                fullName: inquiry.fullName,
                createdAt: inquiry.createdAt
            });
        }
    } catch (error) {
        console.error('Error fetching inquiry:', error);
    } finally {
        setLoading(false);
    }
  };

  // ✅ DOWNLOAD RECEIPT FUNCTION
  const handleDownloadReceipt = () => {
    if (!details) {
      alert('No transaction details available');
      return;
    }

    // Generate HTML receipt
    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>WanderWave Payment Receipt</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: #f5f5f5;
        }
        .receipt { 
            max-width: 700px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo { 
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 8px;
        }
        .receipt-title {
            font-size: 20px;
            color: #2d3748;
            font-weight: 600;
        }
        .status-badge {
            display: inline-block;
            background: #d4edda;
            color: #155724;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin: 20px 0;
        }
        .info-section {
            margin: 25px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-label {
            color: #718096;
            font-weight: 500;
        }
        .info-value {
            color: #2d3748;
            font-weight: 600;
            text-align: right;
        }
        .amount-highlight {
            font-size: 24px;
            color: #22c55e;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 14px;
        }
        @media print {
            body { background: white; padding: 0; }
            .receipt { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="logo">WanderWave Travel & Tours</div>
            <div class="receipt-title">PAYMENT RECEIPT</div>
            <div class="status-badge">✓ PAYMENT CONFIRMED</div>
        </div>

        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Reference Number:</span>
                <span class="info-value">${details.reference}</span>
            </div>
            <div class="info-row">
                <span class="info-label">${type === 'booking' ? 'Package' : 'Service'}:</span>
                <span class="info-value">${details.title}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Customer Name:</span>
                <span class="info-value">${details.fullName || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${details.email}</span>
            </div>
            <div class="info-row">
                <span class="info-label">${details.dateLabel}:</span>
                <span class="info-value">${details.dateValue}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Payment Date:</span>
                <span class="info-value">${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}</span>
            </div>
            ${details.isPartial ? `
            <div class="info-row">
                <span class="info-label">Total Package Price:</span>
                <span class="info-value">₱${details.totalAmount?.toLocaleString()}</span>
            </div>
            <div class="info-row" style="background: #d4edda; padding: 12px; border-radius: 8px; margin-top: 10px;">
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
    </div>

    <script>
        // Auto print on load
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
    `;

    // Create blob and download
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WanderWave-Receipt-${details.reference}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  // ✅ HANDLE DASHBOARD NAVIGATION - Auto login if user exists
  const handleGoToDashboard = () => {
    if (user) {
      // User session exists, go directly to dashboard
      navigate('/dashboard');
    } else {
      // No user session, redirect to login
      alert('Please login to view your dashboard');
      navigate('/login');
    }
  };
 
  // ✅ BACK TO HOME WITH WEBHOOK TRIGGER
  const handleBackToHome = () => {
    fetch('https://services.leadconnectorhq.com/hooks/yTzQYPFRZAWXGWiXtIt2/webhook-trigger/2537b614-8763-4705-8aa7-295d73a6bdf5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'back_to_home_clicked',
        timestamp: new Date().toISOString(),
        user: user || null,
        details: details || null,
        type: type || null
      })
    }).catch(err => console.error('Webhook error:', err));
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
                <div className="info-item">
                  <span className="info-label">Reference ID</span>
                  <strong className="info-value" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {details.reference}
                  </strong>
                </div>

                <div className="info-item">
                  <span className="info-label">{type === 'booking' ? 'Package' : 'Service'}</span>
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
            {/* ✅ UPDATED: Use handleGoToDashboard instead of direct navigate */}
            <button className="btn-primary" onClick={handleGoToDashboard}>
              <LayoutDashboard size={20} />
              Go to Dashboard
            </button>
            
            {/* ✅ UPDATED: Now actually downloads receipt */}
            <button className="btn-secondary" onClick={handleDownloadReceipt}>
              <Download size={20} />
              Download Receipt
            </button>
          </div>

          <div className="success-footer">
            <p>Need help? Contact us at <a href="mailto:support@wanderwave.com">support@wanderwave.com</a></p>
            {/* ✅ UPDATED: Back to Home now triggers webhook before navigating */}
            <button className="btn-link" onClick={handleBackToHome}>
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