import React, { useState, useRef } from 'react';
import { X, Download, Printer, Phone, Mail, MapPin } from 'lucide-react';
import './VoucherPreviewModal.css';   // ← reuse ALL voucher styles
import './OrderSlipModal.css';        // ← order-slip-only overrides
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/* ─────────────────────────────────────────────
   HELPERS  (mirrors the Mongoose schema methods)
───────────────────────────────────────────── */
const fmt = (n) =>
  `₱ ${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getPaymentStatusDescription = (b) => {
  const {
    paymentType, status, initialPaymentPaid,
    balancePaidAmount = 0, totalAmount = 0,
    initialPaymentAmount = 0, remainingBalance = 0,
    balancePaymentPaid, isWalkin,
  } = b;
  if (isWalkin) return 'Paid — Walk-in / Over the Counter';
  if (paymentType === 'full') {
    if (status === 'confirmed' || status === 'fully_paid' || initialPaymentPaid) return 'Paid in Full';
    return 'Pending Payment';
  }
  const totalPaid = initialPaymentAmount + balancePaidAmount;
  const paidViaCheckout = initialPaymentPaid && balancePaymentPaid;
  if (totalPaid >= totalAmount || paidViaCheckout) return 'Fully Paid';
  if ((initialPaymentAmount > 0 || initialPaymentPaid) && balancePaidAmount === 0)
    return `Partial Paid — ${fmt(remainingBalance)} remaining`;
  return 'Pending Payment';
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const OrderSlipModal = ({ booking, onClose }) => {
  const slipRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!booking) return null;

  const raw = booking.rawData || booking;

  const {
    referenceNumber, fullName, email,
    packageName, startDate, endDate, duration,
    pax = {}, selectedRoomType, hotelName, numberOfRooms,
    isCustomized, customizedInclusions = [], originalInclusions = [],
    includesAirfare, flightDetails = {},
    packageTotal, customizationAdditionalPrice = 0,
    airfareTotal = 0, promoCode, discountAmount = 0,
    totalAmount = 0, paymentType,
    initialPaymentAmount = 0, remainingBalance = 0, balancePaidAmount = 0,
    passengers = [], status, createdAt, isWalkin,
    appointmentDate, appointmentTime, destination,
    addOns = {},
    initialPaymentPaid = false,
    createdByType,
  } = raw;

  const bookingId   = booking.id || raw._id;
  const paymentDesc = getPaymentStatusDescription(raw);

  // Fix: for full-payment bookings that haven't been confirmed yet (e.g. sales-created),
  // show the full amount as balance due instead of treating it as settled.
  const isActuallyPaid = status === 'confirmed' || status === 'fully_paid' || initialPaymentPaid === true;
  const computedBal = isWalkin ? 0
    : paymentType === 'partial'
      ? Math.max(0, totalAmount - initialPaymentAmount - balancePaidAmount)
      : isActuallyPaid
        ? 0
        : totalAmount;

  // Inclusions
  let inclusions = [];
  if (isCustomized && customizedInclusions.length > 0) {
    inclusions = customizedInclusions.filter((i) => i.isChecked !== false);
  } else if (originalInclusions.length > 0) {
    inclusions = originalInclusions.map((name) => ({ name, isOriginal: true, price: 0 }));
  }

  // Guest list
  const guestList = passengers.length > 0
    ? passengers.map((p) => ({
        name:        `${p.firstName || ''} ${p.lastName || ''}`.trim() || fullName,
        age:         p.age ?? '—',
        gender:      p.gender || '—',
        nationality: p.nationality || '—',
        contact:     p.phone || p.email || '—',
      }))
    : [{ name: fullName || booking.customerName, age: '—', gender: '—', nationality: '—', contact: email || '—' }];

  /* ── PDF download ── */
  const handleDownloadPDF = async () => {
    if (!slipRef.current) return;
    setIsGenerating(true);
    try {
      const pages = slipRef.current.querySelectorAll('.voucher-page');
      const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2, useCORS: true, logging: false,
          backgroundColor: '#ffffff', windowWidth: 1200,
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      }
      pdf.save(`WanderWave_OrderSlip_${(fullName || 'Booking').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Print ── */
  const handlePrint = () => {
    const node = slipRef.current;
    if (!node) return;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML).join('\n');
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { window.print(); return; }
    win.document.write(`<!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8"/>
      <title>Order Slip — ${referenceNumber || 'WanderWave'}</title>
      <style>@page{size:A4 portrait;margin:0;}html,body{margin:0;padding:0;background:white;}</style>
      ${styles}
    </head><body>${node.outerHTML}
    <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
    </body></html>`);
    win.document.close();
  };

  const wcStatus      = (status || '').toLowerCase();
  const showWatermark = wcStatus === 'pending' || wcStatus === 'cancelled';

  /* ── Status banner colors ── */
  const statusColors = {
    confirmed:  { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    fully_paid: { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    pending:    { bg: '#fffbeb', border: '#fcd34d', color: '#b45309' },
    cancelled:  { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
  };
  const sColor = statusColors[wcStatus] || statusColors.pending;

  /* ───────────────────────── RENDER ───────────────────────── */
  return (
    <div className="voucher-modal-overlay" onClick={onClose}>
      <div className="voucher-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* ACTION BAR */}
        <div className="voucher-action-bar">
          <div className="voucher-action-left">
            <h2 className="voucher-action-title">
              🧾 Order Slip Preview
            </h2>
          </div>
          <div className="voucher-action-buttons">
            <button
              className="voucher-btn voucher-btn-download"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
            >
              <Download size={16} />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </button>
            <button className="voucher-btn voucher-btn-print" onClick={handlePrint}>
              <Printer size={16} /> Print
            </button>
            <button className="voucher-btn voucher-btn-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* SLIP CONTENT */}
        <div className="voucher-content-wrapper">
          <div className="voucher-document" ref={slipRef}>

            {/* ══════════════════════════════════════════════════
                PAGE 1 — CLIENT INFO + FINANCIAL BREAKDOWN
            ══════════════════════════════════════════════════ */}
            <div className="voucher-page" style={{ position: 'relative' }}>
              {showWatermark && (
                <div className={`os-watermark ${wcStatus === 'cancelled' ? 'os-watermark-cancelled' : ''}`}>
                  {wcStatus === 'pending' ? 'PENDING' : 'CANCELLED'}
                </div>
              )}

              {/* Hero header image */}
              <div className="voucher-header-compact">
                <img
                  src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/693901f6169a42de3b07d6c6.jpeg"
                  alt="WanderWave"
                  className="voucher-header-img"
                  crossOrigin="anonymous"
                />
                <div className="voucher-header-overlay" />
              </div>

              <div className="voucher-body-content">

                {/* Client info + brand header */}
                <div className="simple-header-container">
                  <div className="header-left">
                    <span className="header-label">Issued To:</span>
                    <h2 className="header-client-name">{fullName || booking.customerName}</h2>
                    <p className="header-text">{email || booking.email}</p>
                    <p className="header-invoice">Ref No.: {referenceNumber || 'N/A'}</p>
                    <p className="header-invoice">Booking ID: {bookingId}</p>
                    <p className="header-invoice">Date Issued: {fmtDate(createdAt || new Date())}</p>
                    <p className="header-invoice">Type: {isWalkin ? 'Walk-in / Counter' : 'Online Booking'}</p>
                  </div>
                  <div className="header-right">
                    <h1 className="header-brand">ORDER</h1>
                    <div className="header-sub-brand">SLIP</div>
                    <div className="header-date-box">
                      <span className="header-date-label">Travel Date</span>
                      <h2 className="header-date-value">{fmtDate(startDate)}</h2>
                    </div>
                  </div>
                </div>

                {/* Status Banner */}
                <div className="voucher-section" style={{ paddingTop: 0 }}>
                  <div
                    className="os-status-banner"
                    style={{ background: sColor.bg, borderColor: sColor.border, color: sColor.color }}
                  >
                    <span className="os-status-text">
                      {isWalkin
                        ? '✅ Walk-in booking — Paid over the counter.'
                        : paymentType === 'full'
                        ? '✅ Full payment plan selected.'
                        : `💳 Partial payment plan — ${paymentDesc}`}
                    </span>
                    <span
                      className="os-status-type"
                      style={{ background: sColor.color + '18', color: sColor.color }}
                    >
                      {(status || 'pending').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* ── TRIP SUMMARY ── */}
                <div className="voucher-section">
                  <div className="voucher-section-header">
                    <h2 className="voucher-section-title">Trip Details</h2>
                    <div className="voucher-section-brand">WANDERWAVE</div>
                  </div>

                  <div className="table-responsive">
                    <table className="voucher-table">
                      <thead>
                        <tr>
                          <th>PACKAGE</th>
                          <th>DESTINATION</th>
                          <th>DURATION</th>
                          <th>RETURN DATE</th>
                          <th>PAX</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>{packageName || booking.packageName}</strong></td>
                          <td>{destination || booking.destination || 'Philippines'}</td>
                          <td>{duration || '—'}</td>
                          <td>{fmtDate(endDate)}</td>
                          <td>
                            {pax.adult || 1} adult{(pax.adult || 1) > 1 ? 's' : ''}
                            {pax.children > 0 ? `, ${pax.children} child` : ''}
                            {pax.infants > 0 ? `, ${pax.infants} infant` : ''}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {hotelName && (
                    <div className="voucher-info-note" style={{ marginTop: '8px' }}>
                      🏨 <strong>Hotel:</strong> {hotelName}
                      {selectedRoomType ? ` — ${selectedRoomType}` : ''}
                      {numberOfRooms ? ` (${numberOfRooms} room${numberOfRooms > 1 ? 's' : ''})` : ''}
                    </div>
                  )}

                  {isWalkin && (appointmentDate || appointmentTime) && (
                    <div className="voucher-info-note" style={{ marginTop: '8px' }}>
                      📅 <strong>Appointment:</strong>{' '}
                      {appointmentDate && fmtDate(appointmentDate)}
                      {appointmentDate && appointmentTime && ' — '}
                      {appointmentTime}
                    </div>
                  )}
                </div>

                {/* ── GUEST LIST ── */}
                <div className="voucher-section">
                  <div className="table-responsive">
                    <table className="voucher-table os-pax-table">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>#</th>
                          <th style={{ width: '30%' }}>NAME OF GUESTS</th>
                          <th>AGE</th>
                          <th>GENDER</th>
                          <th>NATIONALITY</th>
                          <th>CONTACT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guestList.map((g, i) => (
                          <tr key={i} className={i % 2 === 1 ? 'os-pax-even' : ''}>
                            <td className="os-pax-num">{i + 1}</td>
                            <td className="os-pax-name"><strong>{g.name}</strong></td>
                            <td>{g.age}</td>
                            <td>{g.gender}</td>
                            <td>{g.nationality}</td>
                            <td className="os-pax-contact">{g.contact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>



              </div>

              {/* Footer */}
              <div className="voucher-page-footer">
                <div className="voucher-footer-bar">
                  <div className="voucher-footer-contacts">
                    <span><Phone size={14} /> +63 966 820 0292</span>
                    <span><Mail size={14} /> info@wanderwavetravelandtours.com</span>
                    <span><MapPin size={14} /> Nueva Ecija, Philippines</span>
                  </div>
                </div>
                <div className="voucher-footer-bottom">
                  <span>© 2026 Wanderwave Travel and Tours</span>
                  <span className="voucher-page-number">Page 1</span>
                </div>
              </div>
            </div>
            {/* END PAGE 1 */}

            {/* ══════════════════════════════════════════════════
                PAGE 2 — INCLUSIONS + FLIGHT DETAILS
            ══════════════════════════════════════════════════ */}
            <div className="voucher-page" style={{ position: 'relative' }}>
              {showWatermark && (
                <div className={`os-watermark ${wcStatus === 'cancelled' ? 'os-watermark-cancelled' : ''}`}>
                  {wcStatus === 'pending' ? 'PENDING' : 'CANCELLED'}
                </div>
              )}

              <div className="voucher-body-content">
                <div className="voucher-section">

                  {/* ── FINANCIAL TOTALS (moved from Page 1 to avoid cutoff) ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ height: '2px', flex: 1, background: '#e2e8f0' }} />
                    <h3 style={{ color: '#1e3a8a', fontFamily: 'Brush Script MT, cursive', fontSize: '26px', margin: 0 }}>
                      Financial Breakdown
                    </h3>
                    <div style={{ height: '2px', flex: 1, background: '#e2e8f0' }} />
                  </div>

                  {/* Itemized breakdown */}
                  <div className="table-responsive">
                    <table className="voucher-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>DESCRIPTION</th>
                          <th>DETAILS</th>
                          <th style={{ textAlign: 'right' }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Package Rate</strong></td>
                          <td style={{ color: '#64748b', fontSize: '12px' }}>{packageName || booking.packageName}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700' }}>{fmt(packageTotal || totalAmount)}</td>
                        </tr>
                        {isCustomized && customizationAdditionalPrice > 0 && (
                          <tr>
                            <td>Customization Add-ons</td>
                            <td style={{ color: '#64748b', fontSize: '12px' }}>Additional inclusions</td>
                            <td style={{ textAlign: 'right', color: '#0369a1' }}>+{fmt(customizationAdditionalPrice)}</td>
                          </tr>
                        )}
                        {includesAirfare && airfareTotal > 0 && (
                          <tr>
                            <td>Airfare</td>
                            <td style={{ color: '#64748b', fontSize: '12px' }}>
                              {flightDetails?.airline
                                ? `${flightDetails.airline} ${flightDetails.flightNumber || ''}`
                                : 'Flight included'}
                            </td>
                            <td style={{ textAlign: 'right', color: '#0369a1' }}>+{fmt(airfareTotal)}</td>
                          </tr>
                        )}
                        {(() => {
                          const addOnsTotal = addOns?.addOnsTotal || 0;
                          const hasTours = Array.isArray(addOns?.tours) && addOns.tours.length > 0;
                          const hasTransfers = Array.isArray(addOns?.transfers) && addOns.transfers.length > 0;
                          if (addOnsTotal <= 0 && !hasTours && !hasTransfers) return null;
                          const itemCount = (addOns?.tours?.length || 0) + (addOns?.transfers?.length || 0);
                          return (
                            <tr>
                              <td>Add-Ons</td>
                              <td style={{ color: '#64748b', fontSize: '12px' }}>
                                {itemCount} item{itemCount !== 1 ? 's' : ''} (tours &amp; transfers)
                              </td>
                              <td style={{ textAlign: 'right', color: '#0369a1' }}>+{fmt(addOnsTotal)}</td>
                            </tr>
                          );
                        })()}
                        {promoCode && discountAmount > 0 && (
                          <tr>
                            <td>Promo Discount</td>
                            <td style={{ color: '#64748b', fontSize: '12px' }}>Code: {promoCode}</td>
                            <td style={{ textAlign: 'right', color: '#dc2626' }}>−{fmt(discountAmount)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Total + paid summary — green table */}
                  <div className="table-responsive">
                    <table className="voucher-table voucher-table-payment">
                      <thead>
                        <tr>
                          <th>TOTAL AMOUNT</th>
                          <th>AMOUNT PAID</th>
                          <th>BALANCE DUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{fmt(totalAmount)}</td>
                          <td>
                            {isWalkin
                              ? fmt(totalAmount)
                              : paymentType === 'full'
                              ? fmt(initialPaymentAmount || totalAmount)
                              : fmt(initialPaymentAmount + balancePaidAmount)}
                          </td>
                          <td style={{ color: computedBal > 0 ? '#dc2626' : '#047857' }}>
                            {computedBal > 0 ? fmt(computedBal) : '₱ 0.00 — Fully Settled'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Balance or settled box */}
                  {computedBal > 0 && !isWalkin ? (
                    <div className="os-balance-box" style={{ marginTop: '12px' }}>
                      <div className="os-balance-left">
                        <div>
                          <p className="os-balance-label">Outstanding Balance</p>
                          <p className="os-balance-note">
                            Please settle on or before your travel date ({fmtDate(startDate)}).
                          </p>
                        </div>
                      </div>
                      <div className="os-balance-amount">{fmt(computedBal)}</div>
                    </div>
                  ) : (
                    <div className="os-settled-box" style={{ marginTop: '12px' }}>
                      ✅ Payment fully settled — Thank you!
                    </div>
                  )}

                  {/* Payment schedule when balance is due */}
                  {computedBal > 0 && !isWalkin && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0 10px' }}>
                        <div style={{ height: '2px', flex: 1, background: '#e2e8f0' }} />
                        <h3 style={{ color: '#1e3a8a', fontFamily: 'Brush Script MT, cursive', fontSize: '22px', margin: 0 }}>
                          Payment Schedule
                        </h3>
                        <div style={{ height: '2px', flex: 1, background: '#e2e8f0' }} />
                      </div>
                      <div className="table-responsive">
                        <table className="voucher-table">
                          <thead>
                            <tr>
                              <th>PAYMENT TYPE</th>
                              <th>DUE DATE</th>
                              <th style={{ textAlign: 'right' }}>DUE AMOUNT</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Remaining Balance</td>
                              <td>{fmtDate(startDate)} (on or before travel date)</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>
                                {fmt(computedBal)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                </div>
                <div className="voucher-section">

                  {/* Inclusions */}
                  <div className="voucher-section-header">
                    <h2 className="voucher-section-title">
                      {isCustomized ? 'Customized Inclusions' : 'Package Inclusions'}
                    </h2>
                    <div className="voucher-section-brand">WANDERWAVE</div>
                  </div>

                  {inclusions.length > 0 ? (
                    <div className="voucher-box">
                      <h3 className="voucher-box-title">
                        {isCustomized
                          ? `CUSTOMIZED INCLUSIONS (${inclusions.length} items)`
                          : 'INCLUSIONS'}
                      </h3>
                      <div className="os-inclusions-grid" style={{ padding: '15px 20px' }}>
                        {inclusions.map((inc, i) => {
                          const name    = typeof inc === 'string' ? inc : inc.name;
                          const price   = typeof inc === 'object' ? inc.price : 0;
                          const isAdded = typeof inc === 'object' && !inc.isOriginal;
                          return (
                            <div key={i} className={`os-inclusion-item ${isAdded ? 'os-inclusion-added' : ''}`}>
                              <span className="os-inclusion-check">✓</span>
                              <span className="os-inclusion-name">{name}</span>
                              {isAdded && price > 0 && (
                                <span className="os-inclusion-price">+₱{Number(price).toLocaleString()}</span>
                              )}
                              {isAdded && (
                                <span className="os-inclusion-tag">Added</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="voucher-note">
                      No inclusions recorded for this booking. Please contact the agency.
                    </div>
                  )}

                  {/* Flight details (conditional) */}
                  {includesAirfare && flightDetails && (
                    <div className={`os-section os-section-flight`} style={{ marginTop: '20px' }}>
                      <div className="voucher-section-header" style={{ marginTop: 0 }}>
                        <h2 className="voucher-section-title">Flight Details</h2>
                        {flightDetails.isInternational && (
                          <span className="os-intl-badge">International</span>
                        )}
                      </div>
                      <div className="os-flight-grid">
                        <div className="os-flight-item">
                          <span className="os-flight-label">Airline</span>
                          <span className="os-flight-value">{flightDetails.airline || '—'}</span>
                        </div>
                        <div className="os-flight-item">
                          <span className="os-flight-label">Flight No.</span>
                          <span className="os-flight-value os-mono">{flightDetails.flightNumber || '—'}</span>
                        </div>
                        <div className="os-flight-item">
                          <span className="os-flight-label">Route</span>
                          <span className="os-flight-value">{flightDetails.route || '—'}</span>
                        </div>
                        <div className="os-flight-item">
                          <span className="os-flight-label">Departure</span>
                          <span className="os-flight-value">{flightDetails.departureTime || '—'}</span>
                        </div>
                        <div className="os-flight-item">
                          <span className="os-flight-label">Arrival</span>
                          <span className="os-flight-value">{flightDetails.arrivalTime || '—'}</span>
                        </div>
                        <div className="os-flight-item">
                          <span className="os-flight-label">Airfare Cost</span>
                          <span className="os-flight-value os-flight-price">
                            {flightDetails.price?.formatted || fmt(airfareTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reminder box */}
                  <div className="voucher-alert" style={{ marginTop: '20px' }}>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      <li>This order slip is an official record of your booking with WanderWave Travel & Tours.</li>
                      <li>Please present this slip upon check-in or when settling any remaining balance.</li>
                      {!isWalkin && computedBal > 0 && (
                        <li>
                          <strong>Outstanding balance of {fmt(computedBal)} must be settled before your travel date.</strong>
                        </li>
                      )}
                    </ul>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="voucher-page-footer">
                <div className="voucher-footer-bar">
                  <div className="voucher-footer-contacts">
                    <span><Phone size={14} /> +63 966 820 0292</span>
                    <span><Mail size={14} /> info@wanderwavetravelandtours.com</span>
                    <span><MapPin size={14} /> Nueva Ecija, Philippines</span>
                  </div>
                </div>
                <div className="voucher-footer-bottom">
                  <span>© 2026 Wanderwave Travel and Tours</span>
                  <span className="voucher-page-number">Page 2</span>
                </div>
              </div>
            </div>
            {/* END PAGE 2 */}

            {/* ══════════════════════════════════════════════════
                PAGE 3 — ADD-ONS (TOURS + TRANSFERS) — only if present
            ══════════════════════════════════════════════════ */}
            {(() => {
              const hasTours     = Array.isArray(addOns?.tours)     && addOns.tours.length > 0;
              const hasTransfers = Array.isArray(addOns?.transfers)  && addOns.transfers.length > 0;
              if (!hasTours && !hasTransfers) return null;

              return (
                <div className="voucher-page" style={{ position: 'relative' }}>
                  {showWatermark && (
                    <div className={`os-watermark ${wcStatus === 'cancelled' ? 'os-watermark-cancelled' : ''}`}>
                      {wcStatus === 'pending' ? 'PENDING' : 'CANCELLED'}
                    </div>
                  )}

                  <div className="voucher-body-content">
                    <div className="voucher-section">

                      {/* Section heading */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ height: '2px', flex: 1, background: '#e2e8f0' }} />
                        <h3 style={{ color: '#1e3a8a', fontFamily: 'Brush Script MT, cursive', fontSize: '26px', margin: 0 }}>
                          Add-Ons Details
                        </h3>
                        <div style={{ height: '2px', flex: 1, background: '#e2e8f0' }} />
                      </div>

                      {/* ── TOURS ── */}
                      {hasTours && (
                        <div className="voucher-box" style={{ marginBottom: '16px' }}>
                          <h3 className="voucher-box-title">🗺️ TOURS ({addOns.tours.length})</h3>
                          <div className="table-responsive">
                            <table className="voucher-table">
                              <thead>
                                <tr>
                                  <th>TOUR</th>
                                  <th>DESTINATION</th>
                                  <th>DURATION</th>
                                  <th>CATEGORY</th>
                                  <th>PAX</th>
                                  <th style={{ textAlign: 'right' }}>SUBTOTAL</th>
                                </tr>
                              </thead>
                              <tbody>
                                {addOns.tours.map((tour, i) => (
                                  <tr key={i} className={i % 2 === 1 ? 'os-pax-even' : ''}>
                                    <td><strong>{tour.title || '—'}</strong></td>
                                    <td>{tour.destination || '—'}</td>
                                    <td>{tour.duration || '—'}</td>
                                    <td>{tour.category || '—'}</td>
                                    <td>{tour.paxCount || 1} pax</td>
                                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                                      {fmt(tour.subtotal || 0)}
                                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>
                                        {fmt(tour.price || 0)} × {tour.paxCount || 1}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* ── TRANSFERS ── */}
                      {hasTransfers && (
                        <div className="voucher-box" style={{ marginBottom: '16px' }}>
                          <h3 className="voucher-box-title">🚐 TRANSFERS ({addOns.transfers.length})</h3>
                          <div className="table-responsive">
                            <table className="voucher-table">
                              <thead>
                                <tr>
                                  <th>TRANSFER</th>
                                  <th>TYPE</th>
                                  <th>TRAVEL DATE</th>
                                  <th>PICKUP / DROPOFF</th>
                                  <th>TIME</th>
                                  <th style={{ textAlign: 'right' }}>AMOUNT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {addOns.transfers.map((t, i) => (
                                  <tr key={i} className={i % 2 === 1 ? 'os-pax-even' : ''}>
                                    <td><strong>{t.title || '—'}</strong></td>
                                    <td>
                                      <span style={{
                                        background: t.transferType === 'roundtrip' ? '#eff6ff' : '#f0fdf4',
                                        color: t.transferType === 'roundtrip' ? '#1d4ed8' : '#15803d',
                                        padding: '2px 8px', borderRadius: '12px',
                                        fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap'
                                      }}>
                                        {t.transferType === 'roundtrip' ? '🔄 Roundtrip' : '➡️ One Way'}
                                      </span>
                                    </td>
                                    <td>
                                      {t.travelDate ? fmtDate(t.travelDate) : '—'}
                                      {t.transferType === 'roundtrip' && t.returnDate && (
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                          Return: {fmtDate(t.returnDate)}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <div>{t.pickupLocation || '—'}</div>
                                      {t.dropoffLocation && (
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                          ↓ {t.dropoffLocation}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <div>{t.arrivalTime || '—'}</div>
                                      {t.departureTime && (
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                          Dep: {t.departureTime}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                                      {fmt(t.subtotal || t.selectedPrice || 0)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {addOns.transfers.some(t => t.message) && (
                            <div style={{ padding: '10px 16px 4px', borderTop: '1px solid #e2e8f0' }}>
                              <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Special Requests:</p>
                              {addOns.transfers.filter(t => t.message).map((t, i) => (
                                <div key={i} style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                                  <strong>{t.title}:</strong> {t.message}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Add-Ons grand total */}
                      <div style={{
                        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                        gap: '20px', padding: '12px 16px',
                        background: '#f8fafc', borderRadius: '8px',
                        border: '1.5px solid #e2e8f0'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add-Ons Total</span>
                        <span style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
                          {fmt(addOns.addOnsTotal || 0)}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Footer */}
                  <div className="voucher-page-footer">
                    <div className="voucher-footer-bar">
                      <div className="voucher-footer-contacts">
                        <span><Phone size={14} /> +63 966 820 0292</span>
                        <span><Mail size={14} /> info@wanderwavetravelandtours.com</span>
                        <span><MapPin size={14} /> Nueva Ecija, Philippines</span>
                      </div>
                    </div>
                    <div className="voucher-footer-bottom">
                      <span>© 2026 Wanderwave Travel and Tours</span>
                      <span className="voucher-page-number">Page 3</span>
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* END PAGE 3 */}

          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderSlipModal;