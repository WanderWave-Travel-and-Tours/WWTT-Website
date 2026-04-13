import React, { useState } from 'react';
import {
  X, CheckCircle, AlertCircle, XCircle, Check,
  User, Mail, Calendar, Users, MapPin, Clock,
  CreditCard, Wallet, Plane, Map, Tag, PhoneCall
} from 'lucide-react';
import './TourBookingDetailModal.css';

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getStatusConfig = (status) => {
  const map = {
    PENDING:   { color: 'amber', Icon: AlertCircle, label: 'Pending Review',  desc: 'Awaiting confirmation' },
    CONFIRMED: { color: 'green', Icon: CheckCircle, label: 'Confirmed',        desc: 'Booking is active'     },
    CANCELLED: { color: 'red',   Icon: XCircle,     label: 'Cancelled',        desc: 'Booking was cancelled' },
    COMPLETED: { color: 'blue',  Icon: CheckCircle, label: 'Completed',        desc: 'Tour completed'        },
  };
  return map[(status || 'PENDING').toUpperCase()] || map.PENDING;
};

const TourBookingDetailModal = ({
  showModal,
  selectedBooking,
  setShowModal,
  handleConfirm,
  handleCancel,
  actionLoading,
}) => {
  if (!showModal || !selectedBooking) return null;

  const b      = selectedBooking;
  const raw    = b.rawData || {};
  const status = (b.status || 'pending').toUpperCase();
  const { color, Icon: StatusIcon, label: statusLabel, desc: statusDesc } = getStatusConfig(status);

  // Payment
  const isPartial       = b.paymentType === 'partial';
  const totalAmount     = b.totalAmount || 0;
  const remainingBal    = b.remainingBalance || 0;
  const initialPaid     = totalAmount - remainingBal;
  const isFullyPaid     = remainingBal <= 0;
  const partialPct      = raw.includesAirfare ? '85%' : '50%';

  // Passengers
  const passengers = Array.isArray(raw.passengers) ? raw.passengers : [];
  const tourType   = (raw.tourType || '').toLowerCase();
  const category   = raw.category || '';

  // Flight
  const hasAirfare = raw.includesAirfare;
  const flight     = raw.flightDetails || null;

  const closeModal = () => setShowModal(false);

  return (
    <div className="tbm-overlay" onClick={closeModal}>
      <div className="tbm-modal" onClick={e => e.stopPropagation()}>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="tbm-header">
          <div className="tbm-header-left">
            <h2 className="tbm-header-title">Tour Booking Details</h2>
            <div className="tbm-header-meta">
              <span className="tbm-header-id">ID: #{b.id}</span>
              <span className="tbm-header-dot">•</span>
              <span>Booked: {formatDate(b.bookingDate)}</span>
            </div>
          </div>

          <div className={`tbm-status-badge ${color}`}>
            <div className="tbm-status-icon"><StatusIcon size={16} /></div>
            <div>
              <span className="tbm-status-label">{statusLabel}</span>
              <span className="tbm-status-desc">{statusDesc}</span>
            </div>
          </div>

          <button className="tbm-close-btn" onClick={closeModal} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* ── BODY ───────────────────────────────────────────────── */}
        <div className="tbm-body">

          {/* Tour Hero Strip */}
          <div className="tbm-tour-hero">
            {raw.image && <img src={raw.image} alt="" className="tbm-tour-hero-img" />}
            <div className="tbm-tour-hero-content">
              <div className="tbm-tour-hero-icon">🏝️</div>
              <div className="tbm-tour-hero-info">
                <p className="tbm-tour-hero-name">{b.packageName}</p>
                <div className="tbm-tour-hero-tags">
                  {tourType && (
                    <span className={`tbm-hero-tag ${tourType === 'private' ? 'private' : 'joiners'}`}>
                      {tourType === 'private' ? '🔒 Private' : '👥 Joiners'}
                    </span>
                  )}
                  {category && <span className="tbm-hero-tag category">{category}</span>}
                  {hasAirfare && <span className="tbm-hero-tag airfare">✈️ With Airfare</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Info */}
          <div className="tbm-card">
            <div className="tbm-card-header">
              <Calendar size={15} color="#64748b" />
              <span className="tbm-card-title">Booking Information</span>
            </div>
            <div className="tbm-card-body">
              <div className="tbm-grid">
                <div className="tbm-info-item">
                  <div className="tbm-info-icon"><User size={16} /></div>
                  <div className="tbm-info-content">
                    <span className="tbm-info-label">Customer</span>
                    <span className="tbm-info-value">{b.customerName}</span>
                  </div>
                </div>
                <div className="tbm-info-item">
                  <div className="tbm-info-icon"><Mail size={16} /></div>
                  <div className="tbm-info-content">
                    <span className="tbm-info-label">Email</span>
                    <span className="tbm-info-value">{b.email}</span>
                  </div>
                </div>
                <div className="tbm-info-item">
                  <div className="tbm-info-icon"><MapPin size={16} /></div>
                  <div className="tbm-info-content">
                    <span className="tbm-info-label">Destination</span>
                    <span className="tbm-info-value">{b.destination || raw.destination || '—'}</span>
                  </div>
                </div>
                <div className="tbm-info-item">
                  <div className="tbm-info-icon"><Clock size={16} /></div>
                  <div className="tbm-info-content">
                    <span className="tbm-info-label">Duration</span>
                    <span className="tbm-info-value">{b.duration || '—'}</span>
                  </div>
                </div>
                <div className="tbm-info-item">
                  <div className="tbm-info-icon"><Calendar size={16} /></div>
                  <div className="tbm-info-content">
                    <span className="tbm-info-label">Travel Date</span>
                    <span className="tbm-info-value">{b.travelDate}</span>
                  </div>
                </div>
                <div className="tbm-info-item">
                  <div className="tbm-info-icon"><Calendar size={16} /></div>
                  <div className="tbm-info-content">
                    <span className="tbm-info-label">End Date</span>
                    <span className="tbm-info-value">{b.endDate ? formatDate(b.endDate) : '—'}</span>
                  </div>
                </div>
                <div className="tbm-info-item">
                  <div className="tbm-info-icon"><Users size={16} /></div>
                  <div className="tbm-info-content">
                    <span className="tbm-info-label">Guests</span>
                    <span className="tbm-info-value">
                      {b.guests} Adult{b.guests !== 1 ? 's' : ''}
                      {(raw.pax?.children || 0) > 0 && ` · ${raw.pax.children} Child`}
                      {(raw.pax?.infants  || 0) > 0 && ` · ${raw.pax.infants} Infant`}
                    </span>
                  </div>
                </div>
                {b.promoCode && (
                  <div className="tbm-info-item">
                    <div className="tbm-info-icon"><Tag size={16} /></div>
                    <div className="tbm-info-content">
                      <span className="tbm-info-label">Promo Code</span>
                      <span className="tbm-info-value" style={{ color: '#059669' }}>🏷️ {b.promoCode}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Passengers */}
          <div className="tbm-card">
            <div className="tbm-card-header">
              <Users size={15} color="#64748b" />
              <span className="tbm-card-title">Passenger Details ({passengers.length})</span>
            </div>
            <div className="tbm-card-body" style={{ padding: 0 }}>
              {passengers.length === 0 ? (
                <div className="tbm-no-passengers">No passenger details provided.</div>
              ) : (
                <table className="tbm-passengers-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Nationality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((p, i) => (
                      <tr key={i}>
                        <td><span className="tbm-pax-number">{i + 1}</span></td>
                        <td style={{ fontWeight: 600 }}>
                          {`${p.firstName || ''} ${p.lastName || ''}`.trim() || '—'}
                        </td>
                        <td>{p.email || '—'}</td>
                        <td>{p.age || '—'}</td>
                        <td>{p.gender || '—'}</td>
                        <td>{p.nationality || 'Filipino'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Flight Details (if airfare included) */}
          {hasAirfare && flight && (
            <div className="tbm-card">
              <div className="tbm-card-header">
                <Plane size={15} color="#64748b" />
                <span className="tbm-card-title">Flight Details</span>
              </div>
              <div className="tbm-card-body">
                <div className="tbm-flight-row">
                  <div className="tbm-flight-icon"><Plane size={18} /></div>
                  <div className="tbm-flight-info">
                    <div className="tbm-flight-route">
                      {flight.airline || '—'}
                      {flight.flightNumber && ` · ${flight.flightNumber}`}
                    </div>
                    <div className="tbm-flight-detail">
                      {flight.route ||
                        (flight.departure?.iataCode && flight.arrival?.iataCode
                          ? `${flight.departure.iataCode} → ${flight.arrival.iataCode}`
                          : '—')
                      }
                      {flight.isInternational && ' · International'}
                    </div>
                    {(flight.departureTime || flight.departure?.at) && (
                      <div className="tbm-flight-detail">
                        Departure: {formatDate(flight.departureTime || flight.departure?.at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="tbm-payment-card">
            <div className="tbm-payment-header">
              <span className="tbm-payment-title">
                <CreditCard size={15} />
                Payment Details
              </span>
              <span className={`tbm-payment-type-badge ${isPartial ? 'partial' : 'full'}`}>
                {isPartial ? `Partial Payment (${partialPct})` : 'Full Payment'}
              </span>
            </div>
            <div className="tbm-payment-body">
              {isPartial ? (
                <>
                  <div className="tbm-payment-row">
                    <span className="tbm-payment-lbl">Package Total</span>
                    <span className="tbm-payment-val">₱{totalAmount.toLocaleString()}</span>
                  </div>
                  {b.discountAmount > 0 && (
                    <div className="tbm-payment-row">
                      <span className="tbm-payment-lbl">Promo Discount</span>
                      <span className="tbm-payment-val green">- ₱{b.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {hasAirfare && (
                    <div className="tbm-payment-row">
                      <span className="tbm-payment-lbl">+ Airfare</span>
                      <span className="tbm-payment-val">₱{(b.airfareTotal || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="tbm-payment-divider" />
                  <div className="tbm-payment-row">
                    <span className="tbm-payment-lbl" style={{ fontWeight: 700, color: '#334155' }}>Total Amount</span>
                    <span className="tbm-payment-val total">₱{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="tbm-payment-row">
                    <span className="tbm-payment-lbl">Initial Payment Paid</span>
                    <span className="tbm-payment-val green">₱{initialPaid.toLocaleString()}</span>
                  </div>
                  <div className="tbm-payment-row">
                    <span className="tbm-payment-lbl">Remaining Balance</span>
                    <span className={`tbm-payment-val ${remainingBal > 0 ? 'amber' : 'green'}`}>
                      ₱{remainingBal.toLocaleString()}
                    </span>
                  </div>
                  {isFullyPaid ? (
                    <div className="tbm-fully-paid-banner">
                      <CheckCircle size={18} /> Fully Paid — No remaining balance
                    </div>
                  ) : (
                    <div className="tbm-pending-balance-banner">
                      <Wallet size={18} /> ₱{remainingBal.toLocaleString()} balance due before trip
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="tbm-payment-row">
                    <span className="tbm-payment-lbl">Package Total</span>
                    <span className="tbm-payment-val">₱{totalAmount.toLocaleString()}</span>
                  </div>
                  {b.discountAmount > 0 && (
                    <div className="tbm-payment-row">
                      <span className="tbm-payment-lbl">Promo Discount</span>
                      <span className="tbm-payment-val green">- ₱{b.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {hasAirfare && (
                    <div className="tbm-payment-row">
                      <span className="tbm-payment-lbl">+ Airfare</span>
                      <span className="tbm-payment-val">₱{(b.airfareTotal || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="tbm-payment-divider" />
                  <div className="tbm-payment-row">
                    <span className="tbm-payment-lbl" style={{ fontWeight: 700, color: '#334155' }}>Total Amount</span>
                    <span className="tbm-payment-val total">₱{totalAmount.toLocaleString()}</span>
                  </div>
                  {status === 'CONFIRMED' && (
                    <div className="tbm-fully-paid-banner">
                      <CheckCircle size={18} /> Payment Confirmed — Fully Paid
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <div className="tbm-footer">
          <button className="tbm-btn tbm-btn-ghost" onClick={closeModal}>Close</button>

          {status === 'PENDING' && (
            <>
              <button
                className="tbm-btn tbm-btn-success"
                onClick={() => { handleConfirm(selectedBooking); closeModal(); }}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <><span className="tbm-spinner" /> Processing...</>
                  : <><Check size={16} /> Confirm Booking</>
                }
              </button>
              <button
                className="tbm-btn tbm-btn-danger"
                onClick={() => { handleCancel(selectedBooking); closeModal(); }}
                disabled={actionLoading}
              >
                <X size={16} /> Cancel Booking
              </button>
            </>
          )}

          {status === 'CONFIRMED' && (
            <button
              className="tbm-btn tbm-btn-danger"
              onClick={() => { handleCancel(selectedBooking); closeModal(); }}
              disabled={actionLoading}
            >
              <X size={16} /> Cancel Booking
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default TourBookingDetailModal;
