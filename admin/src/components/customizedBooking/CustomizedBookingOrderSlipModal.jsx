import React, { useRef, useState } from 'react';
import {
  X, Download, Printer, Phone, Mail, MapPin,
  ArrowRight, ArrowLeftRight, Clock, Navigation,
  Map, Truck,
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
const CustomizedBookingOrderSlipModal = ({ booking, onClose }) => {
  const slipRef         = useRef(null);
  const [busy, setBusy] = useState(false);

  if (!booking) return null;

  /* The full MongoDB document lives under rawData */
  const raw = booking.rawData || booking;

  const fullName            = raw.fullName    || booking.customerName || 'N/A';
  const email               = raw.email       || booking.email        || 'N/A';
  const phone               = raw.phone       || '';
  const destination         = raw.destination || booking.destination  || 'N/A';
  const paxCount            = raw.paxCount    || booking.guests       || 1;
  const travelDate          = raw.travelDate  || booking.travelDate   || '';
  const returnDate          = raw.returnDate  || booking.returnDate   || '';
  const message             = raw.message     || raw.notes            || booking.message || '';
  const promoCode           = raw.promoCode   || '';
  const currency            = raw.currency    || 'PHP';
  const paymentType         = raw.paymentType || booking.paymentType  || 'full';
  const initialPaymentAmount = raw.initialPaymentAmount || booking.initialPaymentAmount || 0;
  const totalAmount          = raw.totalAmount    || booking.totalAmount    || 0;
  const toursTotal           = raw.toursTotal     || 0;
  const transfersTotal       = raw.transfersTotal || 0;
  const paymentStatus        = raw.paymentStatus  || 'pending';
  const status               = (raw.status || booking.status || 'pending').toLowerCase();
  const createdByType        = raw.createdByType  || 'customer';
  const createdAt            = raw.createdAt      || booking.bookingDate || '';
  const referenceNumber      = raw.referenceNumber || booking.referenceNumber || '';

  const tours     = Array.isArray(raw.tours)     ? raw.tours     : [];
  const transfers = Array.isArray(raw.transfers) ? raw.transfers : [];

  const bookingId  = booking.id || raw._id || '';
  const showMark   = status === 'pending' || status === 'cancelled';

  /* Derived payment */
  const paidAmount = paymentType === 'partial'
    ? initialPaymentAmount
    : (status === 'confirmed' || status === 'completed' ? totalAmount : initialPaymentAmount);
  const balance = paymentType === 'partial'
    ? Math.max(0, totalAmount - initialPaymentAmount)
    : (status === 'confirmed' || status === 'completed' ? 0 : totalAmount);

  const statusColors = {
    confirmed: { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    completed: { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    pending:   { bg: '#fffbeb', border: '#fcd34d', color: '#b45309' },
    cancelled: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
  };
  const sColor = statusColors[status] || statusColors.pending;

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
      pdf.save(`WanderWave_Custom_OrderSlip_${(fullName).replace(/\s+/g, '_')}.pdf`);
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
      <title>Customized Booking Order Slip — ${bookingId}</title>
      <style>@page{size:A4 portrait;margin:0;}html,body{margin:0;padding:0;background:white;}</style>
      ${styles}
    </head><body>${node.outerHTML}
    <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};}<\/script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div className="voucher-modal-overlay cb-voucher" onClick={onClose}>
      <div className="voucher-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* ACTION BAR */}
        <div className="voucher-action-bar">
          <div className="voucher-action-left">
            <h2 className="voucher-action-title">
              🧾 Customized Booking — Order Slip
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
                PAGE 1 — CLIENT INFO + SERVICES SUMMARY
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
                    <p className="header-invoice">Total Pax: {paxCount}</p>
                    {createdByType && (
                      <p className="header-invoice">Created By: {createdByType.charAt(0).toUpperCase() + createdByType.slice(1)}</p>
                    )}
                  </div>
                  <div className="header-right">
                    <h1 className="header-brand">ORDER</h1>
                    <div className="header-sub-brand">SLIP</div>
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

                {/* Status banner */}
                <div className="voucher-section" style={{ paddingTop: 0 }}>
                  <div
                    className="os-status-banner"
                    style={{ background: sColor.bg, borderColor: sColor.border, color: sColor.color }}
                  >
                    <span className="os-status-text">
                      {paymentType === 'full'
                        ? '✅ Full payment plan selected.'
                        : `💳 Partial payment plan — ${fmt(initialPaymentAmount)} paid`}
                    </span>
                    <span
                      className="os-status-type"
                      style={{ background: sColor.color + '18', color: sColor.color }}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* ── SERVICES OVERVIEW ── */}
                <div className="voucher-section">
                  <div className="voucher-section-header">
                    <h2 className="voucher-section-title">Services Booked</h2>
                    <div className="voucher-section-brand">WANDERWAVE</div>
                  </div>

                  <div className="table-responsive">
                    <table className="voucher-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>SERVICE</th>
                          <th>TYPE</th>
                          <th>DATE</th>
                          <th>PAX</th>
                          <th style={{ textAlign: 'right' }}>SUBTOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tours.map((t, i) => (
                          <tr key={`tour-${i}`}>
                            <td style={{ color: '#94a3b8', fontSize: 11 }}>{i + 1}</td>
                            <td>
                              <strong>{t.title || 'Tour'}</strong>
                              {t.destination && (
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                  📍 {t.destination}{t.category ? ` · ${t.category}` : ''}
                                </div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                background: '#f0fdf4', color: '#15803d',
                                padding: '3px 10px', borderRadius: '12px',
                                fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap',
                              }}>
                                🗺️ Tour
                              </span>
                            </td>
                            <td style={{ fontSize: 12 }}>{t.scheduledDate ? fmtDate(t.scheduledDate) : fmtDate(travelDate)}</td>
                            <td>{t.paxCount || paxCount} pax</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(t.subtotal || 0)}</td>
                          </tr>
                        ))}
                        {transfers.map((t, i) => (
                          <tr key={`transfer-${i}`}>
                            <td style={{ color: '#94a3b8', fontSize: 11 }}>{tours.length + i + 1}</td>
                            <td>
                              <strong>{t.title || 'Transfer'}</strong>
                              {t.pickupLocation && (
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                  🚏 {t.pickupLocation}
                                  {t.dropoffLocation ? ` → ${t.dropoffLocation}` : ''}
                                </div>
                              )}
                            </td>
                            <td>
                              <span style={{
                                background: t.transferType === 'roundtrip' ? '#eff6ff' : '#fdf4ff',
                                color: t.transferType === 'roundtrip' ? '#1d4ed8' : '#7c3aed',
                                padding: '3px 10px', borderRadius: '12px',
                                fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap',
                              }}>
                                {t.transferType === 'roundtrip' ? '🔄 Roundtrip' : '➡️ One Way'}
                              </span>
                            </td>
                            <td style={{ fontSize: 12 }}>{t.travelDate ? fmtDate(t.travelDate) : fmtDate(travelDate)}</td>
                            <td>{t.passengerCount || paxCount} pax</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(t.subtotal || t.selectedPrice || 0)}</td>
                          </tr>
                        ))}
                        {tours.length === 0 && transfers.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                              No services recorded
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── PASSENGER INFO ── */}
                <div className="voucher-section">
                  <div className="table-responsive">
                    <table className="voucher-table os-pax-table os-pax-custom">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>#</th>
                          <th style={{ width: '30%' }}>PASSENGER NAME</th>
                          <th>EMAIL</th>
                          <th>PHONE</th>
                          <th>DESTINATION</th>
                          <th>PAX</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="os-pax-num">1</td>
                          <td className="os-pax-name"><strong>{fullName}</strong></td>
                          <td className="os-pax-contact">{email}</td>
                          <td className="os-pax-contact">{phone || 'N/A'}</td>
                          <td className="os-pax-contact">{destination}</td>
                          <td>{paxCount}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes / Message */}
                {message && (
                  <div className="voucher-section" style={{ paddingTop: 0 }}>
                    <div className="voucher-note">
                      <strong>📝 Notes / Special Request:</strong> {message}
                    </div>
                  </div>
                )}

                {promoCode && (
                  <div className="voucher-section" style={{ paddingTop: 0 }}>
                    <div className="voucher-info-note">
                      🏷️ <strong>Promo Code Applied:</strong> {promoCode}
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
                PAGE 2 — FINANCIAL BREAKDOWN + PAYMENT DETAILS
            ══════════════════════════════════════════════ */}
            <div className="voucher-page" style={{ position: 'relative' }}>
              {showMark && (
                <div className={`os-watermark ${status === 'cancelled' ? 'os-watermark-cancelled' : ''}`}>
                  {status === 'pending' ? 'PENDING' : 'CANCELLED'}
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
                          <th>ITEMS</th>
                          <th style={{ textAlign: 'right' }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tours.length > 0 && (
                          <tr>
                            <td><strong>🗺️ Tours</strong></td>
                            <td style={{ color: '#64748b', fontSize: 12 }}>
                              {tours.map(t => t.title || 'Tour').join(', ')}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(toursTotal)}</td>
                          </tr>
                        )}
                        {tours.map((t, i) => (
                          <tr key={`tour-row-${i}`} style={{ background: '#fafafa' }}>
                            <td style={{ paddingLeft: 24, fontSize: 12, color: '#475569' }}>
                              ↳ {t.title}
                            </td>
                            <td style={{ fontSize: 12, color: '#94a3b8' }}>
                              {t.paxCount || paxCount} pax × {fmt(t.price || 0)}
                            </td>
                            <td style={{ textAlign: 'right', fontSize: 12, color: '#475569' }}>{fmt(t.subtotal || 0)}</td>
                          </tr>
                        ))}
                        {transfers.length > 0 && (
                          <tr>
                            <td><strong>🚐 Transfers</strong></td>
                            <td style={{ color: '#64748b', fontSize: 12 }}>
                              {transfers.map(t => t.title || 'Transfer').join(', ')}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(transfersTotal)}</td>
                          </tr>
                        )}
                        {transfers.map((t, i) => (
                          <tr key={`transfer-row-${i}`} style={{ background: '#fafafa' }}>
                            <td style={{ paddingLeft: 24, fontSize: 12, color: '#475569' }}>
                              ↳ {t.title} ({t.transferType === 'roundtrip' ? 'Roundtrip' : 'One Way'})
                            </td>
                            <td style={{ fontSize: 12, color: '#94a3b8' }}>
                              {t.passengerCount || paxCount} pax
                            </td>
                            <td style={{ textAlign: 'right', fontSize: 12, color: '#475569' }}>
                              {fmt(t.subtotal || t.selectedPrice || 0)}
                            </td>
                          </tr>
                        ))}
                        {promoCode && (
                          <tr>
                            <td>Promo Code</td>
                            <td style={{ color: '#64748b', fontSize: 12 }}>Code: {promoCode}</td>
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
                    <div className="os-balance-box" style={{ marginTop: 12 }}>
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
                    <div className="os-settled-box" style={{ marginTop: 12 }}>
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
                    background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden',
                  }}>
                    {[
                      ['Booking ID', bookingId],
                      ['Reference Number', referenceNumber || 'N/A'],
                      ['Payment Type', paymentType === 'partial' ? 'Partial Payment' : 'Full Payment'],
                      ['Payment Status', (paymentStatus).charAt(0).toUpperCase() + (paymentStatus).slice(1)],
                      ['Currency', currency || 'PHP'],
                      ['Total Services', `${tours.length} Tour${tours.length !== 1 ? 's' : ''} + ${transfers.length} Transfer${transfers.length !== 1 ? 's' : ''}`],
                      ['Created By', (createdByType || 'customer').charAt(0).toUpperCase() + (createdByType || 'customer').slice(1)],
                    ].map(([label, value]) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 13,
                      }}>
                        <span style={{ color: '#64748b' }}>{label}</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Reminders */}
                  <div className="voucher-alert" style={{ marginTop: 20 }}>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      <li>This order slip is an official record of your customized booking with WanderWave Travel & Tours.</li>
                      <li>Please present this slip upon check-in or when settling any remaining balance.</li>
                      <li>All services are subject to availability and WanderWave's terms and conditions.</li>
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

export default CustomizedBookingOrderSlipModal;
