import React, { useRef, useState } from 'react';
import {
  X, Download, Printer, Phone, Mail, MapPin,
  ArrowRight, ArrowLeftRight, Clock, Navigation,
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
  const parsed = new Date(d);
  if (isNaN(parsed)) return d;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   Props:
     booking  — the selectedBooking object from CustomBooking
     onClose  — close handler
───────────────────────────────────────────── */
const CustomizedBookingVoucherModal = ({ booking, onClose }) => {
  const voucherRef      = useRef(null);
  const [busy, setBusy] = useState(false);

  if (!booking) return null;

  const raw = booking.rawData || booking;

  const fullName             = raw.fullName    || booking.customerName || 'N/A';
  const email                = raw.email       || booking.email        || 'N/A';
  const phone                = raw.phone       || '';
  const destination          = raw.destination || booking.destination  || 'N/A';
  const paxCount             = raw.paxCount    || booking.guests       || 1;
  const travelDate           = raw.travelDate  || booking.travelDate   || '';
  const returnDate           = raw.returnDate  || booking.returnDate   || '';
  const message              = raw.message     || raw.notes            || booking.message || '';
  const promoCode            = raw.promoCode   || '';
  const currency             = raw.currency    || 'PHP';
  const paymentType          = raw.paymentType || booking.paymentType  || 'full';
  const initialPaymentAmount = raw.initialPaymentAmount || booking.initialPaymentAmount || 0;
  const totalAmount          = raw.totalAmount    || booking.totalAmount    || 0;
  const toursTotal           = raw.toursTotal     || 0;
  const transfersTotal       = raw.transfersTotal || 0;
  const paymentStatus        = raw.paymentStatus  || 'pending';
  const status               = (raw.status || booking.status || 'pending').toLowerCase();
  const createdAt            = raw.createdAt      || booking.bookingDate || '';
  const referenceNumber      = raw.referenceNumber || booking.referenceNumber || '';

  const tours     = Array.isArray(raw.tours)     ? raw.tours     : [];
  const transfers = Array.isArray(raw.transfers) ? raw.transfers : [];

  const bookingId = booking.id || raw._id || '';
  const showMark  = status === 'pending' || status === 'cancelled';

  const balance = paymentType === 'partial'
    ? Math.max(0, totalAmount - initialPaymentAmount)
    : (status === 'confirmed' || status === 'completed' ? 0 : totalAmount);

  const downPayment = paymentType === 'partial' ? initialPaymentAmount : totalAmount;

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
      pdf.save(`WanderWave_Custom_Voucher_${(fullName).replace(/\s+/g, '_')}.pdf`);
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
      <title>Customized Booking Voucher — ${bookingId}</title>
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
              🎫 Customized Booking — Travel Voucher
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
                PAGE 1 — CLIENT INFO + SERVICES + PAYMENT
            ══════════════════════════════════════════════ */}
            <div className="voucher-page" style={{ position: 'relative' }}>
              {showMark && (
                <div className={`os-watermark ${status === 'cancelled' ? 'os-watermark-cancelled' : ''}`}>
                  {status === 'pending' ? 'PENDING' : 'CANCELLED'}
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
                    <h2 className="header-client-name">{fullName}</h2>
                    <p className="header-text">{email}</p>
                    {phone && <p className="header-text">{phone}</p>}
                    <p className="header-invoice">Booking ID: {bookingId}</p>
                    {referenceNumber && referenceNumber !== 'N/A' && (
                      <p className="header-invoice">Ref No.: {referenceNumber}</p>
                    )}
                    <p className="header-invoice">Date Issued: {fmtDate(createdAt || new Date())}</p>
                    <p className="header-invoice">Destination: {destination}</p>
                  </div>
                  <div className="header-right">
                    <h1 className="header-brand">TRAVEL</h1>
                    <div className="header-sub-brand">VOUCHER</div>
                    <div className="header-date-box">
                      <span className="header-date-label">Travel Date</span>
                      <h2 className="header-date-value">{fmtDate(travelDate)}</h2>
                    </div>
                    {returnDate && (
                      <div className="header-date-box" style={{ marginTop: 8 }}>
                        <span className="header-date-label">Return Date</span>
                        <h2 className="header-date-value" style={{ fontSize: 14 }}>{fmtDate(returnDate)}</h2>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services Summary Table */}
                <div className="voucher-section">
                  <div className="table-responsive">
                    <table className="voucher-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>SERVICE</th>
                          <th>TYPE</th>
                          <th>DATE</th>
                          <th>PAX</th>
                          <th style={{ textAlign: 'right' }}>PRICE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tours.map((t, i) => (
                          <tr key={`tour-${i}`}>
                            <td>
                              <strong>{t.title || 'Tour'}</strong>
                              {t.destination && (
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                  📍 {t.destination}
                                </div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                background: '#f0fdf4', color: '#15803d',
                                padding: '2px 8px', borderRadius: '10px',
                                fontSize: '11px', fontWeight: '700',
                              }}>
                                🗺️ Tour
                              </span>
                            </td>
                            <td style={{ fontSize: 12 }}>{t.scheduledDate ? fmtDate(t.scheduledDate) : fmtDate(travelDate)}</td>
                            <td>{t.paxCount || paxCount}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(t.subtotal || 0)}</td>
                          </tr>
                        ))}
                        {transfers.map((t, i) => (
                          <tr key={`transfer-${i}`}>
                            <td>
                              <strong>{t.title || 'Transfer'}</strong>
                              {(t.pickupLocation || t.category) && (
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                  {t.pickupLocation && `🚏 ${t.pickupLocation}`}
                                  {t.category && ` · ${t.category}`}
                                </div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                background: t.transferType === 'roundtrip' ? '#eff6ff' : '#fdf4ff',
                                color: t.transferType === 'roundtrip' ? '#1d4ed8' : '#7c3aed',
                                padding: '2px 8px', borderRadius: '10px',
                                fontSize: '11px', fontWeight: '700',
                              }}>
                                {t.transferType === 'roundtrip' ? '🔄 Roundtrip' : '➡️ One Way'}
                              </span>
                            </td>
                            <td style={{ fontSize: 12 }}>{t.travelDate ? fmtDate(t.travelDate) : fmtDate(travelDate)}</td>
                            <td>{t.passengerCount || paxCount}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(t.subtotal || t.selectedPrice || 0)}</td>
                          </tr>
                        ))}
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
                          <td>{fmt(downPayment)}</td>
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
                PAGE 2 — SERVICE DETAILS + TERMS
            ══════════════════════════════════════════════ */}
            <div className="voucher-page" style={{ position: 'relative' }}>
              {showMark && (
                <div className={`os-watermark ${status === 'cancelled' ? 'os-watermark-cancelled' : ''}`}>
                  {status === 'pending' ? 'PENDING' : 'CANCELLED'}
                </div>
              )}

              <div className="voucher-body-content">
                <div className="voucher-section">

                  {/* ── TOURS DETAIL ── */}
                  {tours.length > 0 && (
                    <>
                      <div className="voucher-section-header">
                        <h2 className="voucher-section-title">Tour Details</h2>
                        <div className="voucher-section-brand">WANDERWAVE</div>
                      </div>
                      {tours.map((t, i) => (
                        <div
                          key={`tour-detail-${i}`}
                          style={{
                            border: '1px solid #e2e8f0', borderRadius: 10,
                            overflow: 'hidden', marginBottom: 14,
                          }}
                        >
                          {/* Tour header */}
                          <div style={{
                            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                            padding: '14px 18px',
                            borderBottom: '1px solid #d1fae5',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 22 }}>🗺️</span>
                              <div>
                                <div style={{ fontWeight: 800, color: '#065f46', fontSize: 14 }}>
                                  {t.title || 'Tour'}
                                </div>
                                {t.category && (
                                  <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>{t.category}</div>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, color: '#059669', fontSize: 15 }}>
                                {fmt(t.subtotal || 0)}
                              </div>
                              {t.paxCount > 0 && (
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                  {t.paxCount} pax × {fmt(t.price || 0)}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Tour details */}
                          <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                            {[
                              ['Destination', t.destination || destination],
                              ['Duration', t.duration || 'N/A'],
                              ['Scheduled Date', t.scheduledDate ? fmtDate(t.scheduledDate) : fmtDate(travelDate)],
                              ['Pax Count', `${t.paxCount || paxCount} pax`],
                            ].map(([label, value]) => value && (
                              <div key={label}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                                  {label}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* ── TRANSFERS DETAIL ── */}
                  {transfers.length > 0 && (
                    <>
                      <div className="voucher-section-header" style={{ marginTop: tours.length > 0 ? 20 : 0 }}>
                        <h2 className="voucher-section-title">Transfer Details</h2>
                        <div className="voucher-section-brand">WANDERWAVE</div>
                      </div>
                      {transfers.map((t, i) => {
                        const isRoundtrip = t.transferType === 'roundtrip';
                        return (
                          <div
                            key={`transfer-detail-${i}`}
                            style={{
                              border: '1px solid #e2e8f0', borderRadius: 10,
                              overflow: 'hidden', marginBottom: 14,
                            }}
                          >
                            {/* Transfer header */}
                            <div style={{
                              background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
                              padding: '14px 18px',
                              borderBottom: '1px solid #bfdbfe',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 22 }}>🚐</span>
                                <div>
                                  <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: 14 }}>
                                    {t.title || 'Transfer'}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>
                                    {isRoundtrip ? '🔄 Roundtrip' : '➡️ One Way'}
                                    {t.category ? ` · ${t.category}` : ''}
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: 15 }}>
                                  {fmt(t.subtotal || t.selectedPrice || 0)}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                  {t.passengerCount || paxCount} pax
                                </div>
                              </div>
                            </div>

                            {/* Route visual */}
                            <div style={{
                              display: 'flex', alignItems: 'stretch', gap: 0,
                              margin: '12px 18px',
                              borderRadius: '10px', overflow: 'hidden',
                              border: '1px solid #e2e8f0',
                            }}>
                              {/* Pickup */}
                              <div style={{ flex: 1, background: '#eff6ff', padding: '14px 16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                                  📍 PICKUP
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>
                                  {t.pickupLocation || 'N/A'}
                                </div>
                                {t.arrivalTime && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                                    <Clock size={11} /> {t.arrivalTime}
                                  </div>
                                )}
                                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                                  📅 {t.travelDate ? fmtDate(t.travelDate) : fmtDate(travelDate)}
                                </div>
                              </div>
                              {/* Arrow */}
                              <div style={{
                                width: 36, background: '#1e3a8a',
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', gap: 6, color: 'white',
                              }}>
                                {isRoundtrip
                                  ? <><ArrowRight size={14} /><ArrowLeftRight size={14} /></>
                                  : <ArrowRight size={16} />}
                              </div>
                              {/* Dropoff */}
                              <div style={{ flex: 1, background: '#f0fdf4', padding: '14px 16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                                  🏁 {isRoundtrip ? 'DROPOFF / RETURN' : 'DROPOFF'}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>
                                  {isRoundtrip ? (t.dropoffLocation || 'N/A') : (destination || 'Destination')}
                                </div>
                                {isRoundtrip && t.departureTime && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                                    <Clock size={11} /> {t.departureTime}
                                  </div>
                                )}
                                {isRoundtrip && t.returnDate && (
                                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                                    📅 {fmtDate(t.returnDate)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Transfer-specific message */}
                            {t.message && (
                              <div style={{ padding: '0 18px 14px' }}>
                                <div style={{ fontSize: 12, color: '#64748b', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
                                  💬 {t.message}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Booking summary box */}
                  <div className="voucher-box" style={{ marginTop: 16 }}>
                    <h3 className="voucher-box-title">BOOKING INFORMATION</h3>
                    <ul className="voucher-list">
                      <li>
                        <span className="icon-check">✓</span>
                        Client: <strong>{fullName}</strong>
                      </li>
                      <li>
                        <span className="icon-check">✓</span>
                        Destination: <strong>{destination}</strong>
                      </li>
                      <li>
                        <span className="icon-check">✓</span>
                        Travel Date: <strong>{fmtDate(travelDate)}</strong>
                        {returnDate && <> — Return: <strong>{fmtDate(returnDate)}</strong></>}
                      </li>
                      <li>
                        <span className="icon-check">✓</span>
                        Total Pax: <strong>{paxCount}</strong>
                      </li>
                      {tours.length > 0 && (
                        <li>
                          <span className="icon-check">✓</span>
                          Tours: <strong>{tours.length} service{tours.length !== 1 ? 's' : ''}</strong>
                          {' '}({tours.map(t => t.title || 'Tour').join(', ')})
                        </li>
                      )}
                      {transfers.length > 0 && (
                        <li>
                          <span className="icon-check">✓</span>
                          Transfers: <strong>{transfers.length} service{transfers.length !== 1 ? 's' : ''}</strong>
                          {' '}({transfers.map(t => t.title || 'Transfer').join(', ')})
                        </li>
                      )}
                      {promoCode && (
                        <li>
                          <span className="icon-check">✓</span>
                          Promo Code Applied: <strong>{promoCode}</strong>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Notes */}
                  {message && (
                    <div className="voucher-note">
                      <strong>📝 Special Requests / Notes:</strong> {message}
                    </div>
                  )}

                  {/* Terms & Conditions */}
                  <div className="voucher-section-header" style={{ marginTop: 24 }}>
                    <h2 className="voucher-section-title">Terms & Conditions</h2>
                    <div className="voucher-section-brand">WANDERWAVE</div>
                  </div>

                  <div className="voucher-box">
                    <h3 className="voucher-box-title">CANCELLATION & REFUND POLICY</h3>
                    <p style={{ padding: '16px 20px', margin: 0, lineHeight: 1.6, color: '#475569' }}>
                      Please note that <strong style={{ color: '#ef4444' }}>NO</strong> cancellations or
                      modifications are allowed once your booking is confirmed.{' '}
                      <strong style={{ color: '#ef4444' }}>NO</strong> refunds will be provided for
                      commenced services or in cases of no-show and on-the-spot cancellations.
                    </p>
                  </div>

                  <div className="voucher-box">
                    <h3 className="voucher-box-title">IMPORTANT REMINDERS</h3>
                    <ol className="voucher-terms-list">
                      <li>This voucher is valid only for the services and details stated above.</li>
                      <li>Please present this voucher upon check-in or at the start of each service.</li>
                      <li>Valid photo ID required at all times (Passport, Driver's License, etc.)</li>
                      <li>This voucher is non-transferable, non-endorsable, and non-refundable.</li>
                      <li>WanderWave Travel & Tours is not liable for delays caused by traffic or unforeseen circumstances.</li>
                      <li>Personal expenses not covered in the service scope will be charged separately.</li>
                      <li>WanderWave Travel & Tours is not liable for circumstances beyond control (force majeure).</li>
                    </ol>
                  </div>

                  <div className="voucher-alert" style={{ marginTop: 12 }}>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      <li>This voucher is an official document from WanderWave Travel & Tours. Please keep it safe.</li>
                      <li>Present this voucher to the assigned guide, driver, or coordinator at each service point.</li>
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

export default CustomizedBookingVoucherModal;
