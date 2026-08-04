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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const bookingId = searchParams.get('booking_id') || searchParams.get('bookingId');
    const inquiryId = searchParams.get('inquiryId');
    const paymentType = searchParams.get('paymentType');

    // ✅ Safety-net: confirm booking on page load (fallback when webhook doesn't fire)
    const confirmBookingByID = async (id) => {
      try {
        const res = await fetch(`https://wanderwaveph.onrender.com/api/payment/confirm-by-booking/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
      } catch (err) {
      }
    };

    if (bookingId) {
      confirmBookingByID(bookingId);
      setType('booking');
      fetchBookingDetails(bookingId, paymentType);
    } else if (inquiryId) {
      setType('inquiry');
      fetchInquiryDetails(inquiryId);
    }

    // Restore user session
    const storedUser = localStorage.getItem('wanderwave_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
      }
    }

    // Confetti Effect
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#fc9c1b', '#f97316', '#22c55e'] });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#fc9c1b', '#f97316', '#22c55e'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    if (!bookingId && !inquiryId) setLoading(false);
  }, [searchParams]);

  // ============================================
  // FETCH BOOKING WITH RETRY
  // ============================================
  const fetchBookingDetails = async (id, paymentType) => {
    const MAX_RETRIES = 8;
    const RETRY_DELAY = 1800;

    const tryFetch = async (attempt = 1) => {
      try {
        // 1. Try regular Booking first
        let res = await fetch(`https://wanderwaveph.onrender.com/api/bookings/${id}`);
        let data = await res.json();

        if (res.ok && (data._id || (data.success && data.data))) {
          const booking = data.success ? data.data : data;
          return normalizeBooking(booking, paymentType, 'regular');
        }

        // 2. Try TourBooking
        res = await fetch(`https://wanderwaveph.onrender.com/api/tour-bookings/${id}`);
        data = await res.json();

        if (res.ok && data.success && data.data) {
          return normalizeBooking(data.data, paymentType, 'tour');
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

  // ============================================
  // ✅ UPDATED: normalizeBooking — ALL fields included
  // ============================================
  const normalizeBooking = (booking, paymentTypeParam, source) => {
    const isPartial = paymentTypeParam === 'partial' || booking.paymentType === 'partial';

    return {
      // — Core identifiers —
      id: booking._id,
      reference: booking.referenceNumber || booking._id?.slice(-8)?.toUpperCase() || 'N/A',
      source,

      // — Display fields —
      title: booking.packageName || 'Tour Package',
      subTitle: `${booking.duration || ''} • ${booking.pax?.adult || booking.passengers?.length || 1} Pax`,
      dateLabel: 'Travel Dates',
      dateValue: `${booking.startDate} - ${booking.endDate}`,

      // — Customer info —
      fullName: booking.fullName || `${booking.passengers?.[0]?.firstName || ''} ${booking.passengers?.[0]?.lastName || ''}`.trim(),
      email: booking.email,
      phone: booking.phone || booking.contactNumber || '',
      nationality: booking.nationality || '',

      // — Travel details —
      startDate: booking.startDate,
      endDate: booking.endDate,
      duration: booking.duration || '',
      destination: booking.destination || booking.packageId?.destination || '',
      category: booking.category || booking.packageId?.category || '',
      tourType: booking.tourType || booking.packageId?.tourType || '',

      // — Pax / passengers —
      pax: booking.pax || null,
      passengerCount: booking.pax?.adult || booking.passengers?.length || 1,
      passengers: booking.passengers || [],

      // — Payment info —
      isPartial: isPartial,
      paymentType: booking.paymentType || paymentTypeParam,
      amount: isPartial ? booking.initialPaymentAmount : (booking.totalAmount || booking.finalPackageTotal),
      totalAmount: booking.totalAmount || booking.finalPackageTotal || booking.price,
      remainingBalance: booking.remainingBalance || 0,
      initialPaymentAmount: booking.initialPaymentAmount || null,
      includesAirfare: booking.includesAirfare || false,

      // — Booking status —
      status: booking.status,
      checkoutSessionId: booking.checkoutSessionId || null,

      // — Package extras —
      packageImage: booking.image || booking.packageImage || booking.packageId?.image || '',
      inclusions: booking.inclusions || booking.packageId?.inclusions || [],
      itinerary: booking.itinerary || booking.packageId?.itinerary || [],

      // — Optional extras —
      specialRequests: booking.specialRequests || '',
      selectedRoomType: booking.selectedRoomType || '',
      hotelName: booking.hotelName || '',
      promoCode: booking.promoCode || '',
      discountAmount: booking.discountAmount || 0,

      // — Timestamps —
      createdAt: booking.createdAt || booking.updatedAt,
      paidAt: booking.paidAt || null,
    };
  };

  // ============================================
  // FETCH INQUIRY
  // ============================================
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
          totalAmount: inquiry.estimatedPrice,
          email: inquiry.email,
          fullName: inquiry.fullName,
          phone: inquiry.phone || '',
          dateLabel: 'Date Submitted',
          dateValue: new Date(inquiry.createdAt).toLocaleDateString(),
          startDate: null,
          endDate: null,
          status: inquiry.status,
          isPartial: false,
          paymentType: 'full',
          remainingBalance: 0,
          createdAt: inquiry.createdAt,
          serviceName: inquiry.serviceName,
          visaCountry: inquiry.visaCountry || '',
          paxCount: inquiry.paxCount || 1,
          message: inquiry.message || '',
          source: 'inquiry',
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ✅ UPDATED: triggerWebhook — fetches destination payload from backend
  //    so back_to_home_clicked and go_to_dashboard_clicked also carry
  //    destination_greeting, destination_tip1-5, emergency_number
  //    exactly like the backend BOOKING_CONFIRMATION webhook does.
  // ============================================
  const triggerWebhook = async (eventName) => {
    if (!details) return;

    try {
      // ✅ Step 1: Fetch destination personalization data from backend
      let destinationPayload = {};
      if (details.id && type === 'booking') {
        try {
          const destRes = await fetch(
            `https://wanderwaveph.onrender.com/api/bookings/${details.id}/destination-payload`
          );
          const destData = await destRes.json();
          if (destData.success && destData.payload) {
            destinationPayload = destData.payload;
          }
        } catch (destErr) {
        }
      }

      // ✅ Step 2: Send enriched webhook to GHL
      await fetch('https://services.leadconnectorhq.com/hooks/yTzQYPFRZAWXGWiXtIt2/webhook-trigger/2537b614-8763-4705-8aa7-295d73a6bdf5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ── Meta ──────────────────────────────────────────────
          event: eventName,
          timestamp: new Date().toISOString(),
          type: type || null,

          // ── User session ──────────────────────────────────────
          user_email: user?.email || null,
          user_name: user?.name || null,
          user_id: user?._id || user?.id || null,

          // ── Booking identifiers ───────────────────────────────
          booking_id: details.id,
          reference_number: details.reference,
          checkout_session_id: details.checkoutSessionId || null,
          booking_source: details.source || null,

          // ── Customer info ─────────────────────────────────────
          full_name: details.fullName,
          first_name: details.fullName?.split(' ')[0] || '',
          last_name: details.fullName?.split(' ').slice(1).join(' ') || '',
          email: details.email,
          phone: details.phone || '',
          nationality: details.nationality || '',

          // ── Package / service info ────────────────────────────
          package_name: details.title,
          destination: details.destination || '',
          duration: details.duration || '',
          category: details.category || '',
          tour_type: details.tourType || '',
          package_image: details.packageImage || '',
          inclusions: Array.isArray(details.inclusions) ? details.inclusions.join(', ') : '',
          itinerary: Array.isArray(details.itinerary) ? JSON.stringify(details.itinerary) : '',

          // ✅ Destination personalization fields from backend
          // Spreads: destination_greeting, destination_tip1-5, emergency_number
          ...destinationPayload,

          // ── Travel dates ──────────────────────────────────────
          start_date: details.startDate || '',
          end_date: details.endDate || '',
          travel_dates: details.dateValue || '',

          // ── Pax info ──────────────────────────────────────────
          passenger_count: details.passengerCount || 1,
          pax_adult: details.pax?.adult || details.passengerCount || 1,
          pax_child: details.pax?.child || 0,
          pax_infant: details.pax?.infant || 0,

          // ── Payment info ──────────────────────────────────────
          payment_type: details.paymentType || 'full',
          is_partial: details.isPartial || false,
          includes_airfare: details.includesAirfare || false,
          amount_paid: details.amount || 0,
          total_amount: details.totalAmount || 0,
          remaining_balance: details.remainingBalance || 0,
          initial_payment_amount: details.initialPaymentAmount || null,
          discount_amount: details.discountAmount || 0,
          promo_code: details.promoCode || '',

          // ── Hotel / room ──────────────────────────────────────
          selected_room_type: details.selectedRoomType || '',
          hotel_name: details.hotelName || '',

          // ── Special requests ──────────────────────────────────
          special_requests: details.specialRequests || '',

          // ── Booking status ────────────────────────────────────
          booking_status: details.status || '',
          paid_at: details.paidAt || null,
          booking_created_at: details.createdAt || null,

          // ── Inquiry-specific (if applicable) ──────────────────
          service_name: details.serviceName || details.title || '',
          visa_country: details.visaCountry || '',
          inquiry_message: details.message || '',

          // ── Formatted amount strings (for email templates) ────
          amount_paid_formatted: `₱${(details.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
          total_amount_formatted: `₱${(details.totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
          remaining_balance_formatted: details.remainingBalance > 0
            ? `₱${details.remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
            : '₱0.00',

          // ── Raw details object (backup for GHL custom fields) ──
          details: details,
        })
      });

    } catch (err) {
    }
  };

  // ============================================
  // DOWNLOAD RECEIPT
  // ============================================
  const handleDownloadReceipt = async () => {
    if (!details) {
      alert('No transaction details available');
      return;
    }

    await triggerWebhook('download_receipt_clicked');

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
        <div class="section-title">${type === 'booking' ? 'Booking Details' : 'Service Details'}</div>
        <div class="info-row">
            <span class="info-label">${type === 'booking' ? 'Package:' : 'Service:'}</span>
            <span class="info-value">${details.title}</span>
        </div>
        ${details.dateValue && details.dateValue !== 'null - null' ? `
        <div class="info-row">
            <span class="info-label">${details.dateLabel}:</span>
            <span class="info-value">${details.dateValue}</span>
        </div>` : ''}
        ${details.subTitle ? `
        <div class="info-row">
            <span class="info-label">Details:</span>
            <span class="info-value">${details.subTitle}</span>
        </div>` : ''}
    </div>

    <div class="section">
        <div class="section-title">Payment Information</div>
        <div class="info-row">
            <span class="info-label">Payment Type:</span>
            <span class="info-value">${details.isPartial ? 'Partial Payment' : 'Full Payment'
        }</span>
        </div>
        ${details.isPartial ? `
        <div class="info-row">
            <span class="info-label">Total Package Price:</span>
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

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  const handleGoToDashboard = async () => {
    await triggerWebhook('go_to_dashboard_clicked');
    if (user) {
      navigate('/dashboard');
    } else {
      alert('Please login to view your dashboard');
      navigate('/login');
    }
  };

  const handleBackToHome = async () => {
    await triggerWebhook('back_to_home_clicked');
    navigate('/');
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Verifying your payment...</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
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
                  <strong className="info-value ps-info-value-reference">
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
            <button className="btn-link" onClick={handleBackToHome}>
              <Home size={16} className="ps-home-icon" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;