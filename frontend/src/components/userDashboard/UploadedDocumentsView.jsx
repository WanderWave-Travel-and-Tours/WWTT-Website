import React, { useState } from 'react';
import * as Icons from './Icons';
import './UploadedDocumentsView.css';

const UploadedDocumentsView = ({ documents, isLoading, booking }) => {
    const [loadingUrls, setLoadingUrls] = useState({});

    // ── Documents embedded directly on the booking (ID/passport per passenger + proof image) ──
    // These aren't rows in the Document collection (no inquiryId), so they're
    // sourced straight from the booking object instead of the documents prop.
    const bookingDocs = [];
    (booking?.passengers || []).forEach((p, idx) => {
        if (p.idDocument?.path) {
            bookingDocs.push({
                _id: `id-${idx}`,
                fileName: p.idDocument.originalName || `Passenger ${idx + 1} ID`,
                originalName: p.idDocument.originalName,
                fileSize: p.idDocument.size,
                fileUrl: p.idDocument.path,
                section: 'ID',
                isDirectLink: true,
            });
        }
        if (p.passportDocument?.path) {
            bookingDocs.push({
                _id: `passport-${idx}`,
                fileName: p.passportDocument.originalName || `Passenger ${idx + 1} Passport`,
                originalName: p.passportDocument.originalName,
                fileSize: p.passportDocument.size,
                fileUrl: p.passportDocument.path,
                section: 'Passport',
                isDirectLink: true,
            });
        }
    });
    // proofImages is the current (array) field; proofImage is the legacy
    // singular field kept for bookings saved before the array existed.
    const proofImages = booking?.proofImages?.length
        ? booking.proofImages
        : (booking?.proofImage?.path ? [booking.proofImage] : []);

    proofImages.forEach((img, idx) => {
        if (!img?.path) return;
        bookingDocs.push({
            _id: `proof-image-${idx}`,
            fileName: img.originalName || `Proof / Reference Image ${idx + 1}`,
            originalName: img.originalName,
            fileSize: img.size,
            fileUrl: img.path,
            section: proofImages.length > 1 ? `Proof / Reference Image ${idx + 1}` : 'Proof / Reference Image',
            isDirectLink: true,
        });
    });

    const allDocs = [...bookingDocs, ...(documents || [])];

    if (isLoading) {
        return (
            <div className="udv-container">
                <div className="udv-header">
                    <h2>Your Uploaded Documents</h2>
                </div>
                <div className="udv-loading">
                    <div className="udv-spinner"></div>
                    <p>Loading your documents...</p>
                </div>
            </div>
        );
    }

    if (allDocs.length === 0) {
        return (
            <div className="udv-container">
                <div className="udv-header">
                    <h2>Your Uploaded Documents</h2>
                    <p className="udv-subtitle">Documents you've submitted for this application</p>
                </div>
                <div className="udv-empty-state">
                    <div className="udv-empty-icon">
                        <Icons.File />
                    </div>
                    <h3>No Documents Yet</h3>
                    <p>You haven't uploaded any documents for this application yet.</p>
                    <p className="udv-empty-hint">Use the upload section below to submit your documents.</p>
                </div>
            </div>
        );
    }

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
            return <Icons.Image />;
        }
        return <Icons.File />;
    };

    // ✅ NEW: Function to get signed URL from backend
    const getSignedUrl = async (documentId, type = 'view') => {
        try {
            setLoadingUrls(prev => ({ ...prev, [documentId]: true }));
            
            const endpoint = type === 'download' ? 'download' : 'view';
            const response = await fetch(`https://wanderwaveph.onrender.com/api/documents/${documentId}/${endpoint}`);
            
            if (!response.ok) {
                throw new Error('Failed to get signed URL');
            }
            
            const data = await response.json();
            
            if (data.success && data.url) {
                return data.url;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            alert('Failed to access document. Please try again.');
            return null;
        } finally {
            setLoadingUrls(prev => ({ ...prev, [documentId]: false }));
        }
    };

    // ✅ NEW: Handle view button click
    const handleViewDocument = async (e, doc) => {
        e.preventDefault();
        if (doc.isDirectLink) {
            window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        const signedUrl = await getSignedUrl(doc._id, 'view');
        if (signedUrl) {
            window.open(signedUrl, '_blank', 'noopener,noreferrer');
        }
    };

    // ✅ NEW: Handle download button click
    const handleDownloadDocument = async (e, doc) => {
        e.preventDefault();
        const fileName = doc.originalName;
        if (doc.isDirectLink) {
            const link = document.createElement('a');
            link.href = doc.fileUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        const signedUrl = await getSignedUrl(doc._id, 'download');
        if (signedUrl) {
            // Create temporary link to trigger download
            const link = document.createElement('a');
            link.href = signedUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Group documents by section
    const groupedDocs = allDocs.reduce((acc, doc) => {
        const section = doc.section || 'General Documents';
        if (!acc[section]) {
            acc[section] = [];
        }
        acc[section].push(doc);
        return acc;
    }, {});

    return (
        <div className="udv-container">
            <div className="udv-header">
                <div>
                    <h2>Your Uploaded Documents</h2>
                    <p className="udv-subtitle">
                        {allDocs.length} document{allDocs.length !== 1 ? 's' : ''} uploaded
                    </p>
                </div>
                <div className="udv-badge">
                    <Icons.Check />
                    <span>Submitted</span>
                </div>
            </div>

            <div className="udv-sections">
                {Object.entries(groupedDocs).map(([section, docs]) => (
                    <div key={section} className="udv-section">
                        <div className="udv-section-header">
                            <h3>{section}</h3>
                            <span className="udv-section-count">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="udv-docs-grid">
                            {docs.map((doc, idx) => (
                                <div key={doc._id || idx} className="udv-doc-card">
                                    <div className="udv-doc-icon">
                                        {getFileIcon(doc.fileName)}
                                    </div>
                                    <div className="udv-doc-info">
                                        <h4 className="udv-doc-name" title={doc.fileName}>
                                            {doc.fileName}
                                        </h4>
                                        <div className="udv-doc-meta">
                                            <span className="udv-doc-size">
                                                {formatFileSize(doc.fileSize)}
                                            </span>
                                            <span className="udv-doc-divider">•</span>
                                            <span className="udv-doc-date">
                                                {formatDate(doc.uploadedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="udv-doc-actions">
                                        <button
                                            onClick={(e) => handleViewDocument(e, doc)}
                                            className="udv-btn-view"
                                            title="View document"
                                            disabled={loadingUrls[doc._id]}
                                        >
                                            <Icons.Eye />
                                            {loadingUrls[doc._id] ? 'Loading...' : 'View'}
                                        </button>
                                        <button
                                            onClick={(e) => handleDownloadDocument(e, doc)}
                                            className="udv-btn-download"
                                            title="Download document"
                                            disabled={loadingUrls[doc._id]}
                                        >
                                            <Icons.Download />
                                            {loadingUrls[doc._id] ? 'Loading...' : 'Download'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="udv-footer-note">
                <Icons.Info />
                <p>These documents have been submitted for review. You can still upload additional documents using the section below.</p>
            </div>
        </div>
    );
};

export default UploadedDocumentsView;