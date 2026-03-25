import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Check, DollarSign, Calendar, User, Mail, Wallet, CreditCard, FileText, Smartphone, Store, Image, File } from 'lucide-react';
import './BookingDetailModal.css'; 
import VoucherPreviewModal from './VoucherPreviewModal';

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
};

export const BookingDetailModal = ({ 
    showModal, 
    selectedBooking, 
    setShowModal, 
    handleConfirm,
    handleCancel,
    actionLoading,
    CheckCircleIcon,
    AlertCircleIcon,
    XCircleIcon,
    CheckIcon,
    XIcon
}) => {
    const [showVoucherPreview, setShowVoucherPreview] = useState(false);
    const [voucherData, setVoucherData] = useState(null);
    const [submittedDocs, setSubmittedDocs] = useState([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);

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
                if (data.success) {
                    setSubmittedDocs(data.documents || []);
                } else {
                    setSubmittedDocs([]);
                }
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

    const closeModal = () => setShowModal(false);

    const handleConfirmAndClose = async (booking) => {
        const confirmed = await handleConfirm(booking);
        if (confirmed) {
            // Generate voucher data after confirmation
            generateVoucherData(booking);
        }
    };

    const handleCancelAndClose = (booking) => handleCancel(booking);

    const generateVoucherData = (booking) => {
        // Prepare voucher data from booking
        const voucher = {
            // Client Info
            clientName: booking.customerName,
            clientEmail: booking.email,
            clientPhone: booking.phone || booking.contactNumber || "N/A",
            
            // Travel Details
            travelDate: booking.travelDate,
            voucherDate: formatDate(new Date()),
            
            // Package Info
            packageName: booking.packageName,
            packageRate: booking.totalAmount / (booking.guests || 1),
            numberOfGuests: booking.guests || 1,
            duration: booking.duration || "4D3N",
            
            // Guest Details
            guestList: booking.passengers || [
                {
                    name: booking.customerName,
                    age: 30,
                    nationality: "FIL"
                }
            ],
            
            // Payment Info
            totalAmount: booking.totalAmount,
            downPayment: booking.totalAmount - (booking.remainingBalance || 0),
            amountDue: booking.remainingBalance || 0,
            paymentType: booking.paymentType,
            balancePaid: booking.balancePaidAmount || 0,
            
            // Package Details
            inclusions: [
                "4D3N Accommodation (Las Residencias Bed and Breakfast)",
                "Roundtrip Van Transfers",
                "Daily Breakfast",
                "Half-Day City Tour w/ Light Snacks",
                "Underground River w/ Picnic Lunch",
                "Honda Bay Island Hopping Tour with Picnic Lunch"
            ],
            exclusions: [
                "Snorkeling Gears",
                "Other Entrance that not included in Tour package",
                "Travel Insurance"
            ],
            amenities: {
                amenities: ["Free Wi-Fi", "Shared Room", "Shared Bathroom"],
                facilities: ["Air conditioning room"]
            },
            
            // Itinerary
            itinerary: [
                {
                    day: 1,
                    date: "December 11, 2025",
                    activity: "Pickup from PPS Airport, Transfer to Hotel, Half Day City Tour with Light Snacks (1pm to 5pm)"
                },
                {
                    day: 2,
                    date: "December 12, 2025",
                    activity: "Underground River Tour with Buffet Lunch (7am to 3pm)"
                },
                {
                    day: 3,
                    date: "December 13, 2025",
                    activity: "Honda Bay Island Hopping Tour with Picnic Lunch (7am to 3pm)"
                },
                {
                    day: 4,
                    date: "December 14, 2025",
                    activity: "Transfer to Airport - end of service"
                }
            ],
            
            referenceNumber: booking.referenceNumber || booking.id
        };
        
        setVoucherData(voucher);
        setShowVoucherPreview(true);
    };

    const getStatusConfig = (status) => {
        const configs = {
          PENDING: { color: "amber", icon: AlertCircle, label: "Pending Review", description: "Awaiting confirmation" },
          CONFIRMED: { color: "green", icon: CheckCircle, label: "Confirmed", description: "Booking is active" },
          CANCELLED: { color: "red", icon: X, label: "Cancelled", description: "Request was cancelled" },
        };
        return configs[status.toUpperCase()] || configs.PENDING;
    };
    
    const status = (selectedBooking.status || 'PENDING').toUpperCase();
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;

    // ✅ Walk-in logic
    const isWalkin = selectedBooking.isWalkin || false;
    
    // Payment calculations - ✅ Adjusted for walk-in
    const isPartialPayment = !isWalkin && selectedBooking.paymentType === 'partial'; // Walk-in never partial
    const totalAmount = selectedBooking.totalAmount || 0;
    const remainingBalance = isWalkin ? 0 : (selectedBooking.remainingBalance || 0); // Walk-in has no balance
    const balancePaid = isWalkin ? totalAmount : (selectedBooking.balancePaidAmount || 0); // Walk-in is fully paid
    
    const initialPaid = totalAmount - remainingBalance;
    const totalPaid = initialPaid + balancePaid;
    
    const isFullyPaid = isWalkin || (balancePaid > 0 && remainingBalance <= 0); // ✅ Walk-in is always fully paid
    const isPendingPayment = !isWalkin && !isPartialPayment && status === 'PENDING'; // ✅ Walk-in never pending payment

    // Payment Method Logic
    const paymentMethod = isWalkin ? 'Pay Over the Counter' : 'Online Payment';
    const PaymentMethodIcon = isWalkin ? Store : Smartphone;

    return (
        <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div className="modal-overlay" onClick={closeModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="cnm-header-content">
                            <div className="cnm-title-group">
                                <h2 className="cnm-title">Booking Details</h2>
                                <div className="cnm-meta">
                                    <span className="cnm-ref">ID: #{selectedBooking.id}</span>
                                    <span className="cnm-divider">•</span>
                                    <span className="cnm-date">Booked: {formatDate(selectedBooking.bookingDate)}</span>
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
                    
                    <div className="modal-body">
                        {/* CLIENT/BOOKING INFORMATION */}
                        <div className="cnm-card">
                            <div className="cnm-card-header">
                                <h3 className="cnm-card-title">Booking Information</h3>
                            </div>
                            <div className="cnm-grid">
                                <div className="cnm-info-item">
                                    <div className="cnm-info-icon"><User size={18} /></div>
                                    <div className="cnm-info-content">
                                        <label className="cnm-info-label">Client Name</label>
                                        <span className="cnm-info-value">{selectedBooking.customerName}</span>
                                    </div>
                                </div>
                                <div className="cnm-info-item">
                                    <div className="cnm-info-icon"><Mail size={18} /></div>
                                    <div className="cnm-info-content">
                                        <label className="cnm-info-label">Email Address</label>
                                        <span className="cnm-info-value">{selectedBooking.email}</span>
                                    </div>
                                </div>
                                <div className="cnm-info-item">
                                    <div className="cnm-info-icon"><DollarSign size={18} /></div>
                                    <div className="cnm-info-content">
                                        <label className="cnm-info-label">Total Amount</label>
                                        <span className="cnm-info-value cnm-val-amount">₱{selectedBooking.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="cnm-info-item">
                                    <div className="cnm-info-icon"><Calendar size={18} /></div>
                                    <div className="cnm-info-content">
                                        <label className="cnm-info-label">Travel Date</label>
                                        <span className="cnm-info-value">{selectedBooking.travelDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ENHANCED PAYMENT DETAILS SECTION */}
                        <div className="cnm-payment-card">
                            <div className="cnm-payment-header">
                                <div className="cnm-payment-title">
                                    <CreditCard size={18} />
                                    PAYMENT DETAILS
                                </div>
                                <div className={`cnm-payment-badge ${isPartialPayment ? 'partial' : 'full'}`}>
                                    {isWalkin ? 'PAID OVER THE COUNTER' : (isPartialPayment ? 'PARTIAL PAYMENT' : 'FULL PAYMENT')}
                                </div>
                            </div>
                            
                            <div className="cnm-payment-body">
                                {/* Payment Method and Type */}
                                <div className="cnm-payment-section">
                                    {/* Payment Method Row */}
                                    <div className="cnm-payment-row">
                                        <span className="cnm-payment-label">
                                            Payment Method:
                                        </span>
                                        <span className="cnm-payment-value" style={{
                                            color: isWalkin ? '#ea580c' : '#0284c7',
                                            fontWeight: '800'
                                        }}>
                                            {paymentMethod}
                                        </span>
                                    </div>

                                    <div className="cnm-payment-row">
                                        <span className="cnm-payment-label">Payment Type:</span>
                                        <span className="cnm-payment-value">
                                            {isWalkin ? 'Paid in Full' : (isPartialPayment ? 'Pay in Partial' : 'Pay in Full')}
                                        </span>
                                    </div>
                                    <div className="cnm-payment-row">
                                        <span className="cnm-payment-label">Total Booking Amount:</span>
                                        <span className="cnm-payment-value">₱{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* ✅ WALK-IN: Always show as FULLY PAID */}
                                {isWalkin && (
                                    <>
                                        <div className="cnm-payment-divider"></div>
                                        
                                        <div className="cnm-payment-status-box paid">
                                            <div className="cnm-payment-status-left">
                                                <div className="cnm-payment-status-title">
                                                    <CheckCircle size={14} style={{marginRight: '4px', display: 'inline'}} />
                                                    FULLY PAID (WALK-IN)
                                                </div>
                                                <div className="cnm-payment-status-amount">
                                                    ₱{totalAmount.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="cnm-payment-status-icon">
                                                <CheckCircle size={24} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Partial Payment Breakdown - Only for NON-walk-in */}
                                {!isWalkin && isPartialPayment && (
                                    <>
                                        <div className="cnm-payment-divider"></div>
                                        
                                        <div className="cnm-payment-section">
                                            <div className="cnm-payment-row">
                                                <span className="cnm-payment-label">
                                                    <CheckCircle size={16} style={{color: '#16a34a'}} />
                                                    Initial Payment:
                                                </span>
                                                <span className="cnm-payment-value" style={{color: '#16a34a'}}>
                                                    ₱{initialPaid.toLocaleString()}
                                                </span>
                                            </div>

                                            {balancePaid > 0 && (
                                                <div className="cnm-payment-row">
                                                    <span className="cnm-payment-label">
                                                        <CheckCircle size={16} style={{color: '#16a34a'}} />
                                                        Balance Paid:
                                                    </span>
                                                    <span className="cnm-payment-value" style={{color: '#16a34a'}}>
                                                        ₱{balancePaid.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment Status Box */}
                                        {remainingBalance > 0 ? (
                                            <div className="cnm-payment-status-box pending">
                                                <div className="cnm-payment-status-left">
                                                    <div className="cnm-payment-status-title">
                                                        <AlertCircle size={14} style={{marginRight: '4px', display: 'inline'}} />
                                                        PENDING PAYMENT
                                                    </div>
                                                    <div className="cnm-payment-status-amount">
                                                        ₱{remainingBalance.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="cnm-payment-status-icon">
                                                    <AlertCircle size={24} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="cnm-payment-status-box paid">
                                                <div className="cnm-payment-status-left">
                                                    <div className="cnm-payment-status-title">
                                                        <CheckCircle size={14} style={{marginRight: '4px', display: 'inline'}} />
                                                        FULLY PAID
                                                    </div>
                                                    <div className="cnm-payment-status-amount">
                                                        ₱{totalAmount.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="cnm-payment-status-icon">
                                                    <CheckCircle size={24} />
                                                </div>
                                            </div>
                                        )}

                                        {selectedBooking.balancePaidAt && (
                                            <div className="cnm-payment-date">
                                                Balance paid on: {formatDate(selectedBooking.balancePaidAt)}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Full Payment Status - Only for NON-walk-in */}
                                {!isWalkin && !isPartialPayment && (
                                    <>
                                        <div className="cnm-payment-divider"></div>
                                        
                                        {isPendingPayment ? (
                                            <div className="cnm-payment-status-box pending">
                                                <div className="cnm-payment-status-left">
                                                    <div className="cnm-payment-status-title">
                                                        <AlertCircle size={14} style={{marginRight: '4px', display: 'inline'}} />
                                                        PENDING PAYMENT
                                                    </div>
                                                    <div className="cnm-payment-status-amount">
                                                        ₱{totalAmount.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="cnm-payment-status-icon">
                                                    <AlertCircle size={24} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="cnm-payment-status-box paid">
                                                <div className="cnm-payment-status-left">
                                                    <div className="cnm-payment-status-title">
                                                        <CheckCircle size={14} style={{marginRight: '4px', display: 'inline'}} />
                                                        FULLY PAID
                                                    </div>
                                                    <div className="cnm-payment-status-amount">
                                                        ₱{totalAmount.toLocaleString()}
                                                    </div>
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
                                <span className="cnm-badge cnm-badge-amber">{selectedBooking.guests} PAX</span>
                            </div>
                            <div className="cnm-message-box">
                                <h4 style={{margin:'0 0 10px 0', fontSize:'16px'}}>{selectedBooking.packageName}</h4>
                                {selectedBooking.destination && selectedBooking.destination !== 'N/A' && (
                                    <p style={{margin:'0 0 4px 0', color:'#475569'}}>Destination: {selectedBooking.destination}</p>
                                )}
                                <p style={{margin:'0 0 4px 0', color:'#475569'}}>Duration: {selectedBooking.duration}</p>
                                <p style={{margin:0, color:'#475569'}}>Reference No: {selectedBooking.referenceNumber}</p>
                            </div>
                        </div>

                        {/* SPECIAL REQUESTS */}
                        {selectedBooking.message && (
                            <div className="cnm-card">
                                <div className="cnm-card-header">
                                    <h3 className="cnm-card-title">Special Requests / Notes</h3>
                                </div>
                                <div className="cnm-message-box">
                                    {selectedBooking.message}
                                </div>
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
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                    gap: '12px',
                                    padding: '4px 0'
                                }}>
                                    {submittedDocs.map((doc, idx) => {
                                        // Correct field names from Document model:
                                        // fileUrl, fileName, originalName, fileType, fileSize, section
                                        const fileUrl = doc.fileUrl || '#';
                                        const isImage = doc.fileType?.startsWith('image/') ||
                                            /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.originalName || doc.fileName || '');

                                        return (
                                            <a
                                                key={doc._id || idx}
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    border: '1px solid #e2e8f0', borderRadius: '10px',
                                                    overflow: 'hidden', textDecoration: 'none',
                                                    background: '#f8fafc', transition: 'box-shadow 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                                            >
                                                {isImage ? (
                                                    <div style={{ width: '100%', height: '90px', overflow: 'hidden', background: '#e2e8f0', position: 'relative' }}>
                                                        <img
                                                            src={fileUrl}
                                                            alt={doc.originalName || doc.fileName || `Doc ${idx + 1}`}
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
                                                            <Image size={28} color="#94a3b8" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        width: '100%', height: '90px', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', background: '#f1f5f9'
                                                    }}>
                                                        <File size={32} color="#64748b" />
                                                    </div>
                                                )}
                                                <div style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}>
                                                    <p style={{
                                                        margin: '0 0 2px 0', fontSize: '11px', fontWeight: '600',
                                                        color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {doc.originalName || doc.fileName || `Document ${idx + 1}`}
                                                    </p>
                                                    {doc.section && (
                                                        <span style={{
                                                            fontSize: '10px', color: '#f97316', fontWeight: '600',
                                                            background: '#fff7ed', padding: '1px 6px', borderRadius: '4px'
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
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="modal-footer">
                        <button className="cnm-btn cnm-btn-ghost" onClick={closeModal}>Close</button>
                        
                        {/* Show voucher button for confirmed bookings */}
                        {status === 'CONFIRMED' && (
                            <button 
                                className="cnm-btn cnm-btn-primary cnm-btn-left"
                                onClick={() => generateVoucherData(selectedBooking)}
                            >
                                <FileText size={16} /> View Voucher
                            </button>
                        )}
                        
                        {/* ✅ Walk-in bookings are auto-confirmed, no confirm button needed */}
                        {status === 'PENDING' && !isWalkin && (
                            <>
                                <button 
                                    className="cnm-btn cnm-btn-success"
                                    onClick={() => handleConfirmAndClose(selectedBooking)}
                                    disabled={actionLoading}
                                >
                                    <CheckIcon size={16} /> Confirm Booking
                                </button>
                                <button 
                                    className="cnm-btn cnm-btn-danger cnm-btn-outline"
                                    onClick={() => handleCancelAndClose(selectedBooking)}
                                    disabled={actionLoading}
                                >
                                    <XIcon size={16} /> Cancel Booking
                                </button>
                            </>
                        )}
                        {status === 'CONFIRMED' && (
                            <button 
                                className="cnm-btn cnm-btn-danger cnm-btn-outline"
                                onClick={() => handleCancelAndClose(selectedBooking)}
                                disabled={actionLoading}
                            >
                                <XIcon size={16} /> Cancel Booking
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
        </>
    );
};

export default BookingDetailModal;