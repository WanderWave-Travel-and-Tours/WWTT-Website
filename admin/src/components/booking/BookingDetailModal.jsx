import React from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Check, DollarSign, Calendar, User, Mail, Wallet, CreditCard } from 'lucide-react';
import './BookingDetailModal.css'; 

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
    if (!showModal || !selectedBooking) return null;

    const closeModal = () => setShowModal(false);

    const handleConfirmAndClose = (booking) => handleConfirm(booking);
    const handleCancelAndClose = (booking) => handleCancel(booking);

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

    // ✅ Payment calculations - CORRECTED
    const isPartialPayment = selectedBooking.paymentType === 'partial';
    const totalAmount = selectedBooking.totalAmount || 0;
    const remainingBalance = selectedBooking.remainingBalance || 0;
    const balancePaid = selectedBooking.balancePaidAmount || 0;
    
    // Calculate actual amount paid (what they already paid)
    const initialPaid = totalAmount - remainingBalance;
    const totalPaid = initialPaid + balancePaid;
    
    // Check if fully paid
    const isFullyPaid = balancePaid > 0 && remainingBalance <= 0;

    return (
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
                                    <label className="cnm-info-label">
                                        {isPartialPayment ? 'Total Amount' : 'Total Amount'}
                                    </label>
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

                    {/* ✅ NEW: PAYMENT DETAILS SECTION */}
                    <div className="cnm-card" style={{background: isPartialPayment ? '#fef3c7' : '#f0fdf4'}}>
                        <div className="cnm-card-header">
                            <h3 className="cnm-card-title">
                                <Wallet size={18} style={{marginRight: '8px', display: 'inline'}} />
                                Payment Details
                            </h3>
                            <span className={`cnm-badge ${isPartialPayment ? 'cnm-badge-amber' : 'cnm-badge-green'}`}>
                                {isPartialPayment ? 'PARTIAL PAYMENT' : 'FULL PAYMENT'}
                            </span>
                        </div>
                        <div className="cnm-payment-breakdown">
                            <div className="payment-row">
                                <span className="payment-label">Payment Type:</span>
                                <strong>{isPartialPayment ? 'Partial Payment' : 'Pay in Full'}</strong>
                            </div>
                            
                            <div className="payment-row">
                                <span className="payment-label">Total Booking Amount:</span>
                                <strong>₱{selectedBooking.totalAmount.toLocaleString()}</strong>
                            </div>

                            {isPartialPayment && (
                                <>
                                    <div className="payment-divider"></div>
                                    
                                    <div className="payment-row" style={{color: '#059669'}}>
                                        <span className="payment-label">
                                            <CheckCircle size={16} style={{marginRight: '4px', display: 'inline'}} />
                                            Initial Payment:
                                        </span>
                                        <strong>₱{initialPaid.toLocaleString()}</strong>
                                    </div>

                                    {balancePaid > 0 && (
                                        <div className="payment-row" style={{color: '#059669'}}>
                                            <span className="payment-label">
                                                <CheckCircle size={16} style={{marginRight: '4px', display: 'inline'}} />
                                                Balance Paid:
                                            </span>
                                            <strong>₱{balancePaid.toLocaleString()}</strong>
                                        </div>
                                    )}

                                    <div className="payment-row" style={{
                                        color: remainingBalance > 0 ? '#dc2626' : '#059669',
                                        fontSize: '1.05rem',
                                        fontWeight: '700',
                                        paddingTop: '8px',
                                        borderTop: '2px solid #cbd5e1'
                                    }}>
                                        <span className="payment-label">
                                            {remainingBalance > 0 ? (
                                                <AlertCircle size={18} style={{marginRight: '4px', display: 'inline'}} />
                                            ) : (
                                                <CheckCircle size={18} style={{marginRight: '4px', display: 'inline'}} />
                                            )}
                                            Remaining Balance:
                                        </span>
                                        <strong>
                                            {remainingBalance > 0 ? `₱${remainingBalance.toLocaleString()}` : 'FULLY PAID'}
                                        </strong>
                                    </div>

                                    {selectedBooking.balancePaidAt && (
                                        <div className="payment-row" style={{fontSize: '0.85rem', color: '#64748b'}}>
                                            <span>Balance paid on:</span>
                                            <span>{formatDate(selectedBooking.balancePaidAt)}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {!isPartialPayment && (
                                <div className="payment-row" style={{color: isFullyPaid ? '#059669' : '#dc2626'}}>
                                    <span className="payment-label">Payment Status:</span>
                                    <strong>
                                        {isFullyPaid ? (
                                            <>
                                                <CheckCircle size={16} style={{marginRight: '4px', display: 'inline'}} />
                                                PAID IN FULL
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={16} style={{marginRight: '4px', display: 'inline'}} />
                                                PENDING PAYMENT
                                            </>
                                        )}
                                    </strong>
                                </div>
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
                            <p style={{margin:0, color:'#475569'}}>Duration: {selectedBooking.duration}</p>
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
                </div>

                {/* FOOTER ACTIONS */}
                <div className="modal-footer">
                    <button className="cnm-btn cnm-btn-ghost" onClick={closeModal}>Close</button>
                    {status === 'PENDING' && (
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
    );
};

export default BookingDetailModal;