import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, CheckCircle, AlertCircle, XCircle, Check,
  User, Mail, Calendar, Users, MapPin, Clock,
  CreditCard, Wallet, Plane, Tag, FileText, PhoneCall, ReceiptText, Pencil,
  Archive, RotateCcw, Image as ImageIcon, File, ImageOff, Download,
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
  handleArchive,
  actionLoading,
}) => {
  const navigate = useNavigate();
  const [showVoucherPreview, setShowVoucherPreview] = useState(false);
  const [voucherData, setVoucherData] = useState(null);
  const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false);
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [submittedDocs, setSubmittedDocs] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [packageImage, setPackageImage] = useState(null);
  const [packageImageFailed, setPackageImageFailed] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Fetch the booked package's cover image
  useEffect(() => {
    if (!showModal || !selectedBooking?.mongoId) {
      setPackageImage(null);
      setPackageImageFailed(false);
      return;
    }
    let cancelled = false;
    setPackageImageFailed(false);
    const fetchPackageImage = async () => {
      try {
        const res = await fetch(`https://wanderwaveph.onrender.com/api/tour-bookings/${selectedBooking.mongoId}`);
        const data = await res.json();
        const booking = data?.data || data;
        const image = booking?.packageId?.image || null;
        if (!cancelled) setPackageImage(image);
      } catch (err) {
        console.error('Error fetching package image:', err);
        if (!cancelled) setPackageImage(null);
      }
    };
    fetchPackageImage();
    return () => { cancelled = true; };
  }, [showModal, selectedBooking?.mongoId]);

  // Fetch submitted documents whenever the modal opens for a booking
  useEffect(() => {
    if (!showModal || !selectedBooking?.mongoId) {
      setSubmittedDocs([]);
      return;
    }
    const fetchDocs = async () => {
      setIsLoadingDocs(true);
      try {
        const res = await fetch(`https://wanderwaveph.onrender.com/api/documents/inquiry/${selectedBooking.mongoId}`);
        const data = await res.json();
        setSubmittedDocs(data.success ? (data.documents || []) : []);
      } catch (err) {
        console.error('Error fetching booking documents:', err);
        setSubmittedDocs([]);
      } finally {
        setIsLoadingDocs(false);
      }
    };
    fetchDocs();
  }, [showModal, selectedBooking?.mongoId]);

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

  const downloadViaBlob = async (url, fileName) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch file');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="modal-overlay bkm-detail-modal" onClick={closeModal}>
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

            {/* PACKAGE IMAGE BANNER */}
            <div style={{
              position: 'relative', width: '100%', height: '200px',
              borderRadius: '16px', overflow: 'hidden', marginBottom: '15px',
              border: '2px solid #e2e8f0',
            }}>
              {packageImage && !packageImageFailed ? (
                <img
                  src={packageImage}
                  alt={b.packageName || 'Booked tour package'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={() => setPackageImageFailed(true)}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706',
                }}>
                  <ImageOff size={28} />
                </div>
              )}
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                padding: '32px 20px 14px',
                background: 'linear-gradient(to top, rgba(15,23,42,0.85), rgba(15,23,42,0))',
              }}>
                <span style={{
                  color: '#ffffff', fontSize: '15px', fontWeight: '800',
                  textShadow: '0 2px 6px rgba(0,0,0,0.35)',
                }}>
                  {b.packageName || 'Tour Package'}
                </span>
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

            {/* PASSENGER DETAILS */}
            <div className="cnm-card">
              <div className="cnm-card-header">
                <h3 className="cnm-card-title">Passenger Details</h3>
                <span className="cnm-badge cnm-badge-blue">{passengers.length} PAX</span>
              </div>
              {passengers.length === 0 ? (
                <div className="cnm-no-passengers">No passenger details provided.</div>
              ) : (
                <div className="cnm-pax-list">
                  {passengers.map((p, i) => (
                    <div key={i} className="cnm-pax-card">
                      <div className="cnm-pax-card-header">
                        <span className="cnm-pax-number">{i + 1}</span>
                        <span className="cnm-pax-name">{`${p.firstName || ''} ${p.lastName || ''}`.trim() || '—'}</span>
                      </div>
                      <div className="cnm-grid cnm-grid-teal">
                        <div className="cnm-info-item">
                          <div className="cnm-info-icon"><Mail size={16} /></div>
                          <div className="cnm-info-content">
                            <label className="cnm-info-label">Email</label>
                            <span className="cnm-info-value">{p.email || '—'}</span>
                          </div>
                        </div>
                        <div className="cnm-info-item">
                          <div className="cnm-info-icon"><PhoneCall size={16} /></div>
                          <div className="cnm-info-content">
                            <label className="cnm-info-label">Phone</label>
                            <span className="cnm-info-value">{p.phone || '—'}</span>
                          </div>
                        </div>
                        <div className="cnm-info-item">
                          <div className="cnm-info-icon"><Calendar size={16} /></div>
                          <div className="cnm-info-content">
                            <label className="cnm-info-label">Date of Birth</label>
                            <span className="cnm-info-value">{p.dateOfBirth || '—'}</span>
                          </div>
                        </div>
                        <div className="cnm-info-item">
                          <div className="cnm-info-icon"><User size={16} /></div>
                          <div className="cnm-info-content">
                            <label className="cnm-info-label">Age</label>
                            <span className="cnm-info-value">{p.age || '—'}</span>
                          </div>
                        </div>
                        <div className="cnm-info-item">
                          <div className="cnm-info-icon"><Users size={16} /></div>
                          <div className="cnm-info-content">
                            <label className="cnm-info-label">Gender</label>
                            <span className="cnm-info-value">{p.gender || '—'}</span>
                          </div>
                        </div>
                        <div className="cnm-info-item">
                          <div className="cnm-info-icon"><MapPin size={16} /></div>
                          <div className="cnm-info-content">
                            <label className="cnm-info-label">Nationality</label>
                            <span className="cnm-info-value">{p.nationality || 'Filipino'}</span>
                          </div>
                        </div>
                        {p.address && (
                          <div className="cnm-info-item" style={{ gridColumn: 'span 2' }}>
                            <div className="cnm-info-icon"><MapPin size={16} /></div>
                            <div className="cnm-info-content">
                              <label className="cnm-info-label">Address</label>
                              <span className="cnm-info-value">{p.address}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

            {/* PACKAGE DETAILS */}
            <div className="cnm-card">
              <div className="cnm-card-header">
                <h3 className="cnm-card-title">Package Details</h3>
                <span className="cnm-badge cnm-badge-amber">{b.guests} PAX</span>
              </div>
              <div className="cnm-message-box">
                <h4 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: '700' }}>
                  {b.packageName || 'Tour Package'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px 20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Destination</label>
                    <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#0f172a' }}>
                      {b.destination || 'Philippines'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Duration</label>
                    <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#0f172a' }}>
                      {b.duration || '4D3N'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Reference No.</label>
                    <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#475569', fontFamily: 'monospace' }}>
                      {raw.referenceNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
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

            {/* SUBMITTED DOCUMENTS */}
            <div className="cnm-card">
              <div className="cnm-card-header">
                <h3 className="cnm-card-title">Submitted Documents</h3>
                {!isLoadingDocs && (
                  <span className="cnm-badge cnm-badge-amber">
                    {submittedDocs.length} file{submittedDocs.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {isLoadingDocs ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{
                    width: '32px', height: '32px', border: '3px solid #e2e8f0',
                    borderTop: '3px solid #f97316', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', margin: '0 auto 8px'
                  }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>Loading documents...</p>
                </div>
              ) : submittedDocs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  <FileText size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No documents submitted yet.</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '10px'
                }}>
                  {submittedDocs.map((doc, idx) => {
                    const fileUrl = doc.fileUrl || '#';
                    const isImage = doc.fileType?.startsWith('image/') ||
                      /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.originalName || doc.fileName || '');
                    return (
                      <div
                        key={doc._id || idx}
                        onClick={() => isImage
                          ? setPreviewDoc({ fileUrl, name: doc.originalName || doc.fileName, section: doc.section })
                          : window.open(fileUrl, '_blank', 'noopener,noreferrer')
                        }
                        style={{
                          display: 'flex', flexDirection: 'column',
                          border: '1px solid #e2e8f0', borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#fff', transition: 'box-shadow 0.2s', cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                      >
                        {isImage ? (
                          <div style={{ width: '100%', height: '80px', overflow: 'hidden', background: '#e2e8f0', position: 'relative' }}>
                            <img
                              src={fileUrl}
                              alt={doc.originalName || doc.fileName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div style={{
                              display: 'none', width: '100%', height: '100%',
                              alignItems: 'center', justifyContent: 'center',
                              position: 'absolute', top: 0, left: 0, background: '#f1f5f9'
                            }}>
                              <ImageIcon size={24} color="#94a3b8" />
                            </div>
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                            <File size={28} color="#64748b" />
                          </div>
                        )}
                        <div style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}>
                          <p style={{
                            margin: '0 0 3px 0', fontSize: '11px', fontWeight: '600',
                            color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {doc.originalName || doc.fileName || `Document ${idx + 1}`}
                          </p>
                          {doc.section && (
                            <span style={{
                              fontSize: '10px', fontWeight: '600',
                              color: doc.section === 'Valid ID' ? '#1d4ed8' : '#b45309',
                              background: doc.section === 'Valid ID' ? '#dbeafe' : '#fef3c7',
                              padding: '1px 6px', borderRadius: '4px'
                            }}>
                              {doc.section}
                            </span>
                          )}
                          {doc.fileSize && (
                            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                              {(doc.fileSize / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ── FOOTER ──────────────────────────────────────────── */}
          <div className="modal-footer">
            {/* ✅ ORDER SLIP BUTTON — available for all bookings */}
            <button
              className="cnm-btn cnm-btn-utility"
              style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(15,23,42,0.25)',
              }}
              onClick={() => setShowOrderSlip(true)}
            >
              <ReceiptText size={14} />
              Order Slip
            </button>

            {/* ✅ EDIT BOOKING BUTTON */}
            <button
              className="cnm-btn cnm-btn-utility"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
              }}
              onClick={() => {
                setShowModal(false);
                navigate(`/EditTourBooking/${b.mongoId}`);
              }}
            >
              <Pencil size={14} />
              Edit
            </button>

            {/* ✅ ARCHIVE / UNARCHIVE BUTTON */}
            {handleArchive && (
              <button
                className="cnm-btn cnm-btn-outline cnm-btn-utility"
                onClick={() => { closeModal(); handleArchive(selectedBooking); }}
                disabled={actionLoading}
              >
                {b.isArchive === 'Yes' ? (
                  <><RotateCcw size={14} /> Unarchive</>
                ) : (
                  <><Archive size={14} /> Archive</>
                )}
              </button>
            )}

            {/* ✅ View Voucher — confirmed status lang */}
            {status === 'CONFIRMED' && (
              <button
                className="cnm-btn cnm-btn-voucher cnm-btn-utility"
                onClick={generateVoucherData}
                disabled={isGeneratingVoucher}
              >
                <FileText size={14} />
                {isGeneratingVoucher ? 'Loading...' : 'Voucher'}
              </button>
            )}

            {/* Confirm — pending only */}
            {status === 'PENDING' && (
              <button
                className="cnm-btn cnm-btn-success cnm-btn-decision"
                onClick={() => handleConfirm(selectedBooking)}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <><span className="cnm-spinner" /> Processing...</>
                  : <><Check size={14} /> Confirm</>
                }
              </button>
            )}

            {/* Cancel — pending or confirmed */}
            {(status === 'PENDING' || status === 'CONFIRMED') && (
              <button
                className="cnm-btn cnm-btn-danger cnm-btn-outline cnm-btn-decision"
                onClick={() => handleCancel(selectedBooking)}
                disabled={actionLoading}
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ✅ Voucher Preview Modal */}
      {showVoucherPreview && voucherData && (
        <VoucherPreviewModal
          voucherData={voucherData}
          onClose={() => setShowVoucherPreview(false)}
          onEdit={(updatedData) => setVoucherData(updatedData)}
        />
      )}

      {/* ✅ Tour Order Slip Modal */}
      {showOrderSlip && (
        <TourOrderSlipModal
          booking={selectedBooking}
          onClose={() => setShowOrderSlip(false)}
        />
      )}

      {/* ── IMAGE PREVIEW MODAL ── */}
      {previewDoc && (
        <div
          onClick={() => setPreviewDoc(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.9))',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'cnmFadeIn 0.25s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#f1f5f9',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
              display: 'inline-flex',
              flexDirection: 'column',
              maxWidth: 'min(90vw, 820px)',
              animation: 'cnmSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(to bottom, #ffffff, #fafbfc)',
              borderRadius: '20px 20px 0 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.2)',
                }}>
                  <ImageIcon size={16} color="#f59e0b" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    margin: '0 0 3px', fontSize: '13px', fontWeight: '700', color: '#0f172a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '420px',
                  }}>
                    {previewDoc.name || 'Document Preview'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <button
                  onClick={async () => {
                    try {
                      await downloadViaBlob(previewDoc.fileUrl, previewDoc.name);
                    } catch {
                      alert('Failed to download. Please try again.');
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: '10px',
                    height: '36px', padding: '0 14px', display: 'flex', alignItems: 'center', gap: '6px',
                    cursor: 'pointer', color: '#fff', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s',
                  }}
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  style={{
                    background: '#f1f5f9', border: 'none', borderRadius: '10px',
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#64748b', flexShrink: 0, transition: 'all 0.2s',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.name}
                style={{
                  display: 'block',
                  maxWidth: 'min(75vw, 780px)',
                  maxHeight: '70vh',
                  width: 'auto',
                  height: 'auto',
                  borderRadius: '12px',
                  objectFit: 'contain',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TourBookingDetailModal;
