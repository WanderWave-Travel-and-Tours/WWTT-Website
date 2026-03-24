import React, { useState } from 'react';
import BookingDetails from './BookingDetails';
import DocumentsSection from './DocumentsSection';
import UploadedDocumentsView from './UploadedDocumentsView';
import './ApplicationDetails.css';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wanderwaveph.onrender.com';

const ApplicationDetails = ({ 
    inquiry, 
    handlePayment, 
    visaDetails, 
    uploadedFiles, 
    handleFileSelect, 
    handleDrop, 
    removeFile, 
    submitDocuments, 
    isUploading, 
    uploadProgress,
    onDownloadComplete,
    uploadedDocuments,
    isLoadingDocuments,
    onBookingUpdate  // ✅ Handler for booking updates
}) => {
    const toast = useToast();
    const [isCancelling, setIsCancelling] = useState(false);

    // ── Confirm Modal State ──────────────────────────────────────
    const [confirmModal, setConfirmModal] = useState({
        isOpen:    false,
        title:     '',
        message:   '',
        type:      'primary',
        onConfirm: null,
    });

    const showConfirm = ({ title, message, type = 'primary', onConfirm }) => {
        setConfirmModal({ isOpen: true, title, message, type, onConfirm });
    };

    const closeConfirm = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false, onConfirm: null }));
    };

    if (!inquiry) return null;

    // Check if this is a booking-type inquiry
    const isBooking = inquiry.inquiryType === 'BOOKING' || inquiry.inquiryType === 'FLIGHT_BOOKING';

    // ── Smart Display Title ─────────────────────────────────────────────
    // Build a rich title for bookings: Duration · Destination · PackageName
    // If packageName is already a full title (e.g. "3D2N TAIPEI (min of 2 pax)"),
    // use it as-is. If it's just a qualifier (e.g. "Solo", "Min of 2 Pax"),
    // build a full title from duration + destination + packageName.
    const QUALIFIER_ONLY_PATTERN_AD = /^(solo\s*\/?\.?\s*joiners?|solo|joiners?|min\.?\s*of\s*\d+\s*pax|private|group)$/i;

    const getBookingDisplayTitle = () => {
        if (!isBooking) return inquiry.serviceName;
        const name     = (inquiry.packageName || inquiry.serviceName || '').trim();
        const dest     = inquiry.packageId?.destination || '';
        const duration = inquiry.duration || '';
        if (!QUALIFIER_ONLY_PATTERN_AD.test(name)) {
            return name || 'N/A';
        }
        const parts = [];
        if (duration) parts.push(duration);
        if (dest)     parts.push(dest);
        if (name)     parts.push(name);
        return parts.length > 1 ? parts.join(' ') : name || 'N/A';
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        });
    };

    const getStatusClass = (status) => {
        const map = {
            'PAYMENT_PENDING': 'status-payment-pending',
            'PAID': 'status-paid',
            'CONFIRMED': 'status-confirmed',
            'COMPLETED': 'status-completed',
            'CANCELLED': 'status-cancelled',
            'PENDING': 'status-pending'
        };
        return map[status?.toUpperCase()] || 'status-default';
    };

    const handleCancelBooking = () => {
        showConfirm({
            title:   'Cancel Booking',
            message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
            type:    'danger',
            onConfirm: async () => {
                closeConfirm();
                try {
                    setIsCancelling(true);
                    const response = await fetch(`${API_BASE_URL}/api/bookings/${inquiry._id}/cancel`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            userEmail: inquiry.email
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        toast.success('Your booking has been cancelled successfully.', 'Booking Cancelled');
                        if (onBookingUpdate) {
                            onBookingUpdate(data.booking);
                        }
                        window.location.reload();
                    } else {
                        toast.error(data.message || 'Failed to cancel booking.', 'Cancellation Failed');
                    }
                } catch (error) {
                    console.error('Error cancelling booking:', error);
                    toast.error('Failed to cancel booking. Please try again.', 'Error');
                } finally {
                    setIsCancelling(false);
                }
            },
        });
    };

    const renderStatusContent = () => {
        const { status, remarks, evidenceUrl, estimatedPrice, deliveredDocuments, paymentConfirmedAt, documentsDeliveredAt } = inquiry;

        return (
            <>
                {/* 1. Admin Remarks */}
                {remarks && (
                    <div className="ad-alert ad-alert-remarks">
                        <div className="ad-alert-header">
                            <span className="ad-icon">💬</span>
                            <h4>Admin Remarks</h4>
                        </div>
                        <p>{remarks}</p>
                        {evidenceUrl && (
                            <a href={`${API_BASE_URL}${evidenceUrl}`} target="_blank" rel="noreferrer" className="ad-link-btn">
                                View Evidence ↗
                            </a>
                        )}
                    </div>
                )}

                {/* 2. Status Specific Content */}
                {status === 'PAYMENT_PENDING' && (
                    <div className="ad-status-box ad-box-payment">
                        <h4>Payment Required</h4>
                        <p>Please settle the amount to proceed.</p>
                        <button onClick={handlePayment} className="ad-btn-primary">
                            Pay ₱{estimatedPrice?.toLocaleString()}
                        </button>
                    </div>
                )}

                {status === 'PAID' && (
                    <div className="ad-status-box ad-box-paid">
                        <div className="ad-large-icon">✅</div>
                        <h4>Payment Submitted</h4>
                        <p>We have received your payment. Please wait for confirmation.</p>
                    </div>
                )}

                {status === 'CONFIRMED' && (
                    <div className="ad-status-box ad-box-confirmed">
                        <div className="ad-large-icon">🎉</div>
                        <h4>Payment Confirmed!</h4>
                        <p>Confirmed on <strong>{formatDate(paymentConfirmedAt)}</strong>.</p>
                        <p className="ad-subtext">Your documents are now being processed.</p>
                    </div>
                )}

                {status === 'COMPLETED' && deliveredDocuments?.length > 0 && (
                    <div className="ad-status-box ad-box-completed">
                        <div className="ad-large-icon">🎊</div>
                        <h4>Documents Ready!</h4>
                        <p>Your documents are ready for download.</p>
                        <span className="ad-date-badge">Delivered: {formatDate(documentsDeliveredAt)}</span>

                        <div className="ad-file-list">
                            {deliveredDocuments.map((doc, idx) => (
                                <div key={idx} className="ad-file-item">
                                    <div className="ad-file-icon">📄</div>
                                    <div className="ad-file-info">
                                        <span className="ad-filename" title={doc.fileName}>{doc.fileName}</span>
                                        <span className="ad-filedate">{formatDate(doc.uploadedAt)}</span>
                                    </div>
                                    <a 
                                        href={`${API_BASE_URL}${doc.fileUrl}`} 
                                        download={doc.fileName}
                                        className="ad-btn-download"
                                        onClick={() => onDownloadComplete(inquiry._id)}
                                    >
                                        Download
                                    </a>
                                </div>
                            ))}
                        </div>
                        
                        <div className="ad-thank-you">
                            <span>✅ Thank you for choosing WanderWave!</span>
                        </div>
                    </div>
                )}

                {status === 'PENDING' && !remarks && (
                    <div className="ad-status-box ad-box-pending">
                        <div className="ad-large-icon">📝</div>
                        <p>Your application is under review. We will notify you shortly.</p>
                    </div>
                )}

                {status === 'CANCELLED' && (
                    <div className="ad-status-box ad-box-cancelled">
                        <div className="ad-large-icon">❌</div>
                        <h4>Cancelled</h4>
                        <p>This application has been cancelled.</p>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="ad-container">
            {/* ── Custom Confirm Modal ── */}
            <CustomConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
            />
            <header className="ad-header">
                <div>
                    <h1 className="ad-title">{getBookingDisplayTitle()}</h1>
                    <div className="ad-id-badge">ID: {inquiry._id.slice(-8).toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className={`ad-status-pill ${getStatusClass(inquiry.status)}`}>
                        {inquiry.status?.replace('_', ' ') || 'PENDING'}
                    </div>
                    {isBooking && inquiry.status?.toUpperCase() === 'PENDING' && (
                        <button 
                            onClick={handleCancelBooking}
                            disabled={isCancelling}
                            className="ad-cancel-booking-btn"
                            style={{
                                padding: '5px 12px',
                                fontSize: '0.72rem',
                                background: isCancelling 
                                    ? 'linear-gradient(135deg, #fca5a5 0%, #f87171 100%)' 
                                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: '1.5px solid #fca5a5',
                                borderRadius: '8px',
                                cursor: isCancelling ? 'not-allowed' : 'pointer',
                                opacity: isCancelling ? 0.7 : 1,
                                transition: 'all 0.2s ease',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                if (!isCancelling) {
                                    e.target.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                            }}
                        >
                            {isCancelling ? (
                                <>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '14px',
                                        height: '14px',
                                        border: '2px solid white',
                                        borderTopColor: 'transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 0.6s linear infinite'
                                    }}></span>
                                    Cancelling...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                    Cancel Booking
                                </>
                            )}
                        </button>
                    )}
                </div>
            </header>

            {/* ✅ Render BookingDetails for booking-type inquiries.
                BookingDetails already renders BookingCustomizer internally —
                no need to render it again here. */}
            {isBooking && (
                <BookingDetails 
                    booking={inquiry} 
                    onUpdate={onBookingUpdate}
                />
            )}

            {/* Original Application Details Grid - Only show for non-bookings */}
            {!isBooking && (
                <div className="ad-grid">
                    <div className="ad-card ad-details-card">
                        <h3 className="ad-card-title">Application Details</h3>
                        <div className="ad-content-top">
                            <div className="ad-row">
                                <span className="ad-label">Destination / Type</span>
                                <span className="ad-value">
                                    {inquiry.visaCountry || inquiry.serviceName || inquiry.cenomarDocument || inquiry.psaDocument || 'N/A'}
                                </span>
                            </div>
                            <div className="ad-row">
                                <span className="ad-label">Submission Date</span>
                                <span className="ad-value">{formatDate(inquiry.createdAt)}</span>
                            </div>
                            {inquiry.estimatedPrice > 0 && (
                                <div className="ad-price-box">
                                    <span className="ad-label">Total Amount</span>
                                    <span className="ad-price-value">₱{inquiry.estimatedPrice.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                        <div className="ad-message-section">
                            <span className="ad-label">Your Message</span>
                            <div className="ad-message-content">
                                {inquiry.message || 'No additional notes provided.'}
                            </div>
                        </div>
                    </div>

                    <div className="ad-card ad-action-card">
                        <h3 className="ad-card-title">Status & Actions</h3>
                        {renderStatusContent()}
                    </div>
                </div>
            )}

            {/* Show uploaded documents */}
            <div className="ad-uploaded-docs-wrapper">
                <UploadedDocumentsView 
                    documents={uploadedDocuments}
                    isLoading={isLoadingDocuments}
                />
            </div>

            {/* Upload new documents section */}
            <div className="ad-upload-section-wrapper">
                <DocumentsSection 
                    visaDetails={visaDetails}
                    uploadedFiles={uploadedFiles}
                    handleFileSelect={handleFileSelect}
                    handleDrop={handleDrop}
                    removeFile={removeFile}
                    submitDocuments={submitDocuments}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                />
            </div>
        </div>
    );
};

export default ApplicationDetails;