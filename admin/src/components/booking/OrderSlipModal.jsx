import React, { useRef } from 'react';
import { X, Printer, MapPin, Calendar, Users, Plane, Package, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './OrderSlipModal.css';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const fmt = (n) =>
  n != null ? `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₱0.00';

const fmtDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Mirrors the Mongoose method `getPaymentStatusDescription()` on the schema.
 * Works entirely from the plain JS object returned by the API.
 */
const getPaymentStatusDescription = (booking) => {
  const {
    paymentType,
    status,
    initialPaymentPaid,
    balancePaidAmount = 0,
    totalAmount = 0,
    initialPaymentAmount = 0,
    remainingBalance = 0,
    balancePaymentPaid,
    isWalkin,
  } = booking;

  // Walk-in bookings are always fully paid at the counter
  if (isWalkin) return 'Paid — Walk-in / Over the Counter';

  if (paymentType === 'full') {
    if (status === 'confirmed' || status === 'fully_paid' || initialPaymentPaid) {
      return 'Paid in Full';
    }
    return 'Pending Payment';
  }

  // Partial payment checks
  const totalPaid = initialPaymentAmount + balancePaidAmount;
  const paidViaCheckout = initialPaymentPaid && balancePaymentPaid;
  const isFullyPaid = totalPaid >= totalAmount || paidViaCheckout;

  if (isFullyPaid) return 'Fully Paid';

  if ((initialPaymentAmount > 0 || initialPaymentPaid) && balancePaidAmount === 0) {
    return `Partial Paid — ${fmt(remainingBalance)} remaining`;
  }

  return 'Pending Payment';
};

const getStatusMeta = (booking) => {
  const desc = getPaymentStatusDescription(booking);
  if (desc.startsWith('Paid in Full') || desc.startsWith('Fully Paid') || desc.startsWith('Paid —')) {
    return { label: desc, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', Icon: CheckCircle };
  }
  if (desc.startsWith('Partial Paid')) {
    return { label: desc, color: '#b45309', bg: '#fffbeb', border: '#fde68a', Icon: Clock };
  }
  return { label: desc, color: '#991b1b', bg: '#fef2f2', border: '#fecaca', Icon: AlertCircle };
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const OrderSlipModal = ({ booking, onClose }) => {
  const printRef = useRef(null);

  if (!booking) return null;

  // ── Resolve raw data (the modal receives the "formatted" booking
  //    from booking.jsx; the full schema object lives in rawData) ──
  const raw = booking.rawData || booking;

  const {
    referenceNumber,
    fullName,
    email,
    packageName,
    startDate,
    endDate,
    duration,
    pax = {},
    selectedRoomType,
    hotelName,
    numberOfRooms,
    isCustomized,
    customizedInclusions = [],
    originalInclusions = [],
    includesAirfare,
    flightDetails = {},
    packageTotal,
    customizationAdditionalPrice = 0,
    airfareTotal = 0,
    promoCode,
    discountAmount = 0,
    finalPackageTotal,
    totalAmount = 0,
    paymentType,
    initialPaymentAmount = 0,
    remainingBalance = 0,
    balancePaidAmount = 0,
    passengers = [],
    status,
    createdAt,
    isWalkin,
    appointmentDate,
    appointmentTime,
    message,
    destination,
  } = raw;

  // Displayed booking id
  const bookingId = booking.id || booking._id || raw._id;

  // ── Inclusions ──────────────────────────────────────────────────
  let inclusions = [];
  if (isCustomized && Array.isArray(customizedInclusions) && customizedInclusions.length > 0) {
    inclusions = customizedInclusions.filter((i) => i.isChecked !== false);
  } else if (Array.isArray(originalInclusions) && originalInclusions.length > 0) {
    inclusions = originalInclusions.map((name) => ({ name, isOriginal: true, price: 0 }));
  }

  // ── Financial rows ──────────────────────────────────────────────
  const basePackageTotal = packageTotal || totalAmount;
  const computedRemainingBalance = isWalkin
    ? 0
    : paymentType === 'partial'
    ? Math.max(0, totalAmount - initialPaymentAmount - balancePaidAmount)
    : 0;

  // ── Print handler ───────────────────────────────────────────────
  // Opens a dedicated blank window so the browser prints ONLY the slip —
  // no sidebar, no modal overlay, no React chrome. Also inlines the CSS
  // so the new window doesn't need a separate network request.
  const handlePrint = () => {
    // 1. Grab the rendered slip HTML
    const slipNode = printRef.current;
    if (!slipNode) return;
    const slipHTML = slipNode.outerHTML;

    // 2. Collect all <style> and <link rel=stylesheet> from the current doc
    //    so fonts, variables, and our OrderSlipModal.css all transfer across.
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    // 3. Open a blank window, write a minimal HTML document and auto-print
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      // Popup was blocked — fallback to in-page print
      window.print();
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Slip — ${referenceNumber || 'WanderWave'}</title>
  <style>
    /* Remove ALL browser print chrome (URL, date, page numbers) */
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0; padding: 0; background: white; }
  </style>
  ${styles}
</head>
<body>
  ${slipHTML}
  <script>
    window.onload = function () {
      window.print();
      window.onafterprint = function () { window.close(); };
    };
  <\/script>
</body>
</html>`);
    win.document.close();
  };

  // ── Status pill ─────────────────────────────────────────────────
  const statusMeta = getStatusMeta(raw);
  const StatusIcon = statusMeta.Icon;

  return (
    <div className="os-overlay" onClick={onClose}>
      <div className="os-wrapper" onClick={(e) => e.stopPropagation()}>

        {/* ── SCREEN-ONLY TOOLBAR ── */}
        <div className="os-toolbar no-print">
          <span className="os-toolbar-title">Order Slip Preview</span>
          <div className="os-toolbar-actions">
            <button className="os-btn-print" onClick={handlePrint}>
              <Printer size={16} />
              Print / Save PDF
            </button>
            <button className="os-btn-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            PRINTABLE SLIP — everything inside os-slip prints
        ════════════════════════════════════════════════════════════ */}
        <div className="os-slip" ref={printRef}>

          {/* ── SLIP HEADER ── */}
          <div className="os-slip-header">
            <div className="os-brand">
              <div className="os-brand-logo">
                <span>W</span>
              </div>
              <div className="os-brand-info">
                <h1 className="os-brand-name">WanderWave</h1>
                <p className="os-brand-tagline">Travel & Tours</p>
              </div>
            </div>
            <div className="os-slip-meta">
              <div className="os-slip-doc-type">ORDER SLIP</div>
              <table className="os-meta-table">
                <tbody>
                  <tr>
                    <td className="os-meta-label">Ref No.</td>
                    <td className="os-meta-value os-mono">{referenceNumber || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="os-meta-label">Booking ID</td>
                    <td className="os-meta-value os-mono">{bookingId}</td>
                  </tr>
                  <tr>
                    <td className="os-meta-label">Date Issued</td>
                    <td className="os-meta-value">{fmtDate(createdAt || new Date())}</td>
                  </tr>
                  <tr>
                    <td className="os-meta-label">Booking Type</td>
                    <td className="os-meta-value">
                      {isWalkin ? 'Walk-in / Counter' : 'Online Booking'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="os-divider" />

          {/* ── PAYMENT STATUS BANNER ── */}
          <div
            className="os-status-banner"
            style={{ background: statusMeta.bg, borderColor: statusMeta.border, color: statusMeta.color }}
          >
            <StatusIcon size={18} />
            <span className="os-status-text">{statusMeta.label}</span>
            <span className="os-status-type">
              {paymentType === 'partial' ? 'Partial Payment Plan' : 'Full Payment'}
            </span>
          </div>

          {/* ── TWO-COLUMN INFO ── */}
          <div className="os-info-grid">
            {/* Client Info */}
            <div className="os-info-block">
              <p className="os-block-label">CLIENT INFORMATION</p>
              <p className="os-block-primary">{fullName || booking.customerName}</p>
              <p className="os-block-secondary">{email || booking.email}</p>
              {message && <p className="os-block-note">"{message}"</p>}
            </div>
            {/* Trip Summary */}
            <div className="os-info-block">
              <p className="os-block-label">TRIP SUMMARY</p>
              <div className="os-info-row">
                <MapPin size={13} className="os-info-icon" />
                <span>{destination || booking.destination || 'Philippines'}</span>
              </div>
              <div className="os-info-row">
                <Calendar size={13} className="os-info-icon" />
                <span>
                  {fmtDate(startDate)} → {fmtDate(endDate)}
                </span>
              </div>
              <div className="os-info-row">
                <Users size={13} className="os-info-icon" />
                <span>
                  {pax.adult || 1} Adult{(pax.adult || 1) > 1 ? 's' : ''}
                  {pax.children > 0 ? `, ${pax.children} Child${pax.children > 1 ? 'ren' : ''}` : ''}
                  {pax.infants > 0 ? `, ${pax.infants} Infant${pax.infants > 1 ? 's' : ''}` : ''}
                </span>
              </div>
              {duration && (
                <div className="os-info-row">
                  <span className="os-duration-pill">{duration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Walk-in appointment row (if applicable) */}
          {isWalkin && (appointmentDate || appointmentTime) && (
            <div className="os-walkin-badge">
              <span>📅 Appointment:</span>
              <strong>
                {appointmentDate && fmtDate(appointmentDate)}
                {appointmentDate && appointmentTime && ' — '}
                {appointmentTime}
              </strong>
            </div>
          )}

          <div className="os-section-gap" />

          {/* ── PACKAGE DETAILS ── */}
          <div className="os-section">
            <div className="os-section-header">
              <Package size={15} />
              <span>Package Details</span>
              {isCustomized && <span className="os-custom-badge">Customized</span>}
            </div>

            <p className="os-package-name">{packageName || booking.packageName}</p>

            {/* Hotel */}
            {hotelName && (
              <div className="os-hotel-row">
                <span className="os-hotel-label">Hotel</span>
                <span className="os-hotel-value">
                  {hotelName}
                  {selectedRoomType && ` — ${selectedRoomType}`}
                  {numberOfRooms && ` (${numberOfRooms} room${numberOfRooms > 1 ? 's' : ''})`}
                </span>
              </div>
            )}

            {/* Inclusions */}
            {inclusions.length > 0 && (
              <div className="os-inclusions">
                <p className="os-inclusions-title">
                  {isCustomized ? 'Customized Inclusions' : 'Package Inclusions'}
                </p>
                <div className="os-inclusions-grid">
                  {inclusions.map((inc, i) => {
                    const name = typeof inc === 'string' ? inc : inc.name;
                    const price = typeof inc === 'object' ? inc.price : 0;
                    const isAdded = typeof inc === 'object' && !inc.isOriginal;
                    return (
                      <div key={i} className={`os-inclusion-item ${isAdded ? 'os-inclusion-added' : ''}`}>
                        <span className="os-inclusion-check">✓</span>
                        <span className="os-inclusion-name">{name}</span>
                        {isAdded && price > 0 && (
                          <span className="os-inclusion-price">+{fmt(price)}</span>
                        )}
                        {isAdded && (
                          <span className="os-inclusion-tag">Added</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── FLIGHT DETAILS (conditional) ── */}
          {includesAirfare && flightDetails && (
            <div className="os-section os-section-flight">
              <div className="os-section-header">
                <Plane size={15} />
                <span>Flight Details</span>
                {flightDetails.isInternational && <span className="os-intl-badge">International</span>}
              </div>
              <div className="os-flight-grid">
                {flightDetails.airline && (
                  <div className="os-flight-item">
                    <span className="os-flight-label">Airline</span>
                    <span className="os-flight-value">{flightDetails.airline}</span>
                  </div>
                )}
                {flightDetails.flightNumber && (
                  <div className="os-flight-item">
                    <span className="os-flight-label">Flight No.</span>
                    <span className="os-flight-value os-mono">{flightDetails.flightNumber}</span>
                  </div>
                )}
                {flightDetails.route && (
                  <div className="os-flight-item">
                    <span className="os-flight-label">Route</span>
                    <span className="os-flight-value">{flightDetails.route}</span>
                  </div>
                )}
                {flightDetails.departureTime && (
                  <div className="os-flight-item">
                    <span className="os-flight-label">Departure</span>
                    <span className="os-flight-value">{flightDetails.departureTime}</span>
                  </div>
                )}
                {flightDetails.arrivalTime && (
                  <div className="os-flight-item">
                    <span className="os-flight-label">Arrival</span>
                    <span className="os-flight-value">{flightDetails.arrivalTime}</span>
                  </div>
                )}
                {(flightDetails.price?.formatted || airfareTotal > 0) && (
                  <div className="os-flight-item">
                    <span className="os-flight-label">Airfare Cost</span>
                    <span className="os-flight-value os-flight-price">
                      {flightDetails.price?.formatted || fmt(airfareTotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PASSENGER SUMMARY ── */}
          {passengers.length > 0 && (
            <div className="os-section">
              <div className="os-section-header">
                <Users size={15} />
                <span>Passenger Summary</span>
                <span className="os-pax-count">{passengers.length} pax</span>
              </div>
              <table className="os-pax-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Full Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Nationality</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {passengers.map((p, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'os-pax-even' : ''}>
                      <td className="os-pax-num">{i + 1}</td>
                      <td className="os-pax-name">
                        {`${p.firstName || ''} ${p.lastName || ''}`.trim() || '—'}
                      </td>
                      <td>{p.age ?? '—'}</td>
                      <td>{p.gender || '—'}</td>
                      <td>{p.nationality || '—'}</td>
                      <td className="os-pax-contact">{p.phone || p.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── FINANCIAL BREAKDOWN ── */}
          <div className="os-section os-section-finance">
            <div className="os-section-header">
              <CreditCard size={15} />
              <span>Financial Breakdown</span>
            </div>

            <table className="os-finance-table">
              <tbody>
                {/* Base Package */}
                <tr>
                  <td className="os-ft-label">Package Rate</td>
                  <td className="os-ft-desc">{packageName || booking.packageName}</td>
                  <td className="os-ft-amount">{fmt(basePackageTotal)}</td>
                </tr>

                {/* Customization add-on */}
                {isCustomized && customizationAdditionalPrice > 0 && (
                  <tr className="os-ft-addon">
                    <td className="os-ft-label">Customization Add-ons</td>
                    <td className="os-ft-desc">Additional inclusions</td>
                    <td className="os-ft-amount">+{fmt(customizationAdditionalPrice)}</td>
                  </tr>
                )}

                {/* Airfare */}
                {includesAirfare && airfareTotal > 0 && (
                  <tr className="os-ft-addon">
                    <td className="os-ft-label">Airfare</td>
                    <td className="os-ft-desc">
                      {flightDetails?.airline
                        ? `${flightDetails.airline} ${flightDetails.flightNumber || ''}`
                        : 'Flight Included'}
                    </td>
                    <td className="os-ft-amount">+{fmt(airfareTotal)}</td>
                  </tr>
                )}

                {/* Promo Discount */}
                {promoCode && discountAmount > 0 && (
                  <tr className="os-ft-discount">
                    <td className="os-ft-label">Promo Discount</td>
                    <td className="os-ft-desc">Code: {promoCode}</td>
                    <td className="os-ft-amount os-ft-neg">−{fmt(discountAmount)}</td>
                  </tr>
                )}

                {/* Subtotal divider */}
                <tr className="os-ft-divider-row">
                  <td colSpan={3}><div className="os-ft-divider" /></td>
                </tr>

                {/* Total */}
                <tr className="os-ft-total">
                  <td className="os-ft-label" colSpan={2}>TOTAL AMOUNT</td>
                  <td className="os-ft-total-amount">{fmt(totalAmount)}</td>
                </tr>

                {/* Partial payment breakdown */}
                {paymentType === 'partial' && !isWalkin && (
                  <>
                    <tr className="os-ft-divider-row">
                      <td colSpan={3}><div className="os-ft-divider os-ft-divider-dashed" /></td>
                    </tr>
                    <tr className="os-ft-paid">
                      <td className="os-ft-label">Initial Payment</td>
                      <td className="os-ft-desc">Down payment received</td>
                      <td className="os-ft-amount os-ft-pos">{fmt(initialPaymentAmount)}</td>
                    </tr>

                    {balancePaidAmount > 0 && (
                      <tr className="os-ft-paid">
                        <td className="os-ft-label">Balance Settled</td>
                        <td className="os-ft-desc">Remaining balance paid</td>
                        <td className="os-ft-amount os-ft-pos">{fmt(balancePaidAmount)}</td>
                      </tr>
                    )}
                  </>
                )}

                {/* Full payment received */}
                {paymentType === 'full' && !isWalkin && (
                  <>
                    <tr className="os-ft-divider-row">
                      <td colSpan={3}><div className="os-ft-divider os-ft-divider-dashed" /></td>
                    </tr>
                    <tr className="os-ft-paid">
                      <td className="os-ft-label">Amount Paid</td>
                      <td className="os-ft-desc">Full payment</td>
                      <td className="os-ft-amount os-ft-pos">{fmt(initialPaymentAmount || totalAmount)}</td>
                    </tr>
                  </>
                )}

                {/* Walk-in */}
                {isWalkin && (
                  <>
                    <tr className="os-ft-divider-row">
                      <td colSpan={3}><div className="os-ft-divider os-ft-divider-dashed" /></td>
                    </tr>
                    <tr className="os-ft-paid">
                      <td className="os-ft-label">Amount Paid</td>
                      <td className="os-ft-desc">Paid over the counter</td>
                      <td className="os-ft-amount os-ft-pos">{fmt(totalAmount)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* Remaining Balance Highlight */}
            {!isWalkin && computedRemainingBalance > 0 && (
              <div className="os-balance-box">
                <div className="os-balance-left">
                  <AlertCircle size={20} />
                  <div>
                    <p className="os-balance-label">REMAINING BALANCE DUE</p>
                    <p className="os-balance-note">Please settle before your travel date</p>
                  </div>
                </div>
                <span className="os-balance-amount">{fmt(computedRemainingBalance)}</span>
              </div>
            )}

            {/* Fully Settled Confirmation */}
            {(isWalkin || computedRemainingBalance <= 0) && (
              <div className="os-settled-box">
                <CheckCircle size={18} />
                <span>This booking is fully settled — no outstanding balance.</span>
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="os-slip-footer">
            <div className="os-footer-left">
              <p className="os-footer-brand">WanderWave Travel & Tours</p>
              <p className="os-footer-sub">Thank you for booking with us! 🌊</p>
            </div>
            <div className="os-footer-right">
              <p className="os-footer-ref">Ref: <span className="os-mono">{referenceNumber || 'N/A'}</span></p>
              <p className="os-footer-status" style={{ color: statusMeta.color }}>{statusMeta.label}</p>
            </div>
          </div>

          {/* Watermark for pending/cancelled */}
          {(status === 'pending' || status === 'cancelled') && (
            <div className={`os-watermark os-watermark-${status}`}>
              {status === 'pending' ? 'PENDING' : 'CANCELLED'}
            </div>
          )}

        </div>
        {/* end .os-slip */}

      </div>
    </div>
  );
};

export default OrderSlipModal;