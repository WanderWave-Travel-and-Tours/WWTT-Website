import React, { useState } from 'react';
import {
  X, CheckCircle, AlertCircle, XCircle, Check,
  User, Mail, Calendar, Users, MapPin, Clock,
  CreditCard, Wallet, Plane, Tag, FileText, PhoneCall, ReceiptText
} from 'lucide-react';
import './TourBookingDetailModal.css';
import VoucherPreviewModal from '../booking/VoucherPreviewModal';
import TourOrderSlipModal from './TourOrderSlipModal';

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const buildItinerary = (startDate, endDate, duration) => {
  if (!startDate) return [];
  const start = new Date(startDate);
  let days = 1;
  if (endDate) {
    const end = new Date(endDate);
    days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  } else if (duration) {
    const match = duration.match(/(\d+)\s*[Dd]/);
    if (match) days = parseInt(match[1]);
  }
  if (days < 1) days = 1;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    let activity = `Day ${i + 1} Activities`;
    if (i === 0) activity = 'Arrival, Airport Pickup & Hotel Check-in';
    if (i === days - 1 && days > 1) activity = 'Hotel Check-out & Transfer to Airport – End of Service';
    return {
      day: i + 1,
      date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      activity,
    };
  });
};

const getStatusConfig = (status) => {
  const configs = {
    PENDING:   { color: 'amber', Icon: AlertCircle, label: 'Pending Review',  description: 'Awaiting confirmation' },
    CONFIRMED: { color: 'green', Icon: CheckCircle, label: 'Confirmed',        description: 'Booking is active'     },
    CANCELLED: { color: 'red',   Icon: XCircle,     label: 'Cancelled',        description: 'Booking was cancelled' },
    COMPLETED: { color: 'blue',  Icon: CheckCircle, label: 'Completed',        description: 'Tour completed'        },
  };
  return configs[(status || 'PENDING').toUpperCase()] || configs.PENDING;
};

const TourBookingDetailModal = ({
  showModal,
  selectedBooking,
  setShowModal,
  handleConfirm,
  handleCancel,
  actionLoading,
}) => {
  const [showVoucherPreview, setShowVoucherPreview] = useState(false);
  const [voucherData, setVoucherData] = useState(null);
  const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false);
  const [showOrderSlip, setShowOrderSlip] = useState(false);

  if (!showModal || !selectedBooking) return null;

  const b      = selectedBooking;
  const raw    = b.rawData || {};
  const status = (b.status || 'pending').toUpperCase();
  const statusConfig = getStatusConfig(status);
  const StatusIcon   = statusConfig.Icon;

  // Payment
  const isPartialPayment = b.paymentType === 'partial';
  const totalAmount      = b.totalAmount || 0;
  const remainingBalance = b.remainingBalance || 0;
  const initialPaid      = totalAmount - remainingBalance;
  const isFullyPaid      = remainingBalance <= 0 && initialPaid > 0;
  const isPendingPayment = !isPartialPayment && status === 'PENDING';
  const partialPct       = raw.includesAirfare ? '85%' : '50%';

  // Tour info
  const passengers = Array.isArray(raw.passengers) ? raw.passengers : [];
  const tourType   = (raw.tourType || '').toLowerCase();
  const category   = raw.category || '';
  const hasAirfare = raw.includesAirfare;
  const flight     = raw.flightDetails || null;

  const closeModal = () => setShowModal(false);

  // ── Voucher Generation ──────────────────────────────────────────────
  const generateVoucherData = async () => {
    setIsGeneratingVoucher(true);
    try {
      const res = await fetch(`https://wanderwaveph.onrender.com/api/tour-bookings/${b.mongoId}`);
      if (!res.ok) throw new Error(`Failed to fetch booking: ${res.status}`);
      const json = await res.json();
      const fullBooking = json.data || json;

      let guestList = [];
      if (Array.isArray(fullBooking.passengers) && fullBooking.passengers.length > 0) {
        guestList = fullBooking.passengers.map(p => ({
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || b.customerName,
          age: p.age ?? 'N/A',
          nationality: p.nationality || 'Filipino',
        }));
      }
      if (guestList.length === 0) {
        guestList = [{ name: b.customerName, age: 'N/A', nationality: 'Filipino' }];
      }

      const itinerary  = buildItinerary(fullBooking.startDate, fullBooking.endDate, fullBooking.duration);
      const paxAdult   = fullBooking.pax?.adult || b.guests || 1;
      const total      = fullBooking.totalAmount || totalAmount;
      const remBal     = fullBooking.remainingBalance || remainingBalance;

      const voucher = {
        clientName:      fullBooking.fullName || b.customerName,
        clientEmail:     fullBooking.email    || b.email,
        clientPhone:     fullBooking.primaryContact?.phone || 'N/A',
        travelDate:      formatDate(fullBooking.startDate) || b.travelDate,
        packageName:     fullBooking.packageName || b.packageName,
        packageRate:     paxAdult > 0 ? total / paxAdult : total,
        numberOfGuests:  paxAdult,
        guestList,
        inclusions:      Array.isArray(fullBooking.customizedInclusions) && fullBooking.customizedInclusions.length > 0
          ? fullBooking.customizedInclusions
          : ['Package inclusions not specified. Please contact the agency.'],
        exclusions:      ['Snorkeling Gears', 'Other Entrance fees not included', 'Travel Insurance'],
        amenities:       { amenities: ['Free Wi-Fi'], facilities: ['Air conditioning'] },
        itinerary,
        totalAmount:     total,
        downPayment:     total - remBal,
        amountDue:       remBal,
        referenceNumber: fullBooking.referenceNumber || b.mongoId,
      };

      setVoucherData(voucher);
      setShowVoucherPreview(true);
    } catch (err) {
      console.error('❌ Error generating tour voucher:', err);
      alert('May error sa pag-load ng voucher data. Please try again.');
    } finally {
      setIsGeneratingVoucher(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>

          {/* ── HEADER ──────────────────────────────────────────── */}
          <div className="modal-header">
            <div className="cnm-header-content">
              <div className="cnm-title-group">
                <h2>Tour Booking Details</h2>
                <div className="cnm-meta">
                  <span className="cnm-ref">ID: #{b.id}</span>
                  <span className="cnm-divider">•</span>
                  <span className="cnm-date">Booked: {formatDate(b.bookingDate)}</span>
                </div>
              </div>
              <div className={`cnm-status-badge cnm-status-${statusConfig.color}`}>
                <div className="cnm-status-icon"><StatusIcon size={16} /></div>
                <div className="cnm-status-content">
                  <span className="cnm-status-label">{statusConfig.label}</span>
                  <span className="cnm-status-desc">{statusConfig.description}</span>
                </div>
              </div>
            </div>
            <button className="modal-close" onClick={closeModal} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          {/* ── BODY ────────────────────────────────────────────── */}
          <div className="modal-body">

            {/* Tour Hero Strip */}
            <div className="cnm-tour-hero" style={{ marginBottom: '15px' }}>
              {raw.image && <img src={raw.image} alt="" className="cnm-tour-hero-img" />}
              <div className="cnm-tour-hero-content">
                <div className="cnm-tour-hero-icon">🏝️</div>
                <div className="cnm-tour-hero-info">
                  <p className="cnm-tour-hero-name">{b.packageName}</p>
                  <div className="cnm-tour-hero-tags">
                    {tourType && (
                      <span className={`cnm-hero-tag ${tourType === 'private' ? 'private' : 'joiners'}`}>
                        {tourType === 'private' ? '🔒 Private' : '👥 Joiners'}
                      </span>
                    )}
                    {category && <span className="cnm-hero-tag category">{category}</span>}
                    {hasAirfare && <span className="cnm-hero-tag airfare">✈️ With Airfare</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* BOOKING INFORMATION */}
            <div className="cnm-card">
              <div className="cnm-card-header">
                <h3 className="cnm-card-title">Booking Information</h3>
              </div>
              <div className="cnm-grid">
                <div className="cnm-info-item">
                  <div className="cnm-info-icon"><User size={18} /></div>
                  <div className="cnm-info-content">
                    <label className="cnm-info-label">Customer</label>
                    <span className="cnm-info-value">{b.customerName}</span>
                  </div>
                </div>
                <div className="cnm-info-item">
                  <div className="cnm-info-icon"><Mail size={18} /></div>
                  <div className="cnm-info-content">
                    <label className="cnm-info-label">Email Address</label>
                    <span className="cnm-info-value">{b.email}</span>
                  </div>
                </div>
                <div className="cnm-info-item">
                  <div className="cnm-info-icon"><Calendar size={18} /></div>
                  <div className="cnm-info-content">
                    <label className="cnm-info-label">Travel Date</label>
                    <span className="cnm-info-value">{b.travelDate}</span>
                  </div>
                </div>
                <div className="cnm-info-item">
                  <div className="cnm-info-icon"><Calendar size={18} /></div>
                  <div className="cnm-info-content">
                    <label className="cnm-info-label">End Date</label>
                    <span className="cnm-info-value">{b.endDate ? formatDate(b.endDate) : '—'}</span>
                  </div>
                </div>
                <div className="cnm-info-item">
                  <div className="cnm-info-icon"><MapPin size={18} /></div>
                  <div className="cnm-info-content">
                    <label className="cnm-info-label">Destination</label>
                    <span className="cnm-info-value">{b.destination || raw.destination || '—'}</span>
                  </div>
                </div>
                <div className="cnm-info-item">
                  <div className="cnm-info-icon"><Clock size={18} /></div>
                  <div className="cnm-info-content">
                    <label className="cnm-info-label">Duration</label>
                    <span className="cnm-info-value">{b.duration || '—'}</span>
                  </div>
                </div>
                <div className="cnm-info-item">
                  <div className="cnm-info-icon"><Users size={18} /></div>
                  <div className="cnm-info-content">
                    <label className="cnm-info-label">Guests</label>
                    <span className="cnm-info-value">
                      {b.guests} Adult{b.guests !== 1 ? 's' : ''}
                      {(raw.pax?.children || 0) > 0 && ` · ${raw.pax.children} Child`}
                      {(raw.pax?.infants  || 0) > 0 && ` · ${raw.pax.infants} Infant`}
                    </span>
                  </div>
                </div>
                <div className="cnm-info-item">
                  <div className="cnm-info-icon"><Wallet size={18} /></div>
                  <div className="cnm-info-content">
                    <label className="cnm-info-label">Total Amount</label>
                    <span className="cnm-info-value cnm-val-amount">₱{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                {b.promoCode && (
                  <div className="cnm-info-item">
                    <div className="cnm-info-icon"><Tag size={18} /></div>
                    <div className="cnm-info-content">
                      <label className="cnm-info-label">Promo Code</label>
                      <span className="cnm-info-value" style={{ color: '#059669' }}>🏷️ {b.promoCode}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PAYMENT DETAILS */}
            <div className="cnm-payment-card">
              <div className="cnm-payment-header">
                <div className="cnm-payment-title">
                  <CreditCard size={18} />
                  PAYMENT DETAILS
                </div>
                <div className={`cnm-payment-badge ${isPartialPayment ? 'partial' : 'full'}`}>
                  {isPartialPayment ? `PARTIAL PAYMENT (${partialPct})` : 'FULL PAYMENT'}
                </div>
              </div>

              <div className="cnm-payment-body">
                <div className="cnm-payment-section">
                  <div className="cnm-payment-row">
                    <span className="cnm-payment-label">Payment Type:</span>
                    <span className="cnm-payment-value">{isPartialPayment ? 'Pay in Partial' : 'Pay in Full'}</span>
                  </div>
                  <div className="cnm-payment-row">
                    <span className="cnm-payment-label">Total Booking Amount:</span>
                    <span className="cnm-payment-value">₱{totalAmount.toLocaleString()}</span>
                  </div>
                  {b.discountAmount > 0 && (
                    <div className="cnm-payment-row">
                      <span className="cnm-payment-label">Promo Discount:</span>
                      <span className="cnm-payment-value" style={{ color: '#16a34a' }}>
                        - ₱{b.discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {hasAirfare && (
                    <div className="cnm-payment-row">
                      <span className="cnm-payment-label">+ Airfare:</span>
                      <span className="cnm-payment-value">₱{(b.airfareTotal || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Partial Payment Breakdown */}
                {isPartialPayment && (
                  <>
                    <div className="cnm-payment-divider" />
                    <div className="cnm-payment-section">
                      <div className="cnm-payment-row">
                        <span className="cnm-payment-label">
                          <CheckCircle size={16} style={{ color: '#16a34a' }} />
                          Initial Payment:
                        </span>
                        <span className="cnm-payment-value" style={{ color: '#16a34a' }}>
                          ₱{initialPaid.toLocaleString()}
                        </span>
                      </div>
                      {remainingBalance > 0 && (
                        <div className="cnm-payment-row">
                          <span className="cnm-payment-label">
                            <AlertCircle size={16} style={{ color: '#d97706' }} />
                            Remaining Balance:
                          </span>
                          <span className="cnm-payment-value" style={{ color: '#d97706' }}>
                            ₱{remainingBalance.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {remainingBalance > 0 ? (
                      <div className="cnm-payment-status-box pending">
                        <div className="cnm-payment-status-left">
                          <div className="cnm-payment-status-title">
                            <AlertCircle size={14} style={{ marginRight: '4px', display: 'inline' }} />
                            BALANCE DUE
                          </div>
                          <div className="cnm-payment-status-amount">₱{remainingBalance.toLocaleString()}</div>
                        </div>
                        <div className="cnm-payment-status-icon">
                          <AlertCircle size={24} />
                        </div>
                      </div>
                    ) : (
                      <div className="cnm-payment-status-box paid">
                        <div className="cnm-payment-status-left">
                          <div className="cnm-payment-status-title">
                            <CheckCircle size={14} style={{ marginRight: '4px', display: 'inline' }} />
                            FULLY PAID
                          </div>
                          <div className="cnm-payment-status-amount">₱{totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="cnm-payment-status-icon">
                          <CheckCircle size={24} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Full Payment Status */}
                {!isPartialPayment && (
                  <>
                    <div className="cnm-payment-divider" />
                    {isPendingPayment ? (
                      <div className="cnm-payment-status-box pending">
                        <div className="cnm-payment-status-left">
                          <div className="cnm-payment-status-title">
                            <AlertCircle size={14} style={{ marginRight: '4px', display: 'inline' }} />
                            PENDING PAYMENT
                          </div>
                          <div className="cnm-payment-status-amount">₱{totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="cnm-payment-status-icon">
                          <AlertCircle size={24} />
                        </div>
                      </div>
                    ) : (
                      <div className="cnm-payment-status-box paid">
                        <div className="cnm-payment-status-left">
                          <div className="cnm-payment-status-title">
                            <CheckCircle size={14} style={{ marginRight: '4px', display: 'inline' }} />
                            FULLY PAID
                          </div>
                          <div className="cnm-payment-status-amount">₱{totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="cnm-payment-status-icon">
                          <CheckCircle size={24} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* PASSENGER DETAILS */}
            <div className="cnm-card">
              <div className="cnm-card-header">
                <h3 className="cnm-card-title">Passenger Details</h3>
                <span className="cnm-badge cnm-badge-blue">{passengers.length} PAX</span>
              </div>
              {passengers.length === 0 ? (
                <div className="cnm-no-passengers">No passenger details provided.</div>
              ) : (
                <div className="cnm-table-wrapper">
                  <table className="cnm-passengers-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Date of Birth</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Nationality</th>
                        <th>Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((p, i) => (
                        <tr key={i}>
                          <td><span className="cnm-pax-number">{i + 1}</span></td>
                          <td style={{ fontWeight: 600 }}>
                            {`${p.firstName || ''} ${p.lastName || ''}`.trim() || '—'}
                          </td>
                          <td>{p.email || '—'}</td>
                          <td>{p.phone || '—'}</td>
                          <td>{p.dateOfBirth || '—'}</td>
                          <td>{p.age || '—'}</td>
                          <td>{p.gender || '—'}</td>
                          <td>{p.nationality || 'Filipino'}</td>
                          <td>{p.address || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* FLIGHT DETAILS (if airfare included) */}
            {hasAirfare && flight && (
              <div className="cnm-card">
                <div className="cnm-card-header">
                  <h3 className="cnm-card-title">Flight Details</h3>
                  <span className="cnm-badge cnm-badge-blue">✈️ With Airfare</span>
                </div>
                <div className="cnm-flight-row">
                  <div className="cnm-flight-icon"><Plane size={20} /></div>
                  <div className="cnm-flight-info">
                    <div className="cnm-flight-route">
                      {flight.airline || '—'}
                      {flight.flightNumber && ` · ${flight.flightNumber}`}
                    </div>
                    <div className="cnm-flight-detail">
                      {flight.route ||
                        (flight.departure?.iataCode && flight.arrival?.iataCode
                          ? `${flight.departure.iataCode} → ${flight.arrival.iataCode}`
                          : '—')}
                      {flight.isInternational && ' · International'}
                    </div>
                    {(flight.departureTime || flight.departure?.at) && (
                      <div className="cnm-flight-detail">
                        Departure: {formatDate(flight.departureTime || flight.departure?.at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SPECIAL REQUESTS / MESSAGE */}
            {raw.message && (
              <div className="cnm-card">
                <div className="cnm-card-header">
                  <h3 className="cnm-card-title">Special Requests / Notes</h3>
                </div>
                <div className="cnm-message-box">{raw.message}</div>
              </div>
            )}

          </div>

          {/* ── FOOTER ──────────────────────────────────────────── */}
          <div className="modal-footer">
            <button className="cnm-btn cnm-btn-ghost" onClick={closeModal}>Close</button>

            {/* ✅ ORDER SLIP BUTTON — available for all bookings */}
            <button
              className="cnm-btn cnm-btn-left"
              style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(15,23,42,0.25)',
                marginRight: 'auto',
              }}
              onClick={() => setShowOrderSlip(true)}
            >
              <ReceiptText size={16} />
              Order Slip
            </button>

            {/* View Voucher — confirmed only */}
            {status === 'CONFIRMED' && (
              <button
                className="cnm-btn cnm-btn-voucher cnm-btn-left"
                onClick={generateVoucherData}
                disabled={isGeneratingVoucher}
              >
                <FileText size={16} />
                {isGeneratingVoucher ? 'Loading...' : 'View Voucher'}
              </button>
            )}

            {/* Cancel — pending or confirmed */}
            {(status === 'PENDING' || status === 'CONFIRMED') && (
              <button
                className="cnm-btn cnm-btn-danger cnm-btn-outline"
                onClick={() => handleCancel(selectedBooking)}
                disabled={actionLoading}
              >
                <X size={16} /> Cancel Booking
              </button>
            )}

            {/* Confirm — pending only */}
            {status === 'PENDING' && (
              <button
                className="cnm-btn cnm-btn-success"
                onClick={() => handleConfirm(selectedBooking)}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <><span className="cnm-spinner" /> Processing...</>
                  : <><Check size={16} /> Confirm Booking</>
                }
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Voucher Preview Modal */}
      {showVoucherPreview && voucherData && (
        <VoucherPreviewModal
          voucherData={voucherData}
          onClose={() => setShowVoucherPreview(false)}
          onEdit={(updatedData) => setVoucherData(updatedData)}
        />
      )}

      {/* ✅ TOUR ORDER SLIP MODAL */}
      {showOrderSlip && (
        <TourOrderSlipModal
          booking={selectedBooking}
          onClose={() => setShowOrderSlip(false)}
        />
      )}
    </>
  );
};

export default TourBookingDetailModal;