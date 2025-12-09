import React from 'react';
import DocumentsSection from './DocumentsSection';
import './ApplicationDetails.css';
import * as Icons from './Icons'; 

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
    uploadProgress 
}) => {
    
    if (!inquiry) return null;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const getStatusClass = (status) => {
        switch (status?.toUpperCase()) {
            case 'PAYMENT_PENDING': return 'ud-badge-payment';
            case 'PAID': return 'ud-badge-paid';
            case 'CONFIRMED': return 'ud-badge-confirmed';
            case 'COMPLETED': return 'ud-badge-completed';
            case 'CANCELLED': return 'ud-badge-cancelled';
            default: return 'ud-badge-pending';
        }
    };

    return (
        <div className="ud-details-container">
            {/* Header Section */}
            <div className="ud-details-header">
                <div className="ud-header-info">
                    <h1 className="ud-header-title">{inquiry.serviceName}</h1>
                    <p className="ud-header-id">
                        Application ID: {inquiry._id.slice(-8).toUpperCase()}
                    </p>
                </div>
                <div className={`ud-status-pill ${getStatusClass(inquiry.status)}`}>
                    {inquiry.status?.replace('_', ' ') || 'PENDING'}
                </div>
            </div>

            {/* Content Grid */}
            <div className="ud-info-grid">
                {/* Left Card - Application Details */}
                <div className="ud-info-card">
                    <h3 className="ud-card-headline">Application Details</h3>
                    
                    <div className="ud-info-row">
                        <span className="ud-label">Destination / Type</span>
                        <span className="ud-value">
                            {inquiry.visaCountry || inquiry.cenomarDocument || inquiry.psaDocument || 'N/A'}
                        </span>
                    </div>
                    
                    <div className="ud-info-row">
                        <span className="ud-label">Submission Date</span>
                        <span className="ud-value">{formatDate(inquiry.createdAt)}</span>
                    </div>
                    
                    {inquiry.estimatedPrice > 0 && (
                        <div className="ud-info-row ud-price-row">
                            <span className="ud-label">Total Amount</span>
                            <span className="ud-value ud-price-text">
                                ₱{inquiry.estimatedPrice.toLocaleString()}
                            </span>
                        </div>
                    )}
                    
                    <div className="ud-info-message">
                        <span className="ud-label">Your Message</span>
                        <p className="ud-message-box">
                            {inquiry.message || 'No additional notes provided.'}
                        </p>
                    </div>
                </div>

                {/* Right Card - Status & Actions */}
                <div className="ud-info-card ud-action-card">
                    <h3 className="ud-card-headline">Status & Actions</h3>
                    
                    {/* Admin Remarks */}
                    {inquiry.remarks && (
                        <div className="ud-remarks-box">
                            <h4 className="ud-remarks-title">Admin Remarks</h4>
                            <p className="ud-remarks-text">{inquiry.remarks}</p>
                            {inquiry.evidenceUrl && (
                                <a 
                                    href={`http://localhost:5000${inquiry.evidenceUrl}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="ud-evidence-link"
                                >
                                    View Evidence ↗
                                </a>
                            )}
                        </div>
                    )}

                    {/* CONDITION: Payment Pending (Show Pay Button) */}
                    {inquiry.status === 'PAYMENT_PENDING' && (
                        <div className="ud-payment-box">
                            <div className="ud-payment-info">
                                <h4>Payment Required</h4>
                                <p>Complete your payment to proceed with the application</p>
                            </div>
                            <button 
                                onClick={handlePayment} 
                                className="ud-pay-btn"
                            >
                                Pay ₱{inquiry.estimatedPrice?.toLocaleString()}
                            </button>
                        </div>
                    )}

                    {/* CONDITION: PAID - Waiting for Admin Confirmation */}
                    {inquiry.status === 'PAID' && (
                        <div className="ud-paid-box">
                            <div className="ud-paid-icon">✅</div>
                            <h4 className="ud-paid-title">Payment Submitted</h4>
                            <p className="ud-paid-text">
                                Your payment has been received. Please wait for the admin to confirm and process your documents.
                            </p>
                            <div className="ud-paid-note">
                                <span className="ud-note-icon">⏳</span>
                                <span>Confirmation typically takes 1-2 business days</span>
                            </div>
                        </div>
                    )}

                    {/* 🔥 NEW: CONDITION: CONFIRMED - Admin Confirmed Payment */}
                    {inquiry.status === 'CONFIRMED' && (
                        <div className="ud-confirmed-box">
                            <div className="ud-confirmed-icon">🎉</div>
                            <h4 className="ud-confirmed-title">Payment Confirmed!</h4>
                            <p className="ud-confirmed-text">
                                Great news! Admin has confirmed receipt of your payment on <strong>{formatDate(inquiry.paymentConfirmedAt)}</strong>.
                            </p>
                            <p className="ud-confirmed-subtext">
                                Your documents are now being processed and will be ready soon.
                            </p>
                            <div className="ud-confirmed-note">
                                <span className="ud-note-icon">📄</span>
                                <span>We'll notify you when documents are ready for download</span>
                            </div>
                        </div>
                    )}

                    {/* 🔥 NEW: CONDITION: COMPLETED - Documents Ready for Download */}
                    {inquiry.status === 'COMPLETED' && inquiry.deliveredDocuments && inquiry.deliveredDocuments.length > 0 && (
                        <div className="ud-documents-ready-box">
                            <div className="ud-ready-icon">🎊</div>
                            <h4 className="ud-ready-title">Documents Ready!</h4>
                            <p className="ud-ready-text">
                                Your documents have been processed and are now available for download.
                            </p>
                            <p className="ud-ready-date">
                                Delivered on: <strong>{formatDate(inquiry.documentsDeliveredAt)}</strong>
                            </p>
                            
                            <div className="ud-download-section">
                                <h5 className="ud-download-title">Available Documents ({inquiry.deliveredDocuments.length})</h5>
                                <div className="ud-download-list">
                                    {inquiry.deliveredDocuments.map((doc, idx) => (
                                        <div key={idx} className="ud-download-item">
                                            <div className="ud-doc-info">
                                                <span className="ud-doc-icon">📄</span>
                                                <div className="ud-doc-details">
                                                    <span className="ud-doc-name">{doc.fileName}</span>
                                                    <span className="ud-doc-date">Uploaded: {formatDate(doc.uploadedAt)}</span>
                                                </div>
                                            </div>
                                            <a 
                                                href={`http://localhost:5000${doc.fileUrl}`}
                                                download={doc.fileName}
                                                className="ud-download-btn"
                                            >
                                                <span>Download</span>
                                                <span>↓</span>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="ud-completed-note">
                                <span className="ud-note-icon">✅</span>
                                <span>Thank you for choosing WanderWave!</span>
                            </div>
                        </div>
                    )}

                    {/* Condition: Pending (Under Review) */}
                    {inquiry.status === 'PENDING' && !inquiry.remarks && (
                        <div className="ud-pending-msg">
                            <div className="ud-pending-icon">🔍</div>
                            <p>
                                Your application is under review. 
                                We'll notify you with updates soon.
                            </p>
                        </div>
                    )}
                    
                    {/* Condition: Cancelled */}
                    {inquiry.status === 'CANCELLED' && (
                        <div className="ud-cancelled-msg">
                            <div className="ud-cancelled-icon">❌</div>
                            <h4>Application Cancelled</h4>
                            <p>This request has been cancelled. Contact support for details.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Documents Section */}
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
    );
};

export default ApplicationDetails;