import React, { useRef, useState } from 'react';
import {
  X, Download, Printer, Phone, Mail, MapPin,
  Car, ArrowRight, ArrowLeftRight, Clock, Calendar, Navigation
} from 'lucide-react';
import './VoucherPreviewModal.css';
import './OrderSlipModal.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const fmt = (n) =>
  `₱ ${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   Props:
     booking  — the raw TransferBookingOrder document
     onClose  — close handler
───────────────────────────────────────────── */
const TransferOrderSlipModal = ({ booking, onClose }) => {
  const slipRef      = useRef(null);
  const [busy, setBusy] = useState(false);

  if (!booking) return null;

  // Support both wrapped (booking.rawData) and direct document shapes
  const b = booking.rawData || booking;

  const {
    _id, activityName, bookingType, destination, category,
    transferType, travelDate, returnDate,
    arrivalTime, departureTime,
    pickupLocation, dropoffLocation,
    fullName, email, phone, message, specialRequests,
    passengerCount,
    oneWayPrice, roundtripPrice, sellingPrice, totalAmount,
    currency, paymentType,
    initialPaymentAmount, remainingBalance,
    paymentStatus, status, promoCode,
    supplierName, pax, createdByType, createdAt,
  } = b;

  const bookingId    = booking.id || _id;
  const isRoundtrip  = transferType === 'roundtrip';
  const currSym      = currency === 'PHP' ? '₱' : (currency || '₱');
  const wcStatus     = (status || 'pending').toLowerCase();
  const showMark     = wcStatus === 'pending' || wcStatus === 'cancelled';

  // Derived payment
  const paidAmount   = paymentType === 'partial'
    ? (initialPaymentAmount || 0)
    : (wcStatus === 'confirmed' || wcStatus === 'completed' ? (totalAmount || 0) : (initialPaymentAmount || 0));
  const balance      = paymentType === 'partial'
    ? Math.max(0, (totalAmount || 0) - (initialPaymentAmount || 0))
    : (wcStatus === 'confirmed' || wcStatus === 'completed' ? 0 : (totalAmount || 0));

  const statusColors = {
    confirmed:  { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    completed:  { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    pending:    { bg: '#fffbeb', border: '#fcd34d', color: '#b45309' },
    cancelled:  { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
  };
  const sColor = statusColors[wcStatus] || statusColors.pending;

  /* ── PDF ── */
  const handleDownloadPDF = async () => {
    if (!slipRef.current) return;
    setBusy(true);
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
      pdf.save(`WanderWave_Transfer_OrderSlip_${(fullName || 'Booking').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setBusy(false);
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
      <title>Transfer Order Slip — ${bookingId}</title>
      <style>@page{size:A4 portrait;margin:0;}html,body{margin:0;padding:0;background:white;}</style>
      ${styles}
    </head><body>${node.outerHTML}
    <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};}<\/script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div className="voucher-modal-overlay" onClick={onClose}>
      <div className="voucher-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* ACTION BAR */}
        <div className="voucher-action-bar">
          <div className="voucher-action-left">
            <h2 className="voucher-action-title">
              🧾 Transfer Order Slip Preview
            </h2>
          </div>
          <div className="voucher-action-buttons">
            <button
              className="voucher-btn voucher-btn-download"
              onClick={handleDownloadPDF}
              disabled={busy}
            >
              <Download size={16} />
              {busy ? 'Generating...' : 'Download PDF'}
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

            {/* ══════════════════════════════════════════════
                PAGE 1 — BOOKING DETAILS + ROUTE + PAYMENT
            ══════════════════════════════════════════════ */}
            <div className="voucher-page" style={{ position: 'relative' }}>
              {showMark && (
                <div className={`os-watermark ${wcStatus === 'cancelled' ? 'os-watermark-cancelled' : ''}`}>
                  {wcStatus === 'pending' ? 'PENDING' : 'CANCELLED'}
                </div>
              )}

              {/* Hero header */}
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

                {/* Client + brand header */}
                <div className="simple-header-container">
                  <div className="header-left">
                    <span className="header-label">Issued To:</span>
                    <h2 className="header-client-name">{fullName || 'N/A'}</h2>
                    <p className="header-text">{email || 'N/A'}</p>
                    {phone && <p className="header-text">{phone}</p>}
                    <p className="header-invoice">Booking ID: {bookingId}</p>
                    <p className="header-invoice">Date Issued: {fmtDate(createdAt || new Date())}</p>
                    <p className="header-invoice">
                      Type: {isRoundtrip ? 'Round Trip Transfer' : 'One Way Transfer'}
                    </p>
                    {supplierName && <p className="header-invoice">Supplier: {supplierName}</p>}
                  </div>
                  <div className="header-right">
                    <h1 className="header-brand">ORDER</h1>
                    <div className="header-sub-brand">SLIP</div>
                    <div className="header-date-box">
                      <span className="header-date-label">Travel Date</span>
                      <h2 className="header-date-value">{fmtDate(travelDate)}</h2>
                    </div>
                  </div>
                </div>

                {/* Status banner */}
                <div className="voucher-section" style={{ paddingTop: 0 }}>
                  <div
                    className="os-status-banner"
                    style={{ background: sColor.bg, borderColor: sColor.border, color: sColor.color }}
                  >
                    <span className="os-status-text">
                      {paymentType === 'full'
                        ? '✅ Full payment plan selected.'
                        : `💳 Partial payment plan — ${fmt(initialPaymentAmount || 0)} paid`}
                    </span>
                    <span
                      className="os-status-type"
                      style={{ background: sColor.color + '18', color: sColor.color }}
                    >
                      {(status || 'pending').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* ── TRANSFER SUMMARY ── */}
                <div className="voucher-section">
                  <div className="voucher-section-header">
                    <h2 className="voucher-section-title">Transfer Details</h2>
                    <div className="voucher-section-brand">WANDERWAVE</div>
                  </div>

                  <div className="table-responsive">
                    <table className="voucher-table">
                      <thead>
                        <tr>
                          <th>TRANSFER</th>
                          <th>TYPE</th>
                          <th>TRAVEL DATE</th>
                          {isRoundtrip && <th>RETURN DATE</th>}
                          <th>PASSENGERS</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>{activityName || 'Transfer'}</strong></td>
                          <td>
                            <span style={{
                              background: isRoundtrip ? '#eff6ff' : '#f0fdf4',
                              color: isRoundtrip ? '#1d4ed8' : '#15803d',
                              padding: '3px 10px', borderRadius: '12px',
                              fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap'
                            }}>
                              {isRoundtrip ? '🔄 Round Trip' : '➡️ One Way'}
                            </span>
                          </td>
                          <td>{fmtDate(travelDate)}</td>
                          {isRoundtrip && <td>{fmtDate(returnDate)}</td>}
                          <td>{passengerCount || 1} pax</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Route visual */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 0,
                    margin: '16px 0', padding: '18px 24px',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                    borderRadius: '12px', border: '1px solid #e2e8f0',
                  }}>
                    {/* FROM */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                        PICKUP FROM
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Navigation size={16} style={{ color: '#0284c7', flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                          {pickupLocation || 'N/A'}
                        </span>
                      </div>
                      {arrivalTime && (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> Arrival: {arrivalTime}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div style={{ padding: '0 20px', flexShrink: 0 }}>
                      {isRoundtrip
                        ? <ArrowLeftRight size={22} style={{ color: '#64748b' }} />
                        : <ArrowRight size={22} style={{ color: '#64748b' }} />}
                    </div>

                    {/* TO */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                        DROP-OFF AT
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                          {isRoundtrip ? (dropoffLocation || 'N/A') : (destination || 'Destination')}
                        </span>
                        <MapPin size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                      </div>
                      {isRoundtrip && departureTime && (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <Clock size={11} /> Departure: {departureTime}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle / Category info */}
                  {(category || pax) && (
                    <div className="voucher-info-note" style={{ marginTop: 8 }}>
                      🚗 {category && <><strong>Category:</strong> {category}{pax ? ' — ' : ''}</>}
                      {pax && <><strong>Vehicle/Pax Note:</strong> {pax}</>}
                    </div>
                  )}
                </div>

                {/* ── PASSENGER INFO ── */}
                <div className="voucher-section">
                  <div className="table-responsive">
                    <table className="voucher-table os-pax-table">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>#</th>
                          <th style={{ width: '35%' }}>PASSENGER NAME</th>
                          <th>EMAIL</th>
                          <th>PHONE</th>
                          <th>PAX COUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="os-pax-num">1</td>
                          <td className="os-pax-name"><strong>{fullName || 'N/A'}</strong></td>
                          <td className="os-pax-contact">{email || 'N/A'}</td>
                          <td className="os-pax-contact">{phone || 'N/A'}</td>
                          <td>{passengerCount || 1}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Special requests / message */}
                {(specialRequests || message) && (
                  <div className="voucher-section" style={{ paddingTop: 0 }}>
                    <div className="voucher-note">
                      <strong>📝 Notes:</strong>{' '}
                      {[specialRequests, message].filter(Boolean).join(' | ')}
                    </div>
                  </div>
                )}

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

            {/* ══════════════════════════════════════════════
                PAGE 2 — FINANCIAL BREAKDOWN
            ══════════════════════════════════════════════ */}
            <div className="voucher-page" style={{ position: 'relative' }}>
              {showMark && (
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
                      Financial Breakdown
                    </h3>
                    <div style={{ height: '2px', flex: 1, background: '#e2e8f0' }} />
                  </div>

                  {/* Itemized breakdown */}
                  <div className="table-responsive">
                    <table className="voucher-table">
                      <thead>
                        <tr>
                          <th style={{ width: '45%' }}>DESCRIPTION</th>
                          <th>DETAILS</th>
                          <th style={{ textAlign: 'right' }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {oneWayPrice > 0 && (
                          <tr>
                            <td><strong>One Way Rate</strong></td>
                            <td style={{ color: '#64748b', fontSize: '12px' }}>{activityName}</td>
                            <td style={{ textAlign: 'right', fontWeight: '700' }}>{fmt(oneWayPrice)}</td>
                          </tr>
                        )}
                        {roundtripPrice > 0 && (
                          <tr>
                            <td><strong>Round Trip Rate</strong></td>
                            <td style={{ color: '#64748b', fontSize: '12px' }}>{activityName}</td>
                            <td style={{ textAlign: 'right', fontWeight: '700' }}>{fmt(roundtripPrice)}</td>
                          </tr>
                        )}
                        {sellingPrice > 0 && sellingPrice !== oneWayPrice && sellingPrice !== roundtripPrice && (
                          <tr>
                            <td>Selling Price</td>
                            <td style={{ color: '#64748b', fontSize: '12px' }}>Applied rate for selected trip type</td>
                            <td style={{ textAlign: 'right', color: '#0369a1' }}>{fmt(sellingPrice)}</td>
                          </tr>
                        )}
                        {promoCode && (
                          <tr>
                            <td>Promo Code</td>
                            <td style={{ color: '#64748b', fontSize: '12px' }}>Code: {promoCode}</td>
                            <td style={{ textAlign: 'right', color: '#dc2626' }}>Applied</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals table (green) */}
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
                          <td>{fmt(paidAmount)}</td>
                          <td style={{ color: balance > 0 ? '#dc2626' : '#047857' }}>
                            {balance > 0 ? fmt(balance) : '₱ 0.00 — Fully Settled'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Balance / settled box */}
                  {balance > 0 ? (
                    <div className="os-balance-box" style={{ marginTop: '12px' }}>
                      <div className="os-balance-left">
                        <div>
                          <p className="os-balance-label">Outstanding Balance</p>
                          <p className="os-balance-note">
                            Please settle on or before your travel date ({fmtDate(travelDate)}).
                          </p>
                        </div>
                      </div>
                      <div className="os-balance-amount">{fmt(balance)}</div>
                    </div>
                  ) : (
                    <div className="os-settled-box" style={{ marginTop: '12px' }}>
                      ✅ Payment fully settled — Thank you!
                    </div>
                  )}

                  {/* Payment schedule if balance due */}
                  {balance > 0 && (
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
                              <td>{fmtDate(travelDate)} (on or before travel date)</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>
                                {fmt(balance)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* Payment details box */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0 10px' }}>
                    <div style={{ height: '2px', flex: 1, background: '#e2e8f0' }} />
                    <h3 style={{ color: '#1e3a8a', fontFamily: 'Brush Script MT, cursive', fontSize: '22px', margin: 0 }}>
                      Payment Details
                    </h3>
                    <div style={{ height: '2px', flex: 1, background: '#e2e8f0' }} />
                  </div>

                  <div style={{
                    background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden'
                  }}>
                    {[
                      ['Payment Type', paymentType === 'partial' ? 'Partial Payment' : 'Full Payment'],
                      ['Payment Status', (paymentStatus || 'pending').charAt(0).toUpperCase() + (paymentStatus || 'pending').slice(1)],
                      ['Currency', currency || 'PHP'],
                      ['Created By', (createdByType || 'customer').toUpperCase()],
                    ].map(([label, value]) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 16px', borderBottom: '1px solid #f1f5f9',
                        fontSize: 13,
                      }}>
                        <span style={{ color: '#64748b' }}>{label}</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Reminders */}
                  <div className="voucher-alert" style={{ marginTop: '20px' }}>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      <li>This order slip is an official record of your transfer booking with WanderWave Travel & Tours.</li>
                      <li>Please present this slip at the time of pickup or when settling any remaining balance.</li>
                      <li>Be at your pickup location at least 10 minutes before the scheduled time.</li>
                      {balance > 0 && (
                        <li>
                          <strong>Outstanding balance of {fmt(balance)} must be settled before your travel date.</strong>
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

          </div>
        </div>

      </div>
    </div>
  );
};

export default TransferOrderSlipModal;
