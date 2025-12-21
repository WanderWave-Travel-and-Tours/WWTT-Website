import React from 'react';
import DocumentsSection from './DocumentsSection';
import './ApplicationDetails.css';

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
    onDownloadComplete // <-- Trigger from Parent
}) => {
    
    if (!inquiry) return null;

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
                            <a href={`https://wanderwaveph-backend.onrender.com0${evidenceUrl}`} target="_blank" rel="noreferrer" className="ad-link-btn">
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
                                    {/* DOWNLOAD BUTTON */}
                                    <a 
                                        href={`https://wanderwaveph-backend.onrender.com0${doc.fileUrl}`} 
                                        download={doc.fileName}
                                        className="ad-btn-download"
                                        onClick={() => onDownloadComplete(inquiry._id)} // <-- THIS MOVES IT TO HISTORY
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
                        <div className="ad-large-icon">🔍</div>
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
                <div className={`ad-status-pill ${getStatusClass(inquiry.status)}`}>
                    {inquiry.status?.replace('_', ' ') || 'PENDING'}
                </div>
            </header>

            <div className="ad-grid">
                <div className="ad-card ad-details-card">
                    <h3 className="ad-card-title">Application Details</h3>
                    <div className="ad-content-top">
                        <div className="ad-row">
                            <span className="ad-label">Destination / Type</span>
                            <span className="ad-value">
                                {inquiry.visaCountry || inquiry.cenomarDocument || inquiry.psaDocument || 'N/A'}
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