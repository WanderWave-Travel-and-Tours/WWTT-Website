import React, { useState } from 'react';
import BookingDetails from './BookingDetails';
import BookingCustomizer from './BookingCustomizer';
import DocumentsSection from './DocumentsSection';
import UploadedDocumentsView from './UploadedDocumentsView';
import './ApplicationDetails.css';

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
    const [isCancelling, setIsCancelling] = useState(false);
    
    if (!inquiry) return null;

    // Check if this is a booking-type inquiry
    const isBooking = inquiry.inquiryType === 'BOOKING' || inquiry.inquiryType === 'FLIGHT_BOOKING';

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

    const handleCancelBooking = async () => {
        if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
            return;
        }

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
                alert('Booking cancelled successfully');
                if (onBookingUpdate) {
                    onBookingUpdate(data.booking);
                }
                // Optionally refresh the page or update the inquiry state
                window.location.reload();
            } else {
                alert(data.message || 'Failed to cancel booking');
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking. Please try again.');
        } finally {
            setIsCancelling(false);
        }
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
            <header className="ad-header">
                <div>
                    <h1 className="ad-title">{inquiry.serviceName}</h1>
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
                                padding: '10px 20px',
                                fontSize: '0.85rem',
                                background: isCancelling 
                                    ? 'linear-gradient(135deg, #fca5a5 0%, #f87171 100%)' 
                                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: '2px solid #fca5a5',
                                borderRadius: '100px',
                                cursor: isCancelling ? 'not-allowed' : 'pointer',
                                opacity: isCancelling ? 0.7 : 1,
                                transition: 'all 0.3s ease',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
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

            {/* ✅ NEW: Render BookingDetails for booking-type inquiries */}
            {isBooking && (
                <>
                    <BookingDetails 
                        booking={inquiry} 
                        onUpdate={onBookingUpdate}
                    />
                    
                    {/* ✅ Package Inclusions Display */}
                    <div className="ad-card ad-inclusions-card">
                        <h3 className="ad-card-title">Package Inclusions & Pricing</h3>
                        
                        {/* Package Base Details */}
                        <div className="ad-package-summary">
                            <div className="ad-row">
                                <span className="ad-label">Package Name</span>
                                <span className="ad-value">{inquiry.packageName}</span>
                            </div>
                            <div className="ad-row">
                                <span className="ad-label">Duration</span>
                                <span className="ad-value">{inquiry.duration}</span>
                            </div>
                            <div className="ad-row">
                                <span className="ad-label">Travel Dates</span>
                                <span className="ad-value">
                                    {formatDate(inquiry.startDate)} - {formatDate(inquiry.endDate)}
                                </span>
                            </div>
                            <div className="ad-row">
                                <span className="ad-label">Pax</span>
                                <span className="ad-value">
                                    {inquiry.pax?.adult || 0} Adult{(inquiry.pax?.adult || 0) > 1 ? 's' : ''}
                                    {(inquiry.pax?.children || 0) > 0 && `, ${inquiry.pax.children} Child${inquiry.pax.children > 1 ? 'ren' : ''}`}
                                    {(inquiry.pax?.infants || 0) > 0 && `, ${inquiry.pax.infants} Infant${inquiry.pax.infants > 1 ? 's' : ''}`}
                                </span>
                            </div>
                        </div>

                        {/* Inclusions List */}
                        <div className="ad-inclusions-section">
                            <h4 className="ad-section-subtitle">
                                {inquiry.isCustomized ? 'Customized Inclusions' : 'Package Inclusions'}
                            </h4>
                            
                            {inquiry.isCustomized ? (
                                // Customized Inclusions - Show checked items with prices
                                <div className="ad-inclusions-list-enhanced">
                                    {inquiry.customizedInclusions
                                        ?.filter(inc => inc.isChecked)
                                        .map((inclusion, idx) => (
                                            <div key={idx} className="ad-inclusion-card">
                                                <div className="ad-inclusion-header">
                                                    <div className="ad-inclusion-title-row">
                                                        <span className="ad-inclusion-check">✓</span>
                                                        <span className="ad-inclusion-name-enhanced">{inclusion.name}</span>
                                                    </div>
                                                    {inclusion.price > 0 && (
                                                        <span className="ad-inclusion-price-badge">
                                                            ₱{(inclusion.price || 0).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Metadata in a clean grid */}
                                                {(inclusion.supplier || inclusion.destination || inclusion.pax || inclusion.notes) && (
                                                    <div className="ad-inclusion-metadata">
                                                        {inclusion.supplier && (
                                                            <div className="ad-meta-item">
                                                                <span className="ad-meta-label">Supplier:</span>
                                                                <span className="ad-meta-value">{inclusion.supplier}</span>
                                                            </div>
                                                        )}
                                                        {inclusion.destination && (
                                                            <div className="ad-meta-item">
                                                                <span className="ad-meta-label">Destination:</span>
                                                                <span className="ad-meta-value">{inclusion.destination}</span>
                                                            </div>
                                                        )}
                                                        {inclusion.pax && (
                                                            <div className="ad-meta-item">
                                                                <span className="ad-meta-label">Pax:</span>
                                                                <span className="ad-meta-value">{inclusion.pax}</span>
                                                            </div>
                                                        )}
                                                        {inclusion.notes && (
                                                            <div className="ad-meta-item ad-meta-notes">
                                                                <span className="ad-meta-label">Notes:</span>
                                                                <span className="ad-meta-value">{inclusion.notes}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    }
                                    
                                    {/* Customization Summary */}
                                    {inquiry.customizationAdditionalPrice > 0 && (
                                        <div className="ad-customization-summary">
                                            <div className="ad-customization-total">
                                                <span className="ad-customization-total-label">
                                                    <span>💰</span>
                                                    <span>Additional Customization Cost</span>
                                                </span>
                                                <span className="ad-customization-total-amount">
                                                    ₱{(inquiry.customizationAdditionalPrice || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Non-Customized - Show original package inclusions
                                <div className="ad-inclusions-list">
                                    {inquiry.originalInclusions?.map((inclusion, idx) => (
                                        <div key={idx} className="ad-inclusion-item">
                                            <div className="ad-inclusion-info">
                                                <span className="ad-inclusion-icon">✓</span>
                                                <span className="ad-inclusion-name">{inclusion}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Accommodation Details */}
                        {inquiry.selectedRoomType && (
                            <div className="ad-accommodation-section">
                                <h4 className="ad-section-subtitle">Accommodation</h4>
                                <div className="ad-row">
                                    <span className="ad-label">Hotel</span>
                                    <span className="ad-value">{inquiry.hotelName || 'N/A'}</span>
                                </div>
                                <div className="ad-row">
                                    <span className="ad-label">Room Type</span>
                                    <span className="ad-value">{inquiry.selectedRoomType}</span>
                                </div>
                                {inquiry.numberOfRooms && (
                                    <div className="ad-row">
                                        <span className="ad-label">Number of Rooms</span>
                                        <span className="ad-value">{inquiry.numberOfRooms}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Flight Details */}
                        {inquiry.includesAirfare && inquiry.flightDetails && (
                            <div className="ad-flight-section">
                                <h4 className="ad-section-subtitle">Flight Details</h4>
                                <div className="ad-row">
                                    <span className="ad-label">Airline</span>
                                    <span className="ad-value">{inquiry.flightDetails.airline || 'N/A'}</span>
                                </div>
                                <div className="ad-row">
                                    <span className="ad-label">Flight Number</span>
                                    <span className="ad-value">{inquiry.flightDetails.flightNumber || 'N/A'}</span>
                                </div>
                                <div className="ad-row">
                                    <span className="ad-label">Route</span>
                                    <span className="ad-value">{inquiry.flightDetails.route || 'N/A'}</span>
                                </div>
                                <div className="ad-row">
                                    <span className="ad-label">Departure</span>
                                    <span className="ad-value">{inquiry.flightDetails.departureTime || 'N/A'}</span>
                                </div>
                                <div className="ad-row">
                                    <span className="ad-label">Arrival</span>
                                    <span className="ad-value">{inquiry.flightDetails.arrivalTime || 'N/A'}</span>
                                </div>
                            </div>
                        )}

                        {/* Pricing Breakdown */}
                        <div className="ad-pricing-breakdown">
                            <h4 className="ad-section-subtitle">Pricing Breakdown</h4>
                            
                            <div className="ad-price-row">
                                <span className="ad-label">Package Total</span>
                                <span className="ad-value">₱{(inquiry.packageTotal || 0).toLocaleString()}</span>
                            </div>
                            
                            {inquiry.isCustomized && inquiry.customizationAdditionalPrice > 0 && (
                                <div className="ad-price-row">
                                    <span className="ad-label">Customization Additional</span>
                                    <span className="ad-value">₱{inquiry.customizationAdditionalPrice.toLocaleString()}</span>
                                </div>
                            )}
                            
                            {inquiry.includesAirfare && inquiry.airfareTotal > 0 && (
                                <div className="ad-price-row">
                                    <span className="ad-label">Airfare Total</span>
                                    <span className="ad-value">₱{inquiry.airfareTotal.toLocaleString()}</span>
                                </div>
                            )}
                            
                            {inquiry.discountAmount > 0 && (
                                <div className="ad-price-row ad-discount-row">
                                    <span className="ad-label">
                                        Discount {inquiry.promoCode && `(${inquiry.promoCode})`}
                                    </span>
                                    <span className="ad-value">-₱{inquiry.discountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            
                            <div className="ad-price-row ad-total-row">
                                <span className="ad-label">Total Amount</span>
                                <span className="ad-value">₱{(inquiry.totalAmount || 0).toLocaleString()}</span>
                            </div>

                            {/* Payment Information */}
                            {inquiry.paymentType === 'partial' && (
                                <>
                                    <div className="ad-price-row ad-payment-info">
                                        <span className="ad-label">Initial Payment</span>
                                        <span className="ad-value">₱{(inquiry.initialPaymentAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="ad-price-row ad-payment-info">
                                        <span className="ad-label">Remaining Balance</span>
                                        <span className="ad-value">₱{(inquiry.remainingBalance || 0).toLocaleString()}</span>
                                    </div>
                                    {inquiry.balancePaidAmount > 0 && (
                                        <div className="ad-price-row ad-payment-info">
                                            <span className="ad-label">Balance Paid</span>
                                            <span className="ad-value">₱{inquiry.balancePaidAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
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