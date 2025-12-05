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
                        <span className="ud-label">Destination</span>
                        <span className="ud-value">{inquiry.visaCountry || 'N/A'}</span>
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

                    {/* Payment Pending */}
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

                    {/* Pending Status */}
                    {inquiry.status === 'PENDING' && !inquiry.remarks && (
                        <div className="ud-pending-msg">
                            <p>
                                Your application is under review. 
                                We'll notify you with updates soon.
                            </p>
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