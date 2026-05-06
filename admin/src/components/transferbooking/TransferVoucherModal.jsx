import React, { useRef, useState } from 'react';
import {
  X, Download, Printer, Phone, Mail, MapPin,
  ArrowRight, ArrowLeftRight, Clock, Navigation
} from 'lucide-react';
import './VoucherPreviewModal.css';
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
const TransferVoucherModal = ({ booking, onClose }) => {
  const voucherRef    = useRef(null);
  const [busy, setBusy] = useState(false);

  if (!booking) return null;

  const b = booking.rawData || booking;

  const {
    _id, activityName, destination, category,
    transferType, travelDate, returnDate,
    arrivalTime, departureTime,
    pickupLocation, dropoffLocation,
    fullName, email, phone, message, specialRequests,
    passengerCount,
    oneWayPrice, roundtripPrice, sellingPrice, totalAmount,
    currency, paymentType, initialPaymentAmount, remainingBalance,
    paymentStatus, status, promoCode,
    supplierName, pax, createdByType, createdAt,
  } = b;

  const bookingId   = booking.id || _id;
  const isRoundtrip = transferType === 'roundtrip';
  const wcStatus    = (status || 'pending').toLowerCase();
  const showMark    = wcStatus === 'pending' || wcStatus === 'cancelled';

  const balance = paymentType === 'partial'
    ? Math.max(0, (totalAmount || 0) - (initialPaymentAmount || 0))
    : (wcStatus === 'confirmed' || wcStatus === 'completed' ? 0 : (totalAmount || 0));

  /* ── PDF ── */
  const handleDownloadPDF = async () => {
    if (!voucherRef.current) return;
    setBusy(true);
    try {
      const pages = voucherRef.current.querySelectorAll('.voucher-page');
      const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2, useCORS: true, logging: false,
          backgroundColor: '#ffffff', windowWidth: 1200,
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      }
      pdf.save(`WanderWave_Transfer_Voucher_${(fullName || 'Booking').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  /* ── Print ── */
  const handlePrint = () => {
    const node = voucherRef.current;
    if (!node) return;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML).join('\n');
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { window.print(); return; }
    win.document.write(`<!DOCTYPE html><html lang="en"><head>
      <meta charset="UTF-8"/>
      <title>Transfer Voucher — ${bookingId}</title>
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
              🎫 Transfer Voucher Preview
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

        {/* VOUCHER CONTENT */}
        <div className="voucher-content-wrapper">
          <div className="voucher-document" ref={voucherRef}>

            {/* ══════════════════════════════════════════════
                PAGE 1 — CLIENT + TRIP DETAILS + PAYMENT
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
                  </div>
                  <div className="header-right">
                    <h1 className="header-brand">TRAVEL</h1>
                    <div className="header-sub-brand">VOUCHER</div>
                    <div className="header-date-box">
                      <span className="header-date-label">Travel Date</span>
                      <h2 className="header-date-value">{fmtDate(travelDate)}</h2>
                    </div>
                  </div>
                </div>

                {/* Transfer + Payment summary table */}
                <div className="voucher-section">
                  <div className="table-responsive">
                    <table className="voucher-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>TRANSFER SERVICE</th>
                          <th>TRIP TYPE</th>
                          <th>PASSENGERS</th>
                          <th>SELLING PRICE</th>
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
                              fontSize: '11px', fontWeight: '700',
                            }}>
                              {isRoundtrip ? '🔄 Round Trip' : '➡️ One Way'}
                            </span>
                          </td>
                          <td>{passengerCount || 1} pax</td>
                          <td><strong>{fmt(sellingPrice || totalAmount || 0)}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Payment summary table (green) */}
                  <div className="table-responsive" style={{ marginTop: 12 }}>
                    <table className="voucher-table voucher-table-payment">
                      <thead>
                        <tr>
                          <th>TOTAL AMOUNT</th>
                          <th>TOTAL DOWN PAYMENT</th>
                          <th>AMOUNT DUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{fmt(totalAmount)}</td>
                          <td>{fmt(paymentType === 'partial' ? initialPaymentAmount : totalAmount)}</td>
                          <td>{fmt(balance)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Balance due schedule */}
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
                              <th>BALANCE</th>
                              <th>DUE DATE</th>
                              <th>DUE AMOUNT</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{fmt(balance)}</td>
                              <td>{fmtDate(travelDate)}</td>
                              <td style={{ fontWeight: 'bold', color: '#dc2626' }}>{fmt(balance)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
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

            {/* ══════════════════════════════════════════════
                PAGE 2 — ROUTE DETAILS + TERMS
            ══════════════════════════════════════════════ */}
            <div className="voucher-page" style={{ position: 'relative' }}>
              {showMark && (
                <div className={`os-watermark ${wcStatus === 'cancelled' ? 'os-watermark-cancelled' : ''}`}>
                  {wcStatus === 'pending' ? 'PENDING' : 'CANCELLED'}
                </div>
              )}

              <div className="voucher-body-content">
                <div className="voucher-section">

                  {/* Route & Schedule */}
                  <div className="voucher-section-header">
                    <h2 className="voucher-section-title">Route & Schedule</h2>
                    <div className="voucher-section-brand">WANDERWAVE</div>
                  </div>

                  {/* Route visual */}
                  <div style={{
                    display: 'flex', alignItems: 'stretch', gap: 0,
                    margin: '0 0 20px', borderRadius: '12px', overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                  }}>
                    {/* Pickup */}
                    <div style={{
                      flex: 1, background: '#eff6ff', padding: '20px 24px',
                    }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                        📍 PICKUP LOCATION
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>
                        {pickupLocation || 'N/A'}
                      </div>
                      {arrivalTime && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0284c7', fontWeight: 600 }}>
                          <Clock size={13} />
                          <span>Arrival Time: <strong>{arrivalTime}</strong></span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', marginTop: 4 }}>
                        <span>📅 Travel Date: <strong>{fmtDate(travelDate)}</strong></span>
                      </div>
                    </div>

                    {/* Arrow divider */}
                    <div style={{
                      width: 48, background: '#1e3a8a',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                      color: 'white',
                    }}>
                      {isRoundtrip
                        ? <><ArrowRight size={16} /><ArrowLeftRight size={16} /></>
                        : <ArrowRight size={18} />}
                    </div>

                    {/* Dropoff */}
                    <div style={{
                      flex: 1, background: '#f0fdf4', padding: '20px 24px',
                    }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                        🏁 {isRoundtrip ? 'DROPOFF / RETURN' : 'DROPOFF LOCATION'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>
                        {isRoundtrip ? (dropoffLocation || 'N/A') : (destination || 'Destination')}
                      </div>
                      {isRoundtrip && departureTime && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                          <Clock size={13} />
                          <span>Departure Time: <strong>{departureTime}</strong></span>
                        </div>
                      )}
                      {isRoundtrip && returnDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', marginTop: 4 }}>
                          <span>📅 Return Date: <strong>{fmtDate(returnDate)}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional info */}
                  <div className="voucher-box">
                    <h3 className="voucher-box-title">BOOKING INFORMATION</h3>
                    <ul className="voucher-list">
                      <li>
                        <span className="icon-check">✓</span>
                        Transfer Service: <strong>{activityName || 'Transfer'}</strong>
                      </li>
                      <li>
                        <span className="icon-check">✓</span>
                        Trip Type: <strong>{isRoundtrip ? 'Round Trip' : 'One Way'}</strong>
                      </li>
                      <li>
                        <span className="icon-check">✓</span>
                        Passengers: <strong>{passengerCount || 1}</strong>
                      </li>
                      {category && (
                        <li>
                          <span className="icon-check">✓</span>
                          Category: <strong>{category}</strong>
                        </li>
                      )}
                      {supplierName && (
                        <li>
                          <span className="icon-check">✓</span>
                          Supplier: <strong>{supplierName}</strong>
                        </li>
                      )}
                      {destination && (
                        <li>
                          <span className="icon-check">✓</span>
                          Destination: <strong>{destination}</strong>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Special requests */}
                  {(specialRequests || message) && (
                    <div className="voucher-note">
                      <strong>📝 Special Requests / Notes:</strong>{' '}
                      {[specialRequests, message].filter(Boolean).join(' | ')}
                    </div>
                  )}

                  {/* Terms */}
                  <div className="voucher-section-header" style={{ marginTop: 30 }}>
                    <h2 className="voucher-section-title">Terms & Conditions</h2>
                    <div className="voucher-section-brand">WANDERWAVE</div>
                  </div>

                  <div className="voucher-box">
                    <h3 className="voucher-box-title">CANCELLATION & REFUND POLICY</h3>
                    <p style={{ padding: '20px', margin: 0, lineHeight: 1.6, color: '#475569' }}>
                      Please note that <strong style={{ color: '#ef4444' }}>NO</strong> cancellations or
                      modifications are allowed once your booking is confirmed.{' '}
                      <strong style={{ color: '#ef4444' }}>NO</strong> refunds will be provided if the
                      transfer has commenced or in cases of no-show or on-the-spot cancellations.
                    </p>
                  </div>

                  <div className="voucher-box">
                    <h3 className="voucher-box-title">IMPORTANT REMINDERS</h3>
                    <ol className="voucher-terms-list">
                      <li>This voucher is valid only for the specified transfer service and details stated above.</li>
                      <li>Please be at the pickup location at least <strong>10–15 minutes before</strong> the scheduled time.</li>
                      <li>Valid photo ID required (Passport, Driver's License, etc.)</li>
                      <li>This voucher is non-transferable, non-endorsable, and non-refundable.</li>
                      <li>WanderWave Travel & Tours is not liable for delays caused by traffic or unforeseen road conditions.</li>
                      <li>Personal expenses not mentioned in the service scope will be charged separately.</li>
                      <li>WanderWave Travel & Tours is not liable for circumstances beyond control (force majeure).</li>
                    </ol>
                  </div>

                  <div className="voucher-alert" style={{ marginTop: 12 }}>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      <li>This voucher is an official document from WanderWave Travel & Tours. Please keep it safe.</li>
                      <li>Present this voucher to the assigned driver or transport coordinator upon pickup.</li>
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

export default TransferVoucherModal;
